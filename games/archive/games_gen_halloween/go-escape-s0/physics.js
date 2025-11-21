// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState } from './globals.js';

export function setupCollisionHandling(p) {
  // Track ground contact on collision start
  Events.on(gameState.engine, 'collisionStart', (event) => {
    if (gameState.gamePhase !== "PLAYING") return;
    
    const pairs = event.pairs;
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Player-Platform collision
      if ((bodyA.label === 'player' && bodyB.label === 'platform') ||
          (bodyB.label === 'player' && bodyA.label === 'platform')) {
        
        // Set player on ground
        if (gameState.player) {
          gameState.player.onGround = true;
        }
        
        const platform = gameState.platforms.find(p => 
          p.body === bodyA || p.body === bodyB
        );
        
        if (platform && platform.type === 'vanishing') {
          platform.triggerVanish();
          if (gameState.player) {
            gameState.player.onVanishingPlatform = platform;
          }
        }
      }
      
      // Player-Obstacle collision
      if ((bodyA.label === 'player' && bodyB.label === 'obstacle') ||
          (bodyB.label === 'player' && bodyA.label === 'obstacle')) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({
          data: { gamePhase: "GAME_OVER_LOSE", reason: "hit_obstacle" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      
      // Player-Goal collision
      if ((bodyA.label === 'player' && bodyB.label === 'goal') ||
          (bodyB.label === 'player' && bodyA.label === 'goal')) {
        if (!gameState.goalReached) {
          gameState.goalReached = true;
          handleLevelComplete(p);
        }
      }
    });
  });
  
  // Maintain ground contact during active collisions
  Events.on(gameState.engine, 'collisionActive', (event) => {
    if (gameState.gamePhase !== "PLAYING") return;
    
    const pairs = event.pairs;
    let playerOnPlatform = false;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check if player is actively on a platform
      if ((bodyA.label === 'player' && bodyB.label === 'platform') ||
          (bodyB.label === 'player' && bodyA.label === 'platform')) {
        playerOnPlatform = true;
      }
    });
    
    if (gameState.player) {
      if (playerOnPlatform) {
        gameState.player.onGround = true;
      }
    }
  });
  
  // Track when player leaves ground
  Events.on(gameState.engine, 'collisionEnd', (event) => {
    if (gameState.gamePhase !== "PLAYING") return;
    
    const pairs = event.pairs;
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Player leaving platform
      if ((bodyA.label === 'player' && bodyB.label === 'platform') ||
          (bodyB.label === 'player' && bodyA.label === 'platform')) {
        
        // Check if player is still in contact with any platform
        if (gameState.player) {
          // Will be set back to true by collisionActive if still touching another platform
          gameState.player.onGround = false;
        }
      }
    });
  });
}

function handleLevelComplete(p) {
  if (gameState.currentLevel < gameState.totalLevels) {
    gameState.currentLevel++;
    gameState.score += 100;
    
    p.logs.game_info.push({
      data: { event: "level_complete", level: gameState.currentLevel - 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Load next level (will be handled in game.js)
    setTimeout(() => {
      if (gameState.gamePhase === "PLAYING") {
        loadLevel(p, gameState.currentLevel);
      }
    }, 1000);
  } else {
    gameState.gamePhase = "GAME_OVER_WIN";
    p.logs.game_info.push({
      data: { gamePhase: "GAME_OVER_WIN", finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

// Import to avoid circular dependency
let loadLevel;
export function setLoadLevelFunction(fn) {
  loadLevel = fn;
}