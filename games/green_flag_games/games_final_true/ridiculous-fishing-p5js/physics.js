import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CONSTANTS } from './globals.js';
import { Particle } from './entities.js';

// Simple collision detection helper
function collidePointCircle(px, py, cx, cy, diameter) {
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < diameter / 2;
}

export function checkCollisions(p) {
    // 1. Descent Phase: Hook vs Fish
    if (gameState.subPhase === "DESCENT") {
        const hookHitbox = {
            x: gameState.hookX - 10,
            y: gameState.depth + CONSTANTS.WATER_LEVEL + 300, // Hook is drawn at specific screen Y, need World Y
            // Wait, coordinate system:
            // World Y = 0 is surface.
            // Screen Y in Descent: Camera tracks depth.
            // Let's standardize: gameState.depth is the Y position of the hook in World Space.
            // Hook Render Position: Screen Center usually? Or fixed Y?
            // Let's say Hook Screen Y is fixed at 200, world moves up.
            // World Y at Screen Y(200) = gameState.depth.
            w: 20,
            h: 20
        };

        // Actually, simpler: gameState.depth IS the world Y of the hook.
        // check collision with all fish around this depth.
        
        for (let fish of gameState.fish) {
            // Simple circle collision
            const dx = gameState.hookX - fish.x;
            const dy = gameState.depth - fish.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < fish.width/2 + 10) { // 10 is hook radius approx
                // HIT! Stop descent.
                gameState.subPhase = "ASCENT";
                createExplosion(p, fish.x, fish.y - gameState.cameraY + 200, [255, 255, 255], 5);
                break;
            }
        }
    }

    // 2. Ascent Phase: Hook vs Fish
    if (gameState.subPhase === "ASCENT") {
        for (let i = gameState.fish.length - 1; i >= 0; i--) {
            let fish = gameState.fish[i];
            if (fish.caught) continue;

            const dx = gameState.hookX - fish.x;
            const dy = gameState.depth - fish.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < fish.width/2 + 10) {
                // Catch!
                fish.caught = true;
                fish.relativeX = fish.x - gameState.hookX;
                fish.relativeY = fish.y - gameState.depth;
                gameState.caughtFish.push(fish);
                gameState.fish.splice(i, 1);
                
                // Visual feedback
                createExplosion(p, gameState.hookX, 200, [255, 255, 0], 3);
            }
        }
    }

    // 3. Shooting Phase: Projectiles vs Airborne Fish
    if (gameState.subPhase === "SHOOTING") {
        for (let pIdx = gameState.projectiles.length - 1; pIdx >= 0; pIdx--) {
            let proj = gameState.projectiles[pIdx];
            let hit = false;

            for (let fIdx = gameState.airborneFish.length - 1; fIdx >= 0; fIdx--) {
                let fish = gameState.airborneFish[fIdx];
                
                if (collidePointCircle(proj.x, proj.y, fish.x, fish.y, fish.width)) {
                    // HIT!
                    fish.isDead = true;
                    gameState.money += fish.value;
                    gameState.score += fish.value;
                    createExplosion(p, fish.x, fish.y, fish.color, 10);
                    createMoneyPopup(p, fish.x, fish.y, fish.value);
                    
                    gameState.airborneFish.splice(fIdx, 1);
                    hit = true;
                    break;
                }
            }

            if (hit) {
                gameState.projectiles.splice(pIdx, 1);
            }
        }
    }
}

function createExplosion(p, x, y, color, count) {
    for(let i=0; i<count; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

function createMoneyPopup(p, x, y, value) {
    // Just a visual handled in UI, or a specialized particle
    // We can add a "TextParticle" if we want, but for now simple particles suffice
}