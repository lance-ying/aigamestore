import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS, GAME_CONSTANTS, COLOR_KEYS } from './globals.js';
import { createBallTexture, getColorValue, getRoadCurve, getRoadDerivative } from './utils.js';

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
        this.targetX = 0; // Relative lane position (offset from road center)
        this.currentLaneX = 0; // Smoothed relative position
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.groundY = GAME_CONSTANTS.BALL_RADIUS;
    }
    
    update(dt) {
        // Lateral Movement (Smoothing) - Lerp the lane offset, not world X
        const lerpFactor = 10.0 * dt;
        this.currentLaneX += (this.targetX - this.currentLaneX) * lerpFactor;
        
        // Forward Movement
        this.mesh.position.z -= gameState.speed * dt;
        
        // Calculate World X based on Curve + Lane Offset
        const roadCenterX = getRoadCurve(this.mesh.position.z);
        this.mesh.position.x = roadCenterX + this.currentLaneX;
        
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
        const tilt = (this.targetX - this.currentLaneX) * 0.5;
        // Also align with road bank (derivative)
        const roadBank = -getRoadDerivative(this.mesh.position.z) * 0.5;
        this.mesh.rotation.z = -tilt + roadBank;
        
        // Align mesh Y rotation with road curve
        this.mesh.rotation.y = Math.atan(getRoadDerivative(this.mesh.position.z));
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
        
        // Orient ramp
        this.mesh.rotation.y = Math.PI; // Face towards positive Z
        this.mesh.position.set(x, 0, z);
        
        // Align with road rotation
        const rot = Math.atan(getRoadDerivative(z));
        this.mesh.rotation.y += rot;
        
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        gameState.scene.add(this.mesh);
    }
}

/**
 * Road Segment (Visual)
 */
export class RoadSegment extends Entity {
    constructor(z, length, xOffset, rotationY) {
        super();
        // Add slight overlap to prevent gaps on curves
        const drawLength = length + 0.2;
        const geometry = new THREE.PlaneGeometry(GAME_CONSTANTS.LANE_WIDTH * 3 + 4, drawLength);
        const material = new THREE.MeshStandardMaterial({
            color: COLORS.ROAD,
            roughness: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position and Rotate
        this.mesh.position.set(xOffset, -0.05, z - length/2);
        this.mesh.rotation.x = -Math.PI / 2;
        
        // Apply curve rotation around Y (which is Z in local plane space before X rotation)
        // Since we rotated X by -90, local Y is World Z, local Z is World Y.
        // Actually easier to rotate container or use order.
        this.mesh.rotation.set(-Math.PI/2, 0, rotationY); // Z rotation here acts as World Y rotation due to X flip
        
        this.mesh.receiveShadow = true;
        
        gameState.scene.add(this.mesh);
        
        // Add stripes
        const stripeGeo = new THREE.PlaneGeometry(0.2, drawLength);
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
 * Speed Effect (Speedlines)
 */
export class SpeedEffect extends Entity {
    constructor() {
        super();
        const count = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        for(let i=0; i<count; i++) {
            // Random positions in a tunnel around 0,0
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 10;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius + 5; // Offset up
            const z = (Math.random() - 0.5) * 100;
            
            // Line segment
            positions.push(x, y, z);
            positions.push(x, y, z - 5); // Length 5
            
            colors.push(1, 1, 1);
            colors.push(0, 0, 0); // Fade tail
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.5
        });
        
        this.mesh = new THREE.LineSegments(geometry, material);
        this.mesh.frustumCulled = false;
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        if (!gameState.player) return;
        
        // Keep effect centered on camera/player Z
        const camZ = gameState.camera.position.z;
        this.mesh.position.z = camZ - 20;
        this.mesh.position.x = gameState.camera.position.x;
        
        // Animate lines to look like they are rushing past
        const positions = this.mesh.geometry.attributes.position.array;
        const speed = gameState.speed * 1.5; // Faster than player for effect
        
        for(let i=0; i<positions.length; i+=6) {
            // Move Z (index 2 and 5)
            positions[i+2] += speed * dt;
            positions[i+5] += speed * dt;
            
            // Wrap around
            if (positions[i+2] > 20) {
                const len = positions[i+2] - positions[i+5];
                positions[i+2] = -80;
                positions[i+5] = -80 - len;
            }
        }
        this.mesh.geometry.attributes.position.needsUpdate = true;
        
        // Scale opacity with speed
        this.mesh.material.opacity = Math.min(0.8, (gameState.speed - 20) / 40);
        this.mesh.visible = gameState.speed > 20;
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