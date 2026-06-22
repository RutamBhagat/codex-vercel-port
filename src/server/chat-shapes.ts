import { z } from "zod";
import { apiModelIds, type ReasoningEffort } from "@/server/models";

const textPartSchema = z.object({ type: z.literal("text"), text: z.string() });
const filePartSchema = z.object({
	type: z.literal("file"),
	file: z.object({
		filename: z.string().optional(),
		file_data: z.string().optional(),
		file_id: z.string().optional(),
		file_url: z.string().optional(),
	}),
});
const contentSchema = z.union([
	z.string(),
	z.array(z.union([textPartSchema, filePartSchema])).min(1),
]);
const messageSchema = z.object({
	role: z.enum(["system", "developer", "user", "assistant"]),
	content: contentSchema,
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
			.map((message) => toText(message.content))
			.join("\n\n") || "_";

	const input = body.messages.flatMap((message) => {
		if (message.role !== "user" && message.role !== "assistant") {
			return [];
		}
		return {
			type: "message",
			role: message.role,
			content: toResponsesContent(message.role, message.content),
		};
	});
	if (
		body.response_format?.type === "json_object" &&
		!input.some((message) =>
			message.content.some(
				(content) =>
					"text" in content &&
					typeof content.text === "string" &&
					/\bjson\b/i.test(content.text),
			),
		)
	) {
		input.push({
			type: "message",
			role: "user",
			content: [{ type: "input_text", text: "Respond in JSON." }],
		});
	}

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

function toText(content: z.infer<typeof contentSchema>) {
	return typeof content === "string"
		? content
		: content
				.filter((part) => part.type === "text")
				.map((part) => part.text)
				.join("\n\n");
}

function toResponsesContent(
	role: "user" | "assistant",
	content: z.infer<typeof contentSchema>,
) {
	if (typeof content === "string") {
		return [
			{
				type: role === "assistant" ? "output_text" : "input_text",
				text: content,
			},
		];
	}
	return content.map((part) =>
		part.type === "text"
			? {
					type: role === "assistant" ? "output_text" : "input_text",
					text: part.text,
				}
			: {
					type: "input_file",
					...(part.file.filename && { filename: part.file.filename }),
					...(part.file.file_data && { file_data: part.file.file_data }),
					...(part.file.file_id && { file_id: part.file.file_id }),
					...(part.file.file_url && { file_url: part.file.file_url }),
				},
	);
}

function toResponsesFormat(
	format: NonNullable<ChatRequest["response_format"]>,
) {
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
