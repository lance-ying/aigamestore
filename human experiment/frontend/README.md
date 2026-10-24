# Frontend

A Next.js frontend for playing AI-generated HTML5 games with integrated
gameplay-session logging and end-of-study feedback collection. Used as the
participant-facing surface for the user study reported in the paper.

## Features

- HTML5 games playable in-browser via iframe (the 10 public games in this release)
- Search, filter, and sequence-based navigation
- Per-session gameplay logging (Firebase Firestore)
- Per-session media upload (Firebase Storage)
- End-of-study feedback form

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Firebase (Firestore + Storage)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` from the example and fill in Firebase credentials:
   ```bash
   cp .env.local.example .env.local
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Firebase setup

Reproduction requires a Firebase project with Firestore and Storage enabled.
Required env vars are listed in `.env.local.example`. See `firestore.rules`
and `storage.rules` for the security rules used in the deployed study.

## Layout

```
frontend/
├── app/                    # Next.js App Router pages and API routes
├── components/             # React components
├── lib/
│   ├── firebase/           # Firebase client + admin SDK setup
│   ├── types/              # Shared TypeScript types
│   └── utils/
├── public/
│   ├── games/              # the 10 public games (each with index.html)
│   ├── games-manifest.json # Game metadata index
│   └── games-sequences.json
├── scripts/                # Build / data-prep scripts
├── firestore.rules
├── storage.rules
└── package.json
```

## Game corpus

The study used all 100 AI GameStore games; this release ships the 10 public
games under `public/games/`, with `games-manifest.json` and
`games-sequences.json` set up for those 10 (each participant plays all 10,
in a rotated order). The other 90 games are a private test set and are not
distributed. Games were produced by the generation pipeline in
`../../game generation/`. Each directory contains an `index.html` plus
per-library JS modules.
