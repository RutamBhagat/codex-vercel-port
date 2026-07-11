export const supportedModels = [
  "gpt-5.6-sol",
  "gpt-5.5",
  "gpt-5.4-mini",
] as const;
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
  { id: "gpt-5.6-sol-high", model: "gpt-5.6-sol", effort: "high" },
  { id: "gpt-5.6-sol-xhigh", model: "gpt-5.6-sol", effort: "xhigh" },
  { id: "gpt-5.6-sol-max", model: "gpt-5.6-sol", effort: "max" },
  { id: "gpt-5.5-low", model: "gpt-5.5", effort: "low" },
  { id: "gpt-5.5-medium", model: "gpt-5.5", effort: "medium" },
  { id: "gpt-5.5-high", model: "gpt-5.5", effort: "high" },
  { id: "gpt-5.5-xhigh", model: "gpt-5.5", effort: "xhigh" },
  { id: "gpt-5.4-mini-low", model: "gpt-5.4-mini", effort: "low" },
  { id: "gpt-5.4-mini-medium", model: "gpt-5.4-mini", effort: "medium" },
  { id: "gpt-5.4-mini-high", model: "gpt-5.4-mini", effort: "high" },
  { id: "gpt-5.4-mini-xhigh", model: "gpt-5.4-mini", effort: "xhigh" },
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
  "gpt-5.5": ["none", "low", "medium", "high", "xhigh"],
  "gpt-5.4-mini": ["none", "low", "medium", "high", "xhigh"],
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
