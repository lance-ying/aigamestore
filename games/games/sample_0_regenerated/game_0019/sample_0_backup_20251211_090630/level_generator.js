import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS, GAME_CONSTANTS, COLOR_KEYS } from './globals.js';
import { randomChoice, randomRange, randomInt, getRoadCurve, getRoadDerivative } from './utils.js';
import { BallObstacle, Ramp, RoadSegment } from './entities.js';

export function initLevel() {
    gameState.spawnZ = 0;
    gameState.roadSegments = [];
    
    // Create initial safe road
    for(let i=0; i<10; i++) {
        spawnSegment(false);
    }
}

export function updateLevelGeneration() {
    // Keep spawning road ahead of player
    // Player moves in -Z direction
    const playerZ = gameState.player ? gameState.player.mesh.position.z : 0;
    const viewDist = GAME_CONSTANTS.VIEW_DISTANCE;
    
    // While spawn point is within view distance
    while (gameState.spawnZ > playerZ - viewDist) {
        spawnSegment(true);
    }
    
    // Cleanup old segments
    for (let i = gameState.roadSegments.length - 1; i >= 0; i--) {
        const seg = gameState.roadSegments[i];
        if (seg.mesh.position.z > playerZ + 20) { // If behind player
            seg.dispose();
            gameState.roadSegments.splice(i, 1);
        }
    }
}

function spawnSegment(spawnObjects) {
    const length = gameState.segmentLength;
    const z = gameState.spawnZ;
    
    // Calculate curve position
    const x = getRoadCurve(z - length/2); // Center of segment
    const rot = Math.atan(getRoadDerivative(z - length/2));
    
    const segment = new RoadSegment(z, length, x, rot);
    gameState.roadSegments.push(segment);
    
    if (spawnObjects) {
        const type = randomChoice(['BALLS', 'BALLS', 'RAMP', 'EMPTY']);
        
        // Don't spawn ramp too close to last one
        if (type === 'RAMP' && Math.abs(z - gameState.lastRampZ) < 50) {
            spawnBalls(z); // Fallback
        } else if (type === 'RAMP') {
            spawnRamp(z);
        } else if (type === 'BALLS') {
            spawnBalls(z);
        }
    }
    
    gameState.spawnZ -= length;
}

function spawnBalls(z) {
    const laneWidth = GAME_CONSTANTS.LANE_WIDTH;
    const lanes = [-laneWidth, 0, laneWidth];
    
    // Determine pattern
    const pattern = Math.random();
    const playerColor = gameState.player ? gameState.player.colorName : 'RED';
    
    // Calculate road offset for this Z
    const roadX = getRoadCurve(z);
    
    if (pattern < 0.7) {
        // Standard: One matching, others random wrong
        const correctLane = randomChoice(lanes);
        
        lanes.forEach(laneOffset => {
            let color;
            if (laneOffset === correctLane) {
                color = playerColor;
            } else {
                // Pick a wrong color
                const wrongColors = COLOR_KEYS.filter(c => c !== playerColor);
                color = randomChoice(wrongColors);
            }
            const ball = new BallObstacle(roadX + laneOffset, z, color);
            gameState.obstacles.push(ball);
        });
    } else {
        // Line of matching balls
        const laneOffset = randomChoice(lanes);
        // Spawn 3 balls in a line
        for(let i=0; i<3; i++) {
            const ballZ = z - i*3;
            const ballX = getRoadCurve(ballZ) + laneOffset;
            const ball = new BallObstacle(ballX, ballZ, playerColor);
            gameState.obstacles.push(ball);
        }
    }
}

function spawnRamp(z) {
    const laneWidth = GAME_CONSTANTS.LANE_WIDTH;
    const lanes = [-laneWidth, 0, laneWidth];
    const laneOffset = randomChoice(lanes);
    
    // Pick a new color for the ramp
    const playerColor = gameState.player ? gameState.player.colorName : 'RED';
    const newColors = COLOR_KEYS.filter(c => c !== playerColor);
    const nextColor = randomChoice(newColors);
    
    const roadX = getRoadCurve(z);
    
    const ramp = new Ramp(roadX + laneOffset, z, nextColor);
    gameState.ramps.push(ramp);
    gameState.lastRampZ = z;
    
    // Spawn balls matching NEW color after the ramp
    for(let i=1; i<=5; i++) {
        const ballZ = z - 20 - i*4;
        const ballX = getRoadCurve(ballZ) + laneOffset;
        const ball = new BallObstacle(ballX, ballZ, nextColor);
        gameState.obstacles.push(ball);
    }
}