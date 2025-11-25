import { gameState } from './globals.js';
import { TrackSegment, TunnelSegment } from './entities.js';

export function initializeWorld() {
  // Create initial track segments - more segments for smoother appearance
  for (let i = 0; i < 15; i++) {
    const segment = new TrackSegment(-i * 10);
    gameState.trackSegments.push(segment);
  }
  
  // Create initial tunnel segments - more segments for smoother appearance
  for (let i = 0; i < 15; i++) {
    const segment = new TunnelSegment(-i * 10);
    gameState.tunnelSegments.push(segment);
  }
}

export function updateWorld(deltaTime) {
  // Spawn new track segments as needed - maintain more segments for smooth rendering
  // Check the farthest segment and spawn new ones proactively
  if (gameState.trackSegments.length > 0) {
    const lastSegment = gameState.trackSegments[gameState.trackSegments.length - 1];
    const farthestZ = lastSegment.mesh.position.z;
    
    // Keep spawning segments until we have enough coverage
    while (farthestZ > -60) {
      const newZ = gameState.trackSegments[gameState.trackSegments.length - 1].mesh.position.z - 10;
      const segment = new TrackSegment(newZ);
      gameState.trackSegments.push(segment);
    }
  } else {
    // Fallback if array is empty
    const segment = new TrackSegment(-10);
    gameState.trackSegments.push(segment);
  }
  
  // Spawn new tunnel segments as needed - maintain more segments for smooth rendering
  if (gameState.tunnelSegments.length > 0) {
    const lastSegment = gameState.tunnelSegments[gameState.tunnelSegments.length - 1];
    const farthestZ = lastSegment.mesh.position.z;
    
    // Keep spawning segments until we have enough coverage
    while (farthestZ > -60) {
      const newZ = gameState.tunnelSegments[gameState.tunnelSegments.length - 1].mesh.position.z - 10;
      const segment = new TunnelSegment(newZ);
      gameState.tunnelSegments.push(segment);
    }
  } else {
    // Fallback if array is empty
    const segment = new TunnelSegment(-10);
    gameState.tunnelSegments.push(segment);
  }
}