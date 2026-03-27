import fs from "node:fs/promises";
import path from "node:path";
import type { QuestionInput, StageArtifact, StageName } from "../types";

function resolveMaybeRelative(filePath: string) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

function inferMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

export async function readQuestionsFile(inputPath: string): Promise<QuestionInput[]> {
  const raw = await fs.readFile(resolveMaybeRelative(inputPath), "utf-8");
  const parsed = JSON.parse(raw) as { questions?: QuestionInput[] } | QuestionInput[];

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error("questions.json precisa conter um array ou um objeto com a chave questions.");
  }

  return parsed.questions;
}

export async function ensureDir(dirPath: string) {
  await fs.mkdir(resolveMaybeRelative(dirPath), { recursive: true });
}

export async function fileExists(filePath: string) {
  try {
    await fs.access(resolveMaybeRelative(filePath));
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(resolveMaybeRelative(filePath), "utf-8");
  return JSON.parse(raw) as T;
}

export async function writeJson(filePath: string, payload: unknown) {
  await ensureDir(path.dirname(resolveMaybeRelative(filePath)));
  await fs.writeFile(
    resolveMaybeRelative(filePath),
    JSON.stringify(payload, null, 2),
    "utf-8",
  );
}

export async function saveStageArtifact<TPayload>(
  outputDir: string,
  questionId: string,
  stage: StageName,
  artifact: StageArtifact<TPayload>,
) {
  const fileName = {
    solver: "01-solver.json",
    explainer: "02-explainer.json",
    reviewer: "03-reviewer.json",
    latex: "04-latex.json",
  }[stage];

  await writeJson(path.join(outputDir, questionId, fileName), artifact);
}

export async function saveFinalOutput(
  outputDir: string,
  questionId: string,
  payload: unknown,
) {
  await writeJson(path.join(outputDir, questionId, "final.json"), payload);
}

export async function fileToDataUrl(filePath: string) {
  const resolved = resolveMaybeRelative(filePath);
  const bytes = await fs.readFile(resolved);
  const mimeType = inferMimeType(resolved);
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}
