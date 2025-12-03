# AI Service API Specification

## Overview
This document specifies the API contract between Healer (SvelteKit app) and the AI Service (FastAPI).

**Base URL**: `http://localhost:8000` (configurable via `HEALER_AI_BASE_URL`)

---

## Authentication
All requests require authentication via Bearer token in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY_HERE
```

Set via environment variable: `HEALER_AI_API_KEY`

---

## API Endpoints

### 1. Health Check

**Endpoint**: `GET /v1/health`

**Description**: Check if the AI service is running and healthy.

**Response** (200 OK):
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-12-03T10:30:00Z"
}
```

**Error** (503 Service Unavailable):
```json
{
  "error": {
    "message": "Service is not ready",
    "code": "SERVICE_UNAVAILABLE"
  }
}
```

---

### 2. Summarize Content

**Endpoint**: `POST /v1/ai/summarize`

**Description**: Generate a concise summary of webpage content.

**Request Body**:
```json
{
  "content": "Full text content to summarize...",
  "system_prompt": "Optional custom system prompt (default: generate concise summary)",
  "max_length": 200
}
```

**Parameters**:
- `content` (required): Text to summarize (string, max 10,000 chars)
- `system_prompt` (optional): Custom instruction for AI
- `max_length` (optional): Maximum summary length in characters (default: 150)

**Response** (200 OK):
```json
{
  "summary": "This article discusses advanced React patterns...",
  "metadata": {
    "model": "gpt-4-turbo",
    "tokensUsed": 523,
    "processingTimeMs": 1245
  }
}
```

**Error** (400 Bad Request):
```json
{
  "error": {
    "message": "Content is required and must be a non-empty string",
    "code": "INVALID_INPUT",
    "details": {
      "field": "content"
    }
  }
}
```

**Error** (500 Internal Server Error):
```json
{
  "error": {
    "message": "Failed to generate summary",
    "code": "AI_PROCESSING_ERROR"
  }
}
```

---

### 3. Generate Tags

**Endpoint**: `POST /v1/ai/generate-tags`

**Description**: Automatically generate relevant tags from content.

**Request Body**:
```json
{
  "content": "Full text content to analyze...",
  "system_prompt": "Optional custom system prompt",
  "count": 5
}
```

**Parameters**:
- `content` (required): Text to analyze (string, max 10,000 chars)
- `system_prompt` (optional): Custom instruction for AI
- `count` (optional): Number of tags to generate (default: 3, max: 10)

**Response** (200 OK):
```json
{
  "tags": ["react", "hooks", "frontend", "javascript", "tutorial"],
  "metadata": {
    "model": "gpt-4-turbo",
    "tokensUsed": 234,
    "processingTimeMs": 856
  }
}
```

**Error** (400 Bad Request):
```json
{
  "error": {
    "message": "Count must be between 1 and 10",
    "code": "INVALID_INPUT",
    "details": {
      "field": "count",
      "value": 15
    }
  }
}
```

---

### 4. Generate Embeddings

**Endpoint**: `POST /v1/embed`

**Description**: Generate vector embeddings for semantic search.

**Request Body**:
```json
{
  "text": "Text to generate embeddings for...",
  "model": "text-embedding-3-small"
}
```

**Parameters**:
- `text` (required): Text to embed (string, max 8,000 tokens)
- `model` (optional): Embedding model to use (default: `text-embedding-3-small`)

**Response** (200 OK):
```json
{
  "embedding": [0.023, -0.145, 0.678, ...],
  "model": "text-embedding-3-small",
  "dimensions": 1536,
  "tokens_used": 42,
  "processing_time_ms": 234
}
```

**Notes**:
- `embedding` is an array of floats (1536 dimensions for text-embedding-3-small)
- Use cosine similarity for semantic search

**Error** (400 Bad Request):
```json
{
  "error": {
    "message": "Text exceeds maximum token limit (8000)",
    "code": "TEXT_TOO_LONG"
  }
}
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {}  // Optional additional context
  }
}
```

### Common Error Codes:
- `INVALID_INPUT` - Invalid request parameters
- `UNAUTHORIZED` - Missing or invalid API key
- `TEXT_TOO_LONG` - Input exceeds length limits
- `AI_PROCESSING_ERROR` - Internal AI service error
- `TIMEOUT` - Request took too long to process
- `SERVICE_UNAVAILABLE` - AI service is down or overloaded
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## Rate Limiting

- **Default**: 100 requests per minute per API key
- **Headers**:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

**Example**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1701612000
```

**429 Too Many Requests**:
```json
{
  "error": {
    "message": "Rate limit exceeded. Try again in 42 seconds",
    "code": "RATE_LIMIT_EXCEEDED",
    "details": {
      "retryAfter": 42
    }
  }
}
```

---

## Timeouts

- **Client timeout**: 30 seconds (configurable via `HEALER_AI_TIMEOUT`)
- **Server timeout**: 60 seconds for long-running operations
- **Retry strategy**: Exponential backoff (2s, 4s, 8s) for 5xx errors

---

## Example Integration (TypeScript)

```typescript
import { HTTPAIClient } from '$lib/integrations/ai/http-client';

const aiClient = new HTTPAIClient({
  baseUrl: 'http://localhost:8000',
  apiKey: process.env.HEALER_AI_API_KEY,
  timeout: 30000,
  retries: 2,
  debug: true
});

// Summarize content
const summary = await aiClient.summarize({
  content: 'Your webpage content here...',
  maxLength: 200
});
console.log(summary.summary);

// Generate tags
const tags = await aiClient.generateTags({
  content: 'Your webpage content here...',
  count: 5
});
console.log(tags.tags);

// Generate embeddings
const embeddings = await aiClient.generateEmbeddings({
  text: 'Your text here...'
});
console.log(embeddings.embedding.length); // 1536
```

---

## Testing

### Mock Mode
For development/testing without real AI service:

```bash
HEALER_AI_USE_MOCK=true
# or simply don't set HEALER_AI_BASE_URL
```

The `MockAIClient` will return realistic fake responses.

### Curl Examples

**Health Check**:
```bash
curl http://localhost:8000/v1/health
```

**Summarize**:
```bash
curl -X POST http://localhost:8000/v1/ai/summarize \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your content here...",
    "max_length": 200
  }'
```

**Generate Tags**:
```bash
curl -X POST http://localhost:8000/v1/ai/generate-tags \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your content here...",
    "count": 5
  }'
```

**Generate Embeddings**:
```bash
curl -X POST http://localhost:8000/v1/embed \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your text here..."
  }'
```

---

## Production Deployment Checklist

- [ ] Set `HEALER_AI_BASE_URL` to production AI service URL
- [ ] Set `HEALER_AI_API_KEY` to secure API key
- [ ] Set `HEALER_AI_USE_MOCK=false`
- [ ] Configure appropriate timeouts and retries
- [ ] Enable debug logging initially: `HEALER_AI_DEBUG=true`
- [ ] Monitor rate limits and error rates
- [ ] Set up health check monitoring
- [ ] Configure HTTPS for AI service communication
- [ ] Implement proper error handling and fallbacks in UI

---

## Change Log

- **v1.0.0** (2025-12-03): Initial specification
  - Health check endpoint
  - Summarize endpoint
  - Generate tags endpoint
  - Generate embeddings endpoint
  - Authentication via Bearer token
  - Rate limiting
  - Error handling standards
