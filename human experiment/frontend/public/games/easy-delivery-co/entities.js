import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { updateCarPhysics } from './physics.js';
import { createBuildingTexture } from './utils.js';

// Base Entity Class
class Entity {
    constructor() {
        this.mesh = null;
        this.velocity = new THREE.Vector3();
        this.rotationAngle = 0;
        this.markedForDeletion = false;
    }

    update(dt) {}
}

// Player Vehicle Class
export class Car extends Entity {
    constructor(x, y, z) {
        super();
        this.forwardSpeed = 0;
        this.onGround = false;
        
        // Visuals
        this.mesh = new THREE.Group();
        
        // Chassis
        const chassisGeo = new THREE.BoxGeometry(1.8, 1, 3.5);
        const chassisMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.6 }); // Red Kei truck
        this.chassis = new THREE.Mesh(chassisGeo, chassisMat);
        this.chassis.position.y = 0.8;
        this.chassis.castShadow = true;
        this.mesh.add(this.chassis);
        
        // Cabin
        const cabinGeo = new THREE.BoxGeometry(1.7, 1.2, 1.5);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee }); // White cabin top
        this.cabin = new THREE.Mesh(cabinGeo, cabinMat);
        this.cabin.position.set(0, 1.6, -0.8);
        this.cabin.castShadow = true;
        this.mesh.add(this.cabin);
        
        // Headlights
        const lightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        const leftLight = new THREE.Mesh(lightGeo, lightMat);
        leftLight.position.set(-0.6, 1.0, -1.8);
        this.mesh.add(leftLight);
        
        const rightLight = new THREE.Mesh(lightGeo, lightMat);
        rightLight.position.set(0.6, 1.0, -1.8);
        this.mesh.add(rightLight);
        
        // Wheels
        this.wheels = [];
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        
        const positions = [
            [-0.9, 0.4, -1.2], // FL
            [0.9, 0.4, -1.2],  // FR
            [-0.9, 0.4, 1.2],  // RL
            [0.9, 0.4, 1.2]    // RR
        ];
        
        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(...pos);
            wheel.castShadow = true;
            this.mesh.add(wheel);
            this.wheels.push(wheel);
        });

        // Actual 3D spotlight for night driving
        this.spotlight = new THREE.SpotLight(0xffffee, 2, 40, Math.PI / 4, 0.5, 1);
        this.spotlight.position.set(0, 2, -1.5);
        this.spotlight.target.position.set(0, 0, -10);
        this.mesh.add(this.spotlight);
        this.mesh.add(this.spotlight.target);

        this.mesh.position.set(x, y, z);
        gameState.scene.add(this.mesh);
    }

    update(dt, inputs) {
        updateCarPhysics(this, inputs, dt);
        
        // Animate wheels
        if (Math.abs(this.forwardSpeed) > 0.1) {
            const rot = this.forwardSpeed * dt;
            this.wheels.forEach(w => w.rotation.x += rot);
        }
        
        // Animate steering visual
        const steerAngle = inputs.left ? 0.3 : (inputs.right ? -0.3 : 0);
        // Front wheels only
        this.wheels[0].rotation.y = steerAngle;
        this.wheels[1].rotation.y = steerAngle;
    }
}

// Building Class
export class Building extends Entity {
    constructor(x, z, width, depth, height, type = "house") {
        super();
        const geometry = new THREE.BoxGeometry(width, height, depth);
        
        // Generate procedural texture based on building type
        const color = type === "store" ? "#8d6e63" : (type === "industrial" ? "#546e7a" : "#a1887f");
        const texture = createBuildingTexture(color);
        
        const material = new THREE.MeshStandardMaterial({ 
            map: texture,
            roughness: 0.8 
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, height/2, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        this.collider = new THREE.Box3().setFromObject(this.mesh);
        
        // Add name label for specific buildings
        if (type === "depot") {
            this.name = "Central Depot";
        }
        
        gameState.scene.add(this.mesh);
    }
}

// Interactable Zone (Pickup / Delivery)
export class InteractableZone extends Entity {
    constructor(x, z, type, name) {
        super();
        this.type = type; // 'PICKUP' or 'DELIVER'
        this.name = name;
        this.active = false;
        
        // Visual marker - A glowing cylinder
        const geometry = new THREE.CylinderGeometry(2, 2, 0.2, 16);
        const color = type === 'PICKUP' ? 0x00ff00 : 0x0000ff;
        const material = new THREE.MeshBasicMaterial({ 
            color: color, 
            transparent: true, 
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, 0.1, z);
        
        // Floating icon
        const iconGeo = new THREE.OctahedronGeometry(0.5);
        const iconMat = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
        this.icon = new THREE.Mesh(iconGeo, iconMat);
        this.icon.position.set(0, 2, 0);
        this.mesh.add(this.icon);
        
        // Light column
        this.light = new THREE.PointLight(color, 0, 5);
        this.light.position.set(0, 1, 0);
        this.mesh.add(this.light);
        
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        // Pulse effect
        this.icon.rotation.y += dt;
        this.icon.position.y = 2 + Math.sin(gameState.frameCount * 0.05) * 0.5;
        
        // Only show if relevant
        const isRelevant = 
            (this.type === 'PICKUP' && !gameState.hasPackage) ||
            (this.type === 'DELIVER' && gameState.hasPackage && gameState.currentObjective.name === this.name);
            
        this.setActive(isRelevant);
        
        if (this.active) {
            this.mesh.visible = true;
            this.light.intensity = 1.0;
        } else {
            this.mesh.visible = false;
            this.light.intensity = 0;
        }
    }
    
    setActive(bool) {
        this.active = bool;
    }
    
    checkInteraction(playerMesh) {
        if (!this.active) return false;
        
        const dist = playerMesh.position.distanceTo(this.mesh.position);
        return dist < 4.0; // Interaction radius
    }
}

// Mystery Entity (The Watchers)
export class Watcher extends Entity {
    constructor(x, z) {
        super();
        // Simple dark figure
        const geo = new THREE.CapsuleGeometry(0.4, 1.5, 4, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.set(x, 1, z);
        
        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.05);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.15, 0.5, 0.3);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.15, 0.5, 0.3);
        this.mesh.add(leftEye);
        this.mesh.add(rightEye);
        
        this.mesh.lookAt(0, 1, 0); // Look at center roughly
        this.visibleTime = 0;
        this.mesh.visible = false;
        
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        // Logic handled by mystery system mostly, but can have idle anim
        if (this.mesh.visible) {
            // Always face player
            if (gameState.player) {
                this.mesh.lookAt(gameState.player.mesh.position);
            }
        }
    }
}