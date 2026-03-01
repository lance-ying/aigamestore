import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, BLOCKS } from './globals.js';
import { resolveCollision } from './physics.js';
import { intersectRayBox } from './utils.js';

export class Entity {
    constructor(x, y, z) {
        this.mesh = new THREE.Group(); // Placeholder
        this.mesh.position.set(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.size = new THREE.Vector3(0.6, 1.8, 0.6); // Default human size
        this.onGround = false;
        this.health = 100;
        this.maxHealth = 100;
        this.dead = false;
        this.speed = 4.0;
        this.jumpForce = 8.0;
    }

    update(deltaTime) {
        // Gravity
        this.velocity.y += gameState.gravity.y * deltaTime;
        
        // Physics
        resolveCollision(this, deltaTime);
        
        // Friction
        if (this.onGround) {
            const friction = 10.0;
            this.velocity.x -= this.velocity.x * friction * deltaTime;
            this.velocity.z -= this.velocity.z * friction * deltaTime;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.dead = true;
        // Override
    }
}

export class Player extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        // Player doesn't have a mesh in First Person, but we attach camera
        // Using a small box for shadow casting?
        /*
        const geometry = new THREE.BoxGeometry(0.5, 1.8, 0.5);
        const material = new THREE.MeshStandardMaterial({ color: 0x0000ff, transparent: true, opacity: 0 });
        this.body = new THREE.Mesh(geometry, material);
        this.mesh.add(this.body);
        */
        gameState.scene.add(this.mesh);

        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.selectedSlot = 0; // 0 = Pickaxe, 1-5 = Blocks
        this.inventory = [
            { type: "PICKAXE", count: 1 },
            { type: BLOCKS.DIRT, count: 64 },
            { type: BLOCKS.STONE, count: 64 },
            { type: BLOCKS.WOOD, count: 64 },
            { type: BLOCKS.GRASS, count: 64 }
        ];
        
        // Highlight box
        this.highlightBox = new THREE.Mesh(
            new THREE.BoxGeometry(1.01, 1.01, 1.01),
            new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, opacity: 0.3, transparent: true })
        );
        gameState.scene.add(this.highlightBox);
        this.highlightBox.visible = false;
        this.targetedBlock = null; // {x, y, z, normal}
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Sync camera to player head
        gameState.camera.position.copy(this.mesh.position);
        gameState.camera.position.y += 0.7; // Eye height
        gameState.camera.rotation.copy(this.rotation);
        
        this.handleInteraction();
    }
    
    move(forward, right, deltaTime) {
        // Calculate move direction based on Y rotation only
        const moveDir = new THREE.Vector3();
        
        const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        const rgt = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        
        if (forward !== 0) moveDir.add(fwd.multiplyScalar(forward));
        if (right !== 0) moveDir.add(rgt.multiplyScalar(right));
        
        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            // Accelerate
            const acc = this.onGround ? 50.0 : 10.0; // Air control is less
            this.velocity.x += moveDir.x * acc * deltaTime;
            this.velocity.z += moveDir.z * acc * deltaTime;
        }
        
        // Cap speed
        const hVel = new THREE.Vector2(this.velocity.x, this.velocity.z);
        if (hVel.length() > this.speed) {
            hVel.normalize().multiplyScalar(this.speed);
            this.velocity.x = hVel.x;
            this.velocity.z = hVel.y;
        }
    }
    
    rotate(dx, dy) {
        const sensitivity = 0.04;
        this.rotation.y -= dx * sensitivity;
        this.rotation.x -= dy * sensitivity;
        // Clamp pitch
        this.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.rotation.x));
    }
    
    jump() {
        if (this.onGround) {
            this.velocity.y = this.jumpForce;
            this.onGround = false;
        }
    }
    
    handleInteraction() {
        // Raycast for blocks
        const range = 4.0;
        const origin = gameState.camera.position;
        const direction = new THREE.Vector3(0, 0, -1).applyEuler(this.rotation);
        
        // Simple DDA or Raystep
        // Just step along ray 0.1 units
        let hit = null;
        for (let t = 0; t < range; t += 0.05) {
            const p = origin.clone().add(direction.clone().multiplyScalar(t));
            const x = Math.floor(p.x);
            const y = Math.floor(p.y);
            const z = Math.floor(p.z);
            
            if (gameState.world.getBlock(x, y, z) !== BLOCKS.AIR) {
                // Determine normal
                // We need precise intersection to get normal
                const boxMin = { x: x, y: y, z: z };
                const boxMax = { x: x + 1, y: y + 1, z: z + 1 };
                const intersect = intersectRayBox(origin, direction, boxMin, boxMax);
                if (intersect) {
                    hit = { x, y, z, normal: intersect.normal };
                    break;
                }
            }
        }
        
        this.targetedBlock = hit;
        
        if (hit) {
            this.highlightBox.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
            this.highlightBox.visible = true;
        } else {
            this.highlightBox.visible = false;
        }
    }
    
    action() {
        if (!this.targetedBlock) return;
        
        if (this.selectedSlot === 0) {
            // Mine
            gameState.world.setBlock(this.targetedBlock.x, this.targetedBlock.y, this.targetedBlock.z, BLOCKS.AIR);
            gameState.world.updateMeshes();
        } else {
            // Build
            const item = this.inventory[this.selectedSlot];
            if (item && item.count > 0) {
                const tx = this.targetedBlock.x + this.targetedBlock.normal.x;
                const ty = this.targetedBlock.y + this.targetedBlock.normal.y;
                const tz = this.targetedBlock.z + this.targetedBlock.normal.z;
                
                // Don't build inside player
                const pBox = new THREE.Box3().setFromCenterAndSize(this.mesh.position, this.size);
                const bBox = new THREE.Box3(
                    new THREE.Vector3(tx, ty, tz),
                    new THREE.Vector3(tx+1, ty+1, tz+1)
                );
                
                if (!pBox.intersectsBox(bBox)) {
                    gameState.world.setBlock(tx, ty, tz, item.type);
                    gameState.world.updateMeshes();
                    // Infinite resources in this prototype for fun, or uncomment:
                    // item.count--;
                }
            }
        }
    }
    
    cycleSlot() {
        this.selectedSlot = (this.selectedSlot + 1) % this.inventory.length;
    }

    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
}

export class Enemy extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        this.size = new THREE.Vector3(0.6, 1.5, 0.6);
        this.speed = 2.0;
        
        // Visual
        const geometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 0; // Center is at 0 local, adjust height logic
        this.mesh = new THREE.Group();
        this.mesh.add(mesh);
        this.mesh.position.set(x, y, z);
        mesh.position.y = 0; // Keep local center
        
        gameState.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // AI: Chase player
        if (gameState.player && !gameState.player.dead) {
            const dist = this.mesh.position.distanceTo(gameState.player.mesh.position);
            
            if (dist < 10) {
                const dir = new THREE.Vector3()
                    .subVectors(gameState.player.mesh.position, this.mesh.position)
                    .normalize();
                
                // Only move horizontal
                this.velocity.x = dir.x * this.speed;
                this.velocity.z = dir.z * this.speed;
                
                // Jump if blocked? Simple random jump
                if (this.onGround && Math.random() < 0.01) {
                    this.velocity.y = 5.0;
                }
                
                // Attack
                if (dist < 1.0) {
                    gameState.player.takeDamage(10 * deltaTime);
                    // Push back
                    const push = dir.clone().multiplyScalar(-10);
                    gameState.player.velocity.add(push.multiplyScalar(deltaTime));
                }
            } else {
                this.velocity.x = 0;
                this.velocity.z = 0;
            }
        }
    }
}