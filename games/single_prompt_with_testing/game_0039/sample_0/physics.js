import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;
import { gameState } from './globals.js';

export function setupCollisionHandling(engine, p) {
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check player checkpoint collision
      if ((bodyA.label === 'player' || bodyB.label === 'player')) {
        const other = bodyA.label === 'player' ? bodyB : bodyA;
        
        if (other.label && other.label.startsWith('checkpoint_')) {
          const checkpointIndex = parseInt(other.label.split('_')[1]);
          handleCheckpointCollision(gameState.player, checkpointIndex, p);
        }
        
        if (other.label === 'wall') {
          // Wall collision feedback
          const velocity = Math.sqrt(
            Math.pow(bodyA.velocity.x, 2) + Math.pow(bodyA.velocity.y, 2)
          );
          if (velocity > 5) {
            // Significant crash - reduce score
            gameState.score = Math.max(0, gameState.score - 10);
          }
        }
      }
      
      // Check AI checkpoint collision
      if ((bodyA.label === 'ai' || bodyB.label === 'ai')) {
        const aiBody = bodyA.label === 'ai' ? bodyA : bodyB;
        const other = bodyA.label === 'ai' ? bodyB : bodyA;
        
        if (other.label && other.label.startsWith('checkpoint_')) {
          const checkpointIndex = parseInt(other.label.split('_')[1]);
          // Find AI opponent
          for (let ai of gameState.aiOpponents) {
            if (ai.body === aiBody) {
              handleCheckpointCollision(ai, checkpointIndex, p);
              break;
            }
          }
        }
      }
    });
  });
}

function handleCheckpointCollision(vehicle, checkpointIndex, p) {
  // Check if this is the next expected checkpoint
  if (checkpointIndex === vehicle.currentCheckpoint) {
    vehicle.currentCheckpoint++;
    
    // Check if completed lap
    if (vehicle.currentCheckpoint >= gameState.checkpoints.length) {
      vehicle.currentCheckpoint = 0;
      vehicle.lapCount++;
      
      if (vehicle.isPlayer) {
        gameState.lapCount = vehicle.lapCount;
        gameState.score += 100;
        
        // Award drift bonus
        if (gameState.driftScore > 50) {
          gameState.score += Math.floor(gameState.driftScore / 10);
        }
        gameState.driftScore = 0;
      }
      
      // Check if finished race
      if (vehicle.lapCount >= gameState.maxLaps) {
        vehicle.finished = true;
        vehicle.finishTime = Date.now() - gameState.raceStartTime;
        
        if (vehicle.isPlayer) {
          gameState.playerFinished = true;
          gameState.raceEndTime = vehicle.finishTime;
          checkRaceEnd(p);
        } else {
          gameState.aiFinishTimes.push(vehicle.finishTime);
        }
      }
    } else {
      if (vehicle.isPlayer) {
        gameState.score += 20;
        gameState.currentCheckpoint = vehicle.currentCheckpoint;
      }
    }
    
    // Update AI target
    if (!vehicle.isPlayer) {
      vehicle.targetCheckpoint = vehicle.currentCheckpoint;
    }
  }
}

function checkRaceEnd(p) {
  if (gameState.playerFinished) {
    // Determine position
    let position = 1;
    for (let time of gameState.aiFinishTimes) {
      if (time < gameState.raceEndTime) {
        position++;
      }
    }
    
    if (position === 1) {
      gameState.gamePhase = "GAME_OVER_WIN";
      gameState.score += 500;
    } else {
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
    
    p.logs.game_info.push({
      data: { 
        gamePhase: gameState.gamePhase,
        position: position,
        time: gameState.raceEndTime,
        score: gameState.score
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}