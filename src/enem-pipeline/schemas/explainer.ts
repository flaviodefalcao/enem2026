import type { SchemaDefinition } from "../types";

export const explainerSchema: SchemaDefinition = {
  name: "enem_explainer_output",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      didacticExplanation: {
        type: "object",
        additionalProperties: false,
        properties: {
          shortExplanation: { type: "string" },
          stepByStep: { type: "array", items: { type: "string" } },
          commonPitfalls: { type: "array", items: { type: "string" } },
          teachingTips: { type: "array", items: { type: "string" } },
        },
        required: [
          "shortExplanation",
          "stepByStep",
          "commonPitfalls",
          "teachingTips",
        ],
      },
    },
    required: ["didacticExplanation"],
  },
};
