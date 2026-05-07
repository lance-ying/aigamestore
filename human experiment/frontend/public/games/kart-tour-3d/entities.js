import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { randomChoice, checkAABB, randomRange } from './utils.js';

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
        this.bumpVelocity = new THREE.Vector3(); // For collision impulses
        this.speed = 0;
        // Increased speeds for better gameplay
        this.maxSpeed = isPlayer ? 80 : 75; 
        this.acceleration = 40; 
        this.turnSpeed = 2.0;
        this.friction = 0.99; // Less drag on road
        this.offRoadFriction = 0.95; // Less punishing off-road (was 0.90)
        this.driftFactor = 0;
        this.isDrifting = false;
        
        // Visual Animation State
        this.steeringInput = 0; // -1 to 1
        this.currentSteerAngle = 0;
        this.currentTilt = 0;
        this.wheelRotation = 0;
        
        // State
        this.lap = 1;
        this.checkpointIndex = 0;
        this.rank = 1;
        this.score = 0;
        this.coins = 0; // Collected coins
        this.item = null; // 'MUSHROOM', 'SHELL', 'BANANA'
        this.invincible = 0; // Timer
        
        // Visuals
        this.buildKartMesh(color);
    }
    
    buildKartMesh(color) {
        // Container for body (chassis + driver) to allow independent tilting
        this.bodyMesh = new THREE.Group();
        this.mesh.add(this.bodyMesh);
        
        // Chassis
        const chassisGeo = new THREE.BoxGeometry(1.5, 0.5, 2.5);
        const chassisMat = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.6,
            metalness: 0.3
        });
        const chassis = new THREE.Mesh(chassisGeo, chassisMat);
        chassis.castShadow = true;
        this.bodyMesh.add(chassis);
        
        // Wheels
        this.wheels = [];
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        wheelGeo.rotateZ(Math.PI/2); // Cylinder orientation
        const wheelMat = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.8
        });
        
        // Z > 0 is Front in this coordinate system (based on moveDir)
        const positions = [
            [-0.8, -0.2, 1.0], [0.8, -0.2, 1.0],   // Front
            [-0.8, -0.2, -1.0], [0.8, -0.2, -1.0]  // Rear
        ];
        
        positions.forEach(pos => {
            // Container for steering (Y rotation)
            const wheelContainer = new THREE.Group();
            wheelContainer.position.set(...pos);
            this.mesh.add(wheelContainer); // Attach to root so they don't tilt with body
            
            // The wheel mesh itself (for rolling X rotation)
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.castShadow = true;
            wheelContainer.add(wheel);
            
            this.wheels.push({
                container: wheelContainer,
                mesh: wheel,
                isFront: pos[2] > 0 // Z > 0 is front
            });
        });
        
        // Driver
        const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ 
            color: 0xffccaa,
            roughness: 0.9
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 0.8, -0.2);
        this.bodyMesh.add(head);
    }
    
    update(dt) {
        if (this.dead) return;
        
        if (this.invincible > 0) {
            this.invincible -= dt;
            this.mesh.visible = Math.floor(gameState.frameCount / 4) % 2 === 0;
        } else {
            this.mesh.visible = true;
        }
        
        // --- Physics ---
        
        // Apply bump velocity from collisions
        this.mesh.position.add(this.bumpVelocity.clone().multiplyScalar(dt));
        // Dampen bump velocity
        this.bumpVelocity.lerp(new THREE.Vector3(0,0,0), 5.0 * dt);
        
        // Apply physics move
        const moveDir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
        
        // Apply velocity
        this.mesh.position.add(moveDir.multiplyScalar(this.speed * dt));
        
        // Ground clamping - smoother for flat track
        if (gameState.track) {
            const { point } = gameState.track.getClosestPoint(this.mesh.position);
            // Smooth lerp Y to track Y to stay on road
            this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, point.y + 0.7, 15 * dt);
        }
        
        // Drag
        const onTrack = gameState.track ? gameState.track.isOnTrack(this.mesh.position) : true;
        const drag = onTrack ? this.friction : this.offRoadFriction;
        this.speed *= drag;
        
        // Update lap progress
        this.updateProgress();
        
        // --- Visual Animations ---
        
        // 1. Wheel Rotation (Rolling)
        // Circumference ~ 2.5 units. Speed is units/sec.
        const rollSpeed = this.speed * dt * 2.0; 
        this.wheels.forEach(w => {
            w.mesh.rotation.x += rollSpeed;
        });
        
        // 2. Steering (Front Wheels)
        const targetSteer = this.steeringInput * 0.5; // Max 0.5 radians (~30 deg)
        this.currentSteerAngle = THREE.MathUtils.lerp(this.currentSteerAngle, targetSteer, dt * 10);
        
        this.wheels.forEach(w => {
            if (w.isFront) {
                w.container.rotation.y = this.currentSteerAngle;
            }
        });
        
        // 3. Chassis Tilt (Leaning into turn)
        // Lean proportional to steering * speed
        const leanAmount = -this.currentSteerAngle * (this.speed / this.maxSpeed) * 0.5;
        this.currentTilt = THREE.MathUtils.lerp(this.currentTilt, leanAmount, dt * 5);
        this.bodyMesh.rotation.z = this.currentTilt;
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
                
                // Fix: Calculate rank dynamically based on who has ALREADY finished
                // If opponents finished earlier, their lap count would be > lapsTotal
                const opponentsFinished = gameState.opponents.filter(o => o.lap > gameState.lapsTotal).length;
                this.rank = 1 + opponentsFinished;
                
                // Score is already being updated continuously, just ensure it's set correctly at finish
                const rankBonus = (5 - this.rank) * 1000; // 1st=4000, 4th=1000
                const coinBonus = this.coins * 100;
                gameState.score = rankBonus + coinBonus;
                
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
        
        // HUMAN mode is the only mode
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
        
        // Pass input to visuals
        this.steeringInput = steer;
        
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
        
        // Dynamic lookahead: faster = look further, but keep it tight to prevent corner cutting
        const lookAhead = 8 + Math.floor(this.speed / 20);
        let targetIdx = (index + lookAhead) % points.length;
        const target = points[targetIdx].clone();
        
        // Steering logic
        const kartPos = this.mesh.position.clone();
        const dirToTarget = target.sub(kartPos).normalize();
        
        const forward = new THREE.Vector3(0,0,1).applyQuaternion(this.mesh.quaternion);
        
        // Cross product to know left or right (y component acts as sine of angle)
        const cross = new THREE.Vector3().crossVectors(forward, dirToTarget);
        
        // Proportional steering instead of binary
        let steer = cross.y * 4.0;
        steer = Math.max(-1, Math.min(1, steer));
        
        // Pass input to visuals
        this.steeringInput = steer;
        
        // AI Acceleration
        let throttle = 1.0;
        
        // Check angle to target for cornering speed control
        const angle = forward.angleTo(dirToTarget);
        
        // If angle is large (sharp turn), reduce throttle
        if (angle > 0.5) {
            throttle = 0.5;
        }
        
        // Apply throttle
        this.speed += this.acceleration * throttle * dt;
        
        // Cap speed
        const aiMaxSpeed = this.maxSpeed * 0.9;
        if (this.speed > aiMaxSpeed) this.speed = aiMaxSpeed;
        
        // Anti-stuck: If speed is very low (stuck offroad), boost acceleration
        if (this.speed < 10) {
            this.speed += this.acceleration * dt;
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
            emissiveIntensity: 0.5,
            roughness: 0.5,
            metalness: 0.2
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

export class Coin extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        
        // Visuals: Gold Coin
        const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        geo.rotateX(Math.PI / 2); // Stand up
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0xFFD700,
            emissiveIntensity: 0.3
        });
        this.coinMesh = new THREE.Mesh(geo, mat);
        this.mesh.add(this.coinMesh);
        
        this.baseY = y;
    }
    
    update(dt) {
        // Spin
        this.mesh.rotation.y += 3 * dt;
        // Bob
        this.mesh.position.y = this.baseY + Math.sin(gameState.elapsedTime * 4) * 0.2;
        
        // Collision with player (Distance based is sufficient for coins)
        if (gameState.player && !gameState.player.dead) {
            const dSq = this.mesh.position.distanceToSquared(gameState.player.mesh.position);
            // Player radius ~1.0, Coin radius ~0.5. Dist < 1.5. Squared < 2.25
            if (dSq < 2.5) {
                this.collect(gameState.player);
            }
        }
    }
    
    collect(player) {
        player.coins = (player.coins || 0) + 1;
        // Update score when coin is collected
        if (gameState.player === player) {
            const rankBonus = (5 - player.rank) * 1000; // 1st=4000, 4th=1000
            const coinBonus = player.coins * 100;
            gameState.score = rankBonus + coinBonus;
        }
        this.destroy();
        
        // Remove from global list
        const idx = gameState.coins.indexOf(this);
        if (idx > -1) gameState.coins.splice(idx, 1);
    }
}

export class Projectile extends Entity {
    constructor(pos, dir, owner) {
        // Fix: Ensure projectile starts above ground to prevent clipping
        super(pos.x, Math.max(pos.y, 0.5), pos.z);
        
        // Fix: Flatten direction to prevent shooting into ground if kart is tilted
        const flatDir = new THREE.Vector3(dir.x, 0, dir.z).normalize();
        this.velocity = flatDir.multiplyScalar(60); 
        
        this.owner = owner;
        this.life = 3.0; // seconds
        
        const geo = new THREE.SphereGeometry(0.5);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00, 
            emissive: 0x004400,
            roughness: 0.4,
            metalness: 0.6
        }); // Green shell
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
        
        // Fix: Snap to track height and follow track curvature
        if (gameState.track) {
            const { point, index } = gameState.track.getClosestPoint(this.mesh.position);
            
            // Prevent sinking
            const groundY = point.y + 0.5;
            if (this.mesh.position.y < groundY) {
                this.mesh.position.y = groundY;
            }
            
            // Guide along track (steer velocity towards track direction)
            const points = gameState.track.points;
            // Look ahead to find track direction
            const nextIdx = (index + 5) % points.length;
            const currentPt = points[index];
            const nextPt = points[nextIdx];
            const trackDir = new THREE.Vector3().subVectors(nextPt, currentPt).normalize();
            
            // Blend velocity towards track direction
            const speed = this.velocity.length();
            const currentDir = this.velocity.clone().normalize();
            // Lerp factor controls how strongly it follows the track
            const newDir = new THREE.Vector3().lerpVectors(currentDir, trackDir, 10 * dt).normalize();
            this.velocity = newDir.multiplyScalar(speed);
        }
        
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

export class SpeedLines {
    constructor() {
        this.mesh = new THREE.Group();
        // Attach to camera so lines move with view
        if (gameState.camera) gameState.camera.add(this.mesh);
        
        this.particles = [];
        const count = 40;
        // Thin long lines
        const geo = new THREE.BoxGeometry(0.02, 0.02, 2.0);
        const mat = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            transparent: true, 
            opacity: 0
        });
        
        for(let i=0; i<count; i++) {
            const p = new THREE.Mesh(geo, mat.clone());
            this.resetParticle(p);
            // Scatter initial Z so they don't all appear at once
            p.position.z = randomRange(-10, -50);
            this.mesh.add(p);
            this.particles.push(p);
        }
    }
    
    resetParticle(p) {
        // Position relative to camera:
        // X/Y spread, Z far in front (negative Z in camera space)
        const spreadX = 20;
        const spreadY = 15;
        p.position.set(
            randomRange(-spreadX, spreadX),
            randomRange(-spreadY, spreadY),
            randomRange(-30, -60) // Start far ahead
        );
        p.userData.speed = randomRange(40, 80); // Relative speed approaching camera
    }
    
    update(dt, playerSpeed) {
        // Intensity based on player speed (0 to 1)
        const ratio = Math.max(0, (playerSpeed - 30) / 50); 
        
        this.particles.forEach(p => {
            // Fade in based on speed
            p.material.opacity = ratio * 0.4;
            
            if (ratio <= 0) return;
            
            // Move particle towards camera (positive Z in camera space)
            // Speed increases with player speed
            const moveSpeed = p.userData.speed + playerSpeed;
            p.position.z += moveSpeed * dt;
            
            // If passed camera (Z > 2), reset
            if (p.position.z > 2) {
                this.resetParticle(p);
            }
        });
    }
    
    destroy() {
        if (gameState.camera) gameState.camera.remove(this.mesh);
        this.mesh.traverse(o => {
            if (o.geometry) o.geometry.dispose();
            if (o.material) o.material.dispose();
        });
    }
}