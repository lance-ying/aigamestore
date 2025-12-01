import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, TILE_SIZE, LANE_WIDTH } from './globals.js';
import { createStoneTexture } from './utils.js';
import { Coin, Obstacle } from './entities.js';

// Types of segments
const SEG_STRAIGHT = 0;
const SEG_TURN_LEFT = 1;
const SEG_TURN_RIGHT = 2;

class Segment {
    constructor(x, y, z, type, direction, length = 1) {
        this.type = type; // 0=straight, 1=left, 2=right
        this.direction = direction; // Vector3 direction of this segment
        this.length = length; // Number of tiles
        this.mesh = new THREE.Group();
        
        // Create floor
        const geo = new THREE.BoxGeometry(TILE_SIZE, 1, TILE_SIZE);
        const mat = new THREE.MeshStandardMaterial({ 
            map: createStoneTexture(),
            roughness: 0.8 
        });
        
        // Build the physical path
        // For a straight segment of length N
        // We actually build N individual tiles to allow fine-grained spawning
        this.tiles = [];
        
        for (let i = 0; i < length; i++) {
            const tile = new THREE.Mesh(geo, mat);
            
            // Position relative to start of segment
            // If direction is (0,0,-1) [North], tiles are at (0,0,-i*10)
            const offset = direction.clone().multiplyScalar(i * TILE_SIZE);
            tile.position.copy(offset);
            tile.position.y = -0.5; // Floor level
            tile.receiveShadow = true;
            
            this.mesh.add(tile);
            this.tiles.push({
                localPos: offset,
                worldPos: new THREE.Vector3().addVectors(new THREE.Vector3(x,y,z), offset),
                hasObstacle: false
            });
            
            // Add walls?
            // Temple Run has no walls usually, just drop offs.
        }
        
        this.mesh.position.set(x, y, z);
        gameState.scene.add(this.mesh);
        
        // Store metadata
        this.startPos = new THREE.Vector3(x,y,z);
        this.endPos = this.tiles[this.tiles.length-1].worldPos.clone().add(direction.clone().multiplyScalar(TILE_SIZE));
    }
    
    destroy() {
        gameState.scene.remove(this.mesh);
        // Clean up memory
        this.mesh.traverse(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
        });
    }
}

export class PathManager {
    constructor() {
        this.segments = [];
        this.activeCoins = [];
        this.activeObstacles = [];
        
        // Initial setup
        this.currentGenPos = new THREE.Vector3(0, 0, 0);
        this.currentDirection = new THREE.Vector3(0, 0, -1);
        
        // Build initial safe zone
        this.spawnSegment(SEG_STRAIGHT, 5);
        
        // Fill buffer
        for (let i = 0; i < 5; i++) {
            this.extendPath();
        }
    }
    
    spawnSegment(type, length) {
        const seg = new Segment(
            this.currentGenPos.x, 
            this.currentGenPos.y, 
            this.currentGenPos.z, 
            type, 
            this.currentDirection, 
            length
        );
        this.segments.push(seg);
        
        // Update generation pointer
        // For straight, we moved length * TILE_SIZE
        if (type === SEG_STRAIGHT) {
             this.currentGenPos.copy(seg.endPos);
        } else {
            // For turns, we assume the turn happens AT the last tile of a straight, 
            // effectively the "Turn" segment is just a 1x1 tile that acts as a pivot
            // But here we treat it as a specific connector.
            // Let's simplify: A Turn Segment is 1 tile long.
            this.currentGenPos.copy(seg.endPos);
            
            // Rotate direction for NEXT segment
            const axis = new THREE.Vector3(0, 1, 0);
            const angle = (type === SEG_TURN_LEFT) ? Math.PI/2 : -Math.PI/2;
            this.currentDirection.applyAxisAngle(axis, angle);
            this.currentDirection.x = Math.round(this.currentDirection.x);
            this.currentDirection.z = Math.round(this.currentDirection.z);
        }
        
        // Populate with stuff (except first few)
        if (gameState.score > 50 || this.segments.length > 3) {
            this.populateSegment(seg);
        }
    }
    
    extendPath() {
        // Decide next segment
        const r = Math.random();
        // 20% chance to turn, but not too often?
        // Prevent back-to-back turns for playability
        const lastType = this.segments[this.segments.length-1].type;
        
        if (lastType !== SEG_STRAIGHT || r > 0.8) {
             this.spawnSegment(SEG_STRAIGHT, Math.floor(Math.random() * 3 + 3)); // 3 to 6 length
        } else {
             // Turn
             const turnType = Math.random() > 0.5 ? SEG_TURN_LEFT : SEG_TURN_RIGHT;
             this.spawnSegment(turnType, 1);
             // Always follow turn with a straight to avoid immediate double turns
             this.spawnSegment(SEG_STRAIGHT, 3);
        }
    }
    
    populateSegment(seg) {
        if (seg.type !== SEG_STRAIGHT) return; // Don't put obstacles on corners
        
        // Chance for obstacles
        seg.tiles.forEach((tile, idx) => {
            if (idx === 0 || idx === seg.tiles.length - 1) return; // Keep ends clear
            
            const r = Math.random();
            // Coins
            if (r < 0.3) {
                const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
                const right = new THREE.Vector3(0,1,0).cross(seg.direction).normalize();
                const pos = tile.worldPos.clone().add(right.multiplyScalar(lane * LANE_WIDTH));
                pos.y = 1.0;
                
                const coin = new Coin(pos.x, pos.y, pos.z);
                gameState.entities.push(coin);
            }
            // Obstacles
            else if (r > 0.7 && !tile.hasObstacle) {
                 const type = Math.random() > 0.5 ? "LOG" : "BEAM";
                 // Center obstacle
                 const pos = tile.worldPos.clone();
                 const obs = new Obstacle(pos.x, pos.y, pos.z, type);
                 
                 // Rotate obstacle to face player
                 // Obs mesh group needs rotation
                 const angle = Math.atan2(seg.direction.x, seg.direction.z);
                 obs.mesh.rotation.y = angle;
                 
                 gameState.entities.push(obs);
                 tile.hasObstacle = true;
            }
        });
    }
    
    update() {
        if (!gameState.player) return;
        
        // Check if we need to spawn new path
        const distToGen = gameState.player.mesh.position.distanceTo(this.currentGenPos);
        if (distToGen < 50) { // Keep 50 units ahead
            this.extendPath();
        }
        
        // Cleanup old segments behind player
        if (this.segments.length > 0) {
            const playerPos = gameState.player.mesh.position;
            const oldestSeg = this.segments[0];
            const dist = playerPos.distanceTo(oldestSeg.endPos);
            
            // If player is far away AND segment is "behind" (dot product?)
            // Simple distance check if large enough
            if (dist > 30 && this.segments.length > 5) {
                const removed = this.segments.shift();
                removed.destroy();
            }
        }
        
        // Check "Turn" logic
        this.checkTurns();
    }
    
    checkTurns() {
        // Detect if player is on a turn segment
        // Simple AABB check against turn segments
        const playerPos = gameState.player.mesh.position;
        
        for (const seg of this.segments) {
            if (seg.type === SEG_STRAIGHT) continue;
            
            // It's a turn
            const dist = new THREE.Vector2(playerPos.x, playerPos.z).distanceTo(new THREE.Vector2(seg.startPos.x, seg.startPos.z));
            
            if (dist < TILE_SIZE / 2) {
                // Player is inside turn zone
                gameState.inTurnZone = true;
                gameState.turnDirection = (seg.type === SEG_TURN_LEFT) ? 1 : -1; // 1 for left, -1 for right relative to player? 
                // Wait, turn(1) is Left? turn(-1) is Right?
                // In Player class: turn(dir): rotateY(-PI/2 * dir). If dir=1 -> -90 deg (Right). If dir=-1 -> +90 deg (Left).
                
                // Let's standardize:
                // Player.turn(1) -> Turn LEFT (Positive rotation around Y in ThreeJS is CCW, so Left)
                // Player.turn(-1) -> Turn RIGHT
                
                gameState.requiredTurnDir = (seg.type === SEG_TURN_LEFT) ? 1 : -1;
                gameState.turnPivot = seg.startPos.clone();
                return;
            }
        }
        gameState.inTurnZone = false;
        gameState.requiredTurnDir = 0;
    }
}