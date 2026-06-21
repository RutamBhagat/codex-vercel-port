import { env } from "@/env";
import { jsonChat, streamChat } from "@/server/chat-response";
import { buildCodexBody, chatRequestSchema } from "@/server/chat-shapes";
import { fetchCodex } from "@/server/codex-upstream";
import { corsPreflight, jsonCors } from "@/server/cors";
import { defaultEffort, isEffortAllowed } from "@/server/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export function OPTIONS(request: Request) {
	return corsPreflight(request);
}

export async function POST(request: Request) {
	try {
		const authError = validateProxyAuth(request);
		if (authError) {
			return authError;
		}

		const body = chatRequestSchema.parse(await request.json());
		const effort =
			body.reasoning?.effort ?? env.REASONING_EFFORT ?? defaultEffort();
		if (!isEffortAllowed(body.model, effort)) {
			return jsonError(
				`${body.model} does not support reasoning.effort=${effort}`,
				400,
			);
		}

		const created = Math.floor(Date.now() / 1000);
		const upstream = await fetchCodex(
			buildCodexBody(body, body.model, {
				effort,
				summary: body.reasoning?.summary ?? env.REASONING_SUMMARY,
			}),
		);
		return body.stream
			? streamChat(upstream, body.model, created)
			: jsonChat(upstream, body.model, created);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unexpected error";
		return jsonError(message, 400);
	}
}

function validateProxyAuth(request: Request) {
	if (!env.OPENAI_API_KEY) {
		return null;
	}
	const token = request.headers
		.get("authorization")
		?.replace(/^Bearer\s+/i, "");
	return token === env.OPENAI_API_KEY
		? null
		: jsonError("Invalid API key", 401);
}

function jsonError(message: string, status: number) {
	return jsonCors({ error: { message } }, { status });
}
