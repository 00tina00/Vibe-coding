# API Specification

Base URL: `http://localhost:3001`

All responses are JSON. CORS is enabled for frontend development.

---

## Health Check

### `GET /health`

**Response 200**

```json
{
  "status": "ok",
  "service": "ar-kids-game-backend"
}
```

---

## Game Configuration

### `GET /api/game-config`

Returns merged game configuration from shared JSON files.

**Query Parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `language` | string | `en` | Locale code: `en`, `fr`, `ar`, `fa` |

**Response 200**

```json
{
  "difficulty": 1,
  "language": "en",
  "items": {
    "star": {
      "id": "star",
      "model": "/models/star.glb",
      "icon": "/icons/star.svg",
      "voiceKey": "star",
      "color": "#FFD700",
      "scale": 1.0
    }
  },
  "levels": {
    "levels": [
      {
        "level": 1,
        "objectCount": 3,
        "findsToAdvance": 10,
        "spawnRadius": 2.5,
        "floatSpeed": 0.4,
        "rotationSpeed": 0.6
      }
    ],
    "maxLevel": 3,
    "defaultLevel": 1
  },
  "rewards": {
    "correctFind": {
      "stars": 1,
      "particleDuration": 800,
      "celebrationDelay": 600
    }
  }
}
```

---

## Score Submission

### `POST /api/score`

Records a score update from the frontend.

**Request Body**

```json
{
  "score": 15
}
```

**Response 200**

```json
{
  "success": true,
  "entry": {
    "score": 15,
    "timestamp": "2026-06-12T10:00:00.000Z"
  }
}
```

**Response 400**

```json
{
  "success": false,
  "error": "Invalid score value"
}
```

---

## Static Shared Files

### `GET /shared/game-config/:file`

Serves raw configuration files from the shared directory.

---

## Error Format

```json
{
  "success": false,
  "error": "Error message"
}
```
