import { gameState, GRID_ROWS, GRID_COLS, RUNE_TYPES, TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, COLORS, MOVE_COST } from './globals.js';
import { createExplosion, createFloatingText } from './particles.js';
import { createEnemy } from './entities.js';

export class Tile {
    constructor(c, r, type) {
        this.c = c; // Grid Col
        this.r = r; // Grid Row
        this.type = type;
        this.x = c * TILE_SIZE; // Relative pixel pos
        this.y = r * TILE_SIZE;
        this.targetX = this.x;
        this.targetY = this.y;
        this.state = 'IDLE'; // IDLE, SWAP, DROP, MATCHED
        this.scale = 1;
        this.alpha = 1;
    }
}

export function initGrid() {
    gameState.grid = [];
    for (let c = 0; c < GRID_COLS; c++) {
        gameState.grid[c] = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            let type;
            do {
                type = Math.floor(Math.random() * 5);
            } while (checkMatchAtInit(c, r, type));
            gameState.grid[c][r] = new Tile(c, r, type);
        }
    }
    gameState.cursor = { c: 0, r: 0 };
    gameState.selectedTile = null;
    gameState.turnState = "PLAYER_INPUT";
    gameState.comboMultiplier = 1;
    gameState.matchStreak = 0;
    gameState.streakType = null;
}

// Helper to prevent initial matches
function checkMatchAtInit(c, r, type) {
    // Check horizontal
    if (c >= 2) {
        if (gameState.grid[c-1][r].type === type && gameState.grid[c-2][r].type === type) return true;
    }
    // Check vertical
    if (r >= 2) {
        if (gameState.grid[c][r-1].type === type && gameState.grid[c][r-2].type === type) return true;
    }
    return false;
}

export function handleGridUpdate() {
    if (gameState.turnState === "PLAYER_INPUT" || gameState.turnState === "ENEMY_TURN") return;

    let stable = true;

    // Animation update
    for (let c = 0; c < GRID_COLS; c++) {
        for (let r = 0; r < GRID_ROWS; r++) {
            const tile = gameState.grid[c][r];
            if (tile) {
                // Move towards target
                if (Math.abs(tile.x - tile.targetX) > 1 || Math.abs(tile.y - tile.targetY) > 1) {
                    tile.x += (tile.targetX - tile.x) * 0.2;
                    tile.y += (tile.targetY - tile.y) * 0.2;
                    stable = false;
                } else {
                    tile.x = tile.targetX;
                    tile.y = tile.targetY;
                }
            }
        }
    }

    if (!stable) return; // Wait for animations

    if (gameState.turnState === "ANIMATING") {
        // Swap finished, check matches
        const matches = findMatches();
        if (matches.length > 0) {
            gameState.turnState = "RESOLVING";
            processMatches(matches);
        } else {
            // If we have a combo > 1, it means we had matches before this animation (cascade),
            // so the turn should end now that things are stable.
            if (gameState.comboMultiplier > 1) {
                endPlayerTurn();
            } else {
                // No matches occurred this interaction (just a swap with no result).
                
                // Reset Streak on missed match
                gameState.matchStreak = 0;
                gameState.streakType = null;

                // Check if player died from the move cost
                if (gameState.player && gameState.player.hp <= 0) {
                    gameState.gamePhase = "GAME_OVER_LOSE";
                } else {
                    // Return control to player
                    gameState.turnState = "PLAYER_INPUT";
                }
            }
        }
    } else if (gameState.turnState === "RESOLVING") {
        // Drop tiles if needed
        applyGravity();
    }
}

export function swapTiles(c1, r1, c2, r2) {
    const tile1 = gameState.grid[c1][r1];
    const tile2 = gameState.grid[c2][r2];

    // Swap in array
    gameState.grid[c1][r1] = tile2;
    gameState.grid[c2][r2] = tile1;

    // Update logical coords
    tile1.c = c2;
    tile1.r = r2;
    tile2.c = c1;
    tile2.r = r1;

    // Set targets
    tile1.targetX = c2 * TILE_SIZE;
    tile1.targetY = r2 * TILE_SIZE;
    tile2.targetX = c1 * TILE_SIZE;
    tile2.targetY = r1 * TILE_SIZE;

    // Apply Move Cost
    if (gameState.player) {
        gameState.player.hp -= MOVE_COST;
        // Display cost near HP bar
        createFloatingText(60, 340, `-${MOVE_COST} HP`, COLORS.HP);
    }

    gameState.turnState = "ANIMATING";
}

function findMatches() {
    const matches = [];
    
    // Horizontal
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS - 2; c++) {
            const type = gameState.grid[c][r].type;
            if (type === -1) continue;
            let matchLen = 1;
            while (c + matchLen < GRID_COLS && gameState.grid[c + matchLen][r].type === type) {
                matchLen++;
            }
            if (matchLen >= 3) {
                for (let i = 0; i < matchLen; i++) matches.push(gameState.grid[c + i][r]);
                c += matchLen - 1;
            }
        }
    }

    // Vertical
    for (let c = 0; c < GRID_COLS; c++) {
        for (let r = 0; r < GRID_ROWS - 2; r++) {
            const type = gameState.grid[c][r].type;
            if (type === -1) continue;
            let matchLen = 1;
            while (r + matchLen < GRID_ROWS && gameState.grid[c][r + matchLen].type === type) {
                matchLen++;
            }
            if (matchLen >= 3) {
                for (let i = 0; i < matchLen; i++) matches.push(gameState.grid[c][r + i]);
                r += matchLen - 1;
            }
        }
    }
    
    // Unique tiles
    return [...new Set(matches)];
}

function processMatches(matches) {
    if (!gameState.player || !gameState.currentEnemy) return;

    // Streak Logic
    const matchedTypes = new Set(matches.map(t => t.type));
    
    // If we have an active streak type and it was matched again
    if (gameState.streakType !== null && matchedTypes.has(gameState.streakType)) {
        gameState.matchStreak++;
        createFloatingText(450, 50, `STREAK x${gameState.matchStreak}!`, getRuneColor(gameState.streakType));
    } else {
        // Determine dominant type to start new streak
        const counts = {};
        matches.forEach(t => counts[t.type] = (counts[t.type] || 0) + 1);
        
        // Find type with max occurrences
        let maxType = matches[0].type;
        let maxCount = 0;
        for (const t in counts) {
            if (counts[t] > maxCount) {
                maxCount = counts[t];
                maxType = parseInt(t);
            }
        }
        
        gameState.streakType = maxType;
        gameState.matchStreak = 1;
    }

    // Score Calculation
    const points = Math.floor(matches.length * 10 * gameState.comboMultiplier);
    gameState.player.score += points;

    let damage = 0;
    let healing = 0;
    let shield = 0;
    let mana = 0;

    matches.forEach(tile => {
        // Visuals
        createExplosion(
            GRID_OFFSET_X + tile.x + TILE_SIZE/2, 
            GRID_OFFSET_Y + tile.y + TILE_SIZE/2, 
            getRuneColor(tile.type)
        );

        // Effects
        switch(tile.type) {
            case RUNE_TYPES.FIRE: damage += 2; break;
            case RUNE_TYPES.WATER: healing += 2; break;
            case RUNE_TYPES.EARTH: shield += 1; break; // Reduced from 2 to 1 to balance difficulty
            case RUNE_TYPES.LIGHT: mana += 3; break;
            case RUNE_TYPES.DARK: damage += 1; break;
        }
        
        // Remove tile logic
        tile.type = -1; // Empty
        tile.alpha = 0;
    });
    
    // Apply stats
    if (damage > 0) {
        damage = Math.ceil(damage * gameState.comboMultiplier + gameState.player.baseDamage * 0.2);
        const dealt = gameState.currentEnemy.takeDamage(damage);
        // Position updated to be over Enemy (140, 100)
        createFloatingText(140, 100, `-${dealt}`, COLORS.HP);
    }
    if (healing > 0) {
        gameState.player.heal(healing);
        // Position updated to be over Player (60, 250)
        createFloatingText(60, 250, `+${healing}`, COLORS.SHIELD);
    }
    if (shield > 0) {
        gameState.player.addShield(shield);
        // Added floating text for shield over Player (60, 250)
        createFloatingText(60, 250, `SHIELD +${shield}`, COLORS.SHIELD);
    }
    if (mana > 0) {
        gameState.player.gainMana(mana);
    }

    gameState.comboMultiplier += 0.5;
}

function applyGravity() {
    let moved = false;
    
    // Move tiles down
    for (let c = 0; c < GRID_COLS; c++) {
        for (let r = GRID_ROWS - 1; r >= 0; r--) {
            if (gameState.grid[c][r].type === -1) {
                // Find nearest tile above
                let found = false;
                for (let k = r - 1; k >= 0; k--) {
                    if (gameState.grid[c][k].type !== -1) {
                        // Move k to r
                        const tile = gameState.grid[c][k];
                        gameState.grid[c][r] = tile;
                        gameState.grid[c][k] = new Tile(c, k, -1); // Placeholder
                        
                        tile.r = r;
                        tile.targetY = r * TILE_SIZE;
                        found = true;
                        moved = true;
                        break;
                    }
                }
                // If no tile above, spawn new
                if (!found) {
                    const type = Math.floor(Math.random() * 5);
                    const newTile = new Tile(c, r, type);
                    newTile.y = -TILE_SIZE * (GRID_ROWS - r); // Start above screen
                    newTile.targetY = r * TILE_SIZE;
                    gameState.grid[c][r] = newTile;
                    moved = true;
                }
            }
        }
    }
    
    if (moved) {
        gameState.turnState = "ANIMATING"; // Re-animate drop
    } else {
        // Check for cascades
        const matches = findMatches();
        if (matches.length > 0) {
            gameState.turnState = "RESOLVING";
            processMatches(matches);
        } else {
            endPlayerTurn();
        }
    }
}

function endPlayerTurn() {
    gameState.turnState = "ENEMY_TURN";
    gameState.comboMultiplier = 1;
    
    setTimeout(() => {
        // Check Enemy Death First
        if (gameState.currentEnemy && gameState.currentEnemy.hp <= 0) {
            handleEnemyDefeat();
            return;
        }

        // Enemy Attack
        if (gameState.currentEnemy && gameState.currentEnemy.hp > 0) {
            gameState.currentEnemy.attack(gameState.player);
            
            // Check Player Death
            if (gameState.player.hp <= 0) {
                gameState.gamePhase = "GAME_OVER_LOSE";
                return;
            }
        }
        
        // Return control to player
        gameState.turnState = "PLAYER_INPUT";
    }, 500);
}

function handleEnemyDefeat() {
    gameState.stage++;
    if (gameState.stage > gameState.maxStages) {
        gameState.gamePhase = "GAME_OVER_WIN";
    } else {
        createFloatingText(300, 200, "STAGE CLEARED!", COLORS.ACCENT);
        // Create next enemy
        createEnemy(gameState.stage);
        initGrid(); 
        gameState.turnState = "PLAYER_INPUT";
    }
}

export function getRuneColor(type) {
    switch(type) {
        case RUNE_TYPES.FIRE: return COLORS.FIRE;
        case RUNE_TYPES.WATER: return COLORS.WATER;
        case RUNE_TYPES.EARTH: return COLORS.EARTH;
        case RUNE_TYPES.LIGHT: return COLORS.LIGHT;
        case RUNE_TYPES.DARK: return COLORS.DARK;
        default: return '#fff';
    }
}