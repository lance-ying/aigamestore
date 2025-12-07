/**
 * entities.js
 * Contains Player, Enemy, and Collectible classes.
 */

import { PHYSICS, COLORS, gameState, TILE_SIZE, logGameEvent, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { resolveMapCollision } from './physics.js';
import { spawnParticles } from './particle_system.js';

class Entity {
    constructor(x, y, w, h, type) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.vx = 0;
        this.vy = 0;
        this.type = type;
        this.markedForDeletion = false;
    }

    update(p) {
        // Base update
    }

    render(p) {
        // Base render
    }
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 20, 28, 'PLAYER'); // Smaller than tile size
        this.isGrounded = false;
        this.isDashing = false;
        this.dashCooldown = 0;
        this.facing = 1; // 1 Right, -1 Left
        this.coyoteTimer = 0;
        this.jumpBuffer = 0;
        this.animFrame = 0;
        this.invulnerable = 0;
    }

    update(p) {
        // Input Handling
        const keys = gameState.keys;
        const left = keys[p.LEFT_ARROW];
        const right = keys[p.RIGHT_ARROW];
        const up = keys[p.UP_ARROW] || keys[32]; // Space
        const down = keys[p.DOWN_ARROW];
        const dash = keys[90]; // Z

        // Horizontal Movement
        let targetSpeed = 0;
        if (left) {
            targetSpeed = -PHYSICS.MAX_SPEED_X;
            this.facing = -1;
        } else if (right) {
            targetSpeed = PHYSICS.MAX_SPEED_X;
            this.facing = 1;
        }

        // Acceleration / Friction
        this.vx = this.vx * PHYSICS.FRICTION + targetSpeed * (1 - PHYSICS.FRICTION);
        
        // Gravity
        this.vy += PHYSICS.GRAVITY;

        // Jump Handling
        // Coyote Time
        if (this.isGrounded) {
            this.coyoteTimer = PHYSICS.COYOTE_TIME;
        } else {
            this.coyoteTimer--;
        }

        // Jump Buffer
        if (gameState.keys.jumpPressed) {
            this.jumpBuffer = PHYSICS.BUFFER_TIME;
            gameState.keys.jumpPressed = false; // consume press
        } else {
            this.jumpBuffer--;
        }

        // Jump Execution
        if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
            this.vy = PHYSICS.JUMP_FORCE;
            this.jumpBuffer = 0;
            this.coyoteTimer = 0;
            this.isGrounded = false;
            spawnParticles(this.x + this.w/2, this.y + this.h, 'DUST', 3);
            logGameEvent(p, 'player', { action: 'jump', x: this.x, y: this.y });
        }

        // Variable Jump Height
        if (!up && this.vy < PHYSICS.JUMP_HOLD_FORCE) {
            this.vy *= 0.5; // Cut velocity if button released
        }

        // Dash
        if (dash && this.dashCooldown <= 0) {
            this.vx = this.facing * PHYSICS.DASH_SPEED;
            this.vy = 0; // suspend gravity momentarily
            this.dashCooldown = 30;
            spawnParticles(this.x + this.w/2, this.y + this.h/2, 'EXPLOSION', 5);
            logGameEvent(p, 'player', { action: 'dash' });
        }
        if (this.dashCooldown > 0) this.dashCooldown--;

        // Fast Fall
        if (down && !this.isGrounded) {
            this.vy += 0.5;
        }

        // Terminal Velocity
        if (this.vy > PHYSICS.MAX_SPEED_Y) this.vy = PHYSICS.MAX_SPEED_Y;

        // Physics Resolution
        resolveMapCollision(this, gameState.currentRoom);

        // Check Screen Bounds (Room Transition or Death)
        if (this.y > CANVAS_HEIGHT) {
            this.die(p);
        }
        
        // Check Room Exits (Left/Right/Top)
        if (this.x < 0) {
            // Usually shouldn't go left, but if design allows:
            this.x = 0; 
            this.vx = 0;
        } else if (this.x + this.w > CANVAS_WIDTH) {
            // Exit Right -> Win Room
            gameState.nextRoomDirection = 'RIGHT';
            gameState.isTransitioning = true;
        } else if (this.y < 0) {
             // Exit Top -> Win Room (if level designed vertically)
             gameState.nextRoomDirection = 'UP';
             gameState.isTransitioning = true;
        }

        // Invulnerability Tick
        if (this.invulnerable > 0) this.invulnerable--;

        // Animation
        if (Math.abs(this.vx) > 0.5) this.animFrame += 0.2;
        else this.animFrame = 0;
    }

    render(p) {
        if (this.invulnerable > 0 && p.frameCount % 4 < 2) return; // Flash

        p.push();
        p.translate(this.x + this.w/2, this.y + this.h/2);
        p.scale(this.facing, 1);
        
        // Body
        p.fill(COLORS.PLAYER);
        p.rect(-this.w/2, -this.h/2, this.w, this.h, 2);
        
        // Head / Visor
        p.fill(COLORS.PLAYER_ACCENT);
        p.rect(-this.w/2 + 4, -this.h/2 + 4, 12, 6);

        // Legs Animation
        if (Math.abs(this.vx) > 0.5 && this.isGrounded) {
            let legOffset = Math.sin(this.animFrame) * 4;
            p.fill(COLORS.WALL); // Dark legs
            p.rect(-6 + legOffset, this.h/2 - 4, 4, 6);
            p.rect(2 - legOffset, this.h/2 - 4, 4, 6);
        }

        p.pop();
    }

    die(p) {
        if (gameState.gamePhase !== 'PLAYING') return;
        
        spawnParticles(this.x, this.y, 'EXPLOSION', 20);
        gameState.lives--;
        logGameEvent(p, 'game', { event: 'player_death', lives_left: gameState.lives });
        
        if (gameState.lives <= 0) {
            gameState.gamePhase = 'GAME_OVER_LOSE';
        } else {
            // Reset position to spawn of current room
            const spawn = gameState.currentRoom.spawnPoint;
            this.x = spawn.x;
            this.y = spawn.y;
            this.vx = 0;
            this.vy = 0;
            this.invulnerable = 60;
        }
    }
}

export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 24, 24, 'ENEMY');
        this.patrolType = type; // 'WALKER', 'FLYER'
        this.patrolStart = x;
        this.dir = 1;
        this.speed = (type === 'FLYER') ? 2 : 1.5;
        this.range = 100;
        this.oscillation = 0;
    }

    update(p) {
        if (this.patrolType === 'WALKER') {
            // Move back and forth
            this.vx = this.dir * this.speed;
            this.vy += PHYSICS.GRAVITY;
            
            // Check edges of platform
            let map = gameState.currentRoom;
            let lookAheadX = this.x + (this.dir * TILE_SIZE);
            let lookDownY = this.y + this.h + 2;
            
            // Turn around if wall ahead or gap below
            let tileX = Math.floor(lookAheadX / TILE_SIZE);
            let tileY = Math.floor(this.y / TILE_SIZE);
            let floorTileX = Math.floor((this.x + this.w/2 + (this.dir * this.w/2)) / TILE_SIZE);
            let floorTileY = Math.floor(lookDownY / TILE_SIZE);

            if (map.isSolid(tileX, tileY) || !map.isSolid(floorTileX, floorTileY)) {
                this.dir *= -1;
            }

            resolveMapCollision(this, map);

        } else if (this.patrolType === 'FLYER') {
            this.oscillation += 0.05;
            this.x += Math.cos(this.oscillation) * this.speed;
            this.y += Math.sin(this.oscillation) * 1; // Bob up down
        }
    }

    render(p) {
        p.push();
        p.translate(this.x + this.w/2, this.y + this.h/2);
        
        if (this.patrolType === 'WALKER') {
            p.fill(COLORS.ENEMY);
            p.rect(-this.w/2, -this.h/2, this.w, this.h, 4);
            // Eye
            p.fill(COLORS.ENEMY_EYE);
            p.rect(this.dir * 4, -4, 8, 4);
            // Spikes/Antenna
            p.stroke(COLORS.ENEMY);
            p.line(0, -this.h/2, 0, -this.h/2 - 6);
            p.noStroke();
        } else {
            p.fill(COLORS.ENEMY);
            p.ellipse(0, 0, this.w, this.h);
            p.fill(COLORS.ENEMY_EYE);
            p.ellipse(0, 0, 10, 10);
            // Wings
            p.fill(150);
            let wingY = Math.sin(p.frameCount * 0.5) * 5;
            p.rect(-20, -5 + wingY, 10, 5);
            p.rect(10, -5 + wingY, 10, 5);
        }
        
        p.pop();
    }
}

export class Collectible extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16, 'COIN');
        this.baseY = y;
        this.offset = Math.random() * Math.PI * 2;
    }

    update(p) {
        this.y = this.baseY + Math.sin(p.frameCount * 0.1 + this.offset) * 5;
    }

    render(p) {
        p.fill(COLORS.COIN);
        p.push();
        p.translate(this.x + this.w/2, this.y + this.h/2);
        p.rotate(p.frameCount * 0.05);
        p.rect(-this.w/2, -this.h/2, this.w, this.h);
        p.pop();
    }
}

export class ParticleEffect extends Entity {
    // Already handled in particle_system.js but good for consistency
}