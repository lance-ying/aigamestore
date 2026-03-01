import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, TEAMS } from './globals.js';
import { Projectile, Particle } from './entities.js';
import { raycast } from './physics.js';
import { randomRange } from './utils.js';

export const WEAPON_TYPES = {
    SCATTERGUN: {
        name: "Scattergun",
        damage: 10,
        pellets: 6,
        spread: 0.1,
        fireRate: 40, // Frames between shots
        range: 15,
        type: "HITSCAN",
        color: 0xffff00
    },
    ROCKET_LAUNCHER: {
        name: "Rocket Launcher",
        damage: 60,
        speed: 0.8,
        fireRate: 50,
        radius: 4,
        type: "PROJECTILE",
        color: 0xffaa00
    },
    MINIGUN: {
        name: "Sasha",
        damage: 8,
        fireRate: 5,
        spread: 0.05,
        range: 40,
        type: "HITSCAN",
        color: 0xffffff
    }
};

export function fireWeapon(user, weaponType, targetDirection) {
    if (user.cooldown > 0) return;
    
    user.cooldown = weaponType.fireRate;
    
    // Muzzle position (slightly in front of user)
    const muzzlePos = user.mesh.position.clone();
    muzzlePos.y += 0.5; // Eye level
    muzzlePos.add(targetDirection.clone().multiplyScalar(1.0));

    if (weaponType.type === "HITSCAN") {
        const potentialTargets = gameState.entities.filter(e => e !== user && e.team !== user.team);
        // Also walls
        const obstacles = gameState.walls;
        
        const count = weaponType.pellets || 1;
        
        for (let i = 0; i < count; i++) {
            // Apply spread
            const spreadDir = targetDirection.clone();
            spreadDir.x += randomRange(-weaponType.spread, weaponType.spread);
            spreadDir.y += randomRange(-weaponType.spread, weaponType.spread);
            spreadDir.z += randomRange(-weaponType.spread, weaponType.spread);
            
            // Raycast against all hittables
            const hittables = [...potentialTargets, ...obstacles];
            const hit = raycast(muzzlePos, spreadDir, hittables, weaponType.range);
            
            // Visual trace
            createTracer(muzzlePos, spreadDir, hit ? hit.distance : weaponType.range);
            
            if (hit) {
                // Find entity belonging to mesh
                const entity = gameState.entities.find(e => e.mesh === hit.object);
                if (entity && typeof entity.takeDamage === 'function') {
                    entity.takeDamage(weaponType.damage);
                    createImpactParticle(hit.point, 0xff0000);
                } else {
                    createImpactParticle(hit.point, 0xcccccc);
                }
            }
        }
        
    } else if (weaponType.type === "PROJECTILE") {
        const projectile = new Projectile(
            muzzlePos,
            targetDirection,
            weaponType.speed,
            weaponType.damage,
            user.team,
            weaponType.radius
        );
        gameState.projectiles.push(projectile);
    }
}

function createTracer(start, direction, length) {
    const end = start.clone().add(direction.normalize().multiplyScalar(length));
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 });
    const line = new THREE.Line(geometry, material);
    gameState.scene.add(line);
    
    // Quick fade out
    gameState.particles.push({
        mesh: line,
        life: 10,
        update: function() {
            this.life--;
            this.mesh.material.opacity = this.life / 20;
            if (this.life <= 0) {
                gameState.scene.remove(this.mesh);
                return false; // remove
            }
            return true; // keep
        }
    });
}

function createImpactParticle(pos, color) {
    const p = new Particle(pos.x, pos.y, pos.z, color, 0.3);
    gameState.particles.push(p);
}