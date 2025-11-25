# Game Concept Generator Prompt

You are a professional game designer creating technical design documentation. For each of these iOS games, create a comprehensive game concept (4-6 sentences) that explains EXACTLY how the game mechanics work.

## Critical Requirements - Game Mechanics Focus

- Each description **MUST** be 4-6 complete sentences
- **MUST** explain SPECIFIC gameplay mechanics with CONCRETE details (not generic statements)
- **MUST** describe the EXACT user interface and control scheme (swipe left/right, tap to jump, etc.)
- **MUST** explain progression mechanics, unlock systems, and how difficulty scales
- **MUST** include NUMERICAL details where applicable (number of lanes, time limits, health points, spawn rates, speeds, etc.)
- **MUST** explain core game loops and how systems interact
- Focus **EXCLUSIVELY** on game design and mechanics - **DO NOT** discuss monetization, marketing, or business aspects

## What to Include for Each Game

### 1. Core Mechanics
Precise player actions and immediate game responses

- ✅ **Good Example:** "Players swipe left/right to move between 3 lanes"
- ❌ **Bad Example:** "Players control a character"

### 2. Game Systems
How elements interact with specific details

- ✅ **Good Example:** "Obstacles spawn every 2 seconds at increasing speeds"
- ❌ **Bad Example:** "Obstacles appear"

### 3. Progression
Exact unlock and advancement mechanics

- ✅ **Good Example:** "Collect 100 coins to unlock new skins"
- ❌ **Bad Example:** "Players can unlock content"

### 4. Controls & UI
Specific interaction methods

- ✅ **Good Example:** "Tap anywhere to jump, swipe up for double jump"
- ❌ **Bad Example:** "Simple touch controls"

### 5. Win/Loss Conditions
Exact goals and failure states

- ✅ **Good Example:** "Run ends when hitting 3 obstacles; goal is to reach the highest distance"
- ❌ **Bad Example:** "Try to survive"

### 6. Numerical Details
Include specific numbers

- ✅ **Good Example:** "Player has 3 lives, speed increases 10% every 30 seconds"
- ❌ **Bad Example:** "Game gets harder over time"

## Quality Examples (Follow This Style)

### Subway Surfers
An endless running game where players control a character running on three parallel train tracks, swiping left or right to change lanes, up to jump over obstacles, and down to slide under barriers. The game continuously scrolls forward at increasing speeds, spawning trains, barriers, and collectible coins at predetermined intervals that become more frequent and challenging over time. Players collect coins during runs which can be spent on character skins, hoverboards that provide temporary protection, and power-ups like coin magnets and speed boosts that activate for limited durations. Daily missions present specific objectives like collecting a certain number of coins or using particular power-ups, while the main progression revolves around achieving higher distances and unlocking new subway environments with different visual themes.

### Traffic Run
A timing-based arcade game where players tap the screen to make a vehicle accelerate forward across a busy multi-lane highway with perpendicular traffic flowing continuously. The objective is to cross each intersection without colliding with passing vehicles, requiring players to time their taps precisely as gaps appear in the traffic stream. The game features an endless progression where successfully crossed intersections award points and occasionally spawn collectible coins, with traffic density and vehicle speeds increasing gradually to raise difficulty. Players can unlock new vehicle types using collected coins, each with different visual appearances but identical gameplay mechanics, and the run ends immediately upon any collision with another vehicle.

### Worms Zone
A multiplayer snake game where players control a worm that continuously moves forward, using directional swipes or tilt controls to steer around a large 2D arena filled with other player-controlled worms. The core mechanic involves consuming colored food pellets scattered across the map to grow longer, with mass also gained by colliding with and consuming the remains of eliminated worms that break into collectible segments. Players can activate a limited speed boost by double-tapping or holding the screen, which drains a portion of their accumulated mass but allows for quick escapes or aggressive plays to cut off opponents. The game features an elimination mechanic where any collision of a worm's head with another worm's body results in immediate death, transforming the worm into collectible food, with the primary objective being to grow to the largest size possible and climb the live leaderboard displayed in the corner.

## Output Format

Respond with EXACTLY `{len(games_batch)}` concepts numbered 1-`{len(games_batch)}`.

**Format:** `"NUMBER. CONCEPT"`

Each concept must be 4-6 sentences with specific mechanical details.



