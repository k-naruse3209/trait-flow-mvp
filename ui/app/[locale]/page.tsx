
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Header } from "@/components/header";
import { GettingStarted } from "@/components/getting-started";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-6 md:gap-10 items-center">
        <Header />

        <div className="w-full max-w-5xl px-4 md:px-5">
          <GettingStarted />
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
