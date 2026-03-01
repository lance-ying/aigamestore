/**
 * physics.js
 * Collision detection and spatial logic.
 */

import { gameState, CONFIG, COLORS } from './globals.js';
import { createExplosion, createTextPopup } from './particles.js';

// Import p5.collide2D from global scope (loaded via script tag in HTML)
// Since we are in instance mode, we can use p5 methods passed or the global library functions if available.
// p5.collide2D attaches to p5.prototype. 

/**
 * Check collision between Circle (Snake Head) and Rectangle (Block)
 */
export function checkCircleRect(circleX, circleY, radius, rectX, rectY, rectW, rectH) {
    // Closest point on rect to circle center
    let testX = circleX;
    let testY = circleY;

    if (circleX < rectX) testX = rectX;
    else if (circleX > rectX + rectW) testX = rectX + rectW;

    if (circleY < rectY) testY = rectY;
    else if (circleY > rectY + rectH) testY = rectY + rectH;

    let distX = circleX - testX;
    let distY = circleY - testY;
    let distance = Math.sqrt((distX * distX) + (distY * distY));

    return distance <= radius;
}

/**
 * Check collision between Circle and Circle
 */
export function checkCircleCircle(c1x, c1y, c1r, c2x, c2y, c2r) {
    let dx = c1x - c2x;
    let dy = c1y - c2y;
    let distance = Math.sqrt(dx*dx + dy*dy);
    return distance <= c1r + c2r;
}

/**
 * Resolve collisions for the player
 * @param {object} p - p5 instance
 * @param {object} player - Snake entity
 */
export function resolveCollisions(p, player) {
    // Reset frozen state, we will re-determine it
    let currentlyHittingBlock = false;

    // 1. Check Blocks
    for (let i = gameState.blocks.length - 1; i >= 0; i--) {
        const block = gameState.blocks[i];
        
        // Simple AABB broadphase optimization
        if (player.y - player.radius > block.y + block.size + 10 || 
            player.y + player.radius < block.y - 10) continue;

        if (checkCircleRect(player.x, player.y, player.radius, block.x, block.y, block.size, block.size)) {
            handleBlockCollision(p, player, block);
            // If we hit a block frontally, we might freeze
            // Determine if it's a frontal hit (Head is below block)
            // In this game, player is at bottom, blocks come from top.
            // So frontal hit is: Player Y > Block Y.
            if (player.y >= block.y && Math.abs(player.x - (block.x + block.size/2)) < block.size/2 + player.radius) {
                currentlyHittingBlock = true;
            }
        }
    }

    gameState.isFrozen = currentlyHittingBlock;

    // 2. Check Food
    for (let i = gameState.foods.length - 1; i >= 0; i--) {
        const food = gameState.foods[i];
        if (checkCircleCircle(player.x, player.y, player.radius + 5, food.x, food.y, food.radius)) {
            handleFoodCollision(p, player, food, i);
        }
    }

    // 3. Check Walls
    // Walls are thin vertical lines.
    for (const wall of gameState.walls) {
        // Broadphase Y
        if (player.y < wall.y || player.y > wall.y + wall.height) continue;
        
        // Check X distance
        // Treat wall as a thin rect
        if (Math.abs(player.x - wall.x) < player.radius + CONFIG.WALL_WIDTH/2) {
            handleWallCollision(player, wall);
        }
    }
}

function handleBlockCollision(p, player, block) {
    // If in Fever mode, destroy instantly
    if (gameState.isFeverActive) {
        block.value = 0;
        player.score += block.maxValue; // Bonus score
        gameState.score += block.maxValue;
        createExplosion(p, block.x + block.size/2, block.y + block.size/2, COLORS.FEVER, 20);
        
        // Remove block
        const index = gameState.blocks.indexOf(block);
        if (index > -1) {
            gameState.blocks.splice(index, 1);
            const entIdx = gameState.entities.indexOf(block);
            if (entIdx > -1) gameState.entities.splice(entIdx, 1);
        }
        gameState.screenShake = 5;
        return;
    }

    // Normal collision
    // "Snap" player to the bottom of the block to prevent clipping through
    if (player.y > block.y + block.size) {
        // Hitting from bottom
        player.y = block.y + block.size + player.radius;
    }

    // Apply damage tick
    if (p.frameCount % CONFIG.DAMAGE_TICK_RATE === 0) {
        player.length--;
        block.value--;
        gameState.score++;
        gameState.feverValue = Math.min(gameState.feverValue + 2, CONFIG.FEVER_MAX);
        
        // Visuals
        createExplosion(p, player.x, player.y - player.radius, COLORS.PLAYER, 3);
        gameState.screenShake = 2;

        if (player.length <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
            createExplosion(p, player.x, player.y, COLORS.PLAYER, 50);
        }

        if (block.value <= 0) {
            // Destroy block
            const index = gameState.blocks.indexOf(block);
            if (index > -1) {
                gameState.blocks.splice(index, 1);
                const entIdx = gameState.entities.indexOf(block);
                if (entIdx > -1) gameState.entities.splice(entIdx, 1);
            }
            createExplosion(p, block.x + block.size/2, block.y + block.size/2, COLORS.BLOCK_LOW, 15);
            gameState.screenShake = 4;
        }
    }
}

function handleFoodCollision(p, player, food, index) {
    player.length += food.value;
    createTextPopup(p, food.x, food.y, `+${food.value}`, COLORS.FOOD);
    
    // Remove food
    gameState.foods.splice(index, 1);
    const entIdx = gameState.entities.indexOf(food);
    if (entIdx > -1) gameState.entities.splice(entIdx, 1);
}

function handleWallCollision(player, wall) {
    // Push player out of wall
    if (player.x < wall.x) {
        player.x = wall.x - CONFIG.WALL_WIDTH/2 - player.radius;
    } else {
        player.x = wall.x + CONFIG.WALL_WIDTH/2 + player.radius;
    }
}