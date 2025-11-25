import { gameState } from './globals.js';
import { TrackSegment, TunnelSegment } from './entities.js';

export function initializeWorld() {
  // Create initial track segments
  for (let i = 0; i < 10; i++) {
    const segment = new TrackSegment(-i * 10);
    gameState.trackSegments.push(segment);
  }
  
  // Create initial tunnel segments
  for (let i = 0; i < 10; i++) {
    const segment = new TunnelSegment(-i * 10);
    gameState.tunnelSegments.push(segment);
  }
}

export function updateWorld(deltaTime) {
  // Spawn new track segments as needed - use while loop to handle multiple segments
  while (gameState.trackSegments.length < 10) {
    const lastSegment = gameState.trackSegments[gameState.trackSegments.length - 1];
    // Use the current mesh position instead of the stored z value
    const newZ = lastSegment.mesh.position.z - 10;
    const segment = new TrackSegment(newZ);
    gameState.trackSegments.push(segment);
  }
  
  // Spawn new tunnel segments as needed - use while loop to handle multiple segments
  while (gameState.tunnelSegments.length < 10) {
    const lastSegment = gameState.tunnelSegments[gameState.tunnelSegments.length - 1];
    // Use the current mesh position instead of the stored z value
    const newZ = lastSegment.mesh.position.z - 10;
    const segment = new TunnelSegment(newZ);
    gameState.tunnelSegments.push(segment);
  }
}