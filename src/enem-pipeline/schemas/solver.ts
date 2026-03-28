import type { SchemaDefinition } from "../types";

export const solverSchema: SchemaDefinition = {
  name: "enem_solver_output",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      technicalSolution: {
        type: "object",
        additionalProperties: false,
        properties: {
          finalAnswer: { type: "string" },
          correctnessClaim: { type: "string" },
          strategy: { type: "string" },
          steps: { type: "array", items: { type: "string" } },
          formulasUsed: { type: "array", items: { type: "string" } },
          visualEvidenceUsed: { type: "array", items: { type: "string" } },
          confidence: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
        },
        required: [
          "finalAnswer",
          "correctnessClaim",
          "strategy",
          "steps",
          "formulasUsed",
          "visualEvidenceUsed",
          "confidence",
        ],
      },
      distractors: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            option: { type: "string" },
            likelyReasoning: { type: "string" },
            misconceptionType: { type: "string" },
            whyItLooksPlausible: { type: "string" },
            whyItIsWrong: { type: "string" },
          },
          required: [
            "option",
            "likelyReasoning",
            "misconceptionType",
            "whyItLooksPlausible",
            "whyItIsWrong",
          ],
        },
      },
      itemProfile: {
        type: "object",
        additionalProperties: false,
        properties: {
          primarySkill: { type: "string" },
          secondarySkills: { type: "array", items: { type: "string" } },
          cognitiveDemand: { type: "string" },
          difficultyEstimate: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          requiresVisualInterpretation: { type: "boolean" },
          requiresModeling: { type: "boolean" },
          requiresCalculation: { type: "boolean" },
          notes: { type: "array", items: { type: "string" } },
        },
        required: [
          "primarySkill",
          "secondarySkills",
          "cognitiveDemand",
          "difficultyEstimate",
          "requiresVisualInterpretation",
          "requiresModeling",
          "requiresCalculation",
          "notes",
        ],
      },
    },
    required: ["technicalSolution", "distractors", "itemProfile"],
  },
};
