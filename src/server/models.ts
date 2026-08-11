export const supportedModels = ["gpt-5.6-sol", "gpt-5.6-luna"] as const;
export type SupportedModel = (typeof supportedModels)[number];
export type ReasoningEffort =
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max"
  | "none";

export const modelPresets = [
  { id: "gpt-5.6-sol-low", model: "gpt-5.6-sol", effort: "low" },
  {
    id: "gpt-5.6-sol-medium",
    model: "gpt-5.6-sol",
    effort: "medium",
  },
  { id: "gpt-5.6-luna-low", model: "gpt-5.6-luna", effort: "low" },
  { id: "gpt-5.6-luna-medium", model: "gpt-5.6-luna", effort: "medium" },
  { id: "gpt-5.6-luna-high", model: "gpt-5.6-luna", effort: "high" },
  { id: "gpt-5.6-luna-xhigh", model: "gpt-5.6-luna", effort: "xhigh" },
  { id: "gpt-5.6-luna-max", model: "gpt-5.6-luna", effort: "max" },
] as const;
export const apiModelIds = [
  ...supportedModels,
  ...modelPresets.map((preset) => preset.id),
] as [
  SupportedModel,
  ...Array<SupportedModel | (typeof modelPresets)[number]["id"]>,
];
export type ApiModelId = (typeof apiModelIds)[number];

const effortByModel: Record<SupportedModel, readonly ReasoningEffort[]> = {
  "gpt-5.6-sol": ["none", "low", "medium", "high", "xhigh", "max"],
  "gpt-5.6-luna": ["low", "medium", "high", "xhigh", "max"],
};

export function defaultEffort(): ReasoningEffort {
  return "low";
}

export function isEffortAllowed(
  model: SupportedModel,
  effort: ReasoningEffort,
) {
  return effortByModel[model].includes(effort);
}

export function resolveModel(id: ApiModelId): {
  model: SupportedModel;
  effort?: ReasoningEffort;
} {
  const preset = modelPresets.find((item) => item.id === id);
  return preset
    ? { model: preset.model, effort: preset.effort }
    : { model: id as SupportedModel };
}
