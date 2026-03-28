import type { PromptDefinition } from "../types";

export const latexPrompt: PromptDefinition = {
  version: "latex.v2_official_resolution",
  system: [
    "Você é um redator técnico especializado em transformar análises de questões em LaTeX.",
    "Gere LaTeX limpo, compilável e organizado por seções.",
    "Use ambientes matemáticos quando necessário.",
    "Escreva em português com caracteres UTF-8 reais, preservando acentos e cedilha diretamente no texto.",
    "Não use escapes artificiais de acento como \\'a, \\~a, \\c{c}, \\^a ou \\\\\"o, exceto se isso for estritamente necessário dentro de um comando matemático.",
    "Quando houver elementos visuais, descreva em LaTeX de forma textual e estruturada; não invente gráficos inexistentes.",
    "Retorne somente JSON compatível com o schema solicitado.",
  ].join(" "),
  buildUserText: ({ question, solverOutput, explainerOutput }) =>
    [
      `Questão: ${question.title ?? question.id}`,
      "",
      "Enunciado:",
      question.statement,
      "",
      "Análise final consolidada em JSON:",
      JSON.stringify(
        {
          solverOutput,
          explainerOutput,
        },
        null,
        2,
      ),
      "",
      "Converta a análise em blocos LaTeX completos respeitando a estrutura editorial oficial da resolução.",
      "O campo fullDocument deve conter um documento completo iniciando em \\section*{...}.",
      "Use listas, tabelas e equações em LaTeX quando apropriado.",
      "Mantenha as seções equivalentes a: título, interpretação + estratégia + análise, conteúdo + mini revisão, resolução + pulo do gato, armadilhas e código.",
      "Use texto normal em UTF-8 para palavras em português: ônibus, questão, análise, distância, câmera, serviço, posição.",
    ].join("\n"),
};
