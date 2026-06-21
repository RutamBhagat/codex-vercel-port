export const supportedModels = ["gpt-5.5", "gpt-5.4-mini"] as const;

export type SupportedModel = (typeof supportedModels)[number];
export type ReasoningEffort =
	| "minimal"
	| "low"
	| "medium"
	| "high"
	| "xhigh"
	| "none";

const effortByModel: Record<SupportedModel, readonly ReasoningEffort[]> = {
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
