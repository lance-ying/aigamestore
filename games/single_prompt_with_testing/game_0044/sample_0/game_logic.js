// game_logic.js - Core game logic

import { gameState, GAME_PHASES, REQUEST_TYPES, CANVAS_HEIGHT } from './globals.js';
import { Request } from './request.js';
import { createSuccessParticles, createMissParticles } from './particles.js';

export function initGame(p, player) {
  gameState.player = player;
  gameState.entities = [player];
  gameState.score = 0;
  gameState.followers = 0;
  gameState.requests = [];
  gameState.missedRequests = 0;
  gameState.completedRequests = 0;
  gameState.frameCount = 0;
  gameState.lastRequestTime = 0;
  gameState.requestInterval = 180;
}

export function updateGame(p, particles) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return;
  }

  gameState.frameCount++;

  // Update player
  if (gameState.player) {
    gameState.player.update(p);
    
    // Log player info occasionally
    if (gameState.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }

  // Spawn new requests
  if (gameState.frameCount - gameState.lastRequestTime > gameState.requestInterval) {
    spawnRequest(p);
    gameState.lastRequestTime = gameState.frameCount;
    
    // Gradually increase difficulty
    if (gameState.requestInterval > 90) {
      gameState.requestInterval -= 2;
    }
  }

  // Update requests
  for (let i = gameState.requests.length - 1; i >= 0; i--) {
    const request = gameState.requests[i];
    const alive = request.update();

    // Check for matches
    if (!request.completed && !request.missed && gameState.player) {
      if (request.checkMatch(gameState.player)) {
        gameState.completedRequests++;
        const followersGained = 10 + Math.floor(Math.random() * 10);
        gameState.followers += followersGained;
        gameState.score += 100;
        createSuccessParticles(p, request.x, request.y, particles);
      }
    }

    // Handle missed requests
    if (request.missed) {
      gameState.missedRequests++;
      createMissParticles(p, 50, request.y, particles);
    }

    // Remove dead requests
    if (!alive || request.completed || request.missed) {
      gameState.requests.splice(i, 1);
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update()) {
      particles.splice(i, 1);
    }
  }

  // Check win condition
  if (gameState.followers >= gameState.targetFollowers) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", followers: gameState.followers },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  // Check lose condition
  if (gameState.missedRequests >= gameState.maxMissed) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", missed: gameState.missedRequests },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function spawnRequest(p) {
  const requestTypes = Object.values(REQUEST_TYPES);
  const type = requestTypes[Math.floor(Math.random() * requestTypes.length)];
  const y = 100 + Math.random() * (CANVAS_HEIGHT - 200);
  const request = new Request(p, type, y);
  gameState.requests.push(request);
}

export function drawGame(p, particles) {
  p.background(30, 25, 40);

  // Background decoration
  p.noStroke();
  for (let i = 0; i < 10; i++) {
    const x = (p.frameCount * 0.2 + i * 80) % (CANVAS_WIDTH + 100);
    const y = 80 + i * 40;
    p.fill(60, 50, 80, 20);
    p.ellipse(x, y, 60, 60);
  }

  // Draw match zone
  p.fill(255, 200, 100, 20);
  p.noStroke();
  p.rect(50, 50, 100, CANVAS_HEIGHT - 100);

  // Draw particles
  particles.forEach(particle => particle.draw(p));

  // Draw requests
  gameState.requests.forEach(request => request.draw(p));

  // Draw player
  if (gameState.player) {
    gameState.player.draw(p);
  }
}