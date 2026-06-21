import { z } from "zod";
import { env } from "@/env";

const tokensSchema = z.object({
	id_token: z.string().optional(),
	access_token: z.string().min(1),
	refresh_token: z.string().min(1),
	account_id: z.string().optional(),
});

const authSchema = z.object({ tokens: tokensSchema });

type CodexTokens = z.infer<typeof tokensSchema>;

export type CodexAuth = {
	accessToken: string;
	refreshToken: string;
	accountId: string;
};

export function getCodexAuth(): CodexAuth {
	const tokens = authSchema.parse(JSON.parse(env.OPENAI_CODEX_AUTH)).tokens;
	const accountId = tokens.account_id ?? accountIdFromJwt(tokens.id_token);
	if (!accountId) {
		throw new Error("OPENAI_CODEX_AUTH is missing tokens.account_id");
	}
	return {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		accountId,
	};
}

export async function refreshCodexAuth(auth: CodexAuth): Promise<CodexAuth> {
	const response = await fetch("https://auth.openai.com/oauth/token", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			client_id: env.CHATGPT_LOCAL_CLIENT_ID,
			grant_type: "refresh_token",
			refresh_token: auth.refreshToken,
			scope: "openid profile email",
		}),
	});

	if (!response.ok) {
		throw new Error(`Codex token refresh failed: ${response.status}`);
	}

	const refreshed = tokensSchema
		.partial({ refresh_token: true })
		.parse(await response.json());
	return {
		accessToken: refreshed.access_token,
		refreshToken: refreshed.refresh_token ?? auth.refreshToken,
		accountId:
			refreshed.account_id ??
			accountIdFromJwt(refreshed.id_token) ??
			auth.accountId,
	};
}

function accountIdFromJwt(token: CodexTokens["id_token"]): string | undefined {
	if (!token) {
		return undefined;
	}
	const [, payload] = token.split(".");
	if (!payload) {
		return undefined;
	}
	const json = Buffer.from(payload, "base64url").toString("utf8");
	const claims = z
		.object({
			"https://api.openai.com/auth": z
				.object({ chatgpt_account_id: z.string().optional() })
				.optional(),
		})
		.passthrough()
		.parse(JSON.parse(json));
	return claims["https://api.openai.com/auth"]?.chatgpt_account_id;
}
