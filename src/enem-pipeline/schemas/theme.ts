import type { SchemaDefinition } from "../types";

export const themeSchema: SchemaDefinition = {
  name: "enem_theme_classifier_output",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      theme: { type: "string" },
      subtheme: { type: "string" },
      rationale: { type: "string" },
      confidence: {
        type: "string",
        enum: ["low", "medium", "high"],
      },
    },
    required: ["theme", "subtheme", "rationale", "confidence"],
  },
};
