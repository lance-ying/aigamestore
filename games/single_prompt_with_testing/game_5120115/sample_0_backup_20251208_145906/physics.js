import { gameState, MATERIALS, CANVAS_HEIGHT, LEVEL_CONFIG } from './globals.js';

// Simple Vector helper to avoid overhead of p5.Vector for massive particle counts
export class Vec2 {
    constructor(x, y) { this.x = x; this.y = y; }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; return this; }
    mult(n) { this.x *= n; this.y *= n; return this; }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() {
        const m = this.mag();
        if (m > 0) this.mult(1/m);
        return this;
    }
    dist(v) { return Math.sqrt((this.x-v.x)**2 + (this.y-v.y)**2); }
    copy() { return new Vec2(this.x, this.y); }
}

export function updatePhysics(p) {
    gameState.simFrame++;

    // 1. Verlet Integration for Particles (Nodes & Car parts)
    gameState.nodes.forEach(node => {
        if (!node.fixed) {
            let tempX = node.x;
            let tempY = node.y;
            
            // Velocity approximation
            let vx = (node.x - node.oldX) * gameState.friction;
            let vy = (node.y - node.oldY) * gameState.friction;
            
            // Apply Forces
            vy += gameState.gravity * node.mass;
            
            node.x += vx;
            node.y += vy;
            
            node.oldX = tempX;
            node.oldY = tempY;
        }
    });
    
    // Also apply physics to car nodes
    gameState.cars.forEach(car => {
        car.nodes.forEach(node => {
            if (!node.fixed) {
                let tempX = node.x;
                let tempY = node.y;
                
                // Velocity approximation
                let vx = (node.x - node.oldX) * gameState.friction;
                let vy = (node.y - node.oldY) * gameState.friction;
                
                // Apply Forces
                vy += gameState.gravity * node.mass;
                
                node.x += vx;
                node.y += vy;
                
                node.oldX = tempX;
                node.oldY = tempY;
            }
        });
    });

    // 2. Constraint Solving (Relaxation Loop)
    const iterations = 5;
    for (let i = 0; i < iterations; i++) {
        // Resolve Structural Constraints
        gameState.constraints.forEach(c => c.resolve());
        
        // Resolve Car Constraints (Chassis rigidity)
        gameState.cars.forEach(car => car.resolveConstraints());
        
        // Resolve Collisions
        resolveCollisions();
    }
}

export function checkBreakage() {
    // Check if any constraint exceeds max stress
    for (let i = gameState.constraints.length - 1; i >= 0; i--) {
        const c = gameState.constraints[i];
        const stress = c.getStress();
        if (stress > 1.0 && c.material !== "SPRING") {
            // Break!
            return true;
        }
    }
    return false;
}

function resolveCollisions() {
    // Keep nodes above ground (outside gap)
    gameState.nodes.forEach(node => {
        if (!node.fixed) {
            // Ground collision check
            const isOverGap = node.x > LEVEL_CONFIG.gapStart && node.x < LEVEL_CONFIG.gapEnd;
            if (!isOverGap) {
                if (node.y > LEVEL_CONFIG.groundLevel) {
                    node.y = LEVEL_CONFIG.groundLevel;
                    // Ground friction impulse
                    let vx = node.x - node.oldX;
                    node.oldX = node.x - (vx * gameState.groundFriction);
                }
            } else {
                // Water/Abyss collision - if too deep, maybe fail? 
                // For now, let them fall.
                if (node.y > CANVAS_HEIGHT + 100) {
                    // Node fell off world
                }
            }
        }
    });
    
    // Car Wheel vs Road Collision
    gameState.cars.forEach(car => {
        car.wheels.forEach(wheel => {
            // Reset ground flag each frame
            wheel.onGround = false;
            let collided = false;
            
            // 1. Check Terrain
            const isOverGap = wheel.x > LEVEL_CONFIG.gapStart && wheel.x < LEVEL_CONFIG.gapEnd;
            if (!isOverGap) {
                if (wheel.y + wheel.radius > LEVEL_CONFIG.groundLevel) {
                    const pen = (wheel.y + wheel.radius) - LEVEL_CONFIG.groundLevel;
                    wheel.y -= pen;
                    // Simple friction
                    let vx = wheel.x - wheel.oldX;
                    wheel.oldX = wheel.x - (vx * 0.9);
                    collided = true;
                    wheel.onGround = true;
                }
            }
            
            // 2. Check Road Segments (Line-Circle Collision)
            if (!collided) {
                gameState.constraints.forEach(c => {
                    if (c.material === "ROAD") {
                        if (checkLineCircle(c.nodeA, c.nodeB, wheel)) {
                            wheel.onGround = true;
                        }
                    }
                });
            }
        });
    });
}

function checkLineCircle(p1, p2, circle) {
    // Vector from p1 to p2
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    let lenSq = dx*dx + dy*dy;
    
    // Project circle center onto line segment
    let t = ((circle.x - p1.x) * dx + (circle.y - p1.y) * dy) / lenSq;
    
    // Clamp t to segment [0, 1]
    t = Math.max(0, Math.min(1, t));
    
    // Closest point on segment
    let closestX = p1.x + t * dx;
    let closestY = p1.y + t * dy;
    
    // Distance check
    let distX = circle.x - closestX;
    let distY = circle.y - closestY;
    let dist = Math.sqrt(distX*distX + distY*distY);
    
    if (dist < circle.radius) {
        // Collision response: push circle out along normal
        let nx = distX / dist;
        let ny = distY / dist;
        let pen = circle.radius - dist;
        
        // Push wheel
        circle.x += nx * pen;
        circle.y += ny * pen;
        
        // Push bridge nodes slightly (Newton's 3rd law approximation)
        // Distribute impulse based on t (closer node takes more)
        if (!p1.fixed) {
            p1.x -= nx * pen * 0.2 * (1-t);
            p1.y -= ny * pen * 0.2 * (1-t);
        }
        if (!p2.fixed) {
            p2.x -= nx * pen * 0.2 * t;
            p2.y -= ny * pen * 0.2 * t;
        }
        
        return true;
    }
    return false;
}