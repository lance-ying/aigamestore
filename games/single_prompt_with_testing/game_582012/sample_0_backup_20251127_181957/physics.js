import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { checkSphereIntersection } from './utils.js';

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
                createHitParticle(attackPos);
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

function createHitParticle(pos) {
    // Simple visual effect for hit (flash)
    // Since we can't create complex particle systems easily without heavy code, 
    // we spawn a temporary mesh that fades out
    const geom = new THREE.SphereGeometry(1, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(pos);
    gameState.scene.add(mesh);
    
    // Add to entities to be updated/removed
    gameState.entities.push({
        mesh: mesh,
        life: 0.2,
        update: function(dt) {
            this.life -= dt;
            this.mesh.scale.multiplyScalar(1.1);
            this.mesh.material.opacity = this.life * 5;
            if (this.life <= 0) {
                gameState.scene.remove(this.mesh);
                return true; // remove me
            }
            return false;
        }
    });
}