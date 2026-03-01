/**
 * Automated Testing Logic.
 */
import { gameState, OCTAGON_SIDES } from './globals.js';
import { normalizeAngle } from './math_utils.js';

function getPanelAtAngle(rotation, offsetAngle) {
    // Helper to determine which panel index is at a specific angle
    // Inverse of the vertex generation logic
    const step = Math.PI / 4;
    const baseOffset = Math.PI / 2 + Math.PI / 8;
    
    let localAngle = normalizeAngle(offsetAngle - rotation - baseOffset);
    let index = Math.floor(localAngle / step);
    if (index < 0) index += 8;
    return index % 8;
}

export function get_automated_testing_action(gs) {
    if (gs.gamePhase !== "PLAYING") return null;
    
    // Only act every few frames to simulate reaction time, unless urgent
    if (gs.frameCount % 5 !== 0) return null;

    const player = gs.player;
    if (!player) return null;
    
    // Look ahead logic
    const playerZ = 50;
    const lookAheadDist = 300;
    
    // Find closest dangerous segment
    const upcomingSegments = gs.tunnelSegments.filter(s => s.z > playerZ && s.z < playerZ + lookAheadDist);
    upcomingSegments.sort((a, b) => a.z - b.z); // Closest first
    
    if (upcomingSegments.length === 0) return null;
    
    const targetSegment = upcomingSegments[0];
    
    // Calculate current player panel
    const playerAngle = player.isTop ? -Math.PI / 2 : Math.PI / 2;
    const currentPanelIdx = getPanelAtAngle(gs.tunnelRotation, playerAngle);
    
    const wallType = targetSegment.walls[currentPanelIdx];
    
    // Logic based on Control Mode
    if (gs.controlMode === "TEST_1") {
        // Basic Survival: Rotate if obstacle detected
        if (wallType !== 0) {
            // Check neighbors
            const leftPanelIdx = (currentPanelIdx + 1) % 8;
            const rightPanelIdx = (currentPanelIdx + 7) % 8; // -1
            
            // Prefer Right Rotation (Arrow Right moves tunnel CW, effectively moving player CCW relative to tunnel? 
            // Right Arrow increases tunnelRotation.
            // If tunnel rotates CW, the panel under player changes to the one on the "left" in the array?
            // Actually, let's just use trial: press Right.
            return { keyCode: 39 };
        }
    }
    else if (gs.controlMode === "TEST_2") {
        // Flip Test
        if (wallType === 2) { // Gap
            // If Gap, Try to Flip
            // Check if destination is safe
            // Destination panel is on opposite side?
            // Player Angle flips PI/2 -> -PI/2.
            const destAngle = player.isTop ? Math.PI / 2 : -Math.PI / 2;
            const destPanelIdx = getPanelAtAngle(gs.tunnelRotation, destAngle);
            
            if (targetSegment.walls[destPanelIdx] === 0) {
                return { keyCode: 32 }; // Space
            }
        }
        // Fallback to rotate if flip is bad or wallType is 1 (obstacle)
        if (wallType !== 0) {
            return { keyCode: 37 }; // Left
        }
    }
    else if (gs.controlMode === "TEST_3") {
        // Advanced: Combine both
        if (wallType !== 0) {
            // Check Flip Option
            const destAngle = player.isTop ? Math.PI / 2 : -Math.PI / 2;
            const destPanelIdx = getPanelAtAngle(gs.tunnelRotation, destAngle);
            
            if (targetSegment.walls[destPanelIdx] === 0 && wallType === 2) {
                return { keyCode: 32 };
            }
            // Else Rotate
            return { keyCode: 39 };
        }
    }
    
    return null;
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;