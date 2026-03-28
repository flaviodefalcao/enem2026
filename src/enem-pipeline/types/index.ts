export type QuestionOptionInput = {
  label: "A" | "B" | "C" | "D" | "E";
  text: string;
  imagePaths?: string[];
};

export type QuestionInput = {
  id: string;
  year?: number;
  area?: string;
  title?: string;
  statement: string;
  supportImagePaths?: string[];
  options: QuestionOptionInput[];
  answerKey?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type StageName = "theme" | "solver" | "explainer" | "reviewer" | "latex";

export type TechnicalSolution = {
  finalAnswer: string;
  correctnessClaim: string;
  strategy: string;
  steps: string[];
  formulasUsed: string[];
  visualEvidenceUsed: string[];
  confidence: "low" | "medium" | "high";
};

export type DistractorAnalysis = {
  option: string;
  likelyReasoning: string;
  misconceptionType: string;
  whyItLooksPlausible: string;
  whyItIsWrong: string;
};

export type ItemProfile = {
  primarySkill: string;
  secondarySkills: string[];
  cognitiveDemand: string;
  difficultyEstimate: "low" | "medium" | "high";
  requiresVisualInterpretation: boolean;
  requiresModeling: boolean;
  requiresCalculation: boolean;
  notes: string[];
};

export type SolverOutput = {
  technicalSolution: TechnicalSolution;
  distractors: DistractorAnalysis[];
  itemProfile: ItemProfile;
};

export type DidacticExplanation = {
  shortExplanation: string;
  stepByStep: string[];
  commonPitfalls: string[];
  teachingTips: string[];
};

export type ExplainerOutput = {
  didacticExplanation: DidacticExplanation;
};

export type ConsistencyIssue = {
  severity: "low" | "medium" | "high";
  field: string;
  description: string;
  suggestedFix: string;
};

export type OfficialResolutionTerm = {
  term: string;
  explanation: string;
};

export type OfficialResolutionTableRow = {
  concept: string;
  keyIdea: string;
  application: string;
};

export type OfficialResolutionAlternative = {
  option: string;
  isCorrect: boolean;
  explanation: string;
};

export type OfficialResolution = {
  emoji: string;
  shortThemeTitle: string;
  interpretationIntro: string;
  commandTerms: OfficialResolutionTerm[];
  whatTheQuestionAsks: string;
  strategyParagraph: string;
  reviewTable: OfficialResolutionTableRow[];
  theoryParagraphs: string[];
  resolutionParagraphs: string[];
  puloDoGato: string;
  alternatives: OfficialResolutionAlternative[];
  questionCode: string;
};

export type FinalAnalysis = {
  technicalSolution: TechnicalSolution;
  didacticExplanation: DidacticExplanation;
  distractors: DistractorAnalysis[];
  itemProfile: ItemProfile;
  officialResolution: OfficialResolution;
  consistencyReview: {
    verdict: "approved" | "approved_with_notes" | "needs_revision";
    summary: string;
    issues: ConsistencyIssue[];
  };
};

export type ReviewerOutput = {
  finalAnalysis: FinalAnalysis;
};

export type LatexOutput = {
  technicalSolution: string;
  formulasUsed: string;
  visualEvidenceUsed: string;
  didacticExplanation: string;
  commonPitfalls: string;
  teachingTips: string;
  distractors: string;
  itemProfile: string;
  fullDocument: string;
};

export type ThemeClassificationOutput = {
  theme: string;
  subtheme: string;
  rationale: string;
  confidence: "low" | "medium" | "high";
};

export type StageArtifact<TPayload> = {
  stage: StageName;
  model: string;
  promptVersion: string;
  generatedAt: string;
  questionId: string;
  payload: TPayload;
};

export type PipelineModels = {
  solver: string;
  explainer: string;
  reviewer: string;
};

export type PipelineStageLimits = {
  maxOutputTokens: number;
};

export type PipelineConfig = {
  apiKey: string;
  models: PipelineModels;
  stageLimits: {
    theme: PipelineStageLimits;
    solver: PipelineStageLimits;
    explainer: PipelineStageLimits;
    reviewer: PipelineStageLimits;
  };
  budgetUsd: number;
  inputPath: string;
  outputDir: string;
};

export type PromptDefinition = {
  version: string;
  system: string;
  buildUserText: (input: {
    question: QuestionInput;
    solverOutput?: SolverOutput;
    explainerOutput?: ExplainerOutput;
    extraContext?: unknown;
  }) => string;
};

export type SchemaDefinition = {
  name: string;
  schema: Record<string, unknown>;
};

export type UsageSnapshot = {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
};
