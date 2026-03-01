import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS } from './globals.js';
import { PhysicsBody, getTerrainHeight, getWaterLevel } from './physics.js';
import { input } from './input.js';
import { FishingSystem } from './fishing.js';

export class Player {
    constructor(x, y, z) {
        // Simple Body
        const group = new THREE.Group();
        
        // Torso
        const torsoGeo = new THREE.BoxGeometry(0.8, 1.0, 0.5);
        const torsoMat = new THREE.MeshLambertMaterial({ color: COLORS.PLAYER });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 0.5;
        torso.castShadow = true;
        group.add(torso);
        
        // Head
        const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.3;
        group.add(head);
        
        // Hat (Cone)
        const hatGeo = new THREE.ConeGeometry(0.5, 0.6, 16);
        const hatMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const hat = new THREE.Mesh(hatGeo, hatMat);
        hat.position.y = 1.7;
        group.add(hat);
        
        // Fishing Rod (Visual)
        const rodGeo = new THREE.CylinderGeometry(0.02, 0.04, 2.5);
        const rodMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const rod = new THREE.Mesh(rodGeo, rodMat);
        rod.position.set(0.5, 1.2, 0.5); // Hold in "hand"
        rod.rotation.x = Math.PI / 3; // Angle forward
        rod.rotation.z = -Math.PI / 8; // Angle slightly out
        rod.castShadow = true;
        group.add(rod);
        this.rodMesh = rod;

        // Rod Tip Helper (for line attachment)
        const tipGeo = new THREE.BoxGeometry(0.01, 0.01, 0.01);
        const tip = new THREE.Mesh(tipGeo, new THREE.MeshBasicMaterial({ visible: false }));
        tip.position.set(0, 1.25, 0); // Top of rod
        rod.add(tip);
        this.rodTip = tip;
        
        group.position.set(x, y, z);
        gameState.scene.add(group);
        
        this.mesh = group;
        this.physics = new PhysicsBody(group, { mass: 1.0, drag: 0.2, radius: 0.5 });
        
        this.moveSpeed = 0.2;
        this.rotSpeed = 0.1;
        this.jumpForce = 0.4;
        
        // Systems
        this.fishing = new FishingSystem(this);
        gameState.fishingSystem = this.fishing;
        
        // Animation
        this.bobTime = 0;
    }
    
    getRodTipWorldPosition() {
        const pos = new THREE.Vector3();
        if (this.rodTip) {
            this.rodTip.getWorldPosition(pos);
        } else {
            this.mesh.getWorldPosition(pos);
            pos.y += 2;
        }
        return pos;
    }
    
    update(deltaTime) {
        // Fishing Update
        this.fishing.update(deltaTime);
        
        // Movement blocked while fishing (except idle)
        if (this.fishing.isActive && this.fishing.state !== 'IDLE') {
            this.physics.velocity.x = 0;
            this.physics.velocity.z = 0;
            this.physics.update(deltaTime);
            return; // No movement control
        }
        
        // Input Movement
        const moveDir = new THREE.Vector3(0, 0, 0);
        let moved = false;
        
        // Relative to camera/view
        const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(gameState.camera.quaternion);
        camForward.y = 0;
        camForward.normalize();
        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(gameState.camera.quaternion);
        camRight.y = 0;
        camRight.normalize();
        
        if (input.isDown('UP')) {
            moveDir.add(camForward);
            moved = true;
        }
        if (input.isDown('DOWN')) {
            moveDir.add(camForward.clone().negate());
            moved = true;
        }
        if (input.isDown('LEFT')) {
            moveDir.add(camRight.clone().negate());
            moved = true;
        }
        if (input.isDown('RIGHT')) {
            moveDir.add(camRight);
            moved = true;
        }
        
        if (moved) {
            moveDir.normalize();
            
            // Sprint
            const speed = input.isDown('SPRINT') ? this.moveSpeed * 1.8 : this.moveSpeed;
            
            // Apply acceleration
            this.physics.applyForce(moveDir.multiplyScalar(speed * 10 * deltaTime));
            
            // Rotate to face movement
            const angle = Math.atan2(moveDir.x, moveDir.z);
            const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            this.mesh.quaternion.slerp(targetQuat, 0.2);
            
            // Bobbing animation
            this.bobTime += deltaTime * 10;
            this.mesh.children[0].position.y = 0.5 + Math.sin(this.bobTime) * 0.05;
        } else {
            // Idle anim
            this.mesh.children[0].position.y = 0.5;
        }
        
        // Jump
        if (input.justPressed('JUMP') && this.physics.onGround) {
            this.physics.velocity.y = this.jumpForce;
            this.physics.onGround = false;
        }
        
        // Fishing Trigger
        if (input.justPressed('ACTION') && this.fishing.state === 'IDLE' && this.physics.onGround) {
            // Check if facing water
            // Simple check: Is water level nearby?
            const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
            const checkPos = this.mesh.position.clone().add(fwd.multiplyScalar(2));
            const wL = getWaterLevel(checkPos.x, checkPos.z);
            const tH = getTerrainHeight(checkPos.x, checkPos.z);
            
            if (tH < wL) {
                this.fishing.startCasting();
            } else {
                // Feedback?
                gameState.chatLog.push({sender: "You", message: "Can't fish here (too far from water).", color: '#ccc'});
            }
        }
        
        // Update Physics
        this.physics.update(deltaTime);
        
        // Bounds check (respawn if fell off world)
        if (this.mesh.position.y < -10) {
            this.mesh.position.set(0, 5, 0);
            this.physics.velocity.set(0,0,0);
        }
    }
}

export class NPC {
    constructor(x, z, color) {
        this.group = new THREE.Group();
        
        const mat = new THREE.MeshLambertMaterial({ color: color });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.5), mat);
        body.position.y = 0.5;
        this.group.add(body);
        
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshLambertMaterial({color: 0xFFCCAA}));
        head.position.y = 1.3;
        this.group.add(head);
        
        this.group.position.set(x, getTerrainHeight(x, z), z);
        gameState.scene.add(this.group);
        
        this.physics = new PhysicsBody(this.group, { mass: 1.0 });
        this.timer = 0;
        this.action = 'IDLE'; // IDLE, WALK
        this.targetPos = new THREE.Vector3();
        
        this.chatLines = [
            "Nice weather!", "Caught anything?", "I love this island.",
            "My rod is broken...", "Have you seen the Glitch Fish?",
            "WebFishing is fun!", "Zzz...", "Anyone want to trade?"
        ];
        this.chatTimer = Math.random() * 20;
    }
    
    update(deltaTime) {
        this.timer -= deltaTime;
        
        // AI Logic
        if (this.timer <= 0) {
            if (Math.random() > 0.5) {
                this.action = 'WALK';
                this.timer = 2 + Math.random() * 3;
                // Random wander target
                const angle = Math.random() * Math.PI * 2;
                this.targetPos.set(
                    this.group.position.x + Math.cos(angle) * 5,
                    0,
                    this.group.position.z + Math.sin(angle) * 5
                );
            } else {
                this.action = 'IDLE';
                this.timer = 2 + Math.random() * 3;
            }
        }
        
        if (this.action === 'WALK') {
            const dir = new THREE.Vector3().subVectors(this.targetPos, this.group.position);
            dir.y = 0;
            if (dir.length() > 0.5) {
                dir.normalize();
                this.physics.applyForce(dir.multiplyScalar(0.5 * deltaTime));
                
                const angle = Math.atan2(dir.x, dir.z);
                this.group.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), angle), 0.1);
            } else {
                this.action = 'IDLE';
            }
        }
        
        // Chat Logic
        this.chatTimer -= deltaTime;
        if (this.chatTimer <= 0) {
            this.chatTimer = 15 + Math.random() * 20;
            const msg = this.chatLines[Math.floor(Math.random() * this.chatLines.length)];
            gameState.chatLog.push({
                sender: "Friend",
                message: msg,
                color: '#aaaaff'
            });
        }
        
        this.physics.update(deltaTime);
    }
}