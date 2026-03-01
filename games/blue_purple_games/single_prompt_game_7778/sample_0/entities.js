import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, LANE_WIDTH, GRAVITY, JUMP_FORCE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { createPlayerMesh, createEnemyMesh, createCoinMesh, createObstacleMesh } from './graphics.js';
import { checkAABB, disposeObject } from './utils.js';

// Base Entity Class
class Entity {
    constructor() {
        this.mesh = null;
        this.active = true;
        this.bbox = new THREE.Box3();
    }

    update(dt) {
        // Base update
    }

    updateBBox() {
        if (this.mesh) {
            this.bbox.setFromObject(this.mesh);
        }
    }

    destroy() {
        this.active = false;
        if (this.mesh) {
            disposeObject(this.mesh);
            if (gameState.scene) gameState.scene.remove(this.mesh);
        }
    }
}

// Player Class
export class Player extends Entity {
    constructor() {
        super();
        this.mesh = createPlayerMesh();
        gameState.scene.add(this.mesh);

        // State
        this.currentLane = 0; // -1 (Left), 0 (Center), 1 (Right)
        this.targetX = 0;
        
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.isJumping = false;
        this.isRolling = false;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.rollTimer = 0;
        
        this.health = 100;
        this.maxHealth = 100;
        
        this.invulnerableTime = 0;

        // Visuals
        this.mesh.position.set(0, 0, 0);
    }

    update(dt) {
        // Lane Movement (Smooth Lerp)
        this.targetX = this.currentLane * LANE_WIDTH;
        this.mesh.position.x += (this.targetX - this.mesh.position.x) * 10 * dt;

        // Gravity and Jumping
        if (this.mesh.position.y > 0 || this.isJumping) {
            this.velocity.y += GRAVITY; // Gravity is per frame-ish
            this.mesh.position.y += this.velocity.y;
        }

        // Ground Collision
        if (this.mesh.position.y <= 0) {
            // Check if over a pit (no ground)
            if (this.isOverPit()) {
                // Fall
            } else {
                this.mesh.position.y = 0;
                this.velocity.y = 0;
                this.isJumping = false;
            }
        }
        
        // Rolling Logic
        if (this.isRolling) {
            this.rollTimer -= dt;
            this.mesh.scale.set(1, 0.5, 1); // Squish
            if (this.rollTimer <= 0) {
                this.isRolling = false;
                this.mesh.scale.set(1, 1, 1);
                // Reset position slightly to avoid clipping floor when un-squishing
                this.mesh.position.y = 0; 
            }
        }

        // Attack Logic
        if (this.isAttacking) {
            this.attackTimer -= dt;
            // Animate sword arm
            const arm = this.mesh.userData.arm;
            arm.rotation.x = -Math.PI / 2 + Math.sin(this.attackTimer * 20) * 1.5;
            
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                arm.rotation.x = 0;
            }
        }

        // Invulnerability
        if (this.invulnerableTime > 0) {
            this.invulnerableTime -= dt;
            this.mesh.visible = Math.floor(gameState.frameCount / 4) % 2 === 0; // Blink
        } else {
            this.mesh.visible = true;
        }

        // Check falling death
        if (this.mesh.position.y < -10) {
            this.die();
        }

        this.updateBBox();
        this.logPosition();
    }

    isOverPit() {
        // Simplified: Pit logic handled by collision with "Pit" objects or lack of "Ground"
        // For this implementation, we will assume continuous ground unless logic says otherwise
        return false;
    }

    changeLane(dir) {
        const newLane = this.currentLane + dir;
        if (newLane >= -1 && newLane <= 1) {
            this.currentLane = newLane;
        }
    }

    jump() {
        if (!this.isJumping && this.mesh.position.y < 0.1) {
            this.velocity.y = JUMP_FORCE;
            this.isJumping = true;
            this.isRolling = false; // Cancel roll
            this.mesh.scale.set(1, 1, 1);
        }
    }

    roll() {
        if (!this.isJumping && !this.isRolling) {
            this.isRolling = true;
            this.rollTimer = 0.8; // Seconds
        }
    }

    attack() {
        if (!this.isAttacking) {
            this.isAttacking = true;
            this.attackTimer = 0.3; // Duration
            
            // Check hit immediately
            this.checkAttackHit();
        }
    }

    checkAttackHit() {
        // Simple hitbox in front
        const attackBox = new THREE.Box3().setFromObject(this.mesh);
        attackBox.min.z -= 3.0; // Extend forward
        attackBox.max.z -= 0.5;
        // Expand width for lane forgiveness
        attackBox.min.x -= 1.0; 
        attackBox.max.x += 1.0;

        gameState.entities.forEach(entity => {
            if (entity instanceof Enemy && entity.active) {
                entity.updateBBox();
                if (attackBox.intersectsBox(entity.bbox)) {
                    entity.die();
                    gameState.score += 50;
                }
            }
        });
    }

    takeDamage(amount) {
        if (this.invulnerableTime > 0) return;
        
        this.health -= amount;
        this.invulnerableTime = 2.0;
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
    
    logPosition() {
         if (window.logs && window.logs.player_info) {
            // Project 3D position to 2D screen space for logs
            const vector = this.mesh.position.clone();
            vector.project(gameState.camera);
            
            window.logs.player_info.push({
                screen_x: (vector.x + 1) * CANVAS_WIDTH / 2,
                screen_y: -(vector.y - 1) * CANVAS_HEIGHT / 2,
                game_x: this.mesh.position.x,
                game_y: this.mesh.position.y,
                game_z: this.mesh.position.z,
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
         }
    }
}

// Enemy Class (Goon)
export class Enemy extends Entity {
    constructor(x, z) {
        super();
        this.mesh = createEnemyMesh();
        this.mesh.position.set(x, 0, z);
        gameState.scene.add(this.mesh);
    }

    update(dt) {
        // Enemies might move slowly towards player or stand still
        // For runner, static or patrolling enemies are common
        
        // Simple bobbing animation
        this.mesh.position.y = 0.6 + Math.sin(gameState.frameCount * 0.1) * 0.1;
        
        this.updateBBox();
    }
    
    die() {
        this.destroy();
        // Visual effect could spawn here
    }
}

// Collectible Class (Coin)
export class Collectible extends Entity {
    constructor(x, y, z) {
        super();
        this.mesh = createCoinMesh();
        this.mesh.position.set(x, y, z);
        gameState.scene.add(this.mesh);
        this.baseY = y;
    }

    update(dt) {
        this.mesh.rotation.y += 3 * dt;
        this.mesh.position.y = this.baseY + Math.sin(gameState.frameCount * 0.1) * 0.2;
        this.updateBBox();
    }
    
    collect() {
        this.destroy();
        gameState.score += 10;
        // Particle effect here
    }
}

// Obstacle Class
export class Obstacle extends Entity {
    constructor(x, z, type) {
        super();
        this.mesh = createObstacleMesh(type);
        this.mesh.position.set(x, this.mesh.position.y, z);
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        this.updateBBox();
    }
}