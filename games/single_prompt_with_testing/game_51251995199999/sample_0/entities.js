import { gameState, TILE_SIZE, PLAYER_SIZE, PLAYER_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { getMapKey, worldToGrid, checkAABB } from './utils.js';
import { particleSystem } from './particles.js';
import { TILE_WALL, TILE_SPIKE, TILE_COIN } from './map.js';

export class Player {
    constructor(x, y) {
        this.type = 'PLAYER';
        this.x = x;
        this.y = y;
        this.width = PLAYER_SIZE;
        this.height = PLAYER_SIZE;
        
        this.vx = 0;
        this.vy = 0;
        
        this.state = 'IDLE'; // IDLE, MOVING
        this.queuedDir = null; // {x, y}
        
        this.shieldActive = false;
        this.shieldTimer = 0;
    }
    
    update(p) {
        // Handle Shield
        if (this.shieldActive) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) this.shieldActive = false;
        }
    
        // Movement Logic
        if (this.state === 'MOVING') {
            // Apply velocity
            // We use small steps to avoid tunneling
            const speed = PLAYER_SPEED;
            const steps = 4;
            const stepSize = speed / steps;
            
            for (let i = 0; i < steps; i++) {
                this.x += (this.vx / speed) * stepSize;
                this.y += (this.vy / speed) * stepSize;
                
                // Spawn trail
                if (gameState.frameCount % 5 === 0) {
                    particleSystem.spawnTrail(this.x + this.width/2, this.y + this.height/2, COLORS.PLAYER);
                }
                
                // Collision Check
                if (this.checkCollision()) {
                    // Backtrack slightly and align to grid
                    // Find nearest grid center
                    const gridX = Math.round(this.x / TILE_SIZE) * TILE_SIZE;
                    const gridY = Math.round(this.y / TILE_SIZE) * TILE_SIZE;
                    
                    // Simple snap for now - in a full physics engine we'd resolve properly
                    // But since we only move orthogonally, we can snap the axis we were moving on
                    if (this.vx !== 0) this.x = this.vx > 0 ? Math.floor(this.x/TILE_SIZE)*TILE_SIZE + (TILE_SIZE - this.width)/2 : Math.ceil(this.x/TILE_SIZE)*TILE_SIZE + (TILE_SIZE - this.width)/2;
                    if (this.vy !== 0) this.y = this.vy > 0 ? Math.floor(this.y/TILE_SIZE)*TILE_SIZE + (TILE_SIZE - this.height)/2 : Math.ceil(this.y/TILE_SIZE)*TILE_SIZE + (TILE_SIZE - this.height)/2;
                    
                    // Stop
                    this.vx = 0;
                    this.vy = 0;
                    this.state = 'IDLE';
                    
                    // Process queued move if any
                    if (this.queuedDir) {
                        this.move(this.queuedDir.x, this.queuedDir.y);
                        this.queuedDir = null;
                    }
                    break;
                }
            }
            
            // Check interactions (Coins, Spikes)
            this.checkInteractions();
            
        } else if (this.state === 'IDLE') {
            // Align perfectly to grid just in case
            // this.x = Math.round(this.x / TILE_SIZE) * TILE_SIZE + (TILE_SIZE - this.width)/2;
        }
        
        // Log player info
        if (p.logs && p.logs.player_info) {
             p.logs.player_info.push({
                x: this.x,
                y: this.y,
                state: this.state,
                coins: gameState.coins,
                frame: gameState.frameCount
            });
        }
        
        // Check Tide Death
        if (this.y + this.height > gameState.tideY) {
            this.die();
        }
    }
    
    checkCollision() {
        // Check corners against map
        const buffer = 2; // Pixel buffer
        const points = [
            {x: this.x + buffer, y: this.y + buffer},
            {x: this.x + this.width - buffer, y: this.y + buffer},
            {x: this.x + buffer, y: this.y + this.height - buffer},
            {x: this.x + this.width - buffer, y: this.y + this.height - buffer}
        ];
        
        for (let pt of points) {
            const gx = worldToGrid(pt.x);
            const gy = worldToGrid(pt.y);
            const key = getMapKey(gx, gy);
            if (gameState.map[key] === TILE_WALL) return true;
        }
        
        // Canvas bounds (Side walls are generated, but top/bottom constraints?)
        if (this.x < 0 || this.x > CANVAS_WIDTH - this.width) return true;
        
        return false;
    }
    
    checkInteractions() {
        const cx = this.x + this.width/2;
        const cy = this.y + this.height/2;
        const gx = worldToGrid(cx);
        const gy = worldToGrid(cy);
        const key = getMapKey(gx, gy);
        const tile = gameState.map[key];
        
        if (tile === TILE_COIN) {
            gameState.coins++;
            gameState.score += 10;
            delete gameState.map[key];
            particleSystem.spawnExplosion(cx, cy, COLORS.COIN, 5);
        } else if (tile === TILE_SPIKE) {
            if (!this.shieldActive) {
                this.die();
            }
        }
    }
    
    move(dx, dy) {
        if (this.state === 'MOVING') {
            this.queuedDir = {x: dx, y: dy};
            return;
        }
        
        // Check if immediate wall in that direction
        const checkDist = 5;
        const testX = this.x + dx * checkDist;
        const testY = this.y + dy * checkDist;
        // Simple 1-point check center for start
        const cx = this.x + this.width/2 + dx * checkDist;
        const cy = this.y + this.height/2 + dy * checkDist;
        const key = getMapKey(worldToGrid(cx), worldToGrid(cy));
        
        if (gameState.map[key] === TILE_WALL) {
            return; // Can't move there
        }
        
        this.vx = dx * PLAYER_SPEED;
        this.vy = dy * PLAYER_SPEED;
        this.state = 'MOVING';
    }
    
    activateShield() {
        if (gameState.coins >= 50 && !this.shieldActive) {
            gameState.coins -= 50;
            this.shieldActive = true;
            this.shieldTimer = 300; // 5 seconds at 60fps
        }
    }
    
    die() {
        if (gameState.gamePhase !== 'PLAYING') return;
        gameState.gamePhase = "GAME_OVER_LOSE";
        particleSystem.spawnExplosion(this.x + this.width/2, this.y + this.height/2, COLORS.PLAYER, 50);
    }
    
    render(p) {
        const ry = this.y - gameState.cameraY;
        
        p.push();
        // Shield Effect
        if (this.shieldActive) {
            p.noFill();
            p.stroke(COLORS.SHIELD);
            p.strokeWeight(2);
            p.circle(this.x + this.width/2, ry + this.height/2, this.width * 1.5);
        }
        
        p.fill(COLORS.PLAYER);
        p.rect(this.x, ry, this.width, this.height, 4);
        
        // Mask details
        p.fill(COLORS.PLAYER_MASK);
        p.noStroke();
        // Eyes
        p.rect(this.x + 4, ry + 6, 4, 4);
        p.rect(this.x + 12, ry + 6, 4, 4);
        p.pop();
    }
}