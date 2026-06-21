import { z } from "zod";
import { type ReasoningEffort, supportedModels } from "@/server/models";

const messageSchema = z.object({
	role: z.enum(["system", "developer", "user", "assistant"]),
	content: z.string(),
});

export const chatRequestSchema = z.object({
	model: z.enum(supportedModels),
	stream: z.boolean().optional(),
	reasoning: z
		.object({
			effort: z
				.enum(["minimal", "low", "medium", "high", "xhigh", "none"])
				.optional(),
			summary: z.enum(["auto", "concise", "detailed", "none"]).optional(),
		})
		.optional(),
	messages: z.array(messageSchema).min(1),
});

type ChatRequest = z.infer<typeof chatRequestSchema>;

type Reasoning = {
	effort: ReasoningEffort;
	summary: "auto" | "concise" | "detailed" | "none";
};

export function buildCodexBody(
	body: ChatRequest,
	model: string,
	reasoning: Reasoning,
) {
	const instructions =
		body.messages
			.filter(
				(message) => message.role === "system" || message.role === "developer",
			)
			.map((message) => message.content)
			.join("\n\n") || "_";

	const input = body.messages
		.filter(
			(message) => message.role === "user" || message.role === "assistant",
		)
		.map((message) => ({
			type: "message",
			role: message.role,
			content: [
				{
					type: message.role === "assistant" ? "output_text" : "input_text",
					text: message.content,
				},
			],
		}));

	return {
		model,
		instructions,
		input,
		tools: [],
		tool_choice: "auto",
		parallel_tool_calls: false,
		store: false,
		stream: true,
		include: reasoning.effort === "none" ? [] : ["reasoning.encrypted_content"],
		reasoning:
			reasoning.summary === "none"
				? { effort: reasoning.effort }
				: { effort: reasoning.effort, summary: reasoning.summary },
	};
}
