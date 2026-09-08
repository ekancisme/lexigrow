# LexiGrow API Contract — LearningSet Module

## Base URL
`/api/learning-sets`

## Authentication
All endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```
Admin-only endpoints require `role: admin`.

---

## Endpoints

### GET /api/learning-sets
List published learning sets with optional filters.

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category (e.g., "Daily Life", "Travel", "Hobbies") |
| `level` | string | Filter by CEFR level ("A2", "B1", "B2") |
| `page` | integer | Page number (default 1) |
| `limit` | integer | Items per page (default 20, max 100) |

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "slug": "daily-life",
      "title": "Daily Life Vocabulary",
      "description": "Essential words and phrases for everyday activities...",
      "level": "A2",
      "category": "Daily Life",
      "status": "published",
      "items": [
        {
          "word": "routine",
          "partOfSpeech": "noun",
          "definitionVi": "thói quen, công việc hàng ngày",
          "phonetic": "/ruːˈtiːn/",
          "collocations": ["daily routine", "morning routine"],
          "exampleSentences": ["My daily routine includes a morning jog."],
          "quizQuestions": [
            {
              "type": "multiple-choice",
              "question": "What does 'routine' mean in Vietnamese?",
              "options": ["thói quen", "kỹ năng", "mục tiêu"],
              "correctAnswer": "thói quen"
            }
          ]
        }
      ],
      "createdAt": "2026-09-08T00:00:00.000Z",
      "updatedAt": "2026-09-08T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 10,
    "totalPages": 1
  }
}
```

**Error Responses**
- `401` — Unauthorized (missing/invalid token)
- `422` — Invalid query parameters

---

### GET /api/learning-sets/:slug
Get a single published learning set by its slug.

**Path Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | string | Unique slug identifier (e.g., "daily-life") |

**Response (200 OK)**
Same structure as a single item in the list response.

**Error Responses**
- `401` — Unauthorized
- `404` — Learning set not found or not published

---

### POST /api/learning-sets (Admin only)
Create a new learning set.

**Request Body**
```json
{
  "slug": "business-english",
  "title": "Business English Vocabulary",
  "description": "Essential words for professional communication",
  "level": "B2",
  "category": "Business",
  "status": "draft",
  "items": [
    {
      "word": "negotiate",
      "partOfSpeech": "verb",
      "definitionVi": "đàm phán, thương lượng",
      "phonetic": "/nɪˈɡoʊʃieɪt/",
      "collocations": ["negotiate a deal", "negotiate terms"],
      "exampleSentences": ["They need to negotiate the contract."],
      "quizQuestions": [
        {
          "type": "multiple-choice",
          "question": "What does 'negotiate' mean?",
          "options": ["đàm phán", "kết thúc", "bắt đầu"],
          "correctAnswer": "đàm phán"
        }
      ]
    }
  ]
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Responses**
- `400` — Validation error (duplicate slug, missing required fields, invalid enum)
- `401` — Unauthorized
- `403` — Forbidden (not admin)
- `422` — Invalid item structure

---

### PUT /api/learning-sets/:slug (Admin only)
Update an existing learning set (partial updates allowed).

**Path Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | string | Slug of the set to update |

**Request Body** (all fields optional)
Same as POST, but all fields are optional. Items can be replaced entirely.

**Response (200 OK)**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Responses**
- `400` — Validation error
- `401` — Unauthorized
- `403` — Forbidden
- `404` — Set not found

---

### DELETE /api/learning-sets/:slug (Admin only)
Delete a learning set.

**Path Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | string | Slug of the set to delete |

**Response (200 OK)**
```json
{
  "success": true,
  "message": "Learning set deleted successfully"
}
```

**Error Responses**
- `401` — Unauthorized
- `403` — Forbidden
- `404` — Set not found

---

## Data Schemas

### LearningSet
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | MongoDB ID |
| `slug` | string | yes | Unique identifier, lowercase, no spaces |
| `title` | string | yes | Display title |
| `description` | string | yes | Description of the set |
| `level` | string | yes | CEFR level: "A2", "B1", "B2" |
| `category` | string | yes | Category name (e.g., "Daily Life") |
| `status` | string | yes | "published" or "draft" (default "draft") |
| `items` | array | yes | List of LearningItem objects |
| `createdAt` | Date | auto | Creation timestamp |
| `updatedAt` | Date | auto | Last update timestamp |

### LearningItem
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `word` | string | yes | The vocabulary word |
| `partOfSpeech` | string | yes | e.g., "noun", "verb", "adjective" |
| `definitionVi` | string | yes | Vietnamese definition |
| `phonetic` | string | no | IPA pronunciation |
| `collocations` | array | no | List of common collocations |
| `exampleSentences` | array | no | Example sentences using the word |
| `quizQuestions` | array | no | List of quiz questions for this word |

### QuizQuestion
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | "multiple-choice" or "fill-in-blank" |
| `question` | string | yes | The question text |
| `options` | array | no | For multiple-choice: array of options |
| `correctAnswer` | string | yes | The correct answer |

---

## Seed Data (3 Built-in Sets)

| Slug | Title | Level | Category |
|------|-------|-------|----------|
| `daily-life` | Daily Life Vocabulary | A2 | Daily Life |
| `travel` | Travel Vocabulary | B1 | Travel |
| `hobbies` | Hobbies Vocabulary | B1 | Hobbies |

Each set contains 3 vocabulary items with definitions, examples, and quiz questions.

---

## Error Response Format
All error responses follow the same structure:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": { ... } // optional, validation details
}
```
HTTP status codes: 400, 401, 403, 404, 422, 500.