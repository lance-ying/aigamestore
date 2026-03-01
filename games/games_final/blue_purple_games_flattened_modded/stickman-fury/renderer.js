/**
 * renderer.js
 * Contains procedural drawing functions for stickman animations.
 * Allows for dynamic posing without sprites.
 */

/**
 * Draws a stickman with a specific pose.
 * @param {p5} p - p5 instance
 * @param {number} x - Center X position
 * @param {number} y - Foot Y position (ground level)
 * @param {Array} color - [r, g, b]
 * @param {string} pose - 'IDLE', 'RUN', 'ATTACK_HIGH', 'ATTACK_LOW', 'KICK', 'HURT'
 * @param {number} facing - 1 for right, -1 for left
 * @param {number} scale - Size multiplier
 */
export function drawStickman(p, x, y, color, pose = 'IDLE', facing = 1, scale = 1.0) {
    p.push();
    p.translate(x, y);
    p.scale(facing * scale, scale); // Flip horizontally if facing left
    
    // Config
    p.stroke(color);
    p.strokeWeight(3);
    p.noFill();
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);

    const headSize = 15;
    const torsoLen = 25;
    const limbLen = 20;

    // Default Joint Positions (Relative to Hip at 0, -30)
    // Hip is approximately at (0, -30) relative to feet at (0,0)
    // Actually, let's define 0,0 as the feet point on the ground.
    
    let hipX = 0;
    let hipY = -25;
    let shoulderX = 0;
    let shoulderY = hipY - torsoLen;
    let headX = 0;
    let headY = shoulderY - headSize/2;

    // Limbs target offsets
    let elbowL_X = -10, elbowL_Y = shoulderY + 10;
    let handL_X = -15, handL_Y = shoulderY + 20;
    
    let elbowR_X = 10, elbowR_Y = shoulderY + 10;
    let handR_X = 15, handR_Y = shoulderY + 20;
    
    let kneeL_X = -5, kneeL_Y = hipY + 12;
    let footL_X = -10, footL_Y = 0;
    
    let kneeR_X = 5, kneeR_Y = hipY + 12;
    let footR_X = 10, footR_Y = 0;

    // Apply Pose Modifications
    const time = p.millis() * 0.01; // For idle breathing

    switch (pose) {
        case 'IDLE':
            shoulderY += Math.sin(time) * 2;
            headY += Math.sin(time) * 2;
            handL_Y = hipY; 
            handR_Y = hipY;
            break;

        case 'RUN':
            const runCycle = time * 2;
            footL_X = Math.cos(runCycle) * 15;
            footL_Y = Math.min(0, Math.sin(runCycle) * 5 - 5);
            kneeL_X = footL_X / 2;
            
            footR_X = Math.cos(runCycle + Math.PI) * 15;
            footR_Y = Math.min(0, Math.sin(runCycle + Math.PI) * 5 - 5);
            kneeR_X = footR_X / 2;
            
            // Arms swing opposite to legs
            handL_X = Math.cos(runCycle + Math.PI) * 15;
            handL_Y = shoulderY + 10;
            handR_X = Math.cos(runCycle) * 15;
            handR_Y = shoulderY + 10;
            
            // Lean forward
            shoulderX = 5;
            headX = 8;
            break;

        case 'ATTACK_PUNCH':
            // Punch forward (Right hand)
            shoulderX = 5;
            handR_X = 35;
            handR_Y = shoulderY;
            elbowR_X = 15;
            elbowR_Y = shoulderY - 5;
            
            // Left hand guard
            handL_X = 5;
            handL_Y = shoulderY + 5;
            
            // Lunge legs
            footR_X = 20;
            footL_X = -20;
            hipY += 5; // Lower stance
            break;

        case 'ATTACK_KICK':
            // Kick forward (Right leg)
            footR_X = 35;
            footR_Y = hipY - 5;
            kneeR_X = 15;
            kneeR_Y = hipY - 5;
            
            // Balance on left leg
            footL_X = -5;
            hipX = -5;
            
            // Arms balance
            handL_X = -20;
            handL_Y = shoulderY;
            handR_X = 20;
            handR_Y = shoulderY + 10;
            break;

        case 'HURT':
            // Knocked back
            shoulderX = -10;
            headX = -15;
            handL_X = -10; handL_Y = shoulderY - 20; // Hands up
            handR_X = 10; handR_Y = shoulderY - 20;
            break;
            
        case 'WIN':
             // Victory pose
             handL_X = -15; handL_Y = shoulderY - 25;
             handR_X = 15; handR_Y = shoulderY - 25;
             break;
    }

    // Drawing
    // Head
    p.fill(color); // Filled head looks better
    p.noStroke();
    p.circle(headX, headY, headSize);
    
    p.noFill();
    p.stroke(color);
    
    // Torso
    p.line(shoulderX, shoulderY, hipX, hipY);

    // Arms (Shoulder -> Elbow -> Hand)
    // Left Arm
    p.beginShape();
    p.vertex(shoulderX, shoulderY);
    p.vertex(elbowL_X, elbowL_Y);
    p.vertex(handL_X, handL_Y);
    p.endShape();
    
    // Right Arm
    p.beginShape();
    p.vertex(shoulderX, shoulderY);
    p.vertex(elbowR_X, elbowR_Y);
    p.vertex(handR_X, handR_Y);
    p.endShape();

    // Legs (Hip -> Knee -> Foot)
    // Left Leg
    p.beginShape();
    p.vertex(hipX, hipY);
    p.vertex(kneeL_X, kneeL_Y);
    p.vertex(footL_X, footL_Y);
    p.endShape();

    // Right Leg
    p.beginShape();
    p.vertex(hipX, hipY);
    p.vertex(kneeR_X, kneeR_Y);
    p.vertex(footR_X, footR_Y);
    p.endShape();

    p.pop();
}