import {
  ALLOWED_AIL_ORIGINS,
  ALLOWED_AIL_REDIRECT_URIS,
  DEFAULT_AIL_CLIENT_ID,
  handleAILExchange,
} from "./ail-exchange-core.js"

export { ALLOWED_AIL_ORIGINS, ALLOWED_AIL_REDIRECT_URIS }

export async function handleAILExchangeRequest(
  request,
  {
    fetchImpl = globalThis.fetch?.bind(globalThis),
    clientId = process.env.AIL_CLIENT_ID || DEFAULT_AIL_CLIENT_ID,
    clientSecret = process.env.AIL_CLIENT_SECRET || "",
  } = {},
) {
  return handleAILExchange({
    method: request?.method,
    origin: request?.headers?.origin || request?.headers?.Origin || "",
    body: request?.body,
    fetchImpl,
    clientId,
    clientSecret,
  })
}

export default async function handler(req, res) {
  const result = await handleAILExchangeRequest(req)
  res.status(result.status).json(result.body)
}
