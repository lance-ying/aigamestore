import { gameState, COLORS } from './globals.js';
import { Platform, Checkpoint, Goal, Spinner } from './entities.js';

export function buildLevel() {
    // 1. Start Platform
    new Platform(0, 0, 0, 10, 1, 10, COLORS.SKY);
    new Checkpoint(0, 1, 0);

    // 2. Gap Jumps
    new Platform(0, 0, -12, 6, 1, 6);
    new Platform(0, 0, -22, 6, 1, 6);
    
    // 3. The Gauntlet (Spinners)
    new Platform(0, 0, -40, 15, 1, 20);
    const spinner1 = new Spinner(0, 0, -35, 12, 2.0);
    const spinner2 = new Spinner(0, 0, -45, 12, -2.0);
    gameState.entities.push(spinner1, spinner2);
    
    // 4. Narrow Beams
    new Platform(0, 0, -55, 2, 1, 8);
    new Platform(0, 1, -65, 2, 1, 8); // Step up
    
    // 5. Sliding Walls Floor
    new Platform(0, 0, -85, 20, 1, 20);
    // Add some static obstacles/walls
    new Platform(-5, 2, -80, 2, 4, 2, COLORS.OBSTACLE);
    new Platform(5, 2, -85, 2, 4, 2, COLORS.OBSTACLE);
    new Platform(0, 2, -90, 2, 4, 2, COLORS.OBSTACLE);
    
    // 6. Final Ramp
    const rampLength = 20;
    const rampHeight = 5;
    // Approximation with steps or rotated box
    const ramp = new Platform(0, 2.5, -110, 8, 1, 20);
    ramp.mesh.rotation.x = -0.25; // Slope up
    // Recompute physics box is tricky with rotation in simple AABB engine. 
    // We will use stairs for simplicity in this engine version to ensure playability
    gameState.scene.remove(ramp.mesh); // Remove the rotated one from visual if we replace it
    gameState.colliders.pop(); // Remove physics body
    
    // Stairs instead of slope for robust physics
    for(let i=0; i<10; i++) {
        new Platform(0, i*0.5, -100 - (i*2), 8, 1, 2);
    }
    
    // 7. Finish Platform
    new Platform(0, 5, -130, 15, 1, 15, COLORS.GROUND);
    
    // Goal
    gameState.goal = new Goal(0, 7, -130, 14, 4, 2);
    gameState.entities.push(gameState.goal);
}