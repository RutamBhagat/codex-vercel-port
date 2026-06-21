const allowedMethods = "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS";

export function withCors(response: Response, request?: Request) {
	const headers = new Headers(response.headers);
	headers.set("Access-Control-Allow-Origin", "*");
	headers.set("Access-Control-Allow-Methods", allowedMethods);
	headers.set(
		"Access-Control-Expose-Headers",
		"Content-Length, X-Kuma-Revision",
	);
	headers.set("Access-Control-Max-Age", "600");
	headers.set(
		"Access-Control-Allow-Headers",
		request?.headers.get("Access-Control-Request-Headers") ??
			"Authorization, Content-Type",
	);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export function corsPreflight(request: Request) {
	return withCors(new Response(null, { status: 204 }), request);
}

export function jsonCors(value: unknown, init?: ResponseInit) {
	return withCors(Response.json(value, init));
}
