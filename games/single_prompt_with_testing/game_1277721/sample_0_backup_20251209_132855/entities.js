/**
 * Game Entities: Player, Block, Collectible
 */

import { 
    BLOCK_SIZE, BALL_RADIUS, COLORS, GRAVITY, FALL_THRESHOLD, gameState,
    SPEED_INCREMENT
} from './globals.js';
import { worldToScreen, applyCamera, isOnScreen } from './iso_math.js';
import { createExplosion, createSparkle } from './particles.js';

/**
 * The Player Sphere
 */
export class Player {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = 0;
        this.vz = 0;
        this.vy = 0; // Vertical velocity for falling
        this.radius = BALL_RADIUS;
        
        // 0 = Moving +X (Right), 1 = Moving +Z (Left)
        this.direction = 0; 
        this.isDead = false;
        
        // Initial velocity
        this.updateVelocity();
    }

    switchDirection() {
        if (this.isDead) return;
        this.direction = this.direction === 0 ? 1 : 0;
        this.updateVelocity();
    }

    updateVelocity() {
        if (this.direction === 0) {
            this.vx = gameState.speed;
            this.vz = 0;
        } else {
            this.vx = 0;
            this.vz = gameState.speed;
        }
    }

    update(p) {
        if (gameState.gamePhase === "PLAYING") {
            // Move horizontally
            this.x += this.vx;
            this.z += this.vz;
            
            // Increase global game speed slightly
            gameState.speed += SPEED_INCREMENT;
            if (!this.isDead) {
                this.updateVelocity(); // Apply new speed
            }
        }

        // Apply Gravity if falling
        if (this.isDead) {
            this.vy -= GRAVITY;
            this.y += this.vy;

            // Check if fallen too far
            if (this.y < FALL_THRESHOLD) {
                this.finalizeDeath();
            }
        }
    }

    startFalling() {
        if (!this.isDead) {
            this.isDead = true;
            this.vx = this.vx * 0.5; // Retain some forward momentum
            this.vz = this.vz * 0.5;
            this.vy = 0;
            
            // Trigger game over logic phase transition handled in finalizeDeath
            // But we render the fall first
        }
    }

    finalizeDeath() {
        if (gameState.gamePhase !== "GAME_OVER_LOSE") {
            gameState.gamePhase = "GAME_OVER_LOSE";
            createExplosion(this.x, this.y, this.z, COLORS.BALL);
        }
    }

    render(p) {
        const screenPos = worldToScreen(this.x, this.y, this.z);
        const drawPos = applyCamera(screenPos.x, screenPos.y);

        // Draw shadow (only if close to ground)
        if (this.y > -50) {
            const shadowY = worldToScreen(this.x, 0, this.z).y; // Shadow at y=0
            const drawShadow = applyCamera(screenPos.x, shadowY);
            p.noStroke();
            p.fill(COLORS.BALL_SHADOW);
            p.ellipse(drawShadow.x, drawShadow.y, this.radius * 2, this.radius);
        }

        // Draw Ball
        p.noStroke();
        // Gradient fill for pseudo-3D look
        // We simulate a light source from top-left
        p.fill(COLORS.BALL);
        p.circle(drawPos.x, drawPos.y - this.radius, this.radius * 2);

        // Highlight
        p.fill(255, 255, 255, 100);
        p.circle(drawPos.x - 3, drawPos.y - this.radius - 3, this.radius * 0.8);
    }
}

/**
 * A static block in the wall.
 */
export class Block {
    constructor(gridX, gridZ) {
        this.gridX = gridX;
        this.gridZ = gridZ;
        
        // World coordinates (center of top face)
        this.x = gridX * BLOCK_SIZE;
        this.y = -BLOCK_SIZE; // Top face is at y=0, but box draws down. Let's say y=0 is surface.
        // Actually, let's define x,y,z as the center-bottom or top-left corner.
        // Easier: x, z are world coords. Top surface is at y=0.
        this.z = gridZ * BLOCK_SIZE;

        this.size = BLOCK_SIZE;
        this.color = COLORS.BLOCK_TOP;
        
        this.isFalling = false;
        this.fallVelocity = 0;
        this.fallDelay = 0; // Frames before falling
    }

    triggerFall(delay) {
        this.isFalling = true;
        this.fallDelay = delay;
    }

    update() {
        if (this.isFalling) {
            if (this.fallDelay > 0) {
                this.fallDelay--;
            } else {
                this.fallVelocity += GRAVITY;
                this.y -= this.fallVelocity; // y decreases (down)
            }
        }
    }

    render(p) {
        // Optimization: Don't render if far off screen
        const screenPos = worldToScreen(this.x, this.y, this.z);
        const finalPos = applyCamera(screenPos.x, screenPos.y);
        
        if (!isOnScreen(finalPos.x, finalPos.y, 100)) return;

        // Draw Isometric Cube
        const halfSize = this.size / 2;
        // Vertices relative to center (x, z) at height y
        // Top Face: (x-h, z-h), (x+h, z-h), (x+h, z+h), (x-h, z+h)
        
        // We need to transform these 4 corners to screen space
        const p1 = worldToScreen(this.x - halfSize, this.y, this.z - halfSize); // Back
        const p2 = worldToScreen(this.x + halfSize, this.y, this.z - halfSize); // Right
        const p3 = worldToScreen(this.x + halfSize, this.y, this.z + halfSize); // Front
        const p4 = worldToScreen(this.x - halfSize, this.y, this.z + halfSize); // Left

        // Bottom vertices (just shift y down by height)
        // Note: In our coordinate system, y is up. So bottom is y - size.
        // Screen Y goes down as Y world goes down.
        const h = this.size;
        
        // However, worldToScreen logic: y_screen = ... - y_world.
        // So a lower world Y results in a higher screen Y value (pixels go down).
        // Let's recalculate explicitly or just add offset.
        
        const bottomYOffset = h; // In iso projection, height is just vertical pixel offset roughly?
        // Actually, worldToScreen handles y correctly. 
        // We need points for y - height.
        
        const p1b = worldToScreen(this.x - halfSize, this.y - h, this.z - halfSize);
        const p2b = worldToScreen(this.x + halfSize, this.y - h, this.z - halfSize);
        const p3b = worldToScreen(this.x + halfSize, this.y - h, this.z + halfSize);
        const p4b = worldToScreen(this.x - halfSize, this.y - h, this.z + halfSize);
        
        const c1 = applyCamera(p1.x, p1.y);
        const c2 = applyCamera(p2.x, p2.y);
        const c3 = applyCamera(p3.x, p3.y);
        const c4 = applyCamera(p4.x, p4.y);
        
        const c2b = applyCamera(p2b.x, p2b.y);
        const c3b = applyCamera(p3b.x, p3b.y);
        const c4b = applyCamera(p4b.x, p4b.y);

        p.noStroke();

        // Top Face
        p.fill(COLORS.BLOCK_TOP);
        p.quad(c1.x, c1.y, c2.x, c2.y, c3.x, c3.y, c4.x, c4.y);

        // Right Face (Side 1) - defined by p2, p3, p3b, p2b
        p.fill(COLORS.BLOCK_RIGHT);
        p.quad(c2.x, c2.y, c3.x, c3.y, c3b.x, c3b.y, c2b.x, c2b.y);

        // Left Face (Side 2) - defined by p3, p4, p4b, p3b
        p.fill(COLORS.BLOCK_LEFT);
        p.quad(c4.x, c4.y, c3.x, c3.y, c3b.x, c3b.y, c4b.x, c4b.y);
    }
}

/**
 * Collectible Diamond
 */
export class Collectible {
    constructor(gridX, gridZ) {
        this.gridX = gridX;
        this.gridZ = gridZ;
        this.x = gridX * BLOCK_SIZE;
        this.y = 15; // Float above block
        this.z = gridZ * BLOCK_SIZE;
        this.baseY = 15;
        this.rotation = 0;
        this.bobOffset = 0;
        this.collected = false;
    }

    update(p) {
        this.rotation += 0.05;
        this.bobOffset = Math.sin(p.frameCount * 0.1) * 5;
        this.y = this.baseY + this.bobOffset;
    }

    collect() {
        this.collected = true;
        gameState.score += 2; // Bonus points
        createSparkle(this.x, this.y, this.z, COLORS.DIAMOND);
    }

    render(p) {
        if (this.collected) return;

        const screenPos = worldToScreen(this.x, this.y, this.z);
        const finalPos = applyCamera(screenPos.x, screenPos.y);

        if (!isOnScreen(finalPos.x, finalPos.y)) return;

        p.push();
        p.translate(finalPos.x, finalPos.y);
        // Fake 3D rotation by scaling width
        const widthScale = Math.abs(Math.cos(this.rotation));
        
        p.fill(COLORS.DIAMOND);
        p.stroke(255);
        p.strokeWeight(1);
        
        // Draw diamond shape
        p.beginShape();
        p.vertex(0, -15);
        p.vertex(10 * widthScale, 0);
        p.vertex(0, 15);
        p.vertex(-10 * widthScale, 0);
        p.endShape(p.CLOSE);

        p.pop();
    }
}