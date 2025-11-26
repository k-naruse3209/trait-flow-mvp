// TIPI (Ten-Item Personality Inventory) Implementation
// Based on Gosling, S. D., Rentfrow, P. J., & Swann Jr, W. B. (2003)

import { Locale } from './i18n'

export interface TipiQuestion {
  id: number
  text: Record<string, string>
  trait: 'extraversion' | 'agreeableness' | 'conscientiousness' | 'neuroticism' | 'openness'
  reverse: boolean
}

export interface TipiResponse {
  questionId: number
  score: number // 1-7 scale
}

export interface BigFiveScores {
  extraversion: number
  agreeableness: number
  conscientiousness: number
  neuroticism: number
  openness: number
}

// TIPI Questions (10 items) - Multilingual
export const TIPI_QUESTIONS: TipiQuestion[] = [
  {
    id: 1,
    text: {
      en: "Extraverted, enthusiastic",
      vi: "Hướng ngoại, nhiệt tình",
      ja: "外向的で、熱狂的"
    },
    trait: "extraversion",
    reverse: false
  },
  {
    id: 2,
    text: {
      en: "Critical, quarrelsome",
      vi: "Hay chỉ trích, thích tranh cãi",
      ja: "批判的で、口論好き"
    },
    trait: "agreeableness", 
    reverse: true
  },
  {
    id: 3,
    text: {
      en: "Dependable, self-disciplined",
      vi: "Đáng tin cậy, có kỷ luật tự giác",
      ja: "信頼でき、自制心がある"
    },
    trait: "conscientiousness",
    reverse: false
  },
  {
    id: 4,
    text: {
      en: "Anxious, easily upset",
      vi: "Lo lắng, dễ bị kích động",
      ja: "不安で、動揺しやすい"
    },
    trait: "neuroticism",
    reverse: false
  },
  {
    id: 5,
    text: {
      en: "Open to new experiences, complex",
      vi: "Cởi mở với trải nghiệm mới, phức tạp",
      ja: "新しい経験に開放的で、複雑"
    },
    trait: "openness",
    reverse: false
  },
  {
    id: 6,
    text: {
      en: "Reserved, quiet",
      vi: "Dè dặt, ít nói",
      ja: "控えめで、静か"
    },
    trait: "extraversion",
    reverse: true
  },
  {
    id: 7,
    text: {
      en: "Sympathetic, warm",
      vi: "Thông cảm, ấm áp",
      ja: "同情的で、温かい"
    },
    trait: "agreeableness",
    reverse: false
  },
  {
    id: 8,
    text: {
      en: "Disorganized, careless",
      vi: "Thiếu tổ chức, bất cẩn",
      ja: "整理整頓ができず、不注意"
    },
    trait: "conscientiousness",
    reverse: true
  },
  {
    id: 9,
    text: {
      en: "Calm, emotionally stable",
      vi: "Bình tĩnh, ổn định về mặt cảm xúc",
      ja: "冷静で、感情的に安定している"
    },
    trait: "neuroticism",
    reverse: true
  },
  {
    id: 10,
    text: {
      en: "Conventional, uncreative",
      vi: "Theo lối mòn, thiếu sáng tạo",
      ja: "従来的で、創造性に欠ける"
    },
    trait: "openness",
    reverse: true
  }
]

// Helper function to get questions in a specific language
export function getTipiQuestionsForLocale(locale: Locale = 'en'): Array<Omit<TipiQuestion, 'text'> & { text: string }> {
  return TIPI_QUESTIONS.map(question => ({
    ...question,
    text: question.text[locale] || question.text.en
  }))
}

// Helper function to get a single question text in a specific language
export function getTipiQuestionText(questionId: number, locale: Locale = 'en'): string {
  const question = TIPI_QUESTIONS.find(q => q.id === questionId)
  if (!question) {
    throw new Error(`Invalid question ID: ${questionId}`)
  }
  return question.text[locale] || question.text.en
}

// TIPI Scoring Algorithm
export function calculateTipiScores(responses: TipiResponse[]): BigFiveScores {
  if (responses.length !== 10) {
    throw new Error('TIPI requires exactly 10 responses')
  }

  // Initialize scores
  const traitScores: Record<string, number[]> = {
    extraversion: [],
    agreeableness: [],
    conscientiousness: [],
    neuroticism: [],
    openness: []
  }

  // Process each response
  responses.forEach(response => {
    const question = TIPI_QUESTIONS.find(q => q.id === response.questionId)
    if (!question) {
      throw new Error(`Invalid question ID: ${response.questionId}`)
    }

    let score = response.score
    
    // Reverse scoring for reverse items (8 - original score)
    if (question.reverse) {
      score = 8 - score
    }

    traitScores[question.trait].push(score)
  })

  // Calculate average for each trait (each trait has 2 items)
  const bigFiveScores: BigFiveScores = {
    extraversion: traitScores.extraversion.reduce((a, b) => a + b, 0) / 2,
    agreeableness: traitScores.agreeableness.reduce((a, b) => a + b, 0) / 2,
    conscientiousness: traitScores.conscientiousness.reduce((a, b) => a + b, 0) / 2,
    neuroticism: traitScores.neuroticism.reduce((a, b) => a + b, 0) / 2,
    openness: traitScores.openness.reduce((a, b) => a + b, 0) / 2
  }

  return bigFiveScores
}

// Convert raw scores (1-7) to 0-1 scale
export function convertToP01Scale(scores: BigFiveScores): BigFiveScores {
  return {
    extraversion: (scores.extraversion - 1) / 6,
    agreeableness: (scores.agreeableness - 1) / 6,
    conscientiousness: (scores.conscientiousness - 1) / 6,
    neuroticism: (scores.neuroticism - 1) / 6,
    openness: (scores.openness - 1) / 6
  }
}

// Convert raw scores (1-7) to T-scores (0-100 scale)
// Using population norms: mean = 4, std = 1.5 for 7-point scale
export function convertToTScores(scores: BigFiveScores): BigFiveScores {
  const mean = 4
  const std = 1.5
  
  const convertScore = (score: number): number => {
    const zScore = (score - mean) / std
    const tScore = 50 + (zScore * 10)
    // Clamp to 0-100 range
    return Math.max(0, Math.min(100, Math.round(tScore)))
  }

  return {
    extraversion: convertScore(scores.extraversion),
    agreeableness: convertScore(scores.agreeableness),
    conscientiousness: convertScore(scores.conscientiousness),
    neuroticism: convertScore(scores.neuroticism),
    openness: convertScore(scores.openness)
  }
}

// Validate TIPI responses
export function validateTipiResponses(responses: TipiResponse[]): string[] {
  const errors: string[] = []

  if (responses.length !== 10) {
    errors.push('All 10 questions must be answered')
  }

  responses.forEach(response => {
    if (response.score < 1 || response.score > 7) {
      errors.push(`Question ${response.questionId}: Score must be between 1 and 7`)
    }

    const question = TIPI_QUESTIONS.find(q => q.id === response.questionId)
    if (!question) {
      errors.push(`Invalid question ID: ${response.questionId}`)
    }
  })

  // Check for duplicate question IDs
  const questionIds = responses.map(r => r.questionId)
  const uniqueIds = new Set(questionIds)
  if (uniqueIds.size !== questionIds.length) {
    errors.push('Duplicate responses detected')
  }

  return errors
}