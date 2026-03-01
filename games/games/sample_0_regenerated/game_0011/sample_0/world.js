import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, LANE_WIDTH, LANE_COUNT, SEGMENT_LENGTH, VISIBILITY_DISTANCE } from './globals.js';
import { random, randomChoice, randomInt } from './utils.js';
import { Coin, Obstacle } from './entities.js';

export function initWorld() {
    // Initial floor
    spawnSegment(0);
    spawnSegment(-SEGMENT_LENGTH);
    
    // Pre-spawn segments
    for (let z = -SEGMENT_LENGTH * 2; z > -VISIBILITY_DISTANCE; z -= SEGMENT_LENGTH) {
        spawnSegment(z);
    }
}

export function updateWorld() {
    // Generate new segments ahead of player
    const playerZ = gameState.player ? gameState.player.mesh.position.z : 0;
    const spawnZ = Math.floor((playerZ - VISIBILITY_DISTANCE) / SEGMENT_LENGTH) * SEGMENT_LENGTH;
    
    // Check if we need to spawn a new segment
    const lastSegment = gameState.segments[gameState.segments.length - 1];
    if (!lastSegment || lastSegment.z > spawnZ) {
        spawnSegment(spawnZ);
    }

    // Cleanup old segments
    const cleanupZ = playerZ + SEGMENT_LENGTH * 2;
    gameState.segments = gameState.segments.filter(seg => {
        if (seg.z > cleanupZ) {
            destroySegment(seg);
            return false;
        }
        return true;
    });

    // Clean entities (coins, obstacles)
    gameState.obstacles = gameState.obstacles.filter(obs => {
        if (obs.mesh.position.z > cleanupZ) {
            gameState.scene.remove(obs.mesh);
            return false;
        }
        obs.update();
        return true;
    });

    gameState.coins = gameState.coins.filter(coin => {
        if (coin.mesh.position.z > cleanupZ) {
            gameState.scene.remove(coin.mesh);
            return false;
        }
        coin.update(gameState.deltaTime);
        return true;
    });
}

function spawnSegment(z) {
    const group = new THREE.Group();
    
    // Floor
    const floorGeo = new THREE.BoxGeometry(LANE_WIDTH * LANE_COUNT + 1, 1, SEGMENT_LENGTH);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x555555,
        roughness: 0.8,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    group.add(floor);
    
    // Sides (Jungle/Wall illusion)
    const wallGeo = new THREE.BoxGeometry(1, 4, SEGMENT_LENGTH);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x334433 });
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-(LANE_WIDTH * LANE_COUNT / 2 + 1), 1.5, 0);
    group.add(leftWall);
    
    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set((LANE_WIDTH * LANE_COUNT / 2 + 1), 1.5, 0);
    group.add(rightWall);

    group.position.z = z;
    gameState.scene.add(group);
    
    gameState.segments.push({ mesh: group, z: z });

    // Populate with obstacles and coins (skip first few segments for safety)
    if (z < -30) {
        populateSegment(z);
    }
}

function destroySegment(seg) {
    gameState.scene.remove(seg.mesh);
    // Geometry disposal handles by three.js GC mostly, but for large apps manual dispose is better.
    // Keeping simple for this scope.
}

function populateSegment(z) {
    // Chance to spawn row of coins
    if (random() < 0.3) {
        const lane = randomInt(0, 2);
        for (let i = 0; i < 3; i++) {
            const coin = new Coin(
                (lane - 1) * LANE_WIDTH,
                1.0,
                z - (SEGMENT_LENGTH/2) + i * 2
            );
            gameState.coins.push(coin);
        }
    }

    // Chance to spawn obstacle
    if (random() < 0.6) {
        // Pick random lane
        const lane = randomInt(0, 2);
        const x = (lane - 1) * LANE_WIDTH;
        const obstacleType = randomChoice(['WALL', 'BEAM', 'PIT']);
        
        // Ensure not impossible (don't block all lanes at same Z in future advanced logic)
        // For now, simple single lane obstacles
        
        const obs = new Obstacle(obstacleType, x, z);
        gameState.obstacles.push(obs);

        // Fill other lanes with coins?
        const otherLane = (lane + 1) % 3;
        const coin = new Coin((otherLane - 1) * LANE_WIDTH, 1.0, z);
        gameState.coins.push(coin);
    }
}