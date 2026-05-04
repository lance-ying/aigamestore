// ai.js - AI behavior

import { gameState, NUM_LANES, LANE_WIDTH, CANVAS_WIDTH } from './globals.js';

export function updateAI(aiRacer) {
  if (aiRacer.finished) return;
  
  // AI decision making based on level difficulty
  const aggressiveness = Math.min(gameState.level * 0.1, 1.0);
  
  // Find nearest block
  let nearestBlock = null;
  let nearestDist = Infinity;
  
  gameState.blocks.forEach(block => {
    if (block.collected) return;
    
    const dx = block.x - aiRacer.body.position.x;
    const dy = block.worldY - aiRacer.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dy < 200 && dy > -50 && dist < nearestDist) {
      nearestBlock = block;
      nearestDist = dist;
    }
  });
  
  // Find nearest dropped block
  gameState.droppedBlocks.forEach(block => {
    if (block.collected) return;
    
    const dx = block.body.position.x - aiRacer.body.position.x;
    const dy = block.worldY - aiRacer.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dy < 200 && dy > -50 && dist < nearestDist) {
      nearestBlock = block;
      nearestDist = dist;
    }
  });
  
  // Find next bridge
  let nextBridge = null;
  gameState.bridges.forEach(bridge => {
    const dy = bridge.worldY - aiRacer.worldY;
    if (dy < 300 && dy > 0) {
      if (!nextBridge || dy < (nextBridge.worldY - aiRacer.worldY)) {
        nextBridge = bridge;
      }
    }
  });
  
  // Decision making
  const trackLeft = (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
  
  if (nextBridge && aiRacer.blocks < nextBridge.requiredBlocks) {
    // Need blocks, go for nearest block
    if (nearestBlock) {
      const blockLane = Math.floor((nearestBlock.x - trackLeft) / LANE_WIDTH);
      if (blockLane < aiRacer.targetLane) {
        aiRacer.steerLeft();
      } else if (blockLane > aiRacer.targetLane) {
        aiRacer.steerRight();
      }
    }
  } else if (nearestBlock && nearestDist < 150 && Math.random() < aggressiveness) {
    // Opportunistic block collection
    const blockLane = Math.floor((nearestBlock.x - trackLeft) / LANE_WIDTH);
    if (blockLane < aiRacer.targetLane) {
      aiRacer.steerLeft();
    } else if (blockLane > aiRacer.targetLane) {
      aiRacer.steerRight();
    }
  } else {
    // Head toward center or random lane change
    const centerLane = Math.floor(NUM_LANES / 2);
    if (Math.random() < 0.02) {
      if (aiRacer.targetLane < centerLane) {
        aiRacer.steerRight();
      } else if (aiRacer.targetLane > centerLane) {
        aiRacer.steerLeft();
      }
    }
  }
  
  // Aggressive behavior: try to collide with player if ahead
  if (gameState.player && !gameState.player.finished && Math.random() < aggressiveness * 0.05) {
    if (gameState.player.worldY < aiRacer.worldY) {
      const playerLane = Math.floor((gameState.player.body.position.x - trackLeft) / LANE_WIDTH);
      if (Math.abs(playerLane - aiRacer.targetLane) <= 1 && Math.abs(gameState.player.worldY - aiRacer.worldY) < 100) {
        if (playerLane < aiRacer.targetLane) {
          aiRacer.steerLeft();
        } else if (playerLane > aiRacer.targetLane) {
          aiRacer.steerRight();
        }
      }
    }
  }
}