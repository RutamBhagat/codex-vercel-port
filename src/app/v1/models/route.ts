import { corsPreflight, jsonCors } from "@/server/cors";
import { supportedModels } from "@/server/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
	return corsPreflight(request);
}

export function GET() {
	return jsonCors({
		object: "list",
		data: supportedModels.map((id) => ({
			id,
			object: "model",
			owned_by: "openai-codex",
		})),
	});
}
