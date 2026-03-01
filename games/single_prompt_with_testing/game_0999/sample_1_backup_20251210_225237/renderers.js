/**
 * Render utilities for procedural pixel art.
 * Handles drawing complex shapes using rect primitives to simulate sprites.
 */

import { PALETTE } from './globals.js';

/**
 * Draws a pixel art grid relative to (0,0).
 * @param {Object} p - p5 instance
 * @param {Array} grid - 2D array of color indices/codes
 * @param {number} scale - Pixel scale size
 * @param {Object} colors - Map of codes to PALETTE colors
 * @param {boolean} flipX - Whether to flip horizontally
 */
export function drawPixelGrid(p, grid, scale, colors, flipX = false) {
    p.noStroke();
    const rows = grid.length;
    const cols = grid[0].length;
    const width = cols * scale;

    p.push();
    if (flipX) {
        p.scale(-1, 1);
        p.translate(-width, 0); // Re-center after flip if needed, or caller handles offset
        // Actually, if we flip, we usually draw centered.
        // Let's assume the caller translates to center of entity.
        // If we want to flip around the center:
        // p.translate(-width/2, 0); 
    } else {
        // p.translate(-width/2, 0);
    }

    // Centering adjustment: Draw relative to top-left of the grid
    // Caller should translate to (entity.x, entity.y)
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const code = grid[y][x];
            if (code !== 0 && colors[code]) {
                const c = colors[code];
                p.fill(c[0], c[1], c[2]);
                p.rect(x * scale, y * scale, scale, scale);
            }
        }
    }
    p.pop();
}

// --- SPRITE DATA ---

// 0: Empty, 1: Main, 2: Skin, 3: Hair, 4: Weapon/Detail
// Zangetsu Idle (10x12 grid)
export const SPRITE_ZANGETSU_IDLE = [
    [0,0,0,3,3,3,3,0,0,0],
    [0,0,3,3,3,2,2,3,0,0],
    [0,0,3,2,2,2,2,3,0,0],
    [0,0,1,1,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,0,0],
    [0,1,4,1,1,1,4,1,0,0],
    [0,1,1,1,4,4,1,1,0,0],
    [0,0,1,1,1,1,1,0,0,0],
    [0,0,1,1,0,1,1,0,0,0],
    [0,0,1,1,0,1,1,0,0,0],
    [0,0,1,1,0,1,1,0,0,0],
    [0,1,1,0,0,0,1,1,0,0]
];

// Zangetsu Attack (14x12) - Extends weapon
export const SPRITE_ZANGETSU_ATTACK = [
    [0,0,0,3,3,3,3,0,0,0,0,0,0,0],
    [0,0,3,3,3,2,2,3,0,0,0,0,0,0],
    [0,0,3,2,2,2,2,3,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,4,4,4,4,4,0], // Arm extending
    [0,0,1,1,1,1,1,1,4,4,4,4,4,4], // Sword
    [0,0,1,1,1,1,1,1,4,4,4,4,4,0],
    [0,0,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,1,1,0,1,1,0,0,0,0,0,0,0],
    [0,0,1,1,0,1,1,0,0,0,0,0,0,0],
    [0,1,1,0,0,0,1,1,0,0,0,0,0,0],
    [0,1,1,0,0,0,1,1,0,0,0,0,0,0]
];

// Miriam Idle
export const SPRITE_MIRIAM_IDLE = [
    [0,0,0,3,3,3,0,0,0,0],
    [0,0,3,3,2,2,3,0,0,0],
    [0,0,3,2,2,2,3,0,0,0],
    [0,0,0,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,0,0,0],
    [0,0,1,2,1,2,1,0,0,0], // Bare shoulders/arms
    [0,0,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,0,0,0],
    [0,0,2,2,0,2,2,0,0,0], // Legs
    [0,0,2,2,0,2,2,0,0,0],
    [0,0,4,4,0,4,4,0,0,0], // Boots
    [0,0,4,4,0,4,4,0,0,0]
];

// Enemy Skeleton
export const SPRITE_SKELETON = [
    [0,0,0,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,0,0],
    [0,0,1,0,1,0,1,0,0],
    [0,0,0,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,0],
    [0,0,0,1,1,1,0,0,0],
    [0,0,0,1,0,1,0,0,0],
    [0,0,0,1,0,1,0,0,0],
    [0,0,1,1,0,1,1,0,0]
];

// Boss (Simplified Large Head)
export const SPRITE_BOSS = [
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,0,0,1,1,0,0,1,1], // Eyes
    [1,1,2,2,1,1,2,2,1,1], // Glowing eyes
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,3,3,1,1,1,1], // Mouth
    [0,1,1,3,3,3,3,1,1,0],
    [0,0,1,1,3,3,1,1,0,0]
];

/**
 * Renders a specific character state.
 */
export function renderCharacter(p, entity, charType, state) {
    let sprite = SPRITE_ZANGETSU_IDLE;
    let colors = PALETTE.zangetsu;
    const colorMap = {
        1: colors.main,
        2: colors.skin,
        3: colors.hair,
        4: colors.weapon
    };

    if (charType === "MIRIAM") {
        colors = PALETTE.miriam;
        sprite = SPRITE_MIRIAM_IDLE;
        colorMap[1] = colors.main;
        colorMap[2] = colors.skin;
        colorMap[3] = colors.hair;
        colorMap[4] = colors.weapon;
    }

    if (state === "ATTACK") {
        if (charType === "ZANGETSU") sprite = SPRITE_ZANGETSU_ATTACK;
        // reuse idle for miriam attack for simplicity, or make a new array
    }

    // Determine position to draw (centered on entity)
    const scale = 3;
    // Calculate sprite dimensions
    const spriteW = sprite[0].length * scale;
    const spriteH = sprite.length * scale;
    
    // Draw offset to center
    const drawX = -spriteW / 2 + entity.width / 2;
    const drawY = -spriteH / 2 + entity.height / 2;
    
    p.push();
    p.translate(drawX, drawY);
    drawPixelGrid(p, sprite, scale, colorMap, entity.facing === -1);
    p.pop();
}