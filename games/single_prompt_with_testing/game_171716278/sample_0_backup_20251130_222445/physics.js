// physics.js
// Physics engine for momentum, sliding, and collision

import { gameState, GRAVITY, GLIDE_GRAVITY, DIVE_GRAVITY, FRICTION_AIR, FRICTION_GROUND_DIVE, FRICTION_GROUND_NORMAL } from './globals.js';
import { getTerrainHeight, getTerrainAngle, checkTerrainCollision } from './math_utils.js';

export function applyPhysics(p, entity) {
    // 1. Determine forces based on input state
    const isDiving = gameState.isDiving;
    
    // 2. Apply Gravity
    let currentGravity = GRAVITY;
    if (isDiving) {
        currentGravity = DIVE_GRAVITY;
    } else if (entity.vy < 0) {
        // While moving up, glide logic applies if not diving
        currentGravity = GLIDE_GRAVITY; 
    }
    
    // Apply gravity force
    entity.vy += currentGravity;
    
    // 3. Update Position
    entity.x += entity.vx;
    entity.y += entity.vy;
    
    // 4. Terrain Collision / Constraint
    const terrainY = getTerrainHeight(p, entity.x);
    const penetration = (entity.y + entity.radius) - terrainY;
    
    entity.onGround = false;
    
    if (penetration > 0) {
        // Collision detected
        entity.onGround = true;
        
        // Snap to surface
        entity.y = terrainY - entity.radius;
        
        // Calculate slope properties
        const angle = getTerrainAngle(p, entity.x);
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        
        // Decompose velocity into Normal and Tangent components
        // Normal points perpendicular to slope (out of ground)
        // Tangent points down/along the slope
        
        // Velocity dot Normal (impact speed into ground)
        const vDotN = -entity.vx * sinAngle + entity.vy * cosAngle;
        
        // Velocity dot Tangent (speed along the ground)
        let vDotT = entity.vx * cosAngle + entity.vy * sinAngle;
        
        // Stop bouncing: cancel normal velocity if it's pointing into ground
        if (vDotN > 0) {
            // Apply slope acceleration (sliding down adds speed)
            // Force along tangent due to gravity: g * sin(theta)
            const slideForce = currentGravity * Math.sin(angle) * 3.0; // Multiplier for fun physics
            vDotT += slideForce;
            
            // Apply Friction
            let friction = FRICTION_GROUND_NORMAL;
            if (isDiving) {
                // When diving on ground:
                // If going downhill (angle > 0), low friction to gain speed
                // If going uphill (angle < 0), high friction (bad slide)
                if (angle > 0) friction = FRICTION_GROUND_DIVE; // Good slide
                else friction = 0.85; // Bad slide (punishment)
            } else {
                // Not diving on ground
                // Standard friction
                friction = 0.92;
            }
            
            vDotT *= friction;
            
            // Reconstruct velocity from Tangent (Normal is 0 to stick)
            entity.vx = vDotT * cosAngle;
            entity.vy = vDotT * sinAngle;
        }
    } else {
        // In Air Friction (Air Resistance)
        entity.vx *= FRICTION_AIR;
        // Vy friction is handled by gravity mostly, but slight damping helps stability
        entity.vy *= 0.999;
    }
    
    // 5. Min/Max Velocity clamping
    // Ensure forward momentum isn't completely lost easily, but prevent infinite speed
    if (entity.vx < 0) entity.vx *= 0.9; // Discourage moving left
    
    // Soft cap speed
    const speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
    if (speed > 25) {
        const scale = 25 / speed;
        entity.vx *= scale;
        entity.vy *= scale;
    }
}