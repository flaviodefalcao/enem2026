import type { SchemaDefinition } from "../types";

export const latexSchema: SchemaDefinition = {
  name: "enem_latex_output",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      technicalSolution: { type: "string" },
      formulasUsed: { type: "string" },
      visualEvidenceUsed: { type: "string" },
      didacticExplanation: { type: "string" },
      commonPitfalls: { type: "string" },
      teachingTips: { type: "string" },
      distractors: { type: "string" },
      itemProfile: { type: "string" },
      fullDocument: { type: "string" },
    },
    required: [
      "technicalSolution",
      "formulasUsed",
      "visualEvidenceUsed",
      "didacticExplanation",
      "commonPitfalls",
      "teachingTips",
      "distractors",
      "itemProfile",
      "fullDocument",
    ],
  },
};
