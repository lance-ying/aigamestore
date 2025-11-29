import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { checkSphereIntersection } from './utils.js';
import { applyCameraShake } from './camera.js';

export function updatePhysics(deltaTime) {
    // Ground collision is handled inside entity updates usually for simple games,
    // but we can do broad phase checks here.
}

export function handleCollisions() {
    if (!gameState.player || !gameState.monster) return;

    const player = gameState.player;
    const monster = gameState.monster;

    // 1. Player Weapon vs Monster
    if (player.state === 'ATTACK' && player.isHitboxActive) {
        // Simple hitbox check: Sphere in front of player
        const attackPos = player.mesh.position.clone().add(
            player.forward.clone().multiplyScalar(2.0)
        );
        const attackRadius = 2.5;

        // Check against monster body
        if (checkSphereIntersection(attackPos, attackRadius, monster.mesh.position, monster.radius)) {
            if (!player.hasHitThisFrame) {
                monster.takeDamage(player.damage);
                player.hasHitThisFrame = true; // Prevent multi-hit per swing
                
                // Visual feedback
                createHitParticles(attackPos);
                createDamageNumber(attackPos, player.damage);
                createSlashEffect(attackPos, player.forward);
                applyCameraShake(0.3);
                
                console.log("HIT! Damage: " + player.damage + ", Monster HP: " + monster.health);
            }
        }
    }

    // 2. Monster Attack vs Player
    if (monster.state === 'ATTACK' || monster.state === 'CHARGE') {
        // Only hit if player is not dodging (invincibility frames)
        if (player.state !== 'DODGE') {
            const dist = player.mesh.position.distanceTo(monster.mesh.position);
            const hitThreshold = monster.state === 'CHARGE' ? 3.5 : 4.0; // Charge is body slam, Attack is bite/swipe

            if (dist < hitThreshold) {
                if (!monster.hasHitPlayer) {
                    player.takeDamage(monster.damage);
                    monster.hasHitPlayer = true;
                    
                    // Knockback
                    const kbDir = player.mesh.position.clone().sub(monster.mesh.position).normalize();
                    kbDir.y = 0.5; // Slight lift
                    player.velocity.add(kbDir.multiplyScalar(15));
                }
            }
        }
    }
}

function createHitParticles(pos) {
    // Create multiple particle bursts for better visibility
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const speed = 3 + Math.random() * 2;
        const velocity = new THREE.Vector3(
            Math.cos(angle) * speed,
            1 + Math.random() * 2,
            Math.sin(angle) * speed
        );
        
        const geom = new THREE.SphereGeometry(0.3, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ 
            color: 0xff4400, 
            transparent: true, 
            opacity: 1 
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.copy(pos);
        gameState.scene.add(mesh);
        
        gameState.entities.push({
            mesh: mesh,
            velocity: velocity,
            life: 0.5,
            update: function(dt) {
                this.life -= dt;
                this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
                this.velocity.y -= 9.8 * dt; // Gravity
                this.mesh.scale.multiplyScalar(0.95);
                this.mesh.material.opacity = this.life * 2;
                if (this.life <= 0) {
                    gameState.scene.remove(this.mesh);
                    return true;
                }
                return false;
            }
        });
    }
    
    // Big flash at impact point
    const geom = new THREE.SphereGeometry(2, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ 
        color: 0xffff00, 
        transparent: true, 
        opacity: 0.8 
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(pos);
    gameState.scene.add(mesh);
    
    gameState.entities.push({
        mesh: mesh,
        life: 0.15,
        update: function(dt) {
            this.life -= dt;
            this.mesh.scale.multiplyScalar(1.3);
            this.mesh.material.opacity = this.life * 5;
            if (this.life <= 0) {
                gameState.scene.remove(this.mesh);
                return true;
            }
            return false;
        }
    });
}

function createDamageNumber(pos, damage) {
    // Create a text sprite showing damage
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = damage.toString();
    ctx.strokeText(text, 64, 32);
    ctx.fillText(text, 64, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
        map: texture, 
        transparent: true,
        opacity: 1
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 1, 1);
    sprite.position.copy(pos).add(new THREE.Vector3(0, 2, 0));
    
    gameState.scene.add(sprite);
    
    gameState.entities.push({
        mesh: sprite,
        life: 1.0,
        velocity: new THREE.Vector3(0, 2, 0),
        update: function(dt) {
            this.life -= dt;
            this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
            this.velocity.y *= 0.95; // Slow down
            this.mesh.material.opacity = this.life;
            if (this.life <= 0) {
                gameState.scene.remove(this.mesh);
                return true;
            }
            return false;
        }
    });
}

function createSlashEffect(pos, forward) {
    // Create a visual slash arc
    const slashGeo = new THREE.PlaneGeometry(3, 4);
    const slashMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    const slashMesh = new THREE.Mesh(slashGeo, slashMat);
    
    // Position in front of attack
    slashMesh.position.copy(pos);
    
    // Orient towards attack direction
    const angle = Math.atan2(forward.x, forward.z);
    slashMesh.rotation.y = angle;
    
    gameState.scene.add(slashMesh);
    
    gameState.entities.push({
        mesh: slashMesh,
        life: 0.2,
        update: function(dt) {
            this.life -= dt;
            this.mesh.scale.multiplyScalar(1.1);
            this.mesh.material.opacity = this.life * 3.5;
            this.mesh.rotation.z += 10 * dt; // Spin
            if (this.life <= 0) {
                gameState.scene.remove(this.mesh);
                return true;
            }
            return false;
        }
    });
}