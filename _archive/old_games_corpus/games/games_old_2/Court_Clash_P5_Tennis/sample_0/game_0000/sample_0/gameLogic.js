import { gameState, COURT, LEVEL_CONFIG } from './globals.js';
import { Player } from './player.js';
import { Ball } from './ball.js';
import { AIController } from './ai.js';

export function initializeGame(p) {
  // Load high score
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('courtClashHighScore');
    if (saved) {
      gameState.highScore = parseInt(saved);
    }
  }

  // Create player
  gameState.player = new Player(COURT.x + COURT.width / 2, COURT.y + COURT.height - 40, false);

  // Create opponent
  gameState.opponent = new Player(COURT.x + COURT.width / 2, COURT.y + 40, true);

  // Create ball
  gameState.ball = new Ball(COURT.x + COURT.width / 2, COURT.y + COURT.height / 2);

  // Create AI controller
  gameState.aiController = new AIController(gameState.opponent);

  // Add to entities
  gameState.entities = [gameState.player, gameState.opponent, gameState.ball];
}

export function startGame(p) {
  gameState.gamePhase = 'PLAYING';
  gameState.level = 1;
  gameState.score = {
    player: 0,
    opponent: 0,
    total: 0
  };
  gameState.showLevelIntro = true;
  gameState.levelIntroTimer = 120; // 2 seconds at 60fps
  
  initializeGame(p);
  
  p.logs.game_info.push({
    data: { phase: 'PLAYING', level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function startNextLevel(p) {
  gameState.level++;
  gameState.score.player = 0;
  gameState.score.opponent = 0;
  gameState.showLevelIntro = true;
  gameState.levelIntroTimer = 120;
  gameState.gamePhase = 'PLAYING';
  
  resetRound(p);
  
  p.logs.game_info.push({
    data: { phase: 'PLAYING', level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function resetRound(p) {
  gameState.ballInPlay = false;
  gameState.pointScored = false;
  gameState.pointMessage = '';
  
  // Reset positions
  gameState.player.x = COURT.x + COURT.width / 2;
  gameState.player.targetX = gameState.player.x;
  gameState.opponent.x = COURT.x + COURT.width / 2;
  gameState.opponent.targetX = gameState.opponent.x;
  
  // Reset ball for serve
  if (gameState.currentServer === 'player') {
    gameState.ball.reset(gameState.player.x, gameState.player.y - 20);
  } else {
    gameState.ball.reset(gameState.opponent.x, gameState.opponent.y + 20);
  }
}

export function startServe(p) {
  gameState.ballInPlay = true;
  
  const config = LEVEL_CONFIG[gameState.level];
  
  if (gameState.currentServer === 'player') {
    // Player serve - wait for input
    // Ball will be served when player presses space
  } else {
    // AI serve
    const direction = p.random() > 0.5 ? 1 : -1;
    const power = 6 + p.random(2);
    gameState.ball.serve(direction, power * config.ballSpeedMultiplier);
    gameState.ball.lastHitBy = 'opponent';
  }
}

export function scorePoint(winner, p) {
  if (winner === 'player') {
    gameState.score.player++;
    gameState.score.total += 100;
    gameState.pointMessage = 'POINT FOR PLAYER!';
    
    // Bonus for power shot
    if (gameState.lastShotType === 'POWER') {
      gameState.score.total += 50;
    }
  } else {
    gameState.score.opponent++;
    gameState.pointMessage = 'POINT FOR OPPONENT!';
  }

  gameState.pointScored = true;
  gameState.pointMessageTimer = 90; // 1.5 seconds

  // Log score
  p.logs.game_info.push({
    data: { 
      event: 'point_scored',
      winner: winner,
      playerScore: gameState.score.player,
      opponentScore: gameState.score.opponent,
      totalScore: gameState.score.total
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Check for match end
  if (gameState.score.player >= 3) {
    winMatch(p);
  } else if (gameState.score.opponent >= 3) {
    loseMatch(p);
  } else {
    // Switch server
    gameState.currentServer = winner === 'player' ? 'opponent' : 'player';
  }
}

export function winMatch(p) {
  gameState.score.total += 500; // Match win bonus
  gameState.gamePhase = 'GAME_OVER_WIN';
  
  // Save high score
  if (gameState.score.total > gameState.highScore) {
    gameState.highScore = gameState.score.total;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('courtClashHighScore', gameState.highScore.toString());
    }
  }

  p.logs.game_info.push({
    data: { 
      phase: 'GAME_OVER_WIN',
      level: gameState.level,
      totalScore: gameState.score.total
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function loseMatch(p) {
  gameState.gamePhase = 'GAME_OVER_LOSE';
  
  // Save high score
  if (gameState.score.total > gameState.highScore) {
    gameState.highScore = gameState.score.total;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('courtClashHighScore', gameState.highScore.toString());
    }
  }

  p.logs.game_info.push({
    data: { 
      phase: 'GAME_OVER_LOSE',
      level: gameState.level,
      totalScore: gameState.score.total
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  if (gameState.gamePhase !== 'PLAYING') return;

  // Handle level intro
  if (gameState.showLevelIntro) {
    gameState.levelIntroTimer--;
    if (gameState.levelIntroTimer <= 0) {
      gameState.showLevelIntro = false;
      resetRound(p);
      startServe(p);
    }
    return;
  }

  // Handle point message
  if (gameState.pointScored) {
    gameState.pointMessageTimer--;
    if (gameState.pointMessageTimer <= 0) {
      resetRound(p);
      startServe(p);
    }
    return;
  }

  // Update entities
  if (gameState.ballInPlay) {
    const result = gameState.ball.update(p);
    
    // Check for point
    if (result === 'out' || result === 'double_bounce') {
      const winner = gameState.ball.lastHitBy === 'player' ? 'opponent' : 'player';
      scorePoint(winner, p);
    }

    gameState.player.update(p);
    gameState.opponent.update(p);
    gameState.aiController.update(p, gameState.ball);

    // Auto-position player towards ball
    if (gameState.ball.lastHitBy === 'opponent') {
      gameState.player.setTarget(gameState.ball.x);
    }

    // Handle player serve
    if (gameState.ball.isServing && gameState.currentServer === 'player') {
      if (p.keyIsDown(32)) { // Space to serve
        const direction = p.random(-1, 1);
        gameState.ball.serve(direction, 7);
        gameState.ball.lastHitBy = 'player';
      }
    }
  }

  // Log player info periodically
  if (p.frameCount % 10 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}