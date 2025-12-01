import { gameState, GAME_OPTS, COLORS } from './globals.js';
import { checkRectOverlap, pointInRect } from './utils.js';
import { Particle } from './entities.js';

export function updatePhysics(p) {
    const player = gameState.player;
    if (!player) return;

    // Move everything
    let currentSpeed = gameState.feverMode ? GAME_OPTS.feverSpeed : GAME_OPTS.scrollSpeed;
    
    // Update distance
    gameState.distance += currentSpeed;
    gameState.score = Math.floor(gameState.distance / 10);
    
    // Check Win
    if (gameState.distance >= GAME_OPTS.levelLength) {
        gameState.gamePhase = "GAME_OVER_WIN";
        return;
    }

    // Update Obstacles
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
        const obs = gameState.obstacles[i];
        obs.update(currentSpeed);
        
        if (obs.markedForDeletion) {
            gameState.obstacles.splice(i, 1);
            continue;
        }

        // Collision Detection
        
        // 1. Check Projectiles vs Obstacle
        for (let j = gameState.projectiles.length - 1; j >= 0; j--) {
            const proj = gameState.projectiles[j];
            if (checkRectOverlap(proj, obs)) {
                // Destroy obstacle
                destroyObstacle(obs, p);
                // Destroy projectile
                proj.markedForDeletion = true;
                obs.markedForDeletion = true; // Mark obstacle for deletion
                break; // Obstacle gone
            }
        }
        if (obs.markedForDeletion) {
            gameState.obstacles.splice(i, 1);
            continue;
        }

        // 2. Check Player Fever Collision (Smashes obstacles)
        if (gameState.feverMode) {
            // Check player body and entire egg stack
            const playerRect = player.getRect();
            // Combine player + stack rect for simplicity or check individually
            // Actually in fever mode, player destroys everything he touches
            
            let collision = checkRectOverlap(playerRect, obs);
            if (!collision) {
                // Check eggs
                const eggRects = player.getEggRects();
                for (let egg of eggRects) {
                    if (checkRectOverlap(egg, obs)) {
                        collision = true;
                        break;
                    }
                }
            }
            
            if (collision) {
                destroyObstacle(obs, p);
                gameState.obstacles.splice(i, 1);
                continue;
            }
        } else {
            // Normal Mode Collision
            
            // A. Check Bird Body
            const birdRect = player.getRect();
            // Shrink hit box slightly for forgiveness
            const hitBox = {
                x: birdRect.x + 5,
                y: birdRect.y + 5,
                w: birdRect.w - 10,
                h: birdRect.h - 10
            };
            
            if (checkRectOverlap(hitBox, obs)) {
                // Bird hit a wall -> Game Over
                gameState.gamePhase = "GAME_OVER_LOSE";
                createExplosion(player.x, player.y, COLORS.player, p);
                return;
            }
            
            // B. Check Eggs (from bottom up)
            // If an egg hits, it breaks. If multiple hit, they all break.
            const eggRects = player.getEggRects();
            let eggsBroken = 0;
            
            for (let e = 0; e < eggRects.length; e++) {
                const egg = eggRects[e];
                // Check egg overlap
                if (checkRectOverlap(egg, obs)) {
                    // This egg hit the wall. 
                    // Physics logic: In this game, if the stack hits a wall, the eggs that hit are stripped away.
                    // The bird falls to the new stack height.
                    eggsBroken++;
                    createExplosion(egg.x + egg.w, egg.y + egg.h/2, COLORS.egg, p);
                }
            }
            
            if (eggsBroken > 0) {
                // Remove the bottom-most eggs involved?
                // Actually, if egg at index 0 (bottom) hits, it breaks.
                // If egg at index 1 hits, it breaks.
                // So we reduce egg count by eggsBroken.
                player.removeEgg(eggsBroken);
                // Reset combo/landings if we hit a wall? Usually yes.
                gameState.landings = 0;
                
                // IMPORTANT: We hit the wall and paid the egg toll.
                // Snap to this obstacle immediately so we don't fall into it next frame.
                player.groundedObstacle = obs;
            }
        }
    }
    
    // Update Projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        proj.update();
        if (proj.markedForDeletion) {
            gameState.projectiles.splice(i, 1);
        }
    }
    
    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.markedForDeletion) {
            gameState.particles.splice(i, 1);
        }
    }
    
    // Landing Logic (for Fever)
    // Check if player is on ground (eggs == 0) and wasn't previously
    // We need to track previous state. 
    // Simplified: Check if eggs == 0. If yes, and we just came from eggs > 0 state?
    // We can track `lastFrameEggs`.
    
    if (player.eggs === 0 && gameState.lastFrameEggs > 0) {
        // Landed
        gameState.landings++;
        // Visual cue
        createExplosion(player.x + player.w/2, player.groundY, COLORS.ground, p, 5);
        
        if (gameState.landings >= GAME_OPTS.landingTarget) {
            player.activateFever();
        }
    } else if (player.eggs > 0 && gameState.lastFrameEggs === 0) {
        // Took off
    }
    
    gameState.lastFrameEggs = player.eggs;
}

function destroyObstacle(obs, p) {
    createExplosion(obs.x + obs.w/2, obs.y + obs.h/2, COLORS.obstacle, p, 10);
}

function createExplosion(x, y, color, p, count = 10) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}