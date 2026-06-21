import { env } from "@/env";
import {
	type CodexAuth,
	getCodexAuth,
	refreshCodexAuth,
} from "@/server/codex-auth";

export async function fetchCodex(body: unknown) {
	const auth = getCodexAuth();
	const first = await codexFetch(body, auth);
	if (first.status !== 401) {
		return first.ok ? first : upstreamError(first);
	}
	const second = await codexFetch(body, await refreshCodexAuth(auth));
	return second.ok ? second : upstreamError(second);
}

async function codexFetch(body: unknown, auth: CodexAuth) {
	return fetch(env.CHATGPT_RESPONSES_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "text/event-stream",
			Authorization: `Bearer ${auth.accessToken}`,
			"chatgpt-account-id": auth.accountId,
			"OpenAI-Beta": "responses=experimental",
		},
		body: JSON.stringify(body),
	});
}

async function upstreamError(response: Response): Promise<never> {
	const text = await response.text().catch(() => response.statusText);
	throw new Error(`Codex upstream failed: ${response.status} ${text}`);
}
