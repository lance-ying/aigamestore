import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
// Using p5.collide2d logic manually or via library if available, but simple logic is safer for portability.
// The instructions allow p5.collide2d, but we will write robust internal checks to ensure control.

export function checkCollisions(p) {
    const player = gameState.player;
    if (!player) return;

    // 1. Projectile Collisions
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        let proj = gameState.projectiles[i];
        let hit = false;

        // Projectile vs Walls
        for (let wall of gameState.walls) {
            if (checkRectCircle(wall.x, wall.y, wall.w, wall.h, proj.x, proj.y, proj.r)) {
                createImpactEffect(p, proj.x, proj.y, [200, 200, 200]);
                gameState.projectiles.splice(i, 1);
                hit = true;
                break;
            }
        }
        if (hit) continue;

        // Projectile vs Enemies (Player projectiles)
        if (proj.source === 'player') {
            for (let j = gameState.enemies.length - 1; j >= 0; j--) {
                let enemy = gameState.enemies[j];
                if (checkCircleCircle(proj.x, proj.y, proj.r, enemy.x, enemy.y, enemy.radius)) {
                    enemy.takeDamage(proj.damage, p);
                    createImpactEffect(p, proj.x, proj.y, [255, 100, 100]);
                    gameState.projectiles.splice(i, 1);
                    hit = true;
                    // Charge Super
                    player.addSuperCharge();
                    break;
                }
            }
        }
        // Projectile vs Player (Enemy projectiles)
        else if (proj.source === 'enemy') {
            if (checkCircleCircle(proj.x, proj.y, proj.r, player.x, player.y, player.radius)) {
                player.takeDamage(proj.damage, p);
                createImpactEffect(p, proj.x, proj.y, [255, 0, 0]);
                gameState.projectiles.splice(i, 1);
                hit = true;
            }
        }
    }

    // 2. Player vs Gems
    for (let i = gameState.gems.length - 1; i >= 0; i--) {
        let gem = gameState.gems[i];
        if (checkCircleCircle(player.x, player.y, player.radius, gem.x, gem.y, gem.r)) {
            player.collectGem(p);
            gameState.gems.splice(i, 1);
        }
    }

    // 3. Entity vs Walls (Resolution)
    resolveWallCollision(player);
    gameState.enemies.forEach(enemy => resolveWallCollision(enemy));
}

function resolveWallCollision(entity) {
    // Basic AABB resolution
    // Since entities are circles, we treat them as AABB for wall logic for stability, 
    // or do simple clamping.
    
    // Keep in bounds
    entity.x = Math.max(entity.radius, Math.min(CANVAS_WIDTH - entity.radius, entity.x));
    entity.y = Math.max(entity.radius, Math.min(CANVAS_HEIGHT - entity.radius, entity.y));

    // Walls
    for (let wall of gameState.walls) {
        // Nearest point on rect to circle center
        let testX = entity.x;
        let testY = entity.y;

        if (entity.x < wall.x) testX = wall.x;
        else if (entity.x > wall.x + wall.w) testX = wall.x + wall.w;
        
        if (entity.y < wall.y) testY = wall.y;
        else if (entity.y > wall.y + wall.h) testY = wall.y + wall.h;

        let distX = entity.x - testX;
        let distY = entity.y - testY;
        let distance = Math.sqrt((distX*distX) + (distY*distY));

        if (distance <= entity.radius) {
            // Resolve collision - push out
            // Determine overlap
            let overlap = entity.radius - distance;
            
            // Normalize vector
            if (distance === 0) { // Center is inside
                 // Push out closest side
                 // Simplified: Just revert position (prevX/prevY would be better)
                 // Here we push out based on relative center
                 let dx = entity.x - (wall.x + wall.w/2);
                 let dy = entity.y - (wall.y + wall.h/2);
                 if (Math.abs(dx) > Math.abs(dy)) {
                     entity.x = dx > 0 ? wall.x + wall.w + entity.radius : wall.x - entity.radius;
                 } else {
                     entity.y = dy > 0 ? wall.y + wall.h + entity.radius : wall.y - entity.radius;
                 }
            } else {
                let nx = distX / distance;
                let ny = distY / distance;
                entity.x += nx * overlap;
                entity.y += ny * overlap;
            }
        }
    }
}

// Helpers
function checkCircleCircle(x1, y1, r1, x2, y2, r2) {
    let dx = x1 - x2;
    let dy = y1 - y2;
    return (dx*dx + dy*dy) < ((r1+r2)*(r1+r2));
}

function checkRectCircle(rx, ry, rw, rh, cx, cy, cr) {
    let testX = cx;
    let testY = cy;

    if (cx < rx) testX = rx;
    else if (cx > rx + rw) testX = rx + rw;
    
    if (cy < ry) testY = ry;
    else if (cy > ry + rh) testY = ry + rh;

    let distX = cx - testX;
    let distY = cy - testY;
    let distance = Math.sqrt((distX*distX) + (distY*distY));

    return distance <= cr;
}

import { ParticleSystem } from './particles.js';

function createImpactEffect(p, x, y, color) {
    gameState.particles.push(new ParticleSystem(x, y, color, 5));
}