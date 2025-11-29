import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { randomChoice, checkAABB } from './utils.js';

class Entity {
    constructor(x, y, z) {
        this.mesh = new THREE.Group();
        this.mesh.position.set(x, y, z);
        gameState.scene.add(this.mesh);
        this.dead = false;
    }
    
    update(dt) {}
    
    destroy() {
        gameState.scene.remove(this.mesh);
        this.dead = true;
    }
}

export class Kart extends Entity {
    constructor(x, y, z, color, isPlayer = false) {
        super(x, y, z);
        this.isPlayer = isPlayer;
        
        // Physics
        this.velocity = new THREE.Vector3();
        this.speed = 0;
        this.maxSpeed = isPlayer ? 45 : 42; // Player slightly faster
        this.acceleration = 25;
        this.turnSpeed = 2.0;
        this.friction = 0.98;
        this.offRoadFriction = 0.90;
        this.driftFactor = 0;
        this.isDrifting = false;
        
        // State
        this.lap = 1;
        this.checkpointIndex = 0;
        this.rank = 1;
        this.score = 0;
        this.item = null; // 'MUSHROOM', 'SHELL', 'BANANA'
        this.invincible = 0; // Timer
        
        // Visuals
        this.buildKartMesh(color);
    }
    
    buildKartMesh(color) {
        // Chassis
        const chassisGeo = new THREE.BoxGeometry(1.5, 0.5, 2.5);
        const chassisMat = new THREE.MeshStandardMaterial({ color: color });
        const chassis = new THREE.Mesh(chassisGeo, chassisMat);
        chassis.castShadow = true;
        this.mesh.add(chassis);
        
        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        wheelGeo.rotateZ(Math.PI/2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        
        const positions = [
            [-0.8, -0.2, 1.0], [0.8, -0.2, 1.0],
            [-0.8, -0.2, -1.0], [0.8, -0.2, -1.0]
        ];
        
        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(...pos);
            wheel.castShadow = true;
            this.mesh.add(wheel);
        });
        
        // Driver
        const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 0.8, -0.2);
        this.mesh.add(head);
    }
    
    update(dt) {
        if (this.dead) return;
        
        if (this.invincible > 0) {
            this.invincible -= dt;
            this.mesh.visible = Math.floor(gameState.frameCount / 4) % 2 === 0;
        } else {
            this.mesh.visible = true;
        }
        
        // Apply physics move
        const moveDir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
        
        // Apply velocity
        this.mesh.position.add(moveDir.multiplyScalar(this.speed * dt));
        
        // Ground clamping (simplified)
        // Raycast down to find track height would be better, but we used flat track logic
        // We just clamp to generated height approximately or use gravity if jumping
        // For this constraints, we stick to the track path y mostly or simple physics
        if (gameState.track) {
            const { point } = gameState.track.getClosestPoint(this.mesh.position);
            // Lerp Y to track Y to stick to road slopes
            this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, point.y + 0.5, 10 * dt);
        }
        
        // Drag
        const onTrack = gameState.track ? gameState.track.isOnTrack(this.mesh.position) : true;
        const drag = onTrack ? this.friction : this.offRoadFriction;
        this.speed *= drag;
        
        // Update lap progress
        this.updateProgress();
    }
    
    updateProgress() {
        if (!gameState.track) return;
        
        const { index } = gameState.track.getClosestPoint(this.mesh.position);
        
        // Simple lap logic: if index wraps from high to low near start
        const totalPoints = gameState.track.points.length;
        
        // Crossing finish line forward
        if (this.checkpointIndex > totalPoints * 0.9 && index < totalPoints * 0.1) {
            this.lap++;
            if (this.isPlayer && this.lap > gameState.lapsTotal) {
                // Determine win/loss immediately for this jam
                // Check rank (simplified)
                gameState.gamePhase = this.rank === 1 ? "GAME_OVER_WIN" : "GAME_OVER_LOSE";
            }
        }
        // Crossing backward (ignore or decrement?)
        
        this.checkpointIndex = index;
    }
    
    useItem() {
        if (!this.item) return;
        
        if (this.item === 'MUSHROOM') {
            this.speed = this.maxSpeed * 1.5;
        } else if (this.item === 'SHELL') {
            const dir = new THREE.Vector3(0,0,1).applyQuaternion(this.mesh.quaternion);
            const pos = this.mesh.position.clone().add(dir.multiplyScalar(2));
            const proj = new Projectile(pos, dir, this);
            gameState.projectiles.push(proj);
        }
        
        this.item = null;
    }
}

export class Player extends Kart {
    constructor(x, y, z) {
        super(x, y, z, 0xff0000, true);
    }
    
    update(dt) {
        // Input Handling
        let accel = 0;
        let steer = 0;
        
        if (gameState.controlMode === "HUMAN") {
            if (gameState.keys.ArrowUp || gameState.keys.w) accel = 1;
            if (gameState.keys.ArrowDown || gameState.keys.s) accel = -1;
            if (gameState.keys.ArrowLeft || gameState.keys.a) steer = 1; // Left turns +Y rot
            if (gameState.keys.ArrowRight || gameState.keys.d) steer = -1;
            
            if (gameState.keys.Shift && (steer !== 0)) {
                this.isDrifting = true;
            } else {
                this.isDrifting = false;
            }
            
            if (gameState.keys[" "] && this.item) {
                this.useItem();
                gameState.keys[" "] = false; // consume key
            }
        } else if (gameState.controlMode.startsWith("TEST")) {
            // Test automations
            if (gameState.controlMode === "TEST_1") {
                accel = 1; // Just drive
            } else if (gameState.controlMode === "TEST_2") {
                // Drive off road
                accel = 1;
                steer = 1; 
            }
        }
        
        // Physics update
        this.speed += accel * this.acceleration * dt;
        
        // Cap speed
        if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
        if (this.speed < -this.maxSpeed/2) this.speed = -this.maxSpeed/2;
        
        // Turning
        if (Math.abs(this.speed) > 0.1) {
            const turnMultiplier = this.isDrifting ? 1.5 : 1.0;
            // Reverse steering if going backward
            const dir = this.speed > 0 ? 1 : -1;
            this.mesh.rotation.y += steer * this.turnSpeed * turnMultiplier * dt * dir;
            
            // Visual drift tilt
            if (this.isDrifting) {
                // Hop effect or sparks could go here
            }
        }
        
        super.update(dt);
        
        // Log info for testing
        if (window.logs.player_info) {
            window.logs.player_info.push({
                x: this.mesh.position.x,
                z: this.mesh.position.z,
                speed: this.speed,
                lap: this.lap,
                frame: gameState.frameCount
            });
        }
    }
}

export class Opponent extends Kart {
    constructor(x, y, z, color) {
        super(x, y, z, color, false);
        this.targetIndex = 0;
    }
    
    update(dt) {
        if (!gameState.track) return;
        
        // Find target point on track
        const points = gameState.track.points;
        const { index } = gameState.track.getClosestPoint(this.mesh.position);
        
        // Look ahead
        let lookAhead = 15;
        let targetIdx = (index + lookAhead) % points.length;
        const target = points[targetIdx].clone();
        
        // Steering logic
        const kartPos = this.mesh.position.clone();
        const dirToTarget = target.sub(kartPos).normalize();
        
        const forward = new THREE.Vector3(0,0,1).applyQuaternion(this.mesh.quaternion);
        const angle = forward.angleTo(dirToTarget);
        
        // Cross product to know left or right
        const cross = new THREE.Vector3().crossVectors(forward, dirToTarget);
        
        let steer = 0;
        if (cross.y > 0.1) steer = 1; // Left
        if (cross.y < -0.1) steer = -1; // Right
        
        // AI Acceleration
        this.speed += this.acceleration * 0.8 * dt; // slightly slower accel than player
        if (this.speed > this.maxSpeed * 0.9) this.speed = this.maxSpeed * 0.9; // slower top speed
        
        // Slow down for sharp turns
        if (Math.abs(angle) > 0.5) {
            this.speed *= 0.95;
        }
        
        this.mesh.rotation.y += steer * this.turnSpeed * dt;
        
        super.update(dt);
    }
}

export class ItemBox extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xFFFF00, 
            transparent: true, 
            opacity: 0.8,
            emissive: 0xaa8800,
            emissiveIntensity: 0.5
        });
        this.boxMesh = new THREE.Mesh(geometry, material);
        this.mesh.add(this.boxMesh);
        
        // Question mark (simplified as a floating smaller cube inside)
        const qGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const qMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.qMesh = new THREE.Mesh(qGeo, qMat);
        this.mesh.add(this.qMesh);
        
        this.baseY = y;
        this.bbox = new THREE.Box3();
    }
    
    update(dt) {
        this.mesh.rotation.y += 2 * dt;
        this.mesh.rotation.x += 1 * dt;
        this.mesh.position.y = this.baseY + Math.sin(gameState.elapsedTime * 3) * 0.3;
        
        // Update Bounding Box
        this.bbox.setFromObject(this.mesh);
        
        // Check collision with player
        if (gameState.player && !gameState.player.dead) {
            const playerBox = new THREE.Box3().setFromObject(gameState.player.mesh);
            if (this.bbox.intersectsBox(playerBox)) {
                this.collect(gameState.player);
            }
        }
    }
    
    collect(kart) {
        if (kart.item === null) {
            const items = ['MUSHROOM', 'SHELL'];
            kart.item = randomChoice(items);
            // Visual feedback could go here
        }
        this.destroy();
        // Remove from global list
        const idx = gameState.itemBoxes.indexOf(this);
        if (idx > -1) gameState.itemBoxes.splice(idx, 1);
    }
}

export class Projectile extends Entity {
    constructor(pos, dir, owner) {
        super(pos.x, pos.y, pos.z);
        this.velocity = dir.normalize().multiplyScalar(60); // fast
        this.owner = owner;
        this.life = 3.0; // seconds
        
        const geo = new THREE.SphereGeometry(0.5);
        const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x004400 }); // Green shell
        this.shell = new THREE.Mesh(geo, mat);
        this.mesh.add(this.shell);
    }
    
    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.destroy();
            return;
        }
        
        this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
        
        // Check collisions with karts
        const targets = [gameState.player, ...gameState.opponents];
        const myBox = new THREE.Box3().setFromObject(this.mesh);
        
        for (let target of targets) {
            if (target === this.owner || target.dead) continue;
            
            const tBox = new THREE.Box3().setFromObject(target.mesh);
            if (myBox.intersectsBox(tBox)) {
                // Hit!
                target.speed = 0; // Stop them
                target.mesh.position.y += 2; // Jump up
                // Spin effect?
                this.destroy();
                return;
            }
        }
    }
    
    destroy() {
        super.destroy();
        const idx = gameState.projectiles.indexOf(this);
        if (idx > -1) gameState.projectiles.splice(idx, 1);
    }
}