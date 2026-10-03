# LexiGrow AI provider operations

## Provider pool

Administrators can add accounts from **Admin → System Configuration → AI Provider Pool**. Keys are write-only in the UI and are encrypted before being stored in MongoDB.

The Admin settings screen separates **Providers** from **Model Combos**. A provider stores the URL/key connection; a combo stores the ordered model candidates and route assignment. Selecting a combo does not expose provider keys to the application callers.

Supported account types:

- `groq`: native Groq chat completions.
- `gemini`: native Google Gemini structured generation.
- `openai-compatible`: OpenAI, OpenRouter, Together, or another compatible `/chat/completions` endpoint.

Hugging Face remains a separate AI-writing detector integration through `HF_API_TOKEN`; it is not a chat provider account.

Each account has a priority, model, optional base URL, enabled flag, and optional route list. Lower priority numbers are preferred. When a route has no explicit mapping, enabled accounts are eligible for that route. You can also set both input and output prices in USD per million tokens. Account prices override the built-in pricing registry; if neither has a price for the selected model, cost is recorded as unknown rather than guessed.

## Failover behavior

The gateway retries only quota/rate-limit, timeout/network, HTTP 408, and HTTP 5xx failures. A 400/schema/context/policy error is returned immediately because changing providers would hide an application defect.

For retryable failures, the account receives a cooldown. `Retry-After` is respected; otherwise cooldown grows from 30 seconds up to 15 minutes. A request has a bounded attempt count (normally three). The response metadata reports provider, safe account name, model, latency, request ID, attempts, and whether a fallback was used.

Legacy environment/database keys remain supported during migration:

```text
GROQ_API_KEY
GEMINI_API_KEY
GEMINI_MODEL
OPENAI_API_KEY
OPENAI_BASE_URL
HF_API_TOKEN
AI_PROVIDER_ENCRYPTION_KEY
```

Use provider accounts for multiple keys. Do not create numbered variables such as `GROQ_API_KEY_2`; the account pool is the rotation mechanism.

## Security

Set `AI_PROVIDER_ENCRYPTION_KEY` to a long random secret in production. The service derives an AES-256-GCM key from it. `JWT_SECRET` is only a compatibility fallback for existing deployments; rotate both if a credential was exposed.

Never put provider keys in scratch files, logs, prompts, client bundles, or error messages. The old AIML scratch scripts now read `AIML_API_KEY` from the environment. Any key previously committed to Git must be revoked at the provider.

## Adaptive learning

`POST /api/sessions/start` accepts `{ "adaptive": true }`. The deterministic competency service prioritizes due words, struggling words, unseen CEFR-matched words, and then learning/new words. It stores the selected words and rationale in the session snapshot, so later vocabulary changes do not alter an active session.

`GET /api/sessions/recommendation` returns the deterministic target-word payload plus an optional AI-written explanation. Starting an adaptive session never delegates SRS state or word selection to the model.

## Observability

AI logs include route, provider, safe account name, model, request IDs, attempts, status, fallback source, usage availability, and cost estimate. Raw essay text and provider secrets are not logged. Frontend AI responses can expose `_meta.source` as `ai`, `offline_fallback`, `curated_template`, or `deterministic_competency` and `_meta.isFallback`.
