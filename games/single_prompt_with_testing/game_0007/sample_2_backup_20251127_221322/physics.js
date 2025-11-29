import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { collideRectRect, collideCircleCircle, collideRectCircle } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

export class AABB {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

export function checkCollision(entityA, entityB) {
    // Simple AABB collision for now, can be expanded to Circle-Rect if needed
    // Assuming entities have x, y, width, height or radius
    
    if (entityA.radius && entityB.radius) {
        return collideCircleCircle(entityA.x, entityA.y, entityA.radius * 2, entityB.x, entityB.y, entityB.radius * 2);
    }
    
    if (entityA.width && entityB.width) {
        // Center-based rect collision
        // Convert to corner for collideRectRect
        const aX = entityA.x - entityA.width/2;
        const aY = entityA.y - entityA.height/2;
        const bX = entityB.x - entityB.width/2;
        const bY = entityB.y - entityB.height/2;
        
        return collideRectRect(aX, aY, entityA.width, entityA.height, bX, bY, entityB.width, entityB.height);
    }
    
    // Mixed Rect (A) and Circle (B)
    if (entityA.width && entityB.radius) {
         const aX = entityA.x - entityA.width/2;
         const aY = entityA.y - entityA.height/2;
         return collideRectCircle(aX, aY, entityA.width, entityA.height, entityB.x, entityB.y, entityB.radius * 2);
    }
    
    // Mixed Circle (A) and Rect (B)
    if (entityA.radius && entityB.width) {
         const bX = entityB.x - entityB.width/2;
         const bY = entityB.y - entityB.height/2;
         return collideRectCircle(bX, bY, entityB.width, entityB.height, entityA.x, entityA.y, entityA.radius * 2);
    }
    
    return false;
}

export function applyPhysics(entity) {
    // Apply Gravity
    entity.vy += gameState.gravity;
    
    // Apply Friction
    if (entity.onGround) {
        entity.vx *= gameState.groundFriction;
    } else {
        entity.vx *= gameState.airResistance;
    }
    
    // Update Position
    entity.x += entity.vx;
    entity.y += entity.vy;
    
    // Screen Bounds (Horizontal)
    if (entity.x < entity.width/2) {
        entity.x = entity.width/2;
        entity.vx = 0;
    }
    if (entity.x > CANVAS_WIDTH - entity.width/2) {
        entity.x = CANVAS_WIDTH - entity.width/2;
        entity.vx = 0;
    }
}