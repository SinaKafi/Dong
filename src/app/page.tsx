import { ExpenseSplitter } from "@/components/ExpenseSplitter";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <ExpenseSplitter />
      <footer
        className="mx-auto mb-8 w-full max-w-6xl px-4 sm:px-6 lg:px-8"
        dir="ltr"
      >
        <div className="glass-card rounded-3xl border border-white/15 px-5 py-4 text-center text-sm text-white/70">
          <p className="flex items-center justify-center gap-1 leading-1!">
            powered by{" "}
            <a
              href="https://github.com/SinaKafi"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-white transition-colors hover:text-emerald-200"
            >
              sina kafi
            </a>{" "}
            ❤️
          </p>
        </div>
      </footer>
    </main>
  );
}
