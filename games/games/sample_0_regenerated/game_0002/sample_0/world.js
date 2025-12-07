import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, LANE_WIDTH } from './globals.js';
import { createStoneTexture, random, randomRange, randomInt, randomChoice } from './utils.js';
import { Collectible, Obstacle } from './entities.js';

const SEGMENT_LENGTH = 20;
const RENDER_DISTANCE = 200; // units
const DESPAWN_DISTANCE = 20;

let stoneTexture;

export function initWorld() {
    stoneTexture = createStoneTexture();
    
    // Initial safe path
    for (let i = 0; i < 5; i++) {
        createPathSegment(-i * SEGMENT_LENGTH, 'straight');
    }
}

export function updateWorld(playerZ) {
    // Determine the Z coordinate we need to have generated up to
    const targetZ = playerZ - RENDER_DISTANCE;
    
    // Get last segment Z
    let lastZ = 0;
    if (gameState.pathSegments.length > 0) {
        lastZ = gameState.pathSegments[gameState.pathSegments.length - 1].zEnd;
    }

    // Generate new segments
    while (lastZ > targetZ) {
        const nextZ = lastZ;
        const type = chooseSegmentType();
        createPathSegment(nextZ, type);
        lastZ -= SEGMENT_LENGTH;
    }

    // Despawn old segments
    const despawnZ = playerZ + DESPAWN_DISTANCE;
    gameState.pathSegments = gameState.pathSegments.filter(seg => {
        if (seg.zStart > despawnZ) {
            // Remove mesh from scene
            gameState.scene.remove(seg.mesh);
            seg.mesh.geometry.dispose();
            return false;
        }
        return true;
    });

    // Despawn old obstacles and coins
    gameState.obstacles = gameState.obstacles.filter(obs => {
        if (obs.mesh.position.z > despawnZ) {
            gameState.scene.remove(obs.mesh);
            return false;
        }
        return true;
    });

    gameState.collectibles = gameState.collectibles.filter(coin => {
        if (coin.mesh.position.z > despawnZ) {
            gameState.scene.remove(coin.mesh);
            return false;
        }
        return true;
    });
}

function chooseSegmentType() {
    const r = random();
    if (r < 0.7) return 'straight';
    if (r < 0.8) return 'gap'; // 10% chance of gap
    return 'straight'; // More complex logic handled by placing obstacles on straight segments
}

function createPathSegment(zStart, type) {
    const zEnd = zStart - SEGMENT_LENGTH;
    
    // Create Ground Mesh
    if (type !== 'gap') {
        const geometry = new THREE.BoxGeometry(LANE_WIDTH * 3 + 2, 1, SEGMENT_LENGTH);
        const material = new THREE.MeshStandardMaterial({ 
            map: stoneTexture,
            roughness: 0.8 
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, -0.5, zStart - SEGMENT_LENGTH/2);
        mesh.receiveShadow = true;
        gameState.scene.add(mesh);
        
        gameState.pathSegments.push({ mesh, zStart, zEnd, type });
        
        // Populate Segment
        populateSegment(zStart, zEnd);
    } else {
        // Gap - no floor, maybe some debris or pillars below
        gameState.pathSegments.push({ mesh: new THREE.Mesh(), zStart, zEnd, type: 'gap' }); // dummy mesh for tracking
    }
}

function populateSegment(zStart, zEnd) {
    // Chance to spawn obstacles
    if (Math.abs(zStart) < 50) return; // No obstacles at start

    const numSlices = 2; // Potential spots per segment
    const sliceLen = SEGMENT_LENGTH / numSlices;

    for (let i = 0; i < numSlices; i++) {
        const z = zStart - (i * sliceLen) - (sliceLen/2);
        
        if (random() < 0.6) { // 60% chance of something
            const rowType = randomChoice(['coins', 'obstacle']);
            
            if (rowType === 'coins') {
                const lane = randomChoice([-1, 0, 1]);
                const coin = new Collectible(lane * LANE_WIDTH, 1, z);
                gameState.collectibles.push(coin);
            } else {
                spawnObstacleRow(z);
            }
        }
    }
}

function spawnObstacleRow(z) {
    const pattern = randomInt(0, 3);
    // 0: Center obstacle
    // 1: Side obstacles
    // 2: Full block except one lane
    // 3: Jump/Duck challenge
    
    const obsType = randomChoice(['low', 'high', 'full']);
    
    if (pattern === 0) {
        gameState.obstacles.push(new Obstacle(0, 0, z, obsType));
    } else if (pattern === 1) {
        gameState.obstacles.push(new Obstacle(-LANE_WIDTH, 0, z, obsType));
        gameState.obstacles.push(new Obstacle(LANE_WIDTH, 0, z, obsType));
    } else if (pattern === 2) {
        const safeLane = randomChoice([-1, 0, 1]);
        if (safeLane !== -1) gameState.obstacles.push(new Obstacle(-LANE_WIDTH, 0, z, 'full'));
        if (safeLane !== 0) gameState.obstacles.push(new Obstacle(0, 0, z, 'full'));
        if (safeLane !== 1) gameState.obstacles.push(new Obstacle(LANE_WIDTH, 0, z, 'full'));
    } else {
        // All lanes same obstacle
        gameState.obstacles.push(new Obstacle(-LANE_WIDTH, 0, z, obsType));
        gameState.obstacles.push(new Obstacle(0, 0, z, obsType));
        gameState.obstacles.push(new Obstacle(LANE_WIDTH, 0, z, obsType));
    }
}