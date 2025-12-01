import { LEVELS } from './level_data.js';
import { gameState, resetLevelState } from './globals.js';
import { Player, Platform, Hazard, Collectible, Exit } from './entities.js';

export function setupLevel(levelIndex) {
    resetLevelState();
    
    // Safety check
    if (levelIndex < 0 || levelIndex >= LEVELS.length) {
        console.error("Invalid Level Index");
        gameState.gamePhase = "GAME_OVER_WIN";
        return;
    }

    const data = LEVELS[levelIndex];
    gameState.worldWidth = data.width;
    gameState.worldHeight = data.height;

    // Instantiate Entities
    new Player(data.playerStart.x, data.playerStart.y);
    
    data.platforms.forEach(p => new Platform(p.x, p.y, p.w, p.h));
    data.hazards.forEach(h => new Hazard(h.x, h.y, h.w, h.h, h.type));
    data.collectibles.forEach(c => new Collectible(c.x, c.y));
    new Exit(data.exit.x, data.exit.y);
}