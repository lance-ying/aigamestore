// levelgen.js - Level generation

import { CANVAS_WIDTH, NUM_LANES, LANE_WIDTH, TRACK_LENGTH, BLOCKS_PER_BRIDGE, gameState } from './globals.js';
import { Block, Bridge } from './entities.js';

export function generateLevel(p, level) {
  const blocks = [];
  const bridges = [];
  
  // Track configuration based on level
  const trackLeft = (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
  const numBridges = Math.min(2 + Math.floor(level / 3), 6);
  const blocksPerBridge = BLOCKS_PER_BRIDGE + Math.floor(level / 5);
  
  // Generate bridges
  for (let i = 0; i < numBridges; i++) {
    const bridgeY = 200 + (i + 1) * (TRACK_LENGTH / (numBridges + 1));
    const bridgeWidth = CANVAS_WIDTH * 0.8;
    
    const bridge = new Bridge(
      p,
      CANVAS_WIDTH / 2,
      bridgeY,
      bridgeWidth,
      blocksPerBridge
    );
    bridges.push(bridge);
  }
  
  // Generate blocks between bridges
  const colors = [
    [255, 50, 50],
    [50, 100, 255],
    [50, 255, 100],
    [255, 255, 50]
  ];
  
  // Generate blocks in segments
  for (let segment = 0; segment < numBridges + 1; segment++) {
    const segmentStart = segment === 0 ? 100 : (bridges[segment - 1].worldY + 100);
    const segmentEnd = segment === numBridges ? (TRACK_LENGTH + 100) : (bridges[segment].worldY - 100);
    
    const numBlocks = Math.floor((segmentEnd - segmentStart) / 30) * NUM_LANES;
    
    for (let i = 0; i < numBlocks; i++) {
      const lane = Math.floor(Math.random() * NUM_LANES);
      const x = trackLeft + lane * LANE_WIDTH + LANE_WIDTH / 2;
      const y = segmentStart + Math.random() * (segmentEnd - segmentStart);
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      blocks.push(new Block(p, x, y, color));
    }
  }
  
  return { blocks, bridges };
}