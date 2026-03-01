import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CONSTANTS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { gameRNG, hslToHex } from './utils.js';

export class Entity {
    constructor() {
        this.mesh = null;
        this.active = true;
    }

    update(dt) {}
    
    destroy() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        if (this.mesh) {
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(m => m.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
        }
        this.active = false;
    }
}

export class Ball extends Entity {
    constructor() {
        super();
        const geometry = new THREE.SphereGeometry(CONSTANTS.BALL_RADIUS, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: CONSTANTS.COLORS.BALL,
            roughness: 0.1,
            metalness: 0.1,
            emissive: 0x330011
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.set(0, 5, CONSTANTS.BALL_DISTANCE); // Start slightly above
        
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = false;
        this.squashFactor = 1.0;
        
        gameState.scene.add(this.mesh);
        
        // Trail effect variables
        this.trailPositions = [];
        this.trailTimer = 0;
    }

    update(dt) {
        // Physics integration
        this.velocity.y += CONSTANTS.GRAVITY;
        if (this.velocity.y < CONSTANTS.TERMINAL_VELOCITY) {
            this.velocity.y = CONSTANTS.TERMINAL_VELOCITY;
        }

        this.mesh.position.y += this.velocity.y;
        
        // Squash and stretch animation
        if (Math.abs(this.velocity.y) > 0.1) {
            const stretch = 1 + Math.abs(this.velocity.y) * 0.5;
            this.mesh.scale.set(1/Math.sqrt(stretch), stretch, 1/Math.sqrt(stretch));
        } else {
            // Lerp back to 1
            this.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2);
        }

        // Trail Logic (Visual only)
        this.updateTrail(dt);
        
        // Update Logs
        this.logInfo();
    }
    
    bounce() {
        this.velocity.y = CONSTANTS.BOUNCE_FORCE;
        this.onGround = false;
        
        // Squash effect on bounce
        this.mesh.scale.set(1.4, 0.6, 1.4);
        
        // Spawn particles
        this.createSplash(this.mesh.position.clone());
    }
    
    createSplash(pos) {
        for(let i=0; i<8; i++) {
            gameState.particles.push(new Particle(pos, 0xFFFFFF));
        }
    }
    
    updateTrail(dt) {
        // Simple trail implementation could be done here, 
        // but for performance in this scope, we keep it simple.
    }

    logInfo() {
        if (window.logs && window.logs.player_info) {
            const screenPos = this.mesh.position.clone().project(gameState.camera);
            window.logs.player_info.push({
                screen_x: (screenPos.x + 1) * CANVAS_WIDTH / 2,
                screen_y: (1 - screenPos.y) * CANVAS_HEIGHT / 2,
                game_x: this.mesh.position.x,
                game_y: this.mesh.position.y,
                game_z: this.mesh.position.z,
                velocity_y: this.velocity.y,
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    }
}

export class Particle extends Entity {
    constructor(position, color) {
        super();
        const geometry = new THREE.PlaneGeometry(0.2, 0.2);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.position.y -= CONSTANTS.BALL_RADIUS; // Spawn at contact point
        this.mesh.rotation.x = -Math.PI / 2; // Flat on ground
        
        // Random spread
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.05 + 0.02;
        this.velocity = new THREE.Vector3(Math.cos(angle) * speed, 0, Math.sin(angle) * speed);
        
        this.life = 1.0;
        
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        this.life -= dt * 2.0; // Decay speed
        this.mesh.position.add(this.velocity);
        this.mesh.scale.multiplyScalar(0.95);
        this.mesh.material.opacity = this.life;
        
        if (this.life <= 0) {
            this.destroy();
        }
    }
}

export class Tower extends Entity {
    constructor() {
        super();
        // Central Pillar
        const height = CONSTANTS.LEVEL_COUNT * CONSTANTS.PLATFORM_GAP + 20;
        const geometry = new THREE.CylinderGeometry(CONSTANTS.TOWER_RADIUS, CONSTANTS.TOWER_RADIUS, height, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: CONSTANTS.COLORS.TOWER,
            roughness: 0.5 
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = -height / 2 + 10; // Top near origin
        this.mesh.receiveShadow = true;
        
        gameState.scene.add(this.mesh);
        
        // Rotation container for platforms
        this.container = new THREE.Group();
        gameState.scene.add(this.container);
        
        // Generate Levels
        this.generateLevels();
    }
    
    generateLevels() {
        // Base hue for colors
        let hue = gameRNG.float();
        
        for (let i = 0; i < CONSTANTS.LEVEL_COUNT; i++) {
            const y = -i * CONSTANTS.PLATFORM_GAP;
            
            // Difficulty scaling
            const difficulty = i / CONSTANTS.LEVEL_COUNT;
            const gapSize = Math.max(Math.PI / 4, (Math.PI / 2) * (1 - difficulty * 0.5)); // Gaps get slightly smaller
            const numTraps = i === 0 ? 0 : Math.floor(difficulty * 3) + 1;
            
            // Color variation per 5 levels
            if (i % 5 === 0) hue = (hue + 0.1) % 1.0;
            const levelColor = hslToHex(hue, 0.7, 0.5);
            
            const platform = new Platform(y, gapSize, numTraps, levelColor);
            this.container.add(platform.mesh);
            platform.parentGroup = this.container; // Reference for logic
            gameState.platforms.push(platform);
            
            // Final platform (Goal)
            if (i === CONSTANTS.LEVEL_COUNT - 1) {
                // Add a "floor" platform at the very bottom
                const floor = new Platform(y - CONSTANTS.PLATFORM_GAP, 0, 0, 0x00FF00); // No gap, green
                floor.isGoal = true;
                this.container.add(floor.mesh);
                gameState.platforms.push(floor);
            }
        }
    }
    
    update(dt) {
        // Smooth rotation
        gameState.towerRotation = THREE.MathUtils.lerp(gameState.towerRotation, gameState.targetRotation, 0.15);
        this.container.rotation.y = gameState.towerRotation;
        this.mesh.rotation.y = gameState.towerRotation;
    }
}

export class Platform extends Entity {
    constructor(y, gapSize, numTraps, color) {
        super();
        this.y = y;
        this.gapSize = gapSize;
        this.isGoal = false;
        
        // Define sectors
        // 0 angle is facing +Z (towards camera initially, but camera is at +Z looking -Z)
        // We generate sectors based on angle logic.
        // Full circle is 0 to 2PI.
        
        // Randomize gap position
        this.gapAngle = gameRNG.range(0, Math.PI * 2);
        
        this.mesh = new THREE.Group();
        this.mesh.position.y = y;
        
        // Visual Geometry Construction
        // We create arc segments.
        const thickness = CONSTANTS.PLATFORM_HEIGHT;
        const innerRadius = CONSTANTS.TOWER_RADIUS;
        const outerRadius = CONSTANTS.TOWER_RADIUS + CONSTANTS.PLATFORM_WIDTH;
        
        // Safe Sector Material
        const safeMat = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.3 
        });
        
        // Trap Material
        const trapMat = new THREE.MeshStandardMaterial({ 
            color: CONSTANTS.COLORS.PLATFORM_TRAP,
            emissive: 0x550000,
            roughness: 0.3
        });
        
        // Generate logic for segments
        // The circle is split into the gap and the rest.
        // The rest is split into safe and trap zones.
        
        // Gap is from [gapAngle - gapSize/2] to [gapAngle + gapSize/2]
        // Effectively we render the complement of the gap.
        
        const startDraw = this.gapAngle + gapSize / 2;
        const endDraw = this.gapAngle - gapSize / 2 + Math.PI * 2; // Wrap around to draw full circle minus gap
        
        const totalArc = Math.PI * 2 - gapSize;
        
        // Add Traps
        // We insert trap sectors randomly within the solid arc
        const sectors = [];
        
        // Simple approach: Divide totalArc into chunks
        // If numTraps > 0, replace some chunks with traps
        const segmentCount = 12; // resolution of logic
        const segmentArc = totalArc / segmentCount;
        
        let currentAngle = startDraw;
        
        for (let i = 0; i < segmentCount; i++) {
            const isTrap = numTraps > 0 && gameRNG.bool(0.2 + (numTraps * 0.05)); // Probability based on trap count
            
            // Create arc geometry
            const shape = new THREE.Shape();
            shape.absarc(0, 0, outerRadius, 0, segmentArc, false);
            shape.absarc(0, 0, innerRadius, segmentArc, 0, true);
            
            const extrudeSettings = { depth: thickness, bevelEnabled: false, curveSegments: 8 };
            const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            
            // Fix orientation
            // Rotate X by 90 deg: +Y (2D) -> +Z (3D).
            // Extrusion goes from Z=0 to Z=thickness, which becomes Y=0 to Y=-thickness.
            geo.rotateX(Math.PI / 2); 
            
            const mat = isTrap ? trapMat : safeMat;
            const mesh = new THREE.Mesh(geo, mat);
            
            // Position and Rotate the segment
            // Physics Angle increases Clockwise (X -> Z).
            // Three.js Rotation Y increases Counter-Clockwise (X -> -Z).
            // To align them, we negate the visual rotation.
            mesh.rotation.y = -currentAngle;
            
            // Center Y
            // Geometry ranges from Y=0 to Y=-thickness.
            // To center at 0, we shift up by thickness/2.
            mesh.position.y = thickness / 2; 
            
            mesh.userData = { isTrap: isTrap, start: currentAngle, end: currentAngle + segmentArc };
            
            this.mesh.add(mesh);
            sectors.push({ start: currentAngle, end: currentAngle + segmentArc, isTrap: isTrap });
            
            currentAngle += segmentArc;
        }
        
        this.sectors = sectors;
        this.castShadow = true;
        this.receiveShadow = true;
    }
}