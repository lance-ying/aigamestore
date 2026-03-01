/**
 * level_gen.js
 * Procedural Map Generation.
 */

import { gameState, CONFIG } from './globals.js';
import { HexGrid } from './grid.js';
import { Player, Enemy } from './entities.js';
import { HexMath } from './utils.js';

export class LevelGenerator {
    static generate(level) {
        const grid = new HexGrid(CONFIG.GRID_COLS, CONFIG.GRID_ROWS);
        
        // 1. Fill with Floor
        // Already done in init
        
        // 2. Add Walls (Cellular Automata or Random Blobs)
        const wallCount = 15 + level * 2;
        for (let i = 0; i < wallCount; i++) {
            const c = Math.floor(Math.random() * CONFIG.GRID_COLS);
            const r = Math.floor(Math.random() * CONFIG.GRID_ROWS);
            const tile = grid.getTileByOffset(c, r);
            if (tile) tile.type = 'WALL';
        }
        
        // 3. Add Lava
        const lavaCount = 5 + level;
        for (let i = 0; i < lavaCount; i++) {
            const c = Math.floor(Math.random() * CONFIG.GRID_COLS);
            const r = Math.floor(Math.random() * CONFIG.GRID_ROWS);
            const tile = grid.getTileByOffset(c, r);
            if (tile && tile.type !== 'WALL') tile.type = 'LAVA';
        }
        
        // 4. Set Start and End
        // Start usually top left-ish, End bottom right-ish
        const startTile = grid.getTileByOffset(1, 1) || grid.getTileByOffset(0,0);
        const endTile = grid.getTileByOffset(CONFIG.GRID_COLS - 2, CONFIG.GRID_ROWS - 2);
        
        startTile.type = 'FLOOR'; // Ensure safe
        endTile.type = 'EXIT';
        endTile.entity = null; // Clear anything
        
        // Ensure path exists? (Flood fill check)
        // If not, regenerate? For simplicity in this constraints, we force a path or assume probability is high enough.
        // Let's clear a straight line if we want to be safe, but that's boring.
        // We will just clear neighbors of start and end.
        grid.getNeighbors(startTile, true).forEach(t => t.type = 'FLOOR');
        grid.getNeighbors(endTile, true).forEach(t => t.type = 'FLOOR');
        
        // 5. Spawn Player
        const player = new Player(startTile.q, startTile.r);
        gameState.entities = [player];
        gameState.player = player;
        gameState.enemies = [];
        
        // 6. Spawn Enemies
        const enemyCount = 2 + Math.floor(level * 1.5);
        let spawned = 0;
        let attempts = 0;
        while (spawned < enemyCount && attempts < 100) {
            attempts++;
            const c = Math.floor(Math.random() * CONFIG.GRID_COLS);
            const r = Math.floor(Math.random() * CONFIG.GRID_ROWS);
            const tile = grid.getTileByOffset(c, r);
            
            if (tile && tile.type === 'FLOOR' && !tile.entity && HexMath.distance(tile, startTile) > 3) {
                const types = ['ENEMY_MELEE', 'ENEMY_MELEE', 'ENEMY_RANGED', 'ENEMY_BOMBER'];
                const type = types[Math.floor(Math.random() * types.length)];
                const enemy = new Enemy(tile.q, tile.r, type);
                gameState.enemies.push(enemy);
                gameState.entities.push(enemy);
                spawned++;
            }
        }
        
        gameState.grid = grid;
        
        // Reset Cursor
        gameState.cursor.col = startTile.col;
        gameState.cursor.row = startTile.row;
        const axial = HexMath.offsetToAxial(startTile.col, startTile.row);
        gameState.cursor.q = axial.q;
        gameState.cursor.r = axial.r;
    }
}