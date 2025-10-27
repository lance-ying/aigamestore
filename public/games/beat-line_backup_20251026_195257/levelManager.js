// levelManager.js - Level loading and management

import { gameState, GAME_PHASE } from './globals.js';
import { LEVELS } from './levels.js';
import { Player } from './player.js';
import { Obstacle } from './entities.js';

export function loadLevel(levelIndex) {
  if (levelIndex < 0 || levelIndex >= LEVELS.length) {
    return false;
  }

  const level = LEVELS[levelIndex];
  gameState.currentLevel = levelIndex;
  gameState.levelScore = 0;
  gameState.perfectStreak = 0;
  gameState.cameraOffset = 0;
  gameState.trackSegments = [];
  gameState.obstacles = [];
  gameState.turnPoints = [...level.turnPoints];
  gameState.nextTurnIndex = 0;
  gameState.levelStartTime = Date.now();
  gameState.gameTime = 0;
  gameState.lastTapTime = 0;
  gameState.tapFeedback = [];
  gameState.particles = [];
  gameState.beatPulse = 0;
  gameState.gameOverReason = "";

  // Create player
  gameState.player = new Player(100, 200);
  gameState.entities = [gameState.player];

  // Generate initial track segments
  generateTrackSegments(level, 0, 1000);

  // Create obstacles
  for (const obstacleData of level.obstacles) {
    const obstacle = createObstacle(level, obstacleData);
    gameState.obstacles.push(obstacle);
    gameState.entities.push(obstacle);
  }

  return true;
}

function generateTrackSegments(level, startDistance, endDistance) {
  const segmentLength = 50;
  
  for (let dist = startDistance; dist <= endDistance; dist += segmentLength) {
    const segment = {
      distance: dist,
      x: getXForDistance(dist, level),
      y: getYForDistance(dist, level),
      width: level.trackWidth,
      direction: getDirectionForDistance(dist, level)
    };
    gameState.trackSegments.push(segment);
  }
}

function getXForDistance(distance, level) {
  let x = 100;
  let currentDir = { x: 1, y: 0 };
  let lastTurnDist = 0;

  for (const turn of level.turnPoints) {
    if (distance > turn.distance) {
      const segmentLength = turn.distance - lastTurnDist;
      x += currentDir.x * segmentLength;
      lastTurnDist = turn.distance;
      currentDir = getDirectionVector(turn.direction);
    } else {
      break;
    }
  }

  const remainingDist = distance - lastTurnDist;
  x += currentDir.x * remainingDist;
  return x;
}

function getYForDistance(distance, level) {
  let y = 200;
  let currentDir = { x: 1, y: 0 };
  let lastTurnDist = 0;

  for (const turn of level.turnPoints) {
    if (distance > turn.distance) {
      const segmentLength = turn.distance - lastTurnDist;
      y += currentDir.y * segmentLength;
      lastTurnDist = turn.distance;
      currentDir = getDirectionVector(turn.direction);
    } else {
      break;
    }
  }

  const remainingDist = distance - lastTurnDist;
  y += currentDir.y * remainingDist;
  return y;
}

function getDirectionForDistance(distance, level) {
  let direction = "RIGHT";
  
  for (const turn of level.turnPoints) {
    if (distance >= turn.distance) {
      direction = turn.direction;
    } else {
      break;
    }
  }
  
  return direction;
}

function getDirectionVector(direction) {
  switch (direction) {
    case "UP": return { x: 0, y: -1 };
    case "DOWN": return { x: 0, y: 1 };
    case "LEFT": return { x: -1, y: 0 };
    case "RIGHT": return { x: 1, y: 0 };
    default: return { x: 1, y: 0 };
  }
}

function createObstacle(level, obstacleData) {
  const x = getXForDistance(obstacleData.distance, level);
  const y = getYForDistance(obstacleData.distance, level);
  
  // Adjust position based on lane
  const direction = getDirectionForDistance(obstacleData.distance, level);
  const laneOffset = (obstacleData.lane - 0.5) * (level.trackWidth * 0.4);
  
  let finalX = x;
  let finalY = y;
  
  if (direction === "RIGHT" || direction === "LEFT") {
    finalY += laneOffset;
  } else {
    finalX += laneOffset;
  }

  return new Obstacle(
    finalX,
    finalY,
    obstacleData.width,
    obstacleData.height,
    obstacleData.type,
    obstacleData.moveSpeed || 0,
    obstacleData.moveRange || 0
  );
}

export function updateLevel(p) {
  const level = LEVELS[gameState.currentLevel];
  gameState.gameTime = Date.now() - gameState.levelStartTime;

  // Update camera to follow player
  gameState.cameraOffset = gameState.player.x - 150;

  // Generate new track segments ahead
  const maxDistance = gameState.player.getTraveledDistance() + 800;
  const currentMaxDist = Math.max(...gameState.trackSegments.map(s => s.distance), 0);
  
  if (currentMaxDist < maxDistance) {
    generateTrackSegments(level, currentMaxDist + 50, maxDistance);
  }

  // Remove old track segments
  gameState.trackSegments = gameState.trackSegments.filter(
    seg => seg.distance > gameState.player.getTraveledDistance() - 200
  );

  // Update beat pulse
  const beatInterval = 60000 / level.bpm;
  const timeSinceLastBeat = gameState.gameTime % beatInterval;
  gameState.beatPulse = Math.max(0, 255 - (timeSinceLastBeat / beatInterval) * 255);

  // Check for level completion
  if (gameState.player.getTraveledDistance() >= level.endDistance) {
    gameState.levelScore += 1000; // Level completion bonus
    gameState.score += 1000;
    
    if (gameState.currentLevel < LEVELS.length - 1) {
      gameState.gamePhase = GAME_PHASE.LEVEL_COMPLETE;
    } else {
      gameState.gamePhase = GAME_PHASE.GAME_OVER_WIN;
    }
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, level: gameState.currentLevel + 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}