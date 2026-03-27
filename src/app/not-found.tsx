import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
      <section className="w-full rounded-[32px] border border-white/70 bg-white/80 p-8 text-center shadow-card backdrop-blur">
        <span className="inline-flex rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6a22]">
          Conteúdo não encontrado
        </span>
        <h1 className="mt-5 font-display text-4xl text-ink">
          Não encontramos essa questão.
        </h1>
        <p className="mt-4 text-slate-600">
          Volte para a visão geral da prova e abra uma questão disponível.
        </p>
        <Link
          href="/prova/2024/matematica"
          className="mt-8 inline-flex rounded-full bg-ink px-5 py-3 font-semibold text-white transition hover:bg-[#09131f]"
        >
          Voltar para prova
        </Link>
      </section>
    </main>
  );
}
