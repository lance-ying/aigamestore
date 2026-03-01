import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS } from './globals.js';
import { updatePhysics } from './physics.js';
import { dist, clamp } from './utils.js';

// Base Entity
class Entity {
    constructor(x, y, z) {
        this.mesh = new THREE.Group();
        this.mesh.position.set(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.radius = 0.5;
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        updatePhysics(this, dt);
    }
}

// The Horrible Goose
export class Goose extends Entity {
    constructor(x, z) {
        super(x, 0, z);
        this.radius = 0.8;
        this.moveSpeed = 15;
        this.runSpeed = 25;
        this.turnSpeed = 10;
        this.isHonking = false;
        this.honkTimer = 0;
        this.holdingItem = null;
        this.animationTime = 0;
        this.score = 0;

        // Build Goose Model
        this.buildModel();
        
        // State
        this.facing = 0; // angle
    }

    buildModel() {
        const bodyGeo = new THREE.SphereGeometry(0.7, 16, 16);
        bodyGeo.scale(1, 0.7, 1.4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: COLORS.GOOSE_WHITE });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.position.y = 0.7;
        this.body.castShadow = true;
        this.mesh.add(this.body);

        const neckGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.2, 12);
        this.neck = new THREE.Mesh(neckGeo, bodyMat);
        this.neck.position.set(0, 1.3, 0.8);
        this.neck.rotation.x = -Math.PI / 6;
        this.neck.castShadow = true;
        this.mesh.add(this.neck);

        const headGeo = new THREE.SphereGeometry(0.35, 12, 12);
        this.head = new THREE.Mesh(headGeo, bodyMat);
        this.head.position.set(0, 0.7, 0); // Relative to neck
        this.neck.add(this.head);

        const beakGeo = new THREE.ConeGeometry(0.15, 0.5, 12);
        const beakMat = new THREE.MeshStandardMaterial({ color: COLORS.GOOSE_BEAK });
        this.beak = new THREE.Mesh(beakGeo, beakMat);
        this.beak.rotation.x = -Math.PI / 2;
        this.beak.position.set(0, 0, 0.35);
        this.head.add(this.beak);

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
        const legMat = new THREE.MeshStandardMaterial({ color: COLORS.GOOSE_BEAK });
        
        this.legL = new THREE.Mesh(legGeo, legMat);
        this.legL.position.set(-0.3, 0.3, 0);
        this.mesh.add(this.legL);

        this.legR = new THREE.Mesh(legGeo, legMat);
        this.legR.position.set(0.3, 0.3, 0);
        this.mesh.add(this.legR);
        
        // Honk Visual
        const ringGeo = new THREE.RingGeometry(0.5, 0.7, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0, side: THREE.DoubleSide });
        this.honkRing = new THREE.Mesh(ringGeo, ringMat);
        this.honkRing.rotation.x = -Math.PI/2;
        this.honkRing.position.y = 2;
        this.mesh.add(this.honkRing);
    }

    update(dt) {
        super.update(dt); // Physics
        this.handleInput(dt);
        this.animate(dt);
        
        // Removed test logging for player position
    }

    handleInput(dt) {
        if (gameState.gamePhase !== "PLAYING") return;
        
        const k = gameState.keys;
        let speed = k.Shift ? this.runSpeed : this.moveSpeed;

        // Camera Basis Vectors (Isometric View)
        // Camera is at (+20, +30, +20) looking at (0,0,0)
        // Forward on screen (Up key) corresponds to moving away from camera: (-1, 0, -1)
        // Right on screen (Right key) corresponds to moving right relative to view
        
        const fwd = new THREE.Vector3(-1, 0, -1).normalize();
        // Fixed: Correct right vector for iso view (was inverted)
        const right = new THREE.Vector3(1, 0, -1).normalize();
        
        const moveDir = new THREE.Vector3(0, 0, 0);

        if (k.ArrowUp || k.w) moveDir.add(fwd);
        if (k.ArrowDown || k.s) moveDir.sub(fwd);
        if (k.ArrowLeft || k.a) moveDir.sub(right);
        if (k.ArrowRight || k.d) moveDir.add(right);

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            // Fix: Do not multiply by dt here. Velocity is units/second.
            this.velocity.x = moveDir.x * speed;
            this.velocity.z = moveDir.z * speed;
            
            // Rotation
            const targetAngle = Math.atan2(moveDir.x, moveDir.z);
            // Smooth rotation
            let angleDiff = targetAngle - this.mesh.rotation.y;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.mesh.rotation.y += angleDiff * this.turnSpeed * dt;
            
            this.isMoving = true;
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
            this.isMoving = false;
        }

        // Actions
        // Honk
        if (k[" "] && !this.isHonking) {
            this.honk();
            gameState.keys[" "] = false; // consume key
        }
        
        // Interact
        if (k.z) {
            this.interact();
            gameState.keys.z = false; // consume
        }
    }

    honk() {
        this.isHonking = true;
        this.honkTimer = 0.5;
        this.honkRing.material.opacity = 1;
        this.honkRing.scale.set(1, 1, 1);
        
        // Alert NPCs
        if (gameState.gardener) {
            gameState.gardener.hearHonk(this.mesh.position);
        }
    }

    interact() {
        if (this.holdingItem) {
            // Drop
            this.holdingItem.drop();
            this.holdingItem = null;
        } else {
            // Try grab
            // Find nearest grabbable item in front of goose
            let bestItem = null;
            let minDist = 2.0;
            
            const goosePos = this.mesh.position;
            const gooseDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);

            for (const item of gameState.entities) {
                if (!item.isGrabbable) continue;
                
                const d = item.mesh.position.distanceTo(goosePos);
                if (d < minDist) {
                    // Check angle (must be roughly in front)
                    const toItem = item.mesh.position.clone().sub(goosePos).normalize();
                    const dot = gooseDir.dot(toItem);
                    if (dot > 0.5) { // Within ~60 degrees
                        minDist = d;
                        bestItem = item;
                    }
                }
            }
            
            if (bestItem) {
                bestItem.grab(this);
                this.holdingItem = bestItem;
            }
        }
    }

    animate(dt) {
        // Honk Animation
        if (this.honkTimer > 0) {
            this.honkTimer -= dt;
            const s = 1 + (0.5 - this.honkTimer) * 4;
            this.honkRing.scale.set(s, s, s);
            this.honkRing.material.opacity = this.honkTimer * 2;
            
            // Open beak
            this.beak.rotation.x = -Math.PI / 2 - 0.3;
        } else {
            this.isHonking = false;
            this.honkRing.material.opacity = 0;
            this.beak.rotation.x = -Math.PI / 2;
        }

        // Walk Animation
        if (this.isMoving) {
            this.animationTime += dt * 10;
            const waddle = Math.sin(this.animationTime) * 0.1;
            this.body.rotation.z = waddle;
            this.neck.rotation.z = -waddle; // Stabilize head
            
            // Legs
            this.legL.rotation.x = Math.sin(this.animationTime) * 0.5;
            this.legR.rotation.x = Math.sin(this.animationTime + Math.PI) * 0.5;
        } else {
            // Reset pose
            this.body.rotation.z = 0;
            this.neck.rotation.z = 0;
            this.legL.rotation.x = 0;
            this.legR.rotation.x = 0;
        }
    }
}

// Interactive Items (Rake, Radio, etc.)
export class Item extends Entity {
    constructor(name, x, z, color, type = "box") {
        super(x, 1, z);
        this.name = name;
        this.color = color;
        this.isGrabbable = true;
        this.originalPos = new THREE.Vector3(x, 1, z);
        
        // Visuals
        // Added emissive to make objects easier to see
        const mat = new THREE.MeshStandardMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.25
        });
        let geo;
        
        // Enhanced Object Generation
        this.visual = new THREE.Group();
        this.mesh.add(this.visual);

        if (name === "Apple") {
            const appleMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), mat);
            appleMesh.castShadow = true;
            this.visual.add(appleMesh);
            // Stem
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2), new THREE.MeshStandardMaterial({color: 0x3d2817}));
            stem.position.y = 0.3;
            this.visual.add(stem);
        } 
        else if (name === "Sandwich") {
            const breadMat = new THREE.MeshStandardMaterial({
                color: 0xF5DEB3,
                emissive: 0xF5DEB3,
                emissiveIntensity: 0.25
            });
            const fillMat = new THREE.MeshStandardMaterial({
                color: 0x8B4513,
                emissive: 0x8B4513,
                emissiveIntensity: 0.25
            }); // Meat/filling
            // Bottom bread
            const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), breadMat);
            b1.castShadow = true;
            this.visual.add(b1);
            // Filling
            const f = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.45), fillMat);
            f.position.y = 0.075;
            this.visual.add(f);
            // Top bread
            const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), breadMat);
            b2.position.y = 0.15;
            b2.castShadow = true;
            this.visual.add(b2);
            this.visual.rotation.y = Math.PI/4;
        }
        else if (name === "Radio") {
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.3), mat);
            box.castShadow = true;
            this.visual.add(box);
            // Antenna
            const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6), new THREE.MeshStandardMaterial({color: 0x888888}));
            ant.position.set(0.25, 0.4, 0);
            this.visual.add(ant);
            // Speaker grill
            const grill = new THREE.Mesh(new THREE.CircleGeometry(0.15), new THREE.MeshStandardMaterial({color: 0x111111}));
            grill.position.set(0, 0, 0.16);
            this.visual.add(grill);
        }
        else if (name === "Thermos") {
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.6), mat);
            body.castShadow = true;
            this.visual.add(body);
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.15), new THREE.MeshStandardMaterial({color: 0x222222}));
            cap.position.y = 0.35;
            this.visual.add(cap);
        }
        else if (type === "long") { // Rake
            geo = new THREE.BoxGeometry(0.1, 0.1, 1.5);
            const handle = new THREE.Mesh(geo, mat);
            handle.castShadow = true;
            this.visual.add(handle);
            
            const headGeo = new THREE.BoxGeometry(0.8, 0.1, 0.2);
            const head = new THREE.Mesh(headGeo, mat);
            head.position.z = 0.7;
            head.castShadow = true;
            this.visual.add(head);
            
            // Tines
            for(let i=-3; i<=3; i++) {
                 const tine = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), mat);
                 tine.position.set(i*0.1, -0.1, 0.7);
                 tine.castShadow = true;
                 this.visual.add(tine);
            }
        }
        else {
            // Default fallback
            if (type === "sphere") geo = new THREE.SphereGeometry(0.3, 8, 8);
            else geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const m = new THREE.Mesh(geo, mat);
            m.castShadow = true;
            this.visual.add(m);
        }

        // Scale up for better visibility
        this.visual.scale.set(1.4, 1.4, 1.4);
    }

    grab(goose) {
        // Parent to goose beak
        this.isHeld = true;
        // We need to attach to the beak bone effectively
        gameState.scene.remove(this.mesh);
        goose.beak.add(this.mesh);
        this.mesh.position.set(0, 0, 0.5); // Tip of beak
        this.mesh.rotation.set(0, 0, 0);
    }

    drop() {
        this.isHeld = false;
        
        // Convert local position to world
        const worldPos = new THREE.Vector3();
        this.mesh.getWorldPosition(worldPos);
        const worldRot = new THREE.Quaternion();
        this.mesh.getWorldQuaternion(worldRot);

        // Remove from beak
        this.mesh.parent.remove(this.mesh);
        
        // Add back to scene
        gameState.scene.add(this.mesh);
        this.mesh.position.copy(worldPos);
        this.mesh.quaternion.copy(worldRot);
        this.mesh.rotation.setFromQuaternion(worldRot); // Reset euler
    }

    update(dt) {
        if (!this.isHeld) {
            super.update(dt);
        }
    }
}

// The Gardener NPC
export class Gardener extends Entity {
    constructor(x, z) {
        super(x, 0, z);
        this.moveSpeed = 4.5; // Slower than goose run, faster than walk
        this.state = "IDLE"; // IDLE, PATROL, CHASE, STARTLED, RETURNING
        this.radius = 0.8;
        
        this.waypoints = [
            new THREE.Vector3(5, 0, 5),
            new THREE.Vector3(5, 0, -5),
            new THREE.Vector3(-5, 0, -5),
            new THREE.Vector3(-5, 0, 5)
        ];
        this.currentWaypoint = 0;
        this.target = null;
        this.startledTimer = 0;
        
        this.buildModel();
    }

    buildModel() {
        // Simple human shape
        const mat = new THREE.MeshStandardMaterial({ color: COLORS.GARDENER_SHIRT });
        
        // Body
        this.body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.5), mat);
        this.body.position.y = 1.5;
        this.body.castShadow = true;
        this.mesh.add(this.body);
        
        // Head
        this.head = new THREE.Mesh(new THREE.SphereGeometry(0.4), new THREE.MeshStandardMaterial({ color: 0xFFDBAC })); // Skin
        this.head.position.y = 1.0;
        this.body.add(this.head);
        
        // Hat
        const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1), new THREE.MeshStandardMaterial({ color: COLORS.GARDENER_HAT }));
        hat.position.y = 0.3;
        this.head.add(hat);
        const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: COLORS.GARDENER_HAT }));
        hatTop.position.y = 0.2;
        hat.add(hatTop);

        // Arms (simple)
        this.armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), mat);
        this.armL.position.set(-0.6, 0, 0);
        this.body.add(this.armL);
        
        this.armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), mat);
        this.armR.position.set(0.6, 0, 0);
        this.body.add(this.armR);
    }

    update(dt) {
        super.update(dt);
        this.updateAI(dt);
        this.animate(dt);
    }

    updateAI(dt) {
        const playerPos = gameState.player.mesh.position;
        const distToPlayer = dist(this.mesh.position, playerPos);
        
        // Vision check
        let canSeePlayer = false;
        if (distToPlayer < 12) {
            // Check angle
            const toPlayer = playerPos.clone().sub(this.mesh.position).normalize();
            const facing = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
            if (facing.dot(toPlayer) > 0.5) { // 60 deg cone
                canSeePlayer = true;
            }
        }

        // State Machine
        switch (this.state) {
            case "IDLE":
                if (canSeePlayer && gameState.player.holdingItem) {
                    this.state = "CHASE";
                } else {
                    this.state = "PATROL";
                }
                break;
                
            case "PATROL":
                if (canSeePlayer && gameState.player.holdingItem) {
                    this.state = "CHASE";
                    break;
                }
                
                // Move to waypoint
                const wp = this.waypoints[this.currentWaypoint];
                this.moveTo(wp, dt);
                if (dist(this.mesh.position, wp) < 1) {
                    this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
                    this.state = "IDLE"; // Brief pause?
                }
                break;
                
            case "CHASE":
                this.moveTo(playerPos, dt, 1.2); // Faster
                
                // Catch Logic
                if (distToPlayer < 1.5) {
                    // Caught!
                    // Force drop
                    if (gameState.player.holdingItem) {
                        gameState.player.interact(); // Drop
                    }
                    this.state = "IDLE"; // Reset
                }
                
                // Lose sight
                if (distToPlayer > 15) {
                    this.state = "IDLE";
                }
                break;
                
            case "STARTLED":
                this.startledTimer -= dt;
                this.velocity.set(0, 0, 0); // Stop
                // Jitter
                this.mesh.rotation.y += Math.sin(gameState.frameCount * 0.5) * 0.1;
                
                if (this.startledTimer <= 0) {
                    this.state = "CHASE"; // Get angry
                }
                break;
        }
    }

    moveTo(target, dt, speedMult = 1.0) {
        const dir = target.clone().sub(this.mesh.position);
        dir.y = 0;
        if (dir.lengthSq() > 0.1) {
            dir.normalize();
            // Fix: Velocity is units/second. Do not multiply by dt here.
            this.velocity.x = dir.x * this.moveSpeed * speedMult;
            this.velocity.z = dir.z * this.moveSpeed * speedMult;
            
            // Rotate towards
            const targetAngle = Math.atan2(dir.x, dir.z);
            let angleDiff = targetAngle - this.mesh.rotation.y;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.mesh.rotation.y += angleDiff * 5 * dt;
        } else {
            this.velocity.set(0, 0, 0);
        }
    }

    hearHonk(sourcePos) {
        if (dist(this.mesh.position, sourcePos) < 10) {
            this.state = "STARTLED";
            this.startledTimer = 2.0;
            // Look at sound
            const dx = sourcePos.x - this.mesh.position.x;
            const dz = sourcePos.z - this.mesh.position.z;
            this.mesh.rotation.y = Math.atan2(dx, dz);
        }
    }
    
    animate(dt) {
        if (this.velocity.lengthSq() > 0.1) {
            // Swing arms
            const t = gameState.frameCount * 0.2;
            this.armL.rotation.x = Math.sin(t);
            this.armR.rotation.x = -Math.sin(t);
        }
    }
}

// Static Prop (Tree, Fence)
export class StaticProp {
    constructor(x, z, type) {
        this.position = new THREE.Vector3(x, 0, z);
        this.type = type;
        this.radius = 0.5;
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        gameState.scene.add(this.mesh);
        
        if (type === "tree") {
            this.radius = 1.0;
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.7, 3),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 })
            );
            trunk.position.y = 1.5;
            trunk.castShadow = true;
            this.mesh.add(trunk);
            
            const leaves = new THREE.Mesh(
                new THREE.DodecahedronGeometry(2),
                new THREE.MeshStandardMaterial({ color: 0x228B22 })
            );
            leaves.position.y = 4;
            leaves.castShadow = true;
            this.mesh.add(leaves);
        } else if (type === "fence") {
            const post = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 1.5, 0.2),
                new THREE.MeshStandardMaterial({ color: COLORS.FENCE })
            );
            post.position.y = 0.75;
            post.castShadow = true;
            this.mesh.add(post);
            // Crossbars implied by placement in rows
        }
    }
}