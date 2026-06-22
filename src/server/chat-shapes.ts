import { z } from "zod";
import { apiModelIds, type ReasoningEffort } from "@/server/models";

const messageSchema = z.object({
	role: z.enum(["system", "developer", "user", "assistant"]),
	content: z.string(),
});
const responseFormatSchema = z.union([
	z.object({ type: z.literal("json_object") }),
	z.object({
		type: z.literal("json_schema"),
		json_schema: z.object({
			name: z.string().min(1),
			description: z.string().optional(),
			schema: z.record(z.unknown()),
			strict: z.boolean().optional(),
		}),
	}),
]);
export const chatRequestSchema = z.object({
	model: z.enum(apiModelIds),
	stream: z.boolean().optional(),
	response_format: responseFormatSchema.optional(),
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
		...(body.response_format && {
			text: { format: toResponsesFormat(body.response_format) },
		}),
		reasoning:
			reasoning.summary === "none"
				? { effort: reasoning.effort }
				: { effort: reasoning.effort, summary: reasoning.summary },
	};
}

function toResponsesFormat(format: NonNullable<ChatRequest["response_format"]>) {
	if (format.type === "json_object") {
		return { type: "json_object" };
	}
	const jsonSchema = format.json_schema;
	return {
		type: "json_schema",
		name: jsonSchema.name,
		...(jsonSchema.description && { description: jsonSchema.description }),
		schema: jsonSchema.schema,
		...(jsonSchema.strict !== undefined && { strict: jsonSchema.strict }),
	};
}
