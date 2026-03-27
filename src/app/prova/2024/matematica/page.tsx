import Link from "next/link";
import { ExamInsightsPanel } from "@/components/exam-overview/exam-insights-panel";
import { getExamOverviewAnalytics, getExamQuestionSummaries } from "@/data/mock-question";

export default function ExamOverviewPage() {
  const questions = getExamQuestionSummaries();
  const overviewAnalytics = getExamOverviewAnalytics();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-card backdrop-blur">
        <span className="mb-3 inline-flex rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6a22]">
          Prova completa
        </span>
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
              ENEM 2024 - Matemática com leitura orientada por dados.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              Este MVP mostra como uma prova pode combinar imagem original da
              questão, análise de desempenho, interpretação pedagógica e
              navegação rápida entre itens relacionados.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-3xl bg-ink p-5 text-white">
              <div className="text-sm uppercase tracking-[0.2em] text-white/70">
                Questões
              </div>
              <div className="mt-2 text-4xl font-semibold">45</div>
            </div>
            <div className="rounded-3xl bg-white p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Em destaque
              </div>
              <div className="mt-2 text-2xl font-semibold text-ink">
                Questão 147
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Funções • H17 • 38,4% de acerto
              </div>
            </div>
            <Link
              href="/questoes/12"
              className="flex items-center justify-center rounded-3xl bg-clay px-5 py-5 text-base font-semibold text-white transition hover:bg-[#c45c30]"
            >
              Abrir questão 12
            </Link>
          </div>
        </div>
      </section>

      <ExamInsightsPanel
        themeDistribution={overviewAnalytics.themeDistribution}
        competenceAccuracy={overviewAnalytics.competenceAccuracy}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">
            Navegação da prova
          </h2>
          <p className="text-sm text-slate-500">
            Clique em qualquer card para abrir a questão.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {questions.map((question) => (
            <Link
              key={question.id}
              href={`/questoes/${question.id}`}
              className={`rounded-[28px] border p-5 shadow-card transition hover:-translate-y-1 hover:border-clay/40 ${
                question.id === 12
                  ? "border-clay/40 bg-white"
                  : "border-white/70 bg-white/75 backdrop-blur"
              }`}
            >
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Questão {question.displayNumber}
              </div>
              <div className="mt-4 text-xl font-semibold text-ink">
                {question.theme}
              </div>
              <div className="mt-3 text-sm text-slate-600">
                {question.skill} • {question.difficulty}
              </div>
              <div className="mt-6 flex items-end justify-between">
                <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Acerto
                </span>
                <span className="text-2xl font-semibold text-clay">
                  {question.accuracy.toFixed(1)}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
