import { TILE, TILE_SIZE, WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES, gameState } from './globals.js';

export function generateWorld(p) {
    const map = [];
    
    // Ground level variation
    const groundLevelBase = 10;
    let noiseOffset = 0;
    
    for (let x = 0; x < WORLD_WIDTH_TILES; x++) {
        map[x] = [];
        // Calculate surface height using noise
        const surfaceHeight = Math.floor(groundLevelBase + p.noise(noiseOffset) * 10);
        noiseOffset += 0.1;
        
        for (let y = 0; y < WORLD_HEIGHT_TILES; y++) {
            // Bedrock at bottom
            if (y >= WORLD_HEIGHT_TILES - 2) {
                map[x][y] = TILE.BEDROCK;
                continue;
            }
            
            // Sky
            if (y < surfaceHeight) {
                map[x][y] = TILE.AIR;
                continue;
            }
            
            // Underground
            if (y === surfaceHeight) {
                map[x][y] = TILE.DIRT; // Grass/Surface dirt
            } else if (y > surfaceHeight && y < surfaceHeight + 5) {
                map[x][y] = TILE.DIRT;
            } else {
                map[x][y] = TILE.STONE;
            }
            
            // Caves (Simplex-like noise threshold)
            const caveNoise = p.noise(x * 0.05, y * 0.05);
            if (y > surfaceHeight + 2 && caveNoise > 0.6) {
                map[x][y] = TILE.AIR;
            }
            
            // Ores
            if (map[x][y] === TILE.STONE) {
                const oreNoise = p.noise(x * 0.2, y * 0.2 + 1000);
                if (oreNoise > 0.85) { // Rare gold
                    map[x][y] = TILE.GOLD;
                }
            }
        }
    }
    
    gameState.worldMap = map;
}

export function renderWorld(p) {
    // Calculate visible range based on camera
    const startCol = Math.floor(gameState.cameraX / TILE_SIZE);
    const endCol = startCol + (gameState.CANVAS_WIDTH / TILE_SIZE) + 1;
    const startRow = Math.floor(gameState.cameraY / TILE_SIZE);
    const endRow = startRow + (gameState.CANVAS_HEIGHT / TILE_SIZE) + 1;
    
    const visibleStartCol = Math.max(0, Math.floor(gameState.cameraX / TILE_SIZE));
    const visibleEndCol = Math.min(WORLD_WIDTH_TILES, Math.ceil((gameState.cameraX + 600) / TILE_SIZE));
    const visibleStartRow = Math.max(0, Math.floor(gameState.cameraY / TILE_SIZE));
    const visibleEndRow = Math.min(WORLD_HEIGHT_TILES, Math.ceil((gameState.cameraY + 400) / TILE_SIZE));

    p.noStroke();
    
    for (let x = visibleStartCol; x < visibleEndCol; x++) {
        for (let y = visibleStartRow; y < visibleEndRow; y++) {
            const tile = gameState.worldMap[x][y];
            if (tile === TILE.AIR) continue;
            
            const renderX = Math.floor(x * TILE_SIZE - gameState.cameraX);
            const renderY = Math.floor(y * TILE_SIZE - gameState.cameraY);
            
            switch(tile) {
                case TILE.DIRT:
                    p.fill(139, 69, 19); // Brown
                    p.rect(renderX, renderY, TILE_SIZE, TILE_SIZE);
                    // Add grass top detail if air above
                    if (y > 0 && gameState.worldMap[x][y-1] === TILE.AIR) {
                        p.fill(34, 139, 34); // Green
                        p.rect(renderX, renderY, TILE_SIZE, 6);
                    }
                    break;
                case TILE.STONE:
                    p.fill(105, 105, 105); // Grey
                    p.rect(renderX, renderY, TILE_SIZE, TILE_SIZE);
                    // Texture
                    p.fill(80);
                    p.rect(renderX + 4, renderY + 4, 8, 8);
                    break;
                case TILE.GOLD:
                    p.fill(105, 105, 105); // Stone base
                    p.rect(renderX, renderY, TILE_SIZE, TILE_SIZE);
                    p.fill(255, 215, 0); // Gold flecks
                    p.rect(renderX + 8, renderY + 8, 10, 10);
                    p.rect(renderX + 20, renderY + 18, 6, 6);
                    p.rect(renderX + 5, renderY + 22, 5, 5);
                    break;
                case TILE.BEDROCK:
                    p.fill(20); // Dark grey/black
                    p.rect(renderX, renderY, TILE_SIZE, TILE_SIZE);
                    break;
            }
        }
    }
}