import { supportedModels } from "@/server/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
	return Response.json({
		object: "list",
		data: supportedModels.map((id) => ({
			id,
			object: "model",
			owned_by: "openai-codex",
		})),
	});
}
