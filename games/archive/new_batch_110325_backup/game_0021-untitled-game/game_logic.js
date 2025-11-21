// game_logic.js - Core game logic
import { gameState } from './globals.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DIFFICULTY_LEVELS, PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { NumberBall, PrimeFactor, CutLine, Particle } from './entities.js';
import { getCurrentDifficulty } from './utils.js';

let particles = [];

export function initGame(p) {
  gameState.score = 0;
  gameState.timer = 90;
  gameState.frameCount = 0;
  gameState.difficulty = 1;
  gameState.spawnCounter = 0;
  gameState.numbers = [];
  gameState.entities = [];
  gameState.cutLine = null;
  particles = [];
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, action: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  gameState.frameCount++;
  
  // Update timer
  if (gameState.frameCount % 60 === 0) {
    gameState.timer--;
    if (gameState.timer <= 0) {
      gameState.gamePhase = gameState.score >= 500 ? PHASE_GAME_OVER_WIN : PHASE_GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
  }
  
  // Update difficulty
  const currentDiff = getCurrentDifficulty(gameState.score, DIFFICULTY_LEVELS);
  if (currentDiff.level !== gameState.difficulty) {
    gameState.difficulty = currentDiff.level;
    p.logs.game_info.push({
      data: { action: "difficulty_changed", level: gameState.difficulty },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Spawn numbers
  gameState.spawnCounter++;
  if (gameState.spawnCounter >= currentDiff.spawnInterval) {
    spawnNumber(p, currentDiff);
    gameState.spawnCounter = 0;
  }
  
  // Update numbers
  for (let i = gameState.numbers.length - 1; i >= 0; i--) {
    const num = gameState.numbers[i];
    num.update();
    
    if (num.isOffScreen()) {
      gameState.numbers.splice(i, 1);
    }
  }
  
  // Update entities (prime factors)
  for (let i = gameState.entities.length - 1; i >= 0; i--) {
    const entity = gameState.entities[i];
    entity.update();
    
    if (entity.isOffScreen()) {
      gameState.entities.splice(i, 1);
    }
  }
  
  // Update cut line
  if (gameState.cutLine) {
    gameState.cutLine.update();
    if (!gameState.cutLine.isAlive()) {
      gameState.cutLine = null;
    }
  }
  
  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (!particles[i].isAlive()) {
      particles.splice(i, 1);
    }
  }
  
  // Log player info periodically
  if (gameState.frameCount % 30 === 0 && gameState.cursor) {
    p.logs.player_info.push({
      screen_x: gameState.cursor.x,
      screen_y: gameState.cursor.y,
      game_x: gameState.cursor.x,
      game_y: gameState.cursor.y,
      framecount: p.frameCount
    });
  }
}

export function spawnNumber(p, difficulty) {
  const minNum = Math.max(2, Math.floor(difficulty.maxNumber * 0.3));
  const maxNum = difficulty.maxNumber;
  const value = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
  const x = Math.random() * (CANVAS_WIDTH - 100) + 50;
  const y = -30;
  
  const ball = new NumberBall(x, y, value, difficulty.fallSpeed);
  gameState.numbers.push(ball);
}

export function tapNumber(p, cursor) {
  // Check prime factors first (higher priority)
  for (let i = gameState.entities.length - 1; i >= 0; i--) {
    const factor = gameState.entities[i];
    if (factor.contains(cursor.x, cursor.y)) {
      // Tapped a prime factor - score!
      gameState.score += factor.value;
      createParticles(factor.x, factor.y, [100, 220, 150]);
      gameState.entities.splice(i, 1);
      
      p.logs.game_info.push({
        data: { action: "tapped_factor", value: factor.value, score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
  }
  
  // Check number balls
  for (let i = gameState.numbers.length - 1; i >= 0; i--) {
    const num = gameState.numbers[i];
    if (num.contains(cursor.x, cursor.y)) {
      if (num.isPrime) {
        // Correct! Score points
        gameState.score += num.value;
        createParticles(num.x, num.y, [100, 255, 150]);
        gameState.numbers.splice(i, 1);
        
        p.logs.game_info.push({
          data: { action: "tapped_prime", value: num.value, score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        // Wrong! Penalty
        gameState.score = Math.max(0, gameState.score - 5);
        createParticles(num.x, num.y, [255, 100, 100]);
        
        p.logs.game_info.push({
          data: { action: "tapped_composite_penalty", value: num.value, score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
  }
}

export function cutNumber(p, cursor) {
  for (let i = gameState.numbers.length - 1; i >= 0; i--) {
    const num = gameState.numbers[i];
    if (num.contains(cursor.x, cursor.y) && !num.isPrime && !num.isCut) {
      const factors = num.cut();
      
      // Create cut line effect
      gameState.cutLine = new CutLine(
        cursor.x - 30, cursor.y - 10,
        cursor.x + 30, cursor.y + 10
      );
      
      // Spawn prime factors
      for (let j = 0; j < factors.length; j++) {
        const factor = new PrimeFactor(num.x, num.y, factors[j], j, factors.length);
        gameState.entities.push(factor);
      }
      
      createParticles(num.x, num.y, [255, 200, 100]);
      gameState.numbers.splice(i, 1);
      
      p.logs.game_info.push({
        data: { action: "cut_composite", value: num.value, factors: factors },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
  }
}

function createParticles(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push(new Particle(x, y, color));
  }
}

export function getParticles() {
  return particles;
}