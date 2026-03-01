import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS, GAME_CONSTANTS, COLOR_KEYS } from './globals.js';
import { createBallTexture, getColorValue } from './utils.js';

// Shared geometries and materials to optimize performance
const ballGeometry = new THREE.SphereGeometry(GAME_CONSTANTS.BALL_RADIUS, 32, 32);
const ballTexture = createBallTexture();

/**
 * Base Entity Class
 */
class Entity {
    constructor() {
        this.mesh = null;
        this.active = true;
    }
    
    update(dt) {}
    
    dispose() {
        if (this.mesh) {
            gameState.scene.remove(this.mesh);
            if(this.mesh.geometry) this.mesh.geometry.dispose();
            // Don't dispose shared materials/textures aggressively
        }
        this.active = false;
    }
}

/**
 * Player Class
 */
export class Player extends Entity {
    constructor() {
        super();
        this.colorName = 'RED'; // Start color
        
        const material = new THREE.MeshStandardMaterial({
            color: COLORS[this.colorName],
            roughness: 0.1,
            metalness: 0.2,
            map: ballTexture
        });
        
        this.mesh = new THREE.Mesh(ballGeometry, material);
        this.mesh.position.set(0, GAME_CONSTANTS.BALL_RADIUS, 0);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        gameState.scene.add(this.mesh);
        
        // Physics
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.targetX = 0; // Where the player wants to be (lane control)
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.groundY = GAME_CONSTANTS.BALL_RADIUS;
    }
    
    update(dt) {
        // Lateral Movement (Smoothing)
        const lerpFactor = 10.0 * dt;
        this.mesh.position.x += (this.targetX - this.mesh.position.x) * lerpFactor;
        
        // Forward Movement
        this.mesh.position.z -= gameState.speed * dt;
        
        // Vertical Physics (Gravity)
        if (this.isJumping || this.mesh.position.y > this.groundY) {
            this.jumpVelocity += gameState.gravity * dt;
            this.mesh.position.y += this.jumpVelocity * dt;
            
            // Ground collision
            if (this.mesh.position.y <= this.groundY) {
                this.mesh.position.y = this.groundY;
                this.jumpVelocity = 0;
                this.isJumping = false;
            }
        }
        
        // Rotation (Rolling effect)
        // Circumference = 2 * PI * r. Rotation = distance / r
        const rotationSpeed = gameState.speed * dt / GAME_CONSTANTS.PLAYER_RADIUS;
        this.mesh.rotateX(-rotationSpeed);
        
        // Tilt based on lateral movement
        const tilt = (this.targetX - this.mesh.position.x) * 0.5;
        this.mesh.rotation.z = -tilt;
    }
    
    setColor(colorName) {
        this.colorName = colorName;
        this.mesh.material.color.setHex(COLORS[colorName]);
        // Emit particles or effect here
    }
    
    jump(force) {
        this.isJumping = true;
        this.jumpVelocity = force;
    }
}

/**
 * Ball Obstacle / Collectible
 */
export class BallObstacle extends Entity {
    constructor(x, z, colorName) {
        super();
        this.colorName = colorName;
        
        const material = new THREE.MeshStandardMaterial({
            color: COLORS[colorName],
            roughness: 0.4,
            metalness: 0.1,
            map: ballTexture
        });
        
        this.mesh = new THREE.Mesh(ballGeometry, material);
        this.mesh.position.set(x, GAME_CONSTANTS.BALL_RADIUS, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        // Simple idle animation
        // this.mesh.scale.setScalar(1.0 + Math.sin(gameState.frameCount * 0.1) * 0.05);
    }
}

/**
 * Color Ramp
 */
export class Ramp extends Entity {
    constructor(x, z, colorName) {
        super();
        this.colorName = colorName;
        
        const width = GAME_CONSTANTS.LANE_WIDTH * 0.9;
        const length = GAME_CONSTANTS.RAMP_LENGTH;
        const height = GAME_CONSTANTS.RAMP_HEIGHT;
        
        // Wedge shape
        const shape = new THREE.Shape();
        shape.moveTo(-width/2, 0);
        shape.lineTo(width/2, 0);
        shape.lineTo(width/2, length);
        shape.lineTo(-width/2, length);
        shape.lineTo(-width/2, 0);
        
        const extrudeSettings = {
            steps: 1,
            depth: height,
            bevelEnabled: false
        };
        
        // Custom geometry for a ramp wedge
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            // Bottom
            -width/2, 0, 0,
             width/2, 0, 0,
            -width/2, 0, length,
            
             width/2, 0, 0,
             width/2, 0, length,
            -width/2, 0, length,
            
            // Slope (Top)
            -width/2, 0, 0,
            -width/2, height, length,
             width/2, 0, 0,
             
             width/2, 0, 0,
            -width/2, height, length,
             width/2, height, length
             
             // Sides could be added but optimizing for camera angle
        ]);
        
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            color: COLORS[colorName],
            emissive: COLORS[colorName],
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.9
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, 0, z); // z is start of ramp
        // Flip to face player if needed, but we built it pointing +Z, player moves -Z? 
        // Let's verify coordinates. Player moves -Z. Ramp should face +Z (up slope).
        // Vertices go 0 to Length (positive). So if placed at Z, it extends to Z+Length.
        // If player coming from +Z towards -Z, ramp needs to slope up towards -Z.
        // Current geom: 0 to length (positive Z). Height is at Z=Length. 
        // So we need to rotate it 180 Y or build differently.
        
        this.mesh.rotation.y = Math.PI; // Face towards positive Z
        this.mesh.position.z = z; // Adjust position after rotation
        
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        gameState.scene.add(this.mesh);
        
        // Bounding box for logic
        this.box = new THREE.Box3().setFromObject(this.mesh);
    }
}

/**
 * Road Segment (Visual)
 */
export class RoadSegment extends Entity {
    constructor(z, length) {
        super();
        const geometry = new THREE.PlaneGeometry(GAME_CONSTANTS.LANE_WIDTH * 3 + 4, length);
        const material = new THREE.MeshStandardMaterial({
            color: COLORS.ROAD,
            roughness: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.set(0, -0.05, z - length/2); // Center of segment
        this.mesh.receiveShadow = true;
        
        gameState.scene.add(this.mesh);
        
        // Add stripes
        const stripeGeo = new THREE.PlaneGeometry(0.2, length);
        const stripeMat = new THREE.MeshBasicMaterial({ color: COLORS.ROAD_STRIPE });
        
        const leftStripe = new THREE.Mesh(stripeGeo, stripeMat);
        leftStripe.position.set(-GAME_CONSTANTS.LANE_WIDTH/2, 0.01, 0);
        this.mesh.add(leftStripe);
        
        const rightStripe = new THREE.Mesh(stripeGeo, stripeMat);
        rightStripe.position.set(GAME_CONSTANTS.LANE_WIDTH/2, 0.01, 0);
        this.mesh.add(rightStripe);
    }
}

/**
 * Particle System for explosions/collections
 */
export class ParticleSystem extends Entity {
    constructor(position, color, count = 20) {
        super();
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const velocities = [];
        
        for(let i=0; i<count; i++) {
            vertices.push(position.x, position.y, position.z);
            velocities.push(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10 + 5, // Upward bias
                (Math.random() - 0.5) * 10
            );
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.3,
            transparent: true
        });
        
        this.mesh = new THREE.Points(geometry, material);
        this.velocities = velocities;
        this.age = 0;
        this.maxAge = 1.0;
        
        gameState.scene.add(this.mesh);
        gameState.particles.push(this);
    }
    
    update(dt) {
        this.age += dt;
        if (this.age >= this.maxAge) {
            this.dispose();
            return;
        }
        
        const positions = this.mesh.geometry.attributes.position.array;
        
        for(let i=0; i<positions.length; i+=3) {
            // Update pos
            positions[i] += this.velocities[i] * dt;
            positions[i+1] += this.velocities[i+1] * dt;
            positions[i+2] += this.velocities[i+2] * dt;
            
            // Gravity
            this.velocities[i+1] += gameState.gravity * dt;
        }
        
        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.mesh.material.opacity = 1.0 - (this.age / this.maxAge);
    }
    
    dispose() {
        super.dispose();
        const idx = gameState.particles.indexOf(this);
        if(idx > -1) gameState.particles.splice(idx, 1);
    }
}