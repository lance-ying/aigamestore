// ui.js - UI rendering functions
import { gameState, GAME_STATES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(50, 120, 180);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('HAPPY HOOF CARE', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(18);
  p.text('Zoo Animal Care Simulator', CANVAS_WIDTH / 2, 130);
  
  // Description
  p.textSize(14);
  p.fill(230);
  const desc = 'Care for adorable zoo animals through\nfun mini-games! Keep them happy to win!';
  p.text(desc, CANVAS_WIDTH / 2, 180);
  
  // Instructions
  p.textSize(12);
  p.fill(200);
  const instructions = [
    'ARROW KEYS - Navigate & Control',
    'SPACE - Confirm & Activate Tools',
    'ESC - Pause Game',
    'R - Restart to Menu'
  ];
  
  let y = 240;
  instructions.forEach(inst => {
    p.text(inst, CANVAS_WIDTH / 2, y);
    y += 20;
  });
  
  // Start prompt
  p.textSize(20);
  p.fill(255, 255, 100);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 360);
  }
}

export function drawMenu(p) {
  p.background(50, 120, 180);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text('HAPPY HOOF CARE', CANVAS_WIDTH / 2, 80);
  
  const menuItems = ['PLAY', 'INSTRUCTIONS', 'HIGH SCORES'];
  
  menuItems.forEach((item, index) => {
    const y = 180 + index * 60;
    const isSelected = gameState.menuSelection === index;
    
    // Button background
    p.fill(isSelected ? [100, 180, 255] : [70, 140, 200]);
    p.rect(CANVAS_WIDTH / 2 - 120, y - 25, 240, 50, 10);
    
    // Button text
    p.fill(255);
    p.textSize(24);
    p.text(item, CANVAS_WIDTH / 2, y);
  });
}

export function drawInstructions(p) {
  p.background(50, 120, 180);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(32);
  p.text('HOW TO PLAY', CANVAS_WIDTH / 2, 20);
  
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(230);
  
  const instructions = [
    'OBJECTIVE:',
    '• Complete mini-games to increase animal happiness',
    '• Keep all animals happy (above 0%)',
    '• Complete required mini-games per level',
    '',
    'MINI-GAMES:',
    '• SHAVING - Remove dirt from animals',
    '• SHOWERING - Clean dirty spots with water',
    '• MAZE - Guide animals through obstacles',
    '• FEEDING - Feed correct food to animals',
    '',
    'SCORING:',
    '• +50 points per completed mini-game',
    '• +10 points per 10% happiness increase',
    '• +20 bonus for 80%+ efficiency',
    '• +100 for maxing animal happiness'
  ];
  
  let y = 70;
  instructions.forEach(line => {
    p.text(line, 40, y);
    y += 18;
  });
  
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text('Press SHIFT to return', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
}

export function drawHighScores(p) {
  p.background(50, 120, 180);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(32);
  p.text('HIGH SCORES', CANVAS_WIDTH / 2, 20);
  
  if (gameState.highScores.length === 0) {
    p.textSize(18);
    p.fill(200);
    p.text('No high scores yet!', CANVAS_WIDTH / 2, 150);
  } else {
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    
    gameState.highScores.forEach((score, index) => {
      const y = 80 + index * 30;
      p.fill(230);
      p.text(`${index + 1}. ${score}`, 150, y);
    });
  }
  
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text('Press SHIFT to return', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
}

export function drawAnimalSelect(p) {
  p.background(80, 150, 100);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(28);
  p.text(`Level ${gameState.currentLevel} - Select Animal`, CANVAS_WIDTH / 2, 20);
  
  // Draw animals
  gameState.animals.forEach((animal, index) => {
    const isSelected = gameState.animalSelection === index;
    
    p.push();
    
    // Highlight
    if (isSelected) {
      p.fill(255, 255, 150, 100);
      p.noStroke();
      p.rect(animal.x - 70, animal.y - 90, 140, 180, 10);
    }
    
    animal.draw(p);
    
    // Animal name
    p.fill(255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.text(animal.type, animal.x, animal.y + 80);
    
    p.pop();
  });
  
  // Mini-game selection
  if (gameState.animalSelection >= 0 && gameState.animalSelection < gameState.animals.length) {
    const selectedAnimal = gameState.animals[gameState.animalSelection];
    
    p.fill(255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(18);
    p.text('Choose Mini-Game:', CANVAS_WIDTH / 2, 320);
    
    selectedAnimal.availableMiniGames.forEach((game, index) => {
      const y = 350 + index * 30;
      const isSelected = gameState.minigameSelection === index;
      
      p.fill(isSelected ? [200, 255, 200] : [200]);
      p.textSize(14);
      p.text(game, CANVAS_WIDTH / 2, y);
    });
  }
  
  // Instructions
  p.fill(255, 255, 150);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text('ARROWS to select • SPACE to confirm', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
}

export function drawMiniGameIntro(p) {
  p.background(60, 60, 80);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text('GET READY!', CANVAS_WIDTH / 2, 100);
  
  p.textSize(24);
  p.text(gameState.selectedMinigame, CANVAS_WIDTH / 2, 150);
  
  // Instructions based on minigame type
  p.textSize(14);
  p.fill(230);
  let instructions = '';
  
  switch (gameState.selectedMinigame) {
    case 'SHAVING':
      instructions = 'Move cursor with ARROWS\nHold SPACE to shave off dirt';
      break;
    case 'SHOWERING':
      instructions = 'Move cursor with ARROWS\nHold SPACE to spray water';
      break;
    case 'MAZE':
      instructions = 'Use ARROWS to guide animal\nAvoid obstacles, reach the goal';
      break;
    case 'FEEDING':
      instructions = 'ARROWS to move arm\nSPACE to grab/release food\nFeed good food, avoid bad!';
      break;
  }
  
  p.text(instructions, CANVAS_WIDTH / 2, 220);
  
  p.textSize(20);
  p.fill(255, 255, 100);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text('SPACE to start • SHIFT to cancel', CANVAS_WIDTH / 2, 320);
  }
}

export function drawMiniGamePlaying(p) {
  p.background(180, 200, 220);
  
  // Draw the mini-game
  if (gameState.miniGameData) {
    gameState.miniGameData.draw(p);
  }
  
  // HUD
  drawHUD(p);
}

export function drawHUD(p) {
  // Score
  p.fill(255);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 20, 10);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Level: ${gameState.currentLevel}`, 20, 10);
  
  // Timer
  if (gameState.miniGameData) {
    const timeLeft = Math.ceil(gameState.miniGameData.timer / 60);
    const timerColor = timeLeft < 5 ? [255, 100, 100] : [255, 255, 255];
    p.fill(...timerColor);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(18);
    p.text(`Time: ${timeLeft}s`, CANVAS_WIDTH / 2, 10);
  }
  
  // Paused indicator
  if (gameState.gamePhase === 'PAUSED') {
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text('PAUSED', CANVAS_WIDTH - 20, 35);
  }
}

export function drawMiniGameComplete(p) {
  p.background(60, 60, 80);
  
  const data = gameState.miniGameData;
  const success = data.success;
  
  p.fill(success ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(success ? 'SUCCESS!' : 'FAILED!', CANVAS_WIDTH / 2, 100);
  
  p.fill(255);
  p.textSize(18);
  
  if (success) {
    const pointsEarned = 50 + Math.floor(data.efficiency >= 80 ? 20 : 0);
    p.text(`Points Earned: +${pointsEarned}`, CANVAS_WIDTH / 2, 160);
    p.text(`Efficiency: ${Math.floor(data.efficiency)}%`, CANVAS_WIDTH / 2, 190);
    
    const happinessGain = 20;
    p.text(`Animal Happiness: +${happinessGain}`, CANVAS_WIDTH / 2, 220);
  } else {
    p.text('Try again!', CANVAS_WIDTH / 2, 180);
    p.textSize(14);
    p.text('Animal Happiness: -5', CANVAS_WIDTH / 2, 220);
  }
  
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text('Press SPACE to continue', CANVAS_WIDTH / 2, 320);
}

export function drawLevelComplete(p) {
  p.background(80, 150, 100);
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(24);
  p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  
  if (gameState.currentLevel < 5) {
    p.textSize(18);
    p.text('New animals and challenges await!', CANVAS_WIDTH / 2, 250);
  }
  
  p.textSize(20);
  p.fill(255, 255, 100);
  p.text('Press SPACE to continue', CANVAS_WIDTH / 2, 320);
}

export function drawGameWin(p) {
  p.background(100, 200, 100);
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('CONGRATULATIONS!', CANVAS_WIDTH / 2, 100);
  
  p.fill(255);
  p.textSize(28);
  p.text('You are a Zoo Tycoon!', CANVAS_WIDTH / 2, 160);
  
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  p.textSize(18);
  p.fill(255, 255, 150);
  p.text('All animals are happy!', CANVAS_WIDTH / 2, 270);
  
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text('Press R to play again', CANVAS_WIDTH / 2, 340);
}

export function drawGameOver(p) {
  p.background(120, 50, 50);
  
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
  
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  p.textSize(16);
  p.fill(230);
  
  let reason = '';
  if (gameState.animals.some(a => a.happiness <= 0)) {
    reason = 'An animal became too unhappy!';
  } else if (gameState.failedMiniGamesCount >= 3) {
    reason = 'Too many mini-game failures!';
  }
  p.text(reason, CANVAS_WIDTH / 2, 230);
  
  p.textSize(18);
  p.fill(255, 255, 100);
  p.text('Press R to restart', CANVAS_WIDTH / 2, 320);
}