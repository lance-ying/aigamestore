/**
 * traps.js
 * Definitions for static and dynamic traps.
 */

import { Entity } from './entities.js';
import { TILE_SIZE, COLORS, gameState } from './globals.js';
import { gridToScreen } from './physics.js';

export class SpikeTrap extends Entity {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.isHazard = true;
        this.state = 'HIDDEN'; // HIDDEN, WARNING, ACTIVE
        this.timer = 0;
        this.cycleTime = 120; // Frames for full cycle
    }
    
    update(p) {
        this.timer = (this.timer + 1) % this.cycleTime;
        
        if (this.timer < 60) {
            this.state = 'HIDDEN';
        } else if (this.timer < 90) {
            this.state = 'WARNING';
        } else {
            this.state = 'ACTIVE';
        }
        
        // Kill player if active and player is on top
        if (this.state === 'ACTIVE' && gameState.player) {
            if (gameState.player.gridX === this.gridX && gameState.player.gridY === this.gridY && !gameState.player.isMoving) {
                gameState.player.die(p, "Impaled by spikes");
            }
        }
    }
    
    onStep(player, p) {
        if (this.state === 'ACTIVE') {
            player.die(p, "Landed on spikes");
        }
    }
    
    render(p) {
        const pos = gridToScreen(this.gridX, this.gridY);
        const cx = pos.x + TILE_SIZE/2;
        const cy = pos.y + TILE_SIZE/2;
        
        p.push();
        p.translate(cx, cy);
        
        if (this.state === 'HIDDEN') {
            p.fill(40);
            p.circle(0, 0, 5);
        } else if (this.state === 'WARNING') {
            p.fill(COLORS.SPIKE_DANGER);
            p.circle(0, 0, 10);
        } else if (this.state === 'ACTIVE') {
            p.fill(200);
            p.noStroke();
            // Draw spikes
            p.triangle(-10, 10, -5, -10, 0, 10);
            p.triangle(0, 10, 5, -10, 10, 10);
        }
        
        p.pop();
    }
}

/**
 * Moving Wall Trap
 * Simply moves in one direction until it hits a wall, then stops or reverses.
 * Acts like a vehicle.
 */
export class MovingBlock extends Entity {
    constructor(gridX, gridY, dx, dy) {
        super(gridX, gridY);
        this.type = 'TRAP';
        this.isHazard = true;
        this.dx = dx;
        this.dy = dy;
        this.speed = 0.05;
        this.moveDir = 1;
    }
    
    update(p) {
        // Continuous movement logic
        // For grid purity, let's make it hop like the slime but look like a sliding block
        // (Simplified for this example to resemble Slime logic but tougher)
    }
    
    render(p) {
        p.fill(COLORS.WALL_TOP);
        p.rect(this.visualX, this.visualY, TILE_SIZE, TILE_SIZE);
        p.fill(COLORS.VOID_GLOW);
        p.rect(this.visualX + 5, this.visualY + 5, TILE_SIZE - 10, TILE_SIZE - 10);
    }
}