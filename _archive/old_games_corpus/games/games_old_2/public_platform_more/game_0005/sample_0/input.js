// input.js - Input handling

import { gameState, GAME_PHASES, BATTLE_PHASES } from './globals.js';
import { selectCard, playSelectedCards } from './battle.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase control keys
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame();
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame();
    }
    return;
  }
  
  // Game controls
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (gameState.battlePhase !== BATTLE_PHASES.PLAYER_SELECT) return;
  
  // Arrow keys for card selection
  if (keyCode === 37) { // LEFT
    if (gameState.selectedCardIndex > 0) {
      gameState.selectedCardIndex--;
    } else {
      gameState.selectedCardIndex = gameState.hand.length - 1;
    }
  } else if (keyCode === 39) { // RIGHT
    if (gameState.selectedCardIndex < gameState.hand.length - 1) {
      gameState.selectedCardIndex++;
    } else {
      gameState.selectedCardIndex = 0;
    }
  } else if (keyCode === 32) { // SPACE
    if (gameState.selectedCardIndex >= 0 && gameState.selectedCardIndex < gameState.hand.length) {
      const wasSelected = gameState.selectedCards.includes(gameState.selectedCardIndex);
      selectCard(gameState.selectedCardIndex);
      
      // If we have selected cards and just deselected, or have 3 cards, play them
      if (gameState.selectedCards.length === 3 || (wasSelected && gameState.selectedCards.length > 0)) {
        playSelectedCards(p);
      }
    } else if (gameState.selectedCards.length > 0) {
      playSelectedCards(p);
    }
  } else if (keyCode === 90) { // Z
    if (gameState.selectedCards.length > 0) {
      const lastSelected = gameState.selectedCards[gameState.selectedCards.length - 1];
      selectCard(lastSelected);
    }
  }
  
  gameState.hoveredCardIndex = gameState.selectedCardIndex;
}

function startGame() {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.PLAYING },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
  
  // Initialize game
  import('./hero.js').then(heroModule => {
    gameState.heroes = heroModule.createHeroParty();
    gameState.player = gameState.heroes[0];
    
    import('./card.js').then(cardModule => {
      gameState.deck = cardModule.createStarterDeck();
      gameState.hand = [];
      gameState.discardPile = [];
      
      import('./battle.js').then(battleModule => {
        battleModule.shuffleDeck(window.gameInstance);
        
        import('./enemy.js').then(enemyModule => {
          gameState.enemies = enemyModule.createEnemyWave(gameState.battleNumber);
          gameState.entities = [...gameState.heroes, ...gameState.enemies];
          
          battleModule.startBattle(window.gameInstance);
        });
      });
    });
  });
}

function restartGame() {
  // Reset game state
  gameState.gamePhase = GAME_PHASES.START;
  gameState.battlePhase = BATTLE_PHASES.PLAYER_SELECT;
  gameState.turnNumber = 1;
  gameState.selectedCards = [];
  gameState.currentSteam = 3;
  gameState.maxSteam = 3;
  gameState.heroes = [];
  gameState.enemies = [];
  gameState.deck = [];
  gameState.hand = [];
  gameState.discardPile = [];
  gameState.gold = 0;
  gameState.experience = 0;
  gameState.battleNumber = 1;
  gameState.score = 0;
  gameState.animations = [];
  gameState.selectedCardIndex = -1;
  gameState.hoveredCardIndex = -1;
  gameState.entities = [];
  gameState.player = null;
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.START },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}