# Study Data

Gameplay sessions, per-session telemetry, and qualitative feedback collected
from the deployed user study. Participants were recruited via Prolific.

Machine-readable metadata for this dataset is in [`croissant.jsonld`](croissant.jsonld)
(MLCommons Croissant 1.0; includes Responsible AI fields). The `contentUrl`
of the `aigamestore-videos` distribution entry is a placeholder — fill in the
external archive URL once the video release is hosted.

## Top-level layout

```
data/study/
├── firestore/
│   ├── gameplay_sessions.json   # 3,722 session records
│   └── users.json               # 128 participants
├── sessions/<game-slug>/user_sessions/<userId>/<sessionId>/
│   ├── inputs.json              # input event stream
│   ├── metadata.json            # per-session metadata
│   └── scores.json              # score time-series
└── feedback/
    ├── end_study/<userId>/feedback.json     # end-of-study survey
    └── per_game/<userId>/<sessionId>/.../feedback.json
```

## Counts (after dropping pre-launch test sessions)

| Item | Count |
|---|---|
| Participants | 128 |
| Sessions | 3,722 |
| Sessions with completed gameplay | most (`completed: true` in record) |
| Distinct games played | 100 |
| Per-game-feedback files | ~700 |
| End-of-study feedback responses | ~70 |

## What's not included

- **Gameplay videos** (`video.webm`, ~3.2 GB across 902 sessions): held in
  the sibling release `aigamestore_anonymous_videos/`. Its directory layout
  mirrors `data/study/sessions/` so videos can be aligned by path. The
  `inputs.json` event stream and `scores.json` time-series included here
  preserve everything needed for quantitative analysis without the videos.
- **Verbose runtime logs** (`logs.json`, ~189 MB): excluded as redundant —
  these are JS console output captured during gameplay and were used only
  for debugging the deployed app.

## Identifiers

User IDs are Prolific IDs (24-char hex). Prolific IDs are pseudonymous:
they are stable identifiers within the Prolific platform but cannot be
linked to real-world identities without Prolific's cooperation. They are
released as-is, following standard practice for HCI research data.

Pre-launch test sessions (non-Prolific-format user IDs from the research
team's testing) have been removed.

## File schemas

### `firestore/gameplay_sessions.json`

Array of session records. One record per game played by a participant.

```json
{
  "id": "session_<timestamp>_<rand>",
  "sessionId": "session_<timestamp>_<rand>",
  "userId": "<prolific-id>",
  "prolificId": "<prolific-id>",
  "gameId": "all_92_games/<game-slug>",
  "modelId": null,
  "timestamp": { "_seconds": ..., "_nanoseconds": ... },
  "createdAt": { ... },
  "duration": 126,                  // seconds
  "completed": true,
  "score": 1150,                    // game-specific final score
  "scoreTimeSeries": [ ... ],       // per-frame score samples
  "deviceInfo": {
    "userAgent": "...",
    "screenWidth": 3072,
    "screenHeight": 1728,
    "timezone": "America/Los_Angeles",
    "language": "en-US",
    "platform": "Win32",
    "ip": null
  },
  "metadataUrl": "",                // (Firebase URLs stripped; data is local)
  "videoUrl": "",
  "inputsUrl": "",
  "scoresUrl": ""
}
```

### `firestore/users.json`

```json
{
  "id": "<prolific-id>",
  "userId": "<prolific-id>",
  "createdAt": { "_seconds": ..., "_nanoseconds": ... },
  "lastActiveAt": { ... },
  "totalSessions": 0,
  "gamesPlayed": [ "all_92_games/<game-slug>", ... ]
}
```

### `sessions/<game>/user_sessions/<userId>/<sessionId>/inputs.json`

Time-stamped input events captured during gameplay (mouse, keyboard).

```json
{
  "events": [
    { "timestamp": 1770750693096, "type": "mousemove", "x": 393, "y": 449 },
    { "timestamp": 1770750693280, "type": "keydown", "key": "ArrowLeft" },
    ...
  ]
}
```

### `sessions/<game>/user_sessions/<userId>/<sessionId>/scores.json`

```json
{
  "finalScore": 174,
  "scoreTimeSeries": [
    { "frame": 1, "timestamp": 1770758757961, "score": 0 },
    { "frame": 27, "timestamp": 1770758758389, "score": 1 },
    ...
  ]
}
```

### `sessions/<game>/user_sessions/<userId>/<sessionId>/metadata.json`

```json
{
  "sessionId": "...",
  "gameId": "games/<game-slug>",
  "userId": "<prolific-id>",
  "startTime": "ISO-8601",
  "endTime": "ISO-8601",
  "duration": 174,
  "fps": 30,
  "videoWidth": 600,
  "videoHeight": 400,
  "completed": true,
  "deviceInfo": { ... }
}
```

### `feedback/end_study/<userId>/feedback.json`

```json
{
  "prolificId": "<prolific-id>",
  "feedback": {
    "technicalIssues": "No",
    "confusingParts": "No",
    "suggestions": "...",
    "funCriteria": "..."
  },
  "demographics": {
    "age": "35-44",
    "gender": "male",
    "gamingFrequency": "Daily",
    "gamingExperience": "Experienced"
  },
  "submittedAt": "ISO-8601"
}
```

### `feedback/per_game/<userId>/<...>/feedback.json`

Per-game feedback collected after each game. Schema varies; common fields
include free-text comments and rating scales for fun, difficulty, and
clarity.

## Joining the data

- **Sessions ↔ users**: join `gameplay_sessions[i].userId` to `users[j].userId`
- **Sessions ↔ session artifacts**: a session's input/score/metadata files
  live at `sessions/<gameId>/user_sessions/<userId>/<sessionId>/`. Note that
  the `gameId` field in firestore is `all_92_games/<slug>` while the
  `sessions/` directory is keyed by `<slug>` only — strip the prefix before
  joining.
- **Sessions ↔ end-of-study feedback**: `gameplay_sessions[i].userId` →
  `feedback/end_study/<userId>/feedback.json`
