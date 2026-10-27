# Study Data

Gameplay sessions, per-session telemetry, and qualitative feedback collected
from the deployed user study. Participants were recruited via Prolific.

Machine-readable metadata for this dataset is in [`croissant.jsonld`](croissant.jsonld)
(MLCommons Croissant 1.0; includes Responsible AI fields).

## Top-level layout

```
data/study/
├── firestore/
│   ├── gameplay_sessions.json   # 2,281 session records
│   └── users.json               # 87 participants
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
| Participants (with session records) | 87 |
| Sessions | 2,281 |
| Sessions with completed gameplay | most (`completed: true` in record) |
| Distinct games played | 99 of the final 100 (none recorded for PhysiType) |
| Raw session folders (`sessions/`, public games only) | 98 |
| Per-game-feedback files | 889 |
| End-of-study feedback responses | 77 |

## Scope

This release covers only the final 100 AI GameStore games. Sessions and feedback for game variants and for games cut from the final set were removed, along with end-of-study surveys from participants who played only those games.

## Public games vs. private test set

Ten of the 100 games are public (`aqua-sort-puzzle`, `fling-feathers-blitz`,
`red-hot-vengeance-web-edition`, `jetpack-joyride-clone`,
`cheese-chase-mouse-escape`, `shadow-boy`, `battle-zone`, `bubble-cash`,
`megaman`, `ao-oni-the-mansions-shadow`). The other 90 games form the
AI GameStore private test set and are not distributed. For those 90 games
this release keeps session-level results (`firestore/gameplay_sessions.json`:
final score and score time-series) and numeric per-game ratings, but withholds
raw per-session telemetry (`sessions/`) and free-text per-game feedback
(`textFeedback` is `null`).

## What's not included

- **Verbose runtime logs** (`logs.json`, ~189 MB): excluded as redundant —
  these are JS console output captured during gameplay and were used only
  for debugging the deployed app.
- **Device information** (`deviceInfo`: user agent, timezone, screen size,
  platform): removed from all records.
- **Raw telemetry and free-text feedback for the 90 private-test-set games**
  (see above).

## Identifiers

Prolific IDs have been replaced with pseudonymous participant codes
(`P001`, `P002`, ...). The same code is used for a participant in every file
and folder name, so all joins below still work. The original Prolific IDs
are not released.

Pre-launch test sessions (non-Prolific-format user IDs from the research
team's testing) have been removed.

## File schemas

### `firestore/gameplay_sessions.json`

Array of session records. One record per game played by a participant.

```json
{
  "id": "session_<timestamp>_<rand>",
  "sessionId": "session_<timestamp>_<rand>",
  "userId": "P###",
  "gameId": "all_92_games/<game-slug>",
  "modelId": null,
  "timestamp": { "_seconds": ..., "_nanoseconds": ... },
  "createdAt": { ... },
  "duration": 126,                  // seconds
  "completed": true,
  "score": 1150,                    // game-specific final score (null if not recorded)
  "scoreTimeSeries": [ ... ],       // per-frame score samples
  "metadataUrl": "",                // (Firebase URLs stripped; data is local)
  "videoUrl": "",
  "inputsUrl": "",
  "scoresUrl": ""
}
```

### `firestore/users.json`

```json
{
  "id": "P###",
  "userId": "P###",
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
  "userId": "P###",
  "startTime": "ISO-8601",
  "endTime": "ISO-8601",
  "duration": 174,
  "fps": 30,
  "videoWidth": 600,
  "videoHeight": 400,
  "completed": true,
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

Per-game feedback collected after each game: `sessionId`, `gameId`,
`userId`, `funRating` and `challengeRating` (0–100), `similarGame`,
`playFrequency`, `textFeedback` (free text; `null` for private-test-set
games), and `timestamp`. Missing values are `null`.

## Joining the data

- **Sessions ↔ users**: join `gameplay_sessions[i].userId` to `users[j].userId`
- **Sessions ↔ session artifacts**: a session's input/score/metadata files
  live at `sessions/<gameId>/user_sessions/<userId>/<sessionId>/`. Note that
  the `gameId` field in firestore is `all_92_games/<slug>` while the
  `sessions/` directory is keyed by `<slug>` only — strip the prefix before
  joining.
- **Sessions ↔ end-of-study feedback**: `gameplay_sessions[i].userId` →
  `feedback/end_study/<userId>/feedback.json`
