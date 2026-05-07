import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, BLOCK_HEIGHT } from './globals.js';
import { Block, Debris } from './entities.js';
import { hslToHex } from './utils.js';

// Places the current block and returns true if successful, false if game over
export function placeBlock() {
    if (!gameState.activeBlock) return false;
    
    const active = gameState.activeBlock;
    const prev = gameState.stack[gameState.stack.length - 1];
    
    active.stop();
    
    // Calculate overlap
    // We only care about the axis of movement
    const isX = active.moveAxis === 'x';
    
    const activePos = isX ? active.mesh.position.x : active.mesh.position.z;
    const prevPos = isX ? prev.mesh.position.x : prev.mesh.position.z;
    
    const activeSize = isX ? active.width : active.depth;
    // prev block might have different dimensions if we cut it? No, prev block defines the "target" base.
    // The previous block's relevant dimension is what we compare against.
    const prevSize = isX ? prev.width : prev.depth;
    
    // Delta
    const delta = activePos - prevPos;
    const absDelta = Math.abs(delta);
    const overlap = prevSize - absDelta;
    
    // LOGIC:
    // If overlap <= 0, we missed completely.
    if (overlap <= 0) {
        // Make the whole block fall as debris
        const debris = new Debris(
            active.mesh.position.x,
            active.mesh.position.y,
            active.mesh.position.z,
            active.width,
            active.depth,
            active.mesh.material.color
        );
        debris.velocity.set(0, 0.1, 0); // slight pop up
        gameState.debris.push(debris);
        
        gameState.scene.remove(active.mesh);
        gameState.activeBlock = null;
        return false; // Game Over
    }
    
    // If we have overlap, we cut.
    // Cut logic:
    // New block size = overlap
    // New block position = prevPos + delta / 2
    
    let newWidth = active.width;
    let newDepth = active.depth;
    let newX = active.mesh.position.x;
    let newZ = active.mesh.position.z;
    
    // Debris params
    let debrisX, debrisZ, debrisW, debrisD;
    
    if (isX) {
        newWidth = overlap;
        newX = prevPos + delta / 2;
        
        // Determine debris
        debrisW = absDelta;
        debrisD = newDepth;
        debrisZ = newZ;
        
        if (activePos > prevPos) {
            // Overhang on positive side
            debrisX = prevPos + prevSize / 2 + debrisW / 2;
        } else {
            // Overhang on negative side
            debrisX = prevPos - prevSize / 2 - debrisW / 2;
        }
    } else {
        newDepth = overlap;
        newZ = prevPos + delta / 2;
        
        // Determine debris
        debrisW = newWidth;
        debrisD = absDelta;
        debrisX = newX;
        
        if (activePos > prevPos) {
            debrisZ = prevPos + prevSize / 2 + debrisD / 2;
        } else {
            debrisZ = prevPos - prevSize / 2 - debrisD / 2;
        }
    }
    
    // Replace active block with a trimmed static block
    gameState.scene.remove(active.mesh);
    
    const placedBlock = new Block(newX, active.mesh.position.y, newZ, newWidth, newDepth, active.mesh.material.color);
    gameState.stack.push(placedBlock);
    gameState.scene.add(placedBlock.mesh);
    
    // Create debris
    const debris = new Debris(debrisX, active.mesh.position.y, debrisZ, debrisW, debrisD, active.mesh.material.color);
    // Add velocity away from center slightly?
    // debris.velocity.y = 0.1;
    gameState.debris.push(debris);
    
    return true; // Success
}

export function spawnNextBlock() {
    const prevBlock = gameState.stack[gameState.stack.length - 1];
    
    // Increment Hue
    gameState.currentHue += 0.02; // Change color slightly
    if (gameState.currentHue > 1) gameState.currentHue -= 1;
    
    const color = hslToHex(gameState.currentHue, 0.8, 0.6);
    
    // New block spawns at next height
    const y = prevBlock.mesh.position.y + BLOCK_HEIGHT;
    
    // New block inherits dimensions from the top of the stack
    const newBlock = new Block(0, y, 0, prevBlock.width, prevBlock.depth, color);
    
    // Determine axis: alternate
    const lastAxis = gameState.stack.length % 2 === 0 ? 'z' : 'x'; // 1st moved X, 2nd Z, etc.
    const axis = lastAxis === 'x' ? 'z' : 'x';
    
    // Set position to align with previous block on the non-moving axis
    if (axis === 'x') {
        newBlock.mesh.position.z = prevBlock.mesh.position.z;
    } else {
        newBlock.mesh.position.x = prevBlock.mesh.position.x;
    }
    
    // Increase speed slightly
    gameState.blockSpeed += 0.002;
    
    newBlock.startMoving(axis, gameState.blockSpeed);
    
    gameState.activeBlock = newBlock;
    gameState.scene.add(newBlock.mesh);
}