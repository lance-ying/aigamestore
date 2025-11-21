import { gameState, GAME_PHASES } from './globals.js';

export function updateTime(p) {
  // Each hour takes about 90 seconds (5400 frames at 60fps)
  const hourDuration = 5400;
  
  gameState.timeProgress += 1 / hourDuration;
  
  if (gameState.timeProgress >= 1) {
    gameState.timeProgress = 0;
    gameState.currentHour++;
    
    // Log hour change
    p.logs.game_info.push({
      data: `Hour: ${gameState.currentHour} AM`,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Check win condition
    if (gameState.currentHour >= 6) {
      winNight(p);
    }
  }
}

function winNight(p) {
  gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  
  p.logs.game_info.push({
    data: `Night ${gameState.currentNight} completed!`,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function getTimeString() {
  return `${gameState.currentHour} AM`;
}

export function getTimeDisplay() {
  const hours = ['12', '1', '2', '3', '4', '5', '6'];
  return `${hours[gameState.currentHour]} AM`;
}