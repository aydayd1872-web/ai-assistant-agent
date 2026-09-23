export type AegisModel = {
  readonly id: string;
  readonly name: string;
  readonly vendor: string;
  readonly blurb: string;
};

export const MODELS: ReadonlyArray<AegisModel> = [
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    vendor: "Anthropic",
    blurb: "Deep reasoning for threat modeling and secure code review.",
  },
  {
    id: "openai/gpt-5",
    name: "GPT-5",
    vendor: "OpenAI",
    blurb: "Balanced speed and breadth for general security Q&A.",
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    vendor: "Google",
    blurb: "Long-context analysis for logs and large codebases.",
  },
  {
    id: "xai/grok-4",
    name: "Grok 4",
    vendor: "xAI",
    blurb: "Fast, current answers for emerging threats.",
  },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;

export const MODEL_STORAGE_KEY = "aegis:model";

export function getModelById(id: string | null | undefined): AegisModel {
  return MODELS.find((model) => model.id === id) ?? MODELS[0];
}
