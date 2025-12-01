import { gameState, BLOON_TYPES } from './globals.js';

const WAVES = [
    // Wave 1: 5 Reds
    [ { type: 'RED', count: 5, interval: 60 } ],
    // Wave 2: 10 Reds
    [ { type: 'RED', count: 10, interval: 45 } ],
    // Wave 3: 5 Reds, 3 Blues
    [ { type: 'RED', count: 5, interval: 40 }, { type: 'BLUE', count: 3, interval: 60 } ],
    // Wave 4: 10 Blues
    [ { type: 'BLUE', count: 10, interval: 50 } ],
    // Wave 5: 5 Greens
    [ { type: 'GREEN', count: 5, interval: 60 } ],
    // Wave 6: Green rush
    [ { type: 'GREEN', count: 10, interval: 30 } ],
    // Wave 7: Yellow intro
    [ { type: 'YELLOW', count: 5, interval: 70 } ],
    // Wave 8: Mixed
    [ { type: 'BLUE', count: 10, interval: 20 }, { type: 'GREEN', count: 5, interval: 40 } ],
    // Wave 9: Hard
    [ { type: 'YELLOW', count: 10, interval: 40 }, { type: 'GREEN', count: 10, interval: 40 } ],
    // Wave 10: Boss-ish
    [ { type: 'YELLOW', count: 20, interval: 20 } ]
];

export function updateWaves() {
    if (gameState.gamePhase !== 'PLAYING') return;

    // Check for Win
    if (gameState.wave > WAVES.length && gameState.bloons.length === 0 && gameState.waveState.bloonsToSpawn.length === 0) {
        gameState.gamePhase = 'GAME_OVER_WIN';
        return;
    }

    // Start next wave logic
    if (!gameState.waveState.active && gameState.bloons.length === 0) {
        gameState.waveState.waveCompleteTimer++;
        if (gameState.waveState.waveCompleteTimer > 180) { // 3 seconds between waves
            startWave(gameState.wave);
        }
    }

    // Spawning logic
    if (gameState.waveState.active) {
        gameState.waveState.spawnTimer--;
        
        if (gameState.waveState.spawnTimer <= 0 && gameState.waveState.bloonsToSpawn.length > 0) {
            const next = gameState.waveState.bloonsToSpawn[0];
            
            // Spawn it!
            // Dynamic import to avoid circular dependency issues if any, but entities is safe
            import('./entities.js').then(({ Bloon }) => {
                gameState.bloons.push(new Bloon(next.type));
            });
            
            gameState.waveState.spawnTimer = next.interval;
            gameState.waveState.bloonsToSpawn.shift();
            
            if (gameState.waveState.bloonsToSpawn.length === 0) {
                gameState.waveState.active = false;
            }
        }
    }
}

function startWave(waveNum) {
    if (waveNum > WAVES.length) return;
    
    const waveConfig = WAVES[waveNum - 1];
    gameState.waveState.bloonsToSpawn = [];
    
    // Unpack config into a flat queue
    for (const group of waveConfig) {
        for (let i = 0; i < group.count; i++) {
            gameState.waveState.bloonsToSpawn.push({
                type: group.type,
                interval: group.interval
            });
        }
    }
    
    gameState.waveState.active = true;
    gameState.waveState.spawnTimer = 60; // Initial delay
    gameState.waveState.waveCompleteTimer = 0;
    gameState.wave++; // Increment for next time
    
    // Bonus cash for wave start?
    gameState.money += 100 + (waveNum * 10);
}