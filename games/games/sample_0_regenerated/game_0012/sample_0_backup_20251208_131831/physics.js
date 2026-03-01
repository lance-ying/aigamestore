/**
 * Physics engine and collision detection.
 * Provides specialized platformer physics using AABB.
 */

// Removed: import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';
import { gameState } from './globals.js';

// AABB Collision check
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

/**
 * Moves an entity on the X axis and handles collision with solids.
 * @param {Entity} entity The entity to move
 * @param {Number} amount The amount to move
 * @returns {Boolean} True if collision occurred
 */
export function moveX(entity, amount) {
    gameState.solids.forEach(solid => {
        if (checkAABB(
            {x: entity.x + amount, y: entity.y, width: entity.width, height: entity.height}, 
            solid
        )) {
            // Collision detected
            // Move entity to contact point
            if (amount > 0) {
                entity.x = solid.x - entity.width;
            } else {
                entity.x = solid.x + solid.width;
            }
            amount = 0;
            entity.vx = 0;
            
            // Wall slide interaction logic could go here
            return true;
        }
    });
    
    entity.x += amount;
    return amount === 0;
}

/**
 * Moves an entity on the Y axis and handles collision with solids.
 * @param {Entity} entity The entity to move
 * @param {Number} amount The amount to move
 * @returns {Boolean} True if collision occurred (ground or ceiling)
 */
export function moveY(entity, amount) {
    let collided = false;
    
    gameState.solids.forEach(solid => {
        if (checkAABB(
            {x: entity.x, y: entity.y + amount, width: entity.width, height: entity.height}, 
            solid
        )) {
            // Collision detected
            if (amount > 0) {
                // Hitting ground
                entity.y = solid.y - entity.height;
                entity.onGround = true;
                entity.vy = 0;
            } else {
                // Hitting ceiling
                entity.y = solid.y + solid.height;
                entity.vy = 0;
            }
            amount = 0;
            collided = true;
        }
    });
    
    entity.y += amount;
    return collided;
}

export function checkSpikeCollision(p, entity) { // Added p as argument
    for (let spike of gameState.hazards) {
        // Use p5.collide2D for triangle vs rect precision if available, or just AABB
        // Since spikes are entities, they might have complex shapes.
        // Assuming spikes are AABB for now or using circle check for leniency
        
        let hit = false;
        
        // Simple hitbox shrinkage for fairness (hitbox is smaller than sprite)
        let hitbox = {
            x: entity.x + 4,
            y: entity.y + 4,
            width: entity.width - 8,
            height: entity.height - 8
        };
        
        if (spike.type === 'UP') {
            // Triangle pointing up
            // Use p.collideRectRect since p5.collide2d is loaded globally
            hit = p.collideRectRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height, spike.x, spike.y + 4, spike.width, spike.height - 4);
        } else {
             hit = checkAABB(hitbox, spike);
        }
        
        if (hit) return true;
    }
    return false;
}

export function checkTriggerCollisions(entity) {
    for (let i = gameState.triggers.length - 1; i >= 0; i--) {
        let trigger = gameState.triggers[i];
        if (checkAABB(entity, trigger)) {
            trigger.onCollide(entity);
            if (trigger.destroyOnTouch) {
                gameState.triggers.splice(i, 1);
            }
        }
    }
    
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
        let item = gameState.collectibles[i];
        // Use circle collision for strawberries
        let cx = item.x + item.width / 2;
        let cy = item.y + item.height / 2;
        let r = item.width / 2;
        
        // Closest point on rect to circle center
        let testX = cx;
        let testY = cy;
        
        if (cx < entity.x) testX = entity.x;
        else if (cx > entity.x + entity.width) testX = entity.x + entity.width;
        
        if (cy < entity.y) testY = entity.y;
        else if (cy > entity.y + entity.height) testY = entity.y + entity.height;
        
        let distX = cx - testX;
        let distY = cy - testY;
        let distance = Math.sqrt((distX*distX) + (distY*distY));
        
        if (distance <= r) {
            item.collect();
            gameState.collectibles.splice(i, 1);
        }
    }
}