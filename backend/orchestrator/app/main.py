# Orchestrator (FastAPI + LangGraph placeholder)
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import os
import time
import numpy as np
import psycopg2
import psycopg2.extras
from openai import OpenAI
import cohere

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
COHERE_API_KEY = os.environ["COHERE_API_KEY"]
PG_DSN = os.environ["PG_DSN"]
EMBED_MODEL = os.environ.get("EMBED_MODEL", "text-embedding-3-large")
RESP_MODEL = os.environ.get("RESP_MODEL", "gpt-5")

client = OpenAI(api_key=OPENAI_API_KEY)
co = cohere.ClientV2(COHERE_API_KEY)
conn = psycopg2.connect(PG_DSN)
app = FastAPI()


class UpdateReq(BaseModel):
    user_id: str
    text: str
    kind: str = "note"


class RespondReq(BaseModel):
    user_id: str
    query: str


def embed_text(text: str) -> List[float]:
    res = client.embeddings.create(model=EMBED_MODEL, input=text)
    return res.data[0].embedding


def ema(old: np.ndarray, new: np.ndarray, alpha: float = 0.2) -> np.ndarray:
    if old is None or old.size == 0:
        return new
    return (1 - alpha) * old + alpha * new


def update_policy_vec(policy: np.ndarray, text: str) -> np.ndarray:
    embed = np.array(embed_text(text), dtype=np.float32)
    rng = np.random.default_rng(42)
    proj_matrix = rng.standard_normal((128, embed.shape[0])).astype(np.float32) / np.sqrt(embed.shape[0])
    proj = proj_matrix @ embed
    proj = proj / (np.linalg.norm(proj) + 1e-6)
    if policy is None or policy.size == 0:
        return proj
    return ema(policy, proj, alpha=0.1)


@app.post("/api/memory/update")
def memory_update(req: UpdateReq):
    embedding = embed_text(req.text)
    with conn, conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute(
            "INSERT INTO memories(user_id, kind, embedding, text) VALUES (%s,%s,%s,%s)",
            (req.user_id, req.kind, embedding, req.text),
        )
        cur.execute("SELECT long_term, policy FROM user_memory WHERE user_id=%s", (req.user_id,))
        row = cur.fetchone()
        lt = np.array(row["long_term"], dtype=np.float32) if row and row["long_term"] else np.array([])
        pv = np.array(row["policy"], dtype=np.float32) if row and row["policy"] else np.array([])
        lt_new = ema(lt, np.array(embedding, dtype=np.float32), alpha=0.2)
        pv_new = update_policy_vec(pv, req.text)
        if row:
            cur.execute(
                "UPDATE user_memory SET long_term=%s, policy=%s, last_updated=now() WHERE user_id=%s",
                (lt_new.tolist(), pv_new.tolist(), req.user_id),
            )
        else:
            cur.execute(
                "INSERT INTO user_memory(user_id, long_term, policy) VALUES (%s,%s,%s)",
                (req.user_id, lt_new.tolist(), pv_new.tolist()),
            )
    return {"ok": True}


@app.post("/api/respond")
def respond(req: RespondReq):
    start = time.time()
    with conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, text, embedding
            FROM memories
            WHERE user_id=%s
            ORDER BY (embedding <#> (SELECT long_term FROM user_memory WHERE user_id=%s)) ASC
            LIMIT 200
            """,
            (req.user_id, req.user_id),
        )
        candidates = cur.fetchall()
    docs = [c["text"] for c in candidates]

    rerank = co.rerank(query=req.query, documents=docs, top_n=8, rank_fields=["text"])
    top_docs = [docs[item.index] for item in rerank.results]

    system_msg = f"You are a helpful assistant. Personalization: concise, supportive tone for user {req.user_id}."
    resp = client.responses.create(
        model=RESP_MODEL,
        input=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": "Q: " + req.query + "\nUse this context:\n- " + "\n- ".join(top_docs)},
        ],
    )
    latency_ms = int((time.time() - start) * 1000)
    return {"answer": resp.output_text, "used_docs": top_docs, "stats": {"latency_ms": latency_ms, "rerank_k": 8}}
