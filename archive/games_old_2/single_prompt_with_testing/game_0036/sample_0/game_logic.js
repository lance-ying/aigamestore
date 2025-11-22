// game_logic.js - Core game logic and state management
import { gameState, GAME_PHASES } from './globals.js';
import { getSceneData } from './story_data.js';
import { createParticleEffect } from './rendering.js';

export function processChoice(p, choiceIndex) {
  const scene = getSceneData(gameState.currentChapter, gameState.currentScene);
  const choice = scene.choices[choiceIndex];
  
  if (!choice) return;
  
  // Check requirements
  if (choice.requiresCharm && gameState.player.charm < choice.requiresCharm) {
    createParticleEffect(300, 200, [180, 60, 60]);
    return; // Cannot select this choice
  }
  if (choice.requiresWisdom && gameState.player.wisdom < choice.requiresWisdom) {
    createParticleEffect(300, 200, [180, 60, 60]);
    return;
  }
  if (choice.requiresCourage && gameState.player.courage < choice.requiresCourage) {
    createParticleEffect(300, 200, [180, 60, 60]);
    return;
  }
  
  // Log choice
  gameState.choicesMade.push({
    chapter: gameState.currentChapter,
    scene: gameState.currentScene,
    choiceIndex: choiceIndex,
    text: choice.text,
    deathMessage: choice.deathMessage || null
  });
  
  // Apply stat changes
  if (choice.statChanges) {
    Object.keys(choice.statChanges).forEach(stat => {
      gameState.player[stat] += choice.statChanges[stat];
      gameState.player[stat] = Math.max(0, Math.min(150, gameState.player[stat]));
    });
    
    // Visual feedback for stat changes
    createParticleEffect(500, 20, [220, 180, 80]);
  }
  
  // Award score
  const scoreGain = 10 + Math.floor(gameState.currentChapter * 5);
  gameState.score += scoreGain;
  
  // Collect items
  if (choice.item) {
    gameState.inventory.push(choice.item);
    gameState.score += 50;
    createParticleEffect(300, 200, [255, 215, 0]);
  }
  
  // Discover hidden stories
  if (choice.hiddenStory) {
    gameState.hiddenStoriesFound.push(choice.hiddenStory);
    gameState.score += 30;
    createParticleEffect(300, 200, [150, 100, 255]);
  }
  
  // Log player info
  p.logs.player_info.push({
    screen_x: gameState.player.x,
    screen_y: gameState.player.y,
    game_x: gameState.player.x,
    game_y: gameState.player.y,
    framecount: p.frameCount
  });
  
  // Handle outcome
  switch (choice.outcome) {
    case 'death':
      gameState.deathCount++;
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, reason: "death", chapter: gameState.currentChapter },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      break;
      
    case 'win':
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      gameState.score += 1000; // Victory bonus
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      break;
      
    case 'chapter_complete':
      advanceChapter(p);
      break;
      
    case 'success':
    case 'neutral':
    case 'risky':
      if (choice.nextScene !== undefined) {
        gameState.currentScene = choice.nextScene;
        gameState.selectedOption = 0;
      }
      break;
  }
}

function advanceChapter(p) {
  gameState.currentChapter++;
  gameState.currentScene = 0;
  gameState.selectedOption = 0;
  gameState.score += 100; // Chapter completion bonus
  
  // Bonus for balanced stats
  const avgStat = (gameState.player.charm + gameState.player.wisdom + gameState.player.courage) / 3;
  const maxDiff = Math.max(
    Math.abs(gameState.player.charm - avgStat),
    Math.abs(gameState.player.wisdom - avgStat),
    Math.abs(gameState.player.courage - avgStat)
  );
  
  if (maxDiff < 15) {
    gameState.score += 50; // Balance bonus
  }
  
  p.logs.game_info.push({
    data: { event: "chapter_complete", chapter: gameState.currentChapter - 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  gameState.animationFrame++;
  
  // Gradually decay very high stats toward 100 (balance mechanism)
  if (gameState.player.charm > 100) gameState.player.charm -= 0.1;
  if (gameState.player.wisdom > 100) gameState.player.wisdom -= 0.1;
  if (gameState.player.courage > 100) gameState.player.courage -= 0.1;
}

export function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentChapter = 1;
  gameState.currentScene = 0;
  gameState.selectedOption = 0;
  gameState.score = 0;
  gameState.deathCount = 0;
  gameState.choicesMade = [];
  gameState.inventory = [];
  gameState.hiddenStoriesFound = [];
  gameState.showingStats = false;
  gameState.animationFrame = 0;
  gameState.particleEffects = [];
  
  gameState.player = {
    charm: 50,
    wisdom: 50,
    courage: 50,
    x: 300,
    y: 200
  };
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, event: "reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}