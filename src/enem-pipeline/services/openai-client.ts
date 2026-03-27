import OpenAI from "openai";
import { fileToDataUrl } from "./file-utils";
import type {
  PromptDefinition,
  QuestionInput,
  SchemaDefinition,
  UsageSnapshot,
} from "../types";

type RunStructuredParams = {
  client: OpenAI;
  model: string;
  maxOutputTokens: number;
  prompt: PromptDefinition;
  schema: SchemaDefinition;
  question: QuestionInput;
  solverOutput?: unknown;
  explainerOutput?: unknown;
};

const MODEL_PRICING_PER_1M: Record<
  string,
  { input: number; output: number }
> = {
  "gpt-4.1-nano": { input: 0.1, output: 0.4 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1": { input: 2, output: 8 },
};

function getAllImageEntries(question: QuestionInput) {
  const entries: Array<{ label: string; path: string }> = [];

  for (const [index, imagePath] of (question.supportImagePaths ?? []).entries()) {
    entries.push({
      label: `Imagem do enunciado ${index + 1}`,
      path: imagePath,
    });
  }

  for (const option of question.options) {
    for (const [index, imagePath] of (option.imagePaths ?? []).entries()) {
      entries.push({
        label: `Imagem da alternativa ${option.label} ${index + 1}`,
        path: imagePath,
      });
    }
  }

  return entries;
}

function extractOutputText(response: unknown) {
  const maybeResponse = response as { output_text?: string };

  if (typeof maybeResponse.output_text === "string" && maybeResponse.output_text) {
    return maybeResponse.output_text;
  }

  throw new Error("A resposta da OpenAI não trouxe output_text.");
}

export async function createOpenAIClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

function estimateUsageCost(model: string, inputTokens: number, outputTokens: number) {
  const pricing = MODEL_PRICING_PER_1M[model];
  if (!pricing) {
    return 0;
  }

  return Number(
    (
      (inputTokens / 1_000_000) * pricing.input +
      (outputTokens / 1_000_000) * pricing.output
    ).toFixed(6),
  );
}

function extractUsageSnapshot(model: string, response: unknown): UsageSnapshot {
  const usage = (response as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
  const inputTokens = usage?.input_tokens ?? 0;
  const outputTokens = usage?.output_tokens ?? 0;

  return {
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateUsageCost(model, inputTokens, outputTokens),
  };
}

export async function runStructuredOutput<T>({
  client,
  model,
  maxOutputTokens,
  prompt,
  schema,
  question,
  solverOutput,
  explainerOutput,
}: RunStructuredParams): Promise<{ payload: T; usage: UsageSnapshot }> {
  const imageEntries = getAllImageEntries(question);
  const baseContent: Array<Record<string, unknown>> = [
    {
      type: "input_text",
      text: prompt.buildUserText({
        question,
        solverOutput: solverOutput as never,
        explainerOutput: explainerOutput as never,
      }),
    },
  ];

  for (const entry of imageEntries) {
    baseContent.push({
      type: "input_text",
      text: entry.label,
    });
    baseContent.push({
      type: "input_image",
      image_url: await fileToDataUrl(entry.path),
    });
  }

  let lastError: unknown;
  let lastRawText = "";

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const content =
      attempt === 1
        ? baseContent
        : [
            {
              type: "input_text",
              text: "Sua resposta anterior saiu com JSON inválido. Refaça e retorne JSON estrito, válido e completo, sem markdown e sem texto fora do objeto.",
            },
            ...baseContent,
          ];

    const response = await client.responses.create({
      model,
      max_output_tokens: maxOutputTokens,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                attempt === 1
                  ? prompt.system
                  : `${prompt.system} JSON inválido na tentativa anterior é proibido. Retorne apenas JSON válido.`,
            },
          ],
        },
        {
          role: "user",
          content,
        },
      ] as never,
      text: {
        format: {
          type: "json_schema",
          name: schema.name,
          strict: true,
          schema: schema.schema,
        },
      },
    } as never);

    try {
      lastRawText = extractOutputText(response);
      return {
        payload: JSON.parse(lastRawText) as T,
        usage: extractUsageSnapshot(model, response),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Falha ao parsear JSON estruturado após retry. Último erro: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }. Trecho inicial: ${lastRawText.slice(0, 400)}`,
  );
}
