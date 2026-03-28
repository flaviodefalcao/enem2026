import type { SchemaDefinition } from "../types";

export const reviewerSchema: SchemaDefinition = {
  name: "enem_reviewer_output",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      finalAnalysis: {
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
              confidence: { type: "string", enum: ["low", "medium", "high"] },
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
          officialResolution: {
            type: "object",
            additionalProperties: false,
            properties: {
              emoji: { type: "string" },
              shortThemeTitle: { type: "string" },
              interpretationIntro: { type: "string" },
              commandTerms: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    term: { type: "string" },
                    explanation: { type: "string" },
                  },
                  required: ["term", "explanation"],
                },
              },
              whatTheQuestionAsks: { type: "string" },
              strategyParagraph: { type: "string" },
              reviewTable: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    concept: { type: "string" },
                    keyIdea: { type: "string" },
                    application: { type: "string" },
                  },
                  required: ["concept", "keyIdea", "application"],
                },
              },
              theoryParagraphs: { type: "array", items: { type: "string" } },
              resolutionParagraphs: { type: "array", items: { type: "string" } },
              puloDoGato: { type: "string" },
              alternatives: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    option: { type: "string" },
                    isCorrect: { type: "boolean" },
                    explanation: { type: "string" },
                  },
                  required: ["option", "isCorrect", "explanation"],
                },
              },
              questionCode: { type: "string" },
            },
            required: [
              "emoji",
              "shortThemeTitle",
              "interpretationIntro",
              "commandTerms",
              "whatTheQuestionAsks",
              "strategyParagraph",
              "reviewTable",
              "theoryParagraphs",
              "resolutionParagraphs",
              "puloDoGato",
              "alternatives",
              "questionCode",
            ],
          },
          consistencyReview: {
            type: "object",
            additionalProperties: false,
            properties: {
              verdict: {
                type: "string",
                enum: ["approved", "approved_with_notes", "needs_revision"],
              },
              summary: { type: "string" },
              issues: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    severity: {
                      type: "string",
                      enum: ["low", "medium", "high"],
                    },
                    field: { type: "string" },
                    description: { type: "string" },
                    suggestedFix: { type: "string" },
                  },
                  required: ["severity", "field", "description", "suggestedFix"],
                },
              },
            },
            required: ["verdict", "summary", "issues"],
          },
        },
        required: [
          "technicalSolution",
          "didacticExplanation",
          "distractors",
          "itemProfile",
          "officialResolution",
          "consistencyReview",
        ],
      },
    },
    required: ["finalAnalysis"],
  },
};
