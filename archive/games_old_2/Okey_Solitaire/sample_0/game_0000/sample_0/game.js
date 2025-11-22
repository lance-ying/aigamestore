import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Tile, createDeck, shuffleDeck } from './tile.js';
import { validateHand, evaluateHandStrength } from './validation.js';
import { aiTakeTurn } from './ai.js';
import { drawStartScreen, drawGameplay, drawGameOver, drawLevelComplete } from './rendering.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  function logGameInfo(data) {
    p.logs.game_info.push({
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logInput(inputType, data) {
    p.logs.inputs.push({
      input_type: inputType,
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logPlayerInfo() {
    if (gameState.players[0] && gameState.players[0].length > 0) {
      const firstTile = gameState.players[0][0];
      p.logs.player_info.push({
        screen_x: firstTile.x,
        screen_y: firstTile.y,
        game_x: firstTile.x,
        game_y: firstTile.y,
        framecount: p.frameCount
      });
    }
  }

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Load high score
    const savedHighScore = localStorage.getItem('okeyHighScore');
    if (savedHighScore) {
      gameState.highScore = parseInt(savedHighScore);
    }
    
    logGameInfo({ phase: 'START', message: 'Game initialized' });
  };

  p.draw = function() {
    if (gameState.gamePhase === 'START') {
      drawStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING') {
      updateGame(p);
      drawGameplay(p);
    } else if (gameState.gamePhase === 'PAUSED') {
      drawGameplay(p);
    } else if (gameState.gamePhase === 'GAME_OVER_WIN') {
      drawGameOver(p, true);
    } else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
      drawGameOver(p, false);
    } else if (gameState.internalPhase === 'LEVEL_COMPLETE') {
      drawLevelComplete(p);
    }
  };

  function updateGame(p) {
    // Update animating tiles
    for (const tile of gameState.drawPile) {
      tile.update();
    }
    for (const hand of gameState.players) {
      if (hand) {
        for (const tile of hand) {
          tile.update();
        }
      }
    }
    
    // Handle internal phases
    if (gameState.internalPhase === 'DEALING') {
      // Skip - dealing is instant for simplicity
    } else if (gameState.internalPhase === 'AI_TURN') {
      gameState.aiThinkingTime++;
      
      if (gameState.aiThinkingTime > 30) { // 0.5 second thinking time
        const result = aiTakeTurn(gameState.currentPlayer, p);
        
        if (result === 'WIN') {
          endGame(false);
          return;
        } else if (result === 'NO_TILES') {
          endGame(false);
          return;
        }
        
        gameState.aiThinkingTime = 0;
        gameState.currentPlayer = (gameState.currentPlayer + 1) % 4;
        
        if (gameState.currentPlayer === 0) {
          gameState.internalPhase = 'PLAYER_DRAW';
          gameState.hasDrawn = false;
          gameState.focusMode = 'HAND';
          gameState.selectedTileIndex = 0;
        } else {
          gameState.internalPhase = 'AI_TURN';
        }
      }
    }
    
    // Check for automated testing
    if (gameState.controlMode !== 'HUMAN') {
      handleAutomatedControl(p);
    }
    
    logPlayerInfo();
  }

  function handleAutomatedControl(p) {
    if (gameState.controlMode === 'TEST_1') {
      // Basic testing - just play through
      if (gameState.internalPhase === 'PLAYER_DRAW' && !gameState.hasDrawn) {
        if (p.frameCount % 60 === 0) {
          drawTileForPlayer();
        }
      } else if (gameState.internalPhase === 'PLAYER_DISCARD') {
        if (p.frameCount % 60 === 30) {
          discardRandomTile();
        }
      }
    } else if (gameState.controlMode === 'TEST_2') {
      // Win scenario - force a winning hand
      if (gameState.internalPhase === 'PLAYER_DRAW' && !gameState.hasDrawn) {
        if (p.frameCount % 60 === 0) {
          createWinningHand();
          gameState.hasDrawn = true;
          gameState.internalPhase = 'PLAYER_DISCARD';
        }
      } else if (gameState.internalPhase === 'PLAYER_DISCARD') {
        if (p.frameCount % 60 === 30) {
          endGame(true);
        }
      }
    }
  }

  function createWinningHand() {
    const hand = [];
    // Create sets and runs
    hand.push(new Tile('RED', 1));
    hand.push(new Tile('BLUE', 1));
    hand.push(new Tile('BLACK', 1));
    
    hand.push(new Tile('RED', 5));
    hand.push(new Tile('RED', 6));
    hand.push(new Tile('RED', 7));
    
    hand.push(new Tile('BLUE', 10));
    hand.push(new Tile('BLACK', 10));
    hand.push(new Tile('YELLOW', 10));
    
    hand.push(new Tile('YELLOW', 3));
    hand.push(new Tile('YELLOW', 4));
    hand.push(new Tile('YELLOW', 5));
    hand.push(new Tile('YELLOW', 6));
    hand.push(new Tile('YELLOW', 7));
    
    gameState.players[0] = hand;
  }

  function drawTileForPlayer() {
    if (gameState.drawPile.length > 0) {
      const tile = gameState.drawPile.pop();
      gameState.players[0].push(tile);
      gameState.hasDrawn = true;
      gameState.internalPhase = 'PLAYER_DISCARD';
      gameState.pickedUpTileIndex = -1;
    }
  }

  function discardRandomTile() {
    const hand = gameState.players[0];
    if (hand.length > 14) {
      const discardIndex = Math.floor(p.random() * hand.length);
      const tile = hand.splice(discardIndex, 1)[0];
      gameState.discardPiles[0].push(tile);
      
      gameState.currentPlayer = 1;
      gameState.internalPhase = 'AI_TURN';
      gameState.selectedTileIndex = 0;
      gameState.pickedUpTileIndex = -1;
    }
  }

  p.keyPressed = function() {
    logInput('keyPressed', { key: p.key, keyCode: p.keyCode });
    
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === 'START') {
        startGame();
      } else if (gameState.internalPhase === 'LEVEL_COMPLETE') {
        if (gameState.level <= 3) {
          startLevel();
        } else {
          // Game complete
          endGame(true);
        }
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === 'PLAYING') {
        gameState.gamePhase = 'PAUSED';
        logGameInfo({ phase: 'PAUSED' });
      } else if (gameState.gamePhase === 'PAUSED') {
        gameState.gamePhase = 'PLAYING';
        logGameInfo({ phase: 'PLAYING' });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
        resetGame();
      }
    }
    
    if (gameState.gamePhase === 'PLAYING' && gameState.controlMode === 'HUMAN') {
      handlePlayerInput(p.keyCode);
    }
  };

  function handlePlayerInput(keyCode) {
    if (gameState.currentPlayer !== 0) return;
    
    const hand = gameState.players[0];
    
    if (gameState.internalPhase === 'PLAYER_DRAW') {
      if (keyCode === 38) { // Arrow Up
        if (gameState.focusMode === 'HAND') {
          gameState.focusMode = 'DRAW_CENTER';
        } else if (gameState.focusMode === 'DRAW_CENTER') {
          const prevPlayer = 3;
          if (gameState.discardPiles[prevPlayer].length > 0) {
            gameState.focusMode = 'DRAW_DISCARD';
          }
        } else if (gameState.focusMode === 'DRAW_DISCARD') {
          gameState.focusMode = 'DRAW_CENTER';
        }
      } else if (keyCode === 40) { // Arrow Down
        gameState.focusMode = 'HAND';
      } else if (keyCode === 32) { // Space
        if (gameState.focusMode === 'DRAW_CENTER') {
          if (gameState.drawPile.length > 0) {
            const tile = gameState.drawPile.pop();
            hand.push(tile);
            gameState.hasDrawn = true;
            gameState.internalPhase = 'PLAYER_DISCARD';
            gameState.focusMode = 'HAND';
            gameState.selectedTileIndex = hand.length - 1;
          }
        } else if (gameState.focusMode === 'DRAW_DISCARD') {
          const prevPlayer = 3;
          if (gameState.discardPiles[prevPlayer].length > 0) {
            const tile = gameState.discardPiles[prevPlayer].pop();
            hand.push(tile);
            gameState.hasDrawn = true;
            gameState.internalPhase = 'PLAYER_DISCARD';
            gameState.focusMode = 'HAND';
            gameState.selectedTileIndex = hand.length - 1;
          }
        }
      }
    } else if (gameState.internalPhase === 'PLAYER_DISCARD') {
      if (keyCode === 37) { // Arrow Left
        if (gameState.pickedUpTileIndex >= 0) {
          // Move picked up tile left
          if (gameState.pickedUpTileIndex > 0) {
            const tile = hand[gameState.pickedUpTileIndex];
            hand.splice(gameState.pickedUpTileIndex, 1);
            hand.splice(gameState.pickedUpTileIndex - 1, 0, tile);
            gameState.pickedUpTileIndex--;
            gameState.selectedTileIndex = gameState.pickedUpTileIndex;
          }
        } else {
          if (gameState.selectedTileIndex > 0) {
            gameState.selectedTileIndex--;
          }
        }
      } else if (keyCode === 39) { // Arrow Right
        if (gameState.pickedUpTileIndex >= 0) {
          // Move picked up tile right
          if (gameState.pickedUpTileIndex < hand.length - 1) {
            const tile = hand[gameState.pickedUpTileIndex];
            hand.splice(gameState.pickedUpTileIndex, 1);
            hand.splice(gameState.pickedUpTileIndex + 1, 0, tile);
            gameState.pickedUpTileIndex++;
            gameState.selectedTileIndex = gameState.pickedUpTileIndex;
          }
        } else {
          if (gameState.selectedTileIndex < hand.length - 1) {
            gameState.selectedTileIndex++;
          }
        }
      } else if (keyCode === 32) { // Space
        if (gameState.pickedUpTileIndex >= 0) {
          // Put down tile
          gameState.pickedUpTileIndex = -1;
        } else if (gameState.selectedTileIndex >= 0 && gameState.selectedTileIndex < hand.length) {
          // Pick up tile
          gameState.pickedUpTileIndex = gameState.selectedTileIndex;
        }
      } else if (keyCode === 68) { // D - Discard
        if (gameState.pickedUpTileIndex >= 0) {
          const tile = hand.splice(gameState.pickedUpTileIndex, 1)[0];
          gameState.discardPiles[0].push(tile);
          
          gameState.pickedUpTileIndex = -1;
          gameState.selectedTileIndex = Math.min(gameState.selectedTileIndex, hand.length - 1);
          
          gameState.currentPlayer = 1;
          gameState.internalPhase = 'AI_TURN';
          gameState.hasDrawn = false;
        }
      } else if (keyCode === 90) { // Z - Declare Okey
        if (hand.length === 14 && validateHand(hand, gameState.okeyTile)) {
          endRound(true);
        } else if (hand.length === 15) {
          // Must discard first
        }
      }
    }
  }

  function startGame() {
    gameState.score = 0;
    gameState.level = 1;
    gameState.gamePhase = 'PLAYING';
    gameState.internalPhase = 'DEALING';
    
    logGameInfo({ phase: 'PLAYING', level: 1 });
    
    startLevel();
  }

  function startLevel() {
    // Create and shuffle deck
    const deck = createDeck();
    gameState.drawPile = shuffleDeck(deck, p);
    
    // Deal tiles
    gameState.players = [[], [], [], []];
    gameState.discardPiles = [[], [], [], []];
    
    for (let i = 0; i < 14; i++) {
      for (let player = 0; player < 4; player++) {
        if (gameState.drawPile.length > 0) {
          gameState.players[player].push(gameState.drawPile.pop());
        }
      }
    }
    
    // Set Okey tile
    if (gameState.drawPile.length > 0) {
      const okeyIndicator = gameState.drawPile.pop();
      const okeyNumber = (okeyIndicator.number % 13) + 1;
      gameState.okeyTile = new Tile(okeyIndicator.color, okeyNumber);
    }
    
    // Apply level difficulty
    if (gameState.level === 1) {
      // Give player a slightly better hand
      improvePl ayerHand();
    }
    
    gameState.currentPlayer = 0;
    gameState.internalPhase = 'PLAYER_DRAW';
    gameState.hasDrawn = false;
    gameState.selectedTileIndex = 0;
    gameState.pickedUpTileIndex = -1;
    gameState.focusMode = 'HAND';
    
    logGameInfo({ phase: 'LEVEL_START', level: gameState.level });
  }

  function improvePlayerHand() {
    // For level 1, try to give player some matching tiles
    const hand = gameState.players[0];
    const numbers = {};
    
    for (const tile of hand) {
      if (!tile.isJoker) {
        if (!numbers[tile.number]) numbers[tile.number] = [];
        numbers[tile.number].push(tile);
      }
    }
    
    // If no pairs, swap tiles to create some
    let hasPair = false;
    for (const num in numbers) {
      if (numbers[num].length >= 2) {
        hasPair = true;
        break;
      }
    }
    
    if (!hasPair && gameState.drawPile.length > 5) {
      // Swap a tile with one from the deck that creates a pair
      for (let i = 0; i < 3 && !hasPair; i++) {
        const deckTile = gameState.drawPile[i];
        for (let j = 0; j < hand.length; j++) {
          if (hand[j].number === deckTile.number && hand[j].color !== deckTile.color) {
            const temp = hand[j];
            hand[j] = gameState.drawPile.splice(i, 1)[0];
            gameState.drawPile.push(temp);
            hasPair = true;
            break;
          }
        }
      }
    }
  }

  function endRound(playerWon) {
    if (playerWon) {
      // Calculate score
      const baseScore = 500;
      const tileBonus = gameState.players[0].filter(t => !t.isJoker && (!gameState.okeyTile || t.number !== gameState.okeyTile.number || t.color !== gameState.okeyTile.color)).length * 50;
      const opponentBonus = 300;
      const levelBonus = 1000;
      const multiplier = 1 + (gameState.level - 1) * 0.1;
      
      gameState.roundScore = Math.floor((baseScore + tileBonus + opponentBonus) * multiplier + levelBonus);
      gameState.score += gameState.roundScore;
      
      if (gameState.level < 3) {
        gameState.level++;
        gameState.internalPhase = 'LEVEL_COMPLETE';
      } else {
        endGame(true);
      }
    } else {
      endGame(false);
    }
  }

  function endGame(won) {
    gameState.gamePhase = won ? 'GAME_OVER_WIN' : 'GAME_OVER_LOSE';
    
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      localStorage.setItem('okeyHighScore', gameState.highScore.toString());
    }
    
    logGameInfo({ phase: gameState.gamePhase, score: gameState.score });
  }

  function resetGame() {
    gameState.gamePhase = 'START';
    gameState.score = 0;
    gameState.level = 1;
    gameState.internalPhase = 'MENU';
    
    logGameInfo({ phase: 'START', message: 'Game reset' });
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switcher
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};