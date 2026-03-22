import { DEFAULT_AIL_CLIENT_ID, handleAILExchange } from "../../api/ail-exchange-core.js"

export async function onRequestPost(context) {
  const requestBody = await context.request.clone().json().catch(() => ({}))

  const result = await handleAILExchange({
    method: context.request.method,
    origin: context.request.headers.get("origin") || "",
    body: requestBody,
    fetchImpl: context.data?.fetchImpl || globalThis.fetch?.bind(globalThis),
    clientId: context.env?.AIL_CLIENT_ID || DEFAULT_AIL_CLIENT_ID,
    clientSecret: context.env?.AIL_CLIENT_SECRET || "",
  })

  return Response.json(result.body, {
    status: result.status,
    headers: {
      "Access-Control-Allow-Origin": context.request.headers.get("origin") || "",
      Vary: "Origin",
    },
  })
}
