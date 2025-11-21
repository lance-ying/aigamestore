// physics.js - Physics collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;
import { gameState, POINTS } from './globals.js';

export function setupCollisionHandling(p) {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      
      // Candy collides with Om Nom
      if ((bodyA.label === 'candy' && bodyB.label === 'omnom') ||
          (bodyA.label === 'omnom' && bodyB.label === 'candy')) {
        if (gameState.gamePhase === "PLAYING") {
          handleWin(p);
        }
      }
      
      // Candy collides with star
      if ((bodyA.label === 'candy' && bodyB.label === 'star') ||
          (bodyA.label === 'star' && bodyB.label === 'candy')) {
        const star = gameState.stars.find(s => s.body === bodyA || s.body === bodyB);
        if (star && !star.collected) {
          star.collect();
          p.logs.game_info.push({
            data: { event: "star_collected", index: star.index, score: gameState.score },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      
      // Candy collides with hazard
      if ((bodyA.label === 'candy' && bodyB.label === 'hazard') ||
          (bodyA.label === 'hazard' && bodyB.label === 'candy')) {
        if (gameState.gamePhase === "PLAYING") {
          gameState.gamePhase = "GAME_OVER_LOSE";
          p.logs.game_info.push({
            data: { gamePhase: "GAME_OVER_LOSE", reason: "hit_hazard" },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      
      // Candy collides with bubble
      if ((bodyA.label === 'candy' && bodyB.label === 'bubble') ||
          (bodyA.label === 'bubble' && bodyB.label === 'candy')) {
        const bubble = gameState.bubbles.find(b => b.body === bodyA || b.body === bodyB);
        if (bubble && !bubble.attached && !bubble.popped) {
          bubble.attachToCandy();
        }
      }
    });
  });
}

function handleWin(p) {
  gameState.levelCompleteTime = Date.now();
  const timeElapsed = (gameState.levelCompleteTime - gameState.levelStartTime) / 1000;
  
  // Calculate score
  gameState.score += POINTS.WIN;
  
  // Three star bonus
  const allStarsCollected = gameState.starsCollected.every(s => s);
  if (allStarsCollected) {
    gameState.score += POINTS.THREE_STAR_BONUS;
  }
  
  // Time bonus
  const currentLevel = gameState.currentLevel;
  if (currentLevel < 5) {
    const parTime = [10, 15, 20, 25, 30][currentLevel];
    if (timeElapsed <= parTime * 0.75) {
      gameState.score += POINTS.TIME_BONUS_FAST;
    } else if (timeElapsed <= parTime) {
      gameState.score += POINTS.TIME_BONUS_MEDIUM;
    }
  }
  
  // Update high scores
  if (!gameState.highScores[currentLevel] || gameState.score > gameState.highScores[currentLevel]) {
    gameState.highScores[currentLevel] = gameState.score;
    localStorage.setItem('cutTheRopeHighScores', JSON.stringify(gameState.highScores));
  }
  
  // Update best stars
  const starsThisLevel = gameState.starsCollected.filter(s => s).length;
  if (!gameState.bestStars[currentLevel] || starsThisLevel > gameState.bestStars[currentLevel]) {
    gameState.bestStars[currentLevel] = starsThisLevel;
    localStorage.setItem('cutTheRopeBestStars', JSON.stringify(gameState.bestStars));
  }
  
  // Count total stars
  const totalStars = gameState.starsCollected.filter(s => s).length;
  gameState.totalStarsCollected += totalStars;
  
  gameState.gamePhase = "GAME_OVER_WIN";
  if (gameState.omNom) {
    gameState.omNom.startEating();
  }
  
  p.logs.game_info.push({
    data: { 
      gamePhase: "GAME_OVER_WIN", 
      score: gameState.score, 
      stars: starsThisLevel,
      timeElapsed: timeElapsed 
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}