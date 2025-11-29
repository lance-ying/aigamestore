import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS } from './globals.js';
import { getTerrainHeight, randomRange } from './utils.js';

// Base Physics Entity
export class Entity {
    constructor(x, y, z) {
        this.mesh = new THREE.Group();
        this.mesh.position.set(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.mass = 1.0;
        this.onGround = false;
        
        // Physics props
        this.drag = 0.98;
        this.gravityMultiplier = 1.0;
    }

    update(dt) {
        // Basic Euler integration
        if (!this.onGround) {
            this.velocity.y += gameState.gravity.y * this.gravityMultiplier * dt;
        }

        this.velocity.add(this.acceleration.clone().multiplyScalar(dt));
        this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
        
        // Reset accel
        this.acceleration.set(0, 0, 0);

        // Ground collision (Basic heightmap check)
        const terrainH = getTerrainHeight(this.mesh.position.x, this.mesh.position.z);
        if (this.mesh.position.y < terrainH) {
            this.mesh.position.y = terrainH;
            this.velocity.y = Math.max(0, this.velocity.y);
            this.onGround = true;
            
            // Apply ground friction
            this.velocity.multiplyScalar(this.drag);
        } else {
            this.onGround = false;
        }
    }
}

export class Car extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        
        // Car specs
        this.mass = 1500;
        this.maxSpeed = 70.0;
        this.accelerationPower = 60.0;
        this.turnSpeed = 2.5;
        this.drag = 0.97; // Air resistance + Rolling resistance
        this.driftFactor = 0.95; // Grip
        
        // Visuals
        this.createMesh();
        
        gameState.scene.add(this.mesh);
        
        // State
        this.heading = 0; // Radians
        this.speed = 0;
        this.inputs = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            brake: false
        };
    }

    createMesh() {
        const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 4.0);
        const bodyMat = new THREE.MeshStandardMaterial({ color: COLORS.car_paint, roughness: 0.2, metalness: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        this.mesh.add(body);

        const roofGeo = new THREE.BoxGeometry(1.6, 0.6, 2.0);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 }); // Windows dark
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 1.3;
        roof.position.z = -0.2;
        roof.castShadow = true;
        this.mesh.add(roof);
        
        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const positions = [
            [-0.9, 0.4, 1.2], [0.9, 0.4, 1.2], // Front
            [-0.9, 0.4, -1.2], [0.9, 0.4, -1.2] // Rear
        ];

        positions.forEach(pos => {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.position.set(...pos);
            w.castShadow = true;
            this.mesh.add(w);
        });
        
        // Headlights (visual)
        const lightGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
        const lightMat = new THREE.MeshStandardMaterial({ color: 0xFFFFCC, emissive: 0xFFFFCC, emissiveIntensity: 2 });
        const l1 = new THREE.Mesh(lightGeo, lightMat);
        l1.position.set(-0.6, 0.6, 2.0);
        this.mesh.add(l1);
        const l2 = l1.clone();
        l2.position.set(0.6, 0.6, 2.0);
        this.mesh.add(l2);
    }

    update(dt) {
        // Handle Input to Physics
        let accel = 0;
        if (this.inputs.forward) accel += this.accelerationPower;
        if (this.inputs.backward) accel -= this.accelerationPower;
        
        let turn = 0;
        if (this.inputs.left) turn += 1;
        if (this.inputs.right) turn -= 1;
        
        // Physics Logic
        
        // 1. Orientation
        // Only turn if moving
        if (Math.abs(this.speed) > 0.5) {
            const turnAmount = turn * this.turnSpeed * dt * (this.inputs.brake ? 1.5 : 1.0);
            // Reverse steering when going backward
            this.heading += (this.speed > 0 ? 1 : -1) * turnAmount;
        }
        
        // Update rotation
        this.mesh.rotation.set(0, this.heading, 0);
        
        // 2. Acceleration
        const forwardDir = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
        
        // Apply acceleration
        if (this.onGround) {
            this.velocity.add(forwardDir.multiplyScalar(accel * dt));
        }
        
        // 3. Friction & Drifting
        // Get velocity relative to car heading
        // localVelocity.z is forward speed, .x is slide speed
        const velClone = this.velocity.clone();
        // Simple approximation of drift:
        // If handbrake (Space) is pressed, reduce friction sideways less (slide more)
        const slideFriction = this.inputs.brake ? 0.98 : 0.85; // Low friction = slide
        
        // Apply drag
        this.velocity.multiplyScalar(this.drag);
        
        // 4. Update Position (Entity update handles integration and gravity)
        super.update(dt);
        
        // Calc speed for logic
        this.speed = this.velocity.length() * (this.velocity.dot(new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading))) > 0 ? 1 : -1);

        // Ground align (simple tilt based on terrain normal - optional polish)
        // For now, simple y-positioning in Entity class is enough for arcade feel
        
        // Log info
        if (gameState.frameCount % 60 === 0) {
           this.logStatus();
        }
    }
    
    logStatus() {
        if(window.logs) {
            window.logs.player_info.push({
                x: this.mesh.position.x,
                y: this.mesh.position.y,
                z: this.mesh.position.z,
                speed: this.speed,
                timestamp: Date.now()
            });
        }
    }
}

export class Collectible {
    constructor(x, z) {
        this.active = true;
        const y = getTerrainHeight(x, z) + 1.5;
        
        // Geometry
        const geometry = new THREE.OctahedronGeometry(0.5, 0);
        const material = new THREE.MeshStandardMaterial({ 
            color: COLORS.token,
            emissive: COLORS.token,
            emissiveIntensity: 0.5,
            metalness: 1.0,
            roughness: 0.2
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        
        // Light for effect
        this.light = new THREE.PointLight(COLORS.token, 1, 5);
        this.light.position.set(0, 0, 0);
        this.mesh.add(this.light);
        
        gameState.scene.add(this.mesh);
        
        // Animation offsets
        this.bobOffset = Math.random() * Math.PI * 2;
        this.baseY = y;
    }
    
    update(dt) {
        if (!this.active) return;
        
        // Rotate
        this.mesh.rotation.y += 2.0 * dt;
        
        // Bob
        this.mesh.position.y = this.baseY + Math.sin(gameState.frameCount * 0.05 + this.bobOffset) * 0.5;
        
        // Check collision
        if (gameState.player) {
            const dist = this.mesh.position.distanceTo(gameState.player.mesh.position);
            if (dist < 2.5) {
                this.collect();
            }
        }
    }
    
    collect() {
        this.active = false;
        this.mesh.visible = false;
        gameState.scene.remove(this.mesh); // Better cleanup
        gameState.score += 1000;
        gameState.tokensCollected++;
        gameState.player.maxSpeed += 2.0; // Upgrade car slightly!
        
        // check win
        if (gameState.tokensCollected >= gameState.totalTokens) {
            // Trigger win
             gameState.gamePhase = "GAME_OVER_WIN";
        }
    }
}

export class Prop {
    constructor(x, z, type) {
        const y = getTerrainHeight(x, z);
        this.mesh = new THREE.Group();
        this.mesh.position.set(x, y, z);
        
        if (type === 'cactus') {
            const mat = new THREE.MeshStandardMaterial({ color: 0x2E8B57, roughness: 0.8 });
            const trunk = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 2, 4, 8), mat);
            trunk.position.y = 1;
            this.mesh.add(trunk);
            
            const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1, 4, 8), mat);
            arm.position.set(0.4, 1.5, 0);
            arm.rotation.z = -Math.PI / 3;
            this.mesh.add(arm);
        } else if (type === 'rock') {
            const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
            const geo = new THREE.DodecahedronGeometry(randomRange(0.5, 1.5), 0);
            const rock = new THREE.Mesh(geo, mat);
            rock.position.y = 0.5;
            rock.scale.set(1, 0.7, 1);
            this.mesh.add(rock);
        } else if (type === 'palm') {
             const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
             const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 6), trunkMat);
             trunk.position.y = 1.5;
             this.mesh.add(trunk);
             
             const leafMat = new THREE.MeshStandardMaterial({ color: 0x006400, side: THREE.DoubleSide });
             const leafGeo = new THREE.ConeGeometry(1.5, 0.5, 5, 1, true);
             const leaves = new THREE.Mesh(leafGeo, leafMat);
             leaves.position.y = 3;
             this.mesh.add(leaves);
        }
        
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        gameState.scene.add(this.mesh);
        
        // Add physics collision bounds (simple radius check later)
        this.radius = 1.0;
        this.active = true;
    }
}