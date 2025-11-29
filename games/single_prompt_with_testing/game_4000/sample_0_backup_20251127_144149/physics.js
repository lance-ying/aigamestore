// physics.js - Physics and collision handling
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function updatePhysics(deltaTime) {
    // Update player physics
    if (gameState.player) {
        gameState.player.update(deltaTime);
        checkPlayerCollisions();
        checkPortalTeleportation();
    }
    
    // Update portals
    if (gameState.bluePortal) {
        gameState.bluePortal.update(deltaTime);
    }
    if (gameState.orangePortal) {
        gameState.orangePortal.update(deltaTime);
    }
    
    // Update collectibles
    gameState.collectibles.forEach(item => item.update(deltaTime));
    
    // Update exit door
    if (gameState.exitDoor) {
        gameState.exitDoor.update(deltaTime);
    }
}

export function checkPlayerCollisions() {
    if (!gameState.player) return;
    
    const player = gameState.player;
    player.setOnGround(false);
    
    // Check collision with each platform
    for (const platform of gameState.platforms) {
        const bounds = platform.getBounds();
        const playerPos = player.mesh.position;
        const playerRadius = player.radius;
        const playerHalfHeight = player.height / 2;
        
        // Check if player is within platform bounds (expanded by player radius)
        if (playerPos.x + playerRadius > bounds.min.x &&
            playerPos.x - playerRadius < bounds.max.x &&
            playerPos.z + playerRadius > bounds.min.z &&
            playerPos.z - playerRadius < bounds.max.z) {
            
            // Check vertical collision (ground)
            const playerBottom = playerPos.y - playerHalfHeight;
            const platformTop = bounds.max.y;
            
            if (playerBottom <= platformTop && playerBottom >= bounds.min.y - 0.5) {
                player.mesh.position.y = platformTop + playerHalfHeight;
                player.velocity.y = Math.max(0, player.velocity.y);
                player.setOnGround(true);
            }
            
            // Check ceiling collision
            const playerTop = playerPos.y + playerHalfHeight;
            const platformBottom = bounds.min.y;
            
            if (playerTop >= platformBottom && playerTop <= bounds.max.y + 0.5 && player.velocity.y > 0) {
                player.mesh.position.y = platformBottom - playerHalfHeight;
                player.velocity.y = 0;
            }
        }
        
        // Check horizontal collisions (walls) - improved to prevent tunneling
        if (playerPos.y - playerHalfHeight < bounds.max.y &&
            playerPos.y + playerHalfHeight > bounds.min.y) {
            
            // X-axis collision
            if (playerPos.z + playerRadius > bounds.min.z &&
                playerPos.z - playerRadius < bounds.max.z) {
                
                // Left wall collision
                if (playerPos.x - playerRadius < bounds.max.x &&
                    playerPos.x > bounds.max.x) {
                    const overlap = bounds.max.x - (playerPos.x - playerRadius);
                    if (overlap > 0 && overlap < playerRadius) {
                        player.mesh.position.x = bounds.max.x + playerRadius;
                        player.velocity.x = Math.max(0, player.velocity.x);
                    }
                }
                // Right wall collision
                else if (playerPos.x + playerRadius > bounds.min.x &&
                         playerPos.x < bounds.min.x) {
                    const overlap = (playerPos.x + playerRadius) - bounds.min.x;
                    if (overlap > 0 && overlap < playerRadius) {
                        player.mesh.position.x = bounds.min.x - playerRadius;
                        player.velocity.x = Math.min(0, player.velocity.x);
                    }
                }
            }
            
            // Z-axis collision
            if (playerPos.x + playerRadius > bounds.min.x &&
                playerPos.x - playerRadius < bounds.max.x) {
                
                // Front wall collision
                if (playerPos.z - playerRadius < bounds.max.z &&
                    playerPos.z > bounds.max.z) {
                    const overlap = bounds.max.z - (playerPos.z - playerRadius);
                    if (overlap > 0 && overlap < playerRadius) {
                        player.mesh.position.z = bounds.max.z + playerRadius;
                        player.velocity.z = Math.max(0, player.velocity.z);
                    }
                }
                // Back wall collision
                else if (playerPos.z + playerRadius > bounds.min.z &&
                         playerPos.z < bounds.min.z) {
                    const overlap = (playerPos.z + playerRadius) - bounds.min.z;
                    if (overlap > 0 && overlap < playerRadius) {
                        player.mesh.position.z = bounds.min.z - playerRadius;
                        player.velocity.z = Math.min(0, player.velocity.z);
                    }
                }
            }
        }
    }
    
    // Check if player fell off the world
    if (player.mesh.position.y < -10) {
        // Respawn player
        player.mesh.position.set(0, 2, 0);
        player.velocity.set(0, 0, 0);
    }
}

export function checkPortalTeleportation() {
    if (!gameState.player || gameState.player.justTeleported) return;
    
    const bluePortal = gameState.bluePortal;
    const orangePortal = gameState.orangePortal;
    
    // Check if both portals are active
    if (!bluePortal || !orangePortal || !bluePortal.active || !orangePortal.active) {
        return;
    }
    
    const player = gameState.player;
    const playerPos = player.mesh.position;
    
    // Check distance to blue portal
    const distToBlue = playerPos.distanceTo(bluePortal.position);
    if (distToBlue < 1.2) {
        // Check if player is moving towards portal
        const dirToBlue = new THREE.Vector3().subVectors(bluePortal.position, playerPos).normalize();
        const dot = player.velocity.clone().normalize().dot(dirToBlue);
        
        if (dot > 0.3) {
            teleportPlayer(bluePortal, orangePortal);
            return;
        }
    }
    
    // Check distance to orange portal
    const distToOrange = playerPos.distanceTo(orangePortal.position);
    if (distToOrange < 1.2) {
        // Check if player is moving towards portal
        const dirToOrange = new THREE.Vector3().subVectors(orangePortal.position, playerPos).normalize();
        const dot = player.velocity.clone().normalize().dot(dirToOrange);
        
        if (dot > 0.3) {
            teleportPlayer(orangePortal, bluePortal);
            return;
        }
    }
}

function teleportPlayer(fromPortal, toPortal) {
    const player = gameState.player;
    
    // Calculate exit position (in front of exit portal)
    const exitPos = toPortal.position.clone().add(
        toPortal.normal.clone().multiplyScalar(1.5)
    );
    
    // Transform velocity through portals
    const entryVelocity = player.velocity.clone();
    const entryNormal = fromPortal.normal.clone();
    const exitNormal = toPortal.normal.clone();
    
    // Calculate velocity relative to entry portal
    const velocityAlongNormal = entryVelocity.dot(entryNormal);
    const tangentialVelocity = entryVelocity.clone().sub(
        entryNormal.clone().multiplyScalar(velocityAlongNormal)
    );
    
    // Reflect velocity to exit portal
    const exitVelocity = exitNormal.clone().multiplyScalar(Math.abs(velocityAlongNormal))
        .add(tangentialVelocity);
    
    // Apply slight velocity boost to prevent getting stuck (but capped)
    exitVelocity.multiplyScalar(1.1);
    
    // Clamp exit velocity to reasonable limits
    const maxExitSpeed = 0.4;
    if (exitVelocity.length() > maxExitSpeed) {
        exitVelocity.normalize().multiplyScalar(maxExitSpeed);
    }
    
    // Teleport player
    player.teleport(exitPos, exitVelocity);
}

export function castRayForPortal(origin, direction) {
    const raycaster = new THREE.Raycaster(origin, direction, 0, 50);
    
    // Only check portal surfaces
    const surfaceMeshes = gameState.portalSurfaces.map(s => s.mesh);
    const intersects = raycaster.intersectObjects(surfaceMeshes);
    
    if (intersects.length > 0) {
        const hit = intersects[0];
        return {
            position: hit.point,
            normal: hit.face.normal.clone().transformDirection(hit.object.matrixWorld),
            surface: gameState.portalSurfaces.find(s => s.mesh === hit.object)
        };
    }
    
    return null;
}