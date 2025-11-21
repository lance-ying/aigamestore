import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, CARD_TEMPLATES, ENEMY_TEMPLATES, MAX_ENERGY, STARTING_HAND_SIZE, PLAYER_MAX_HEALTH, drawCard, shuffleArray, getGameState } from './globals.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Card } from './card.js';
import { drawStartScreen, drawPauseIndicator, drawGameOverScreen, drawBattleUI, drawRewardScreen } from './game_screens.js';
import game_testing_controller from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize the logs
  p.logs = {
    "game_info": [],
    "player_info": [],
    "inputs": []
  };

  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    p.textFont('Arial');
    
    // Initialize game state
    resetGame();
    
    // Log initial game state
    logGameInfo("Game initialized", {});
  };

  // Draw function
  p.draw = function() {
    p.background(30, 30, 40);
    
    // Update animations
    updateAnimations();
    
    // Handle different game phases
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen(p);
        break;
      case "PLAYING":
        drawPlayingScreen();
        break;
      case "PAUSED":
        drawPlayingScreen();
        drawPauseIndicator(p);
        break;
      case "GAME_OVER_WIN":
        drawPlayingScreen();
        drawGameOverScreen(p, true);
        break;
      case "GAME_OVER_LOSE":
        drawPlayingScreen();
        drawGameOverScreen(p, false);
        break;
    }
    
    // Draw animations
    drawAnimations();
    
    // Handle automated testing if not in HUMAN mode
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode !== "HUMAN") {
      const testAction = window.game_testing_controller(gameState);
      if (testAction !== null) {
        handleTestAction(testAction);
      }
    }
  };

  // Function to update animations
  function updateAnimations() {
    gameState.animations = gameState.animations.filter(anim => {
      anim.update();
      return !anim.isDone();
    });
  }

  // Function to draw animations
  function drawAnimations() {
    gameState.animations.forEach(anim => {
      anim.draw(p);
    });
  }

  // Function to add damage number animation
  function addDamageNumber(x, y, value, color = [255, 50, 50]) {
    gameState.animations.push({
      x: x,
      y: y,
      value: value,
      color: color,
      life: 60,
      update: function() {
        this.y -= 2;
        this.life--;
      },
      isDone: function() {
        return this.life <= 0;
      },
      draw: function(p) {
        p.push();
        p.fill(this.color[0], this.color[1], this.color[2], (this.life / 60) * 255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(24);
        p.strokeWeight(2);
        p.stroke(0, 0, 0, (this.life / 60) * 200);
        p.text(this.value, this.x, this.y);
        p.pop();
      }
    });
  }

  // Function to add block gained animation
  function addBlockNumber(x, y, value) {
    addDamageNumber(x, y, "+" + value, [100, 180, 255]);
  }

  // Function to add attack animation from enemy to player
  function addEnemyAttackAnimation(fromX, fromY, toX, toY, damage) {
    const duration = 15;
    gameState.animations.push({
      x: fromX,
      y: fromY,
      targetX: toX,
      targetY: toY,
      damage: damage,
      life: duration,
      maxLife: duration,
      update: function() {
        const progress = 1 - (this.life / this.maxLife);
        this.x = fromX + (toX - fromX) * progress;
        this.y = fromY + (toY - fromY) * progress;
        this.life--;
      },
      isDone: function() {
        return this.life <= 0;
      },
      draw: function(p) {
        p.push();
        const alpha = (this.life / this.maxLife) * 255;
        p.fill(255, 50, 50, alpha);
        p.noStroke();
        p.ellipse(this.x, this.y, 20, 20);
        
        // Draw sword slash effect
        p.stroke(255, 100, 100, alpha);
        p.strokeWeight(4);
        p.line(this.x - 15, this.y - 15, this.x + 15, this.y + 15);
        p.line(this.x + 15, this.y - 15, this.x - 15, this.y + 15);
        p.pop();
      }
    });
  }

  // Function to add card play animation
  function addCardPlayAnimation(fromX, fromY, toX, toY, card) {
    const duration = 20;
    gameState.animations.push({
      x: fromX,
      y: fromY,
      targetX: toX,
      targetY: toY,
      card: card,
      life: duration,
      maxLife: duration,
      update: function() {
        const progress = 1 - (this.life / this.maxLife);
        this.x = fromX + (toX - fromX) * progress;
        this.y = fromY + (toY - fromY) * progress;
        this.life--;
      },
      isDone: function() {
        return this.life <= 0;
      },
      draw: function(p) {
        p.push();
        const alpha = (this.life / this.maxLife) * 255;
        p.tint(255, alpha);
        this.card.draw(p, this.x - 55, this.y - 60, false);
        p.pop();
      }
    });
  }

  // Function to draw the playing screen
  function drawPlayingScreen() {
    // Draw background
    p.background(30, 30, 40);
    
    // Draw player
    if (gameState.player) {
      gameState.player.draw(p);
      
      // Log player info occasionally
      if (p.frameCount % 30 === 0) {
        logPlayerInfo();
      }
    }
    
    // Draw current enemy
    if (gameState.currentEnemy) {
      gameState.currentEnemy.draw(p);
    }
    
    // Draw UI elements
    drawBattleUI(p);
    
    // Draw hand
    drawHand();
    
    // Draw reward screen if in reward state
    if (gameState.battleState === "REWARD") {
      drawRewardScreen(p);
    }
  }

  // Function to draw the player's hand
  function drawHand() {
    const handSize = gameState.hand.length;
    if (handSize === 0) return;
    
    const cardWidth = 110;
    const spacing = Math.min(cardWidth + 10, (CANVAS_WIDTH - cardWidth) / (handSize + 1));
    const startX = (CANVAS_WIDTH - (spacing * (handSize - 1) + cardWidth)) / 2;
    const baseY = CANVAS_HEIGHT - 180;
    
    for (let i = 0; i < handSize; i++) {
      const x = startX + i * spacing;
      let y = baseY;
      
      // Raise the selected card
      if (i === gameState.selectedCardIndex) {
        y -= 30;
      }
      
      // Dim cards that can't be played due to energy
      const canPlay = gameState.hand[i].energy <= gameState.energy && gameState.turn === "PLAYER";
      p.push();
      if (!canPlay) {
        p.tint(255, 150);
      }
      
      gameState.hand[i].draw(p, x, y, i === gameState.selectedCardIndex);
      p.pop();
    }
  }

  // Function to reset the game
  function resetGame() {
    // Create player
    gameState.player = new Player();
    
    // Reset game state
    gameState.gamePhase = "START";
    gameState.enemies = createEnemies();
    gameState.currentEnemyIndex = 0;
    gameState.currentEnemy = gameState.enemies[0];
    gameState.deck = createStarterDeck();
    gameState.hand = [];
    gameState.drawPile = [...gameState.deck];
    gameState.discardPile = [];
    gameState.energy = MAX_ENERGY;
    gameState.turn = "PLAYER";
    gameState.selectedCardIndex = 0;
    gameState.viewingPile = null;
    gameState.battleState = "SELECT_CARD";
    gameState.availableRewards = [];
    gameState.selectedRewardIndex = 0;
    gameState.battleCount = 0;
    gameState.animations = [];
    
    // Shuffle the draw pile
    shuffleArray(gameState.drawPile);
    
    // Log game reset
    logGameInfo("Game reset", {});
  }

  // Function to start the game
  function startGame() {
    gameState.gamePhase = "PLAYING";
    startBattle();
    
    // Log game start
    logGameInfo("Game started", {});
  }

  // Function to start a battle
  function startBattle() {
    // Reset battle state
    gameState.turn = "PLAYER";
    gameState.energy = MAX_ENERGY;
    gameState.hand = [];
    gameState.battleState = "SELECT_CARD";
    
    // Move all cards back to draw pile
    gameState.drawPile = [...gameState.deck];
    gameState.discardPile = [];
    shuffleArray(gameState.drawPile);
    
    // Draw starting hand
    drawCard(gameState, STARTING_HAND_SIZE);
    
    // Log battle start
    logGameInfo("Battle started", { enemyName: gameState.currentEnemy.name });
  }

  // Function to create starter deck
  function createStarterDeck() {
    const starterDeck = [];
    
    // Add 5 Strikes
    for (let i = 0; i < 5; i++) {
      starterDeck.push(new Card(CARD_TEMPLATES.find(t => t.id === "strike")));
    }
    
    // Add 4 Defends
    for (let i = 0; i < 4; i++) {
      starterDeck.push(new Card(CARD_TEMPLATES.find(t => t.id === "defend")));
    }
    
    // Add 1 Bash
    starterDeck.push(new Card(CARD_TEMPLATES.find(t => t.id === "bash")));
    
    return starterDeck;
  }

  // Function to create enemies with progressive difficulty
  function createEnemies() {
    const enemies = [];
    
    // Define difficulty tiers
    const difficultyTiers = [
      // Battles 1-2: Easy (Slime only)
      { enemies: ['slime'], count: 2 },
      // Battles 3-4: Easy-Medium (Slime, Cultist)
      { enemies: ['slime', 'cultist'], count: 2 },
      // Battles 5-6: Medium (Cultist, Thief)
      { enemies: ['cultist', 'thief'], count: 2 },
      // Battles 7-8: Medium-Hard (Thief, Jaw Worm)
      { enemies: ['thief', 'jaw_worm'], count: 2 },
      // Battle 9: Hard (Jaw Worm only)
      { enemies: ['jaw_worm'], count: 1 }
    ];
    
    let battleNum = 0;
    
    // Create enemies for each tier
    for (let tier of difficultyTiers) {
      for (let i = 0; i < tier.count; i++) {
        // Select a random enemy from the tier
        const enemyId = tier.enemies[Math.floor(p.random(tier.enemies.length))];
        const enemyTemplate = ENEMY_TEMPLATES.find(e => e.id === enemyId);
        
        // Create enemy with scaling based on battle number
        const scaledEnemy = createScaledEnemy(enemyTemplate, battleNum);
        enemies.push(scaledEnemy);
        battleNum++;
      }
    }
    
    // Add boss as the final enemy
    const bossTemplate = ENEMY_TEMPLATES.find(e => e.id === "boss");
    enemies.push(new Enemy(bossTemplate));
    
    return enemies;
  }

  // Function to create a scaled enemy based on progression
  function createScaledEnemy(template, battleNum) {
    // Create a copy of the template
    const scaledTemplate = JSON.parse(JSON.stringify(template));
    
    // Apply scaling factor based on battle number (0-8)
    // Increase health and damage by 5% per battle after battle 0
    const scaleFactor = 1 + (battleNum * 0.05);
    
    scaledTemplate.health = Math.floor(template.health * scaleFactor);
    scaledTemplate.maxHealth = Math.floor(template.maxHealth * scaleFactor);
    scaledTemplate.attackDamage = Math.floor(template.attackDamage * scaleFactor);
    
    if (template.heavyAttackDamage) {
      scaledTemplate.heavyAttackDamage = Math.floor(template.heavyAttackDamage * scaleFactor);
    }
    
    return new Enemy(scaledTemplate);
  }

  // Function to play a card
  function playCard(cardIndex) {
    if (cardIndex < 0 || cardIndex >= gameState.hand.length) return;
    
    const card = gameState.hand[cardIndex];
    
    // Check if player has enough energy
    if (card.energy > gameState.energy) return;
    
    // Calculate card position for animation
    const handSize = gameState.hand.length;
    const cardWidth = 110;
    const spacing = Math.min(cardWidth + 10, (CANVAS_WIDTH - cardWidth) / (handSize + 1));
    const startX = (CANVAS_WIDTH - (spacing * (handSize - 1) + cardWidth)) / 2;
    const fromX = startX + cardIndex * spacing + cardWidth / 2;
    const fromY = CANVAS_HEIGHT - 180 - (cardIndex === gameState.selectedCardIndex ? 30 : 0);
    
    // Determine target based on card type
    let toX, toY;
    if (card.type.name === "Attack") {
      toX = gameState.currentEnemy.x;
      toY = gameState.currentEnemy.y;
    } else {
      toX = gameState.player.x;
      toY = gameState.player.y;
    }
    
    // Add card play animation
    addCardPlayAnimation(fromX, fromY, toX, toY, card);
    
    // Use energy
    gameState.energy -= card.energy;
    
    // Store old values for animation
    const oldEnemyHealth = gameState.currentEnemy.health;
    const oldPlayerBlock = gameState.player.block;
    
    // Apply card effect
    if (card.type.name === "Attack") {
      card.effect(gameState.currentEnemy, gameState.player);
      // Show damage number
      const damage = oldEnemyHealth - gameState.currentEnemy.health;
      if (damage > 0) {
        addDamageNumber(gameState.currentEnemy.x, gameState.currentEnemy.y - 20, damage);
        gameState.currentEnemy.hitFlash = 10;
      }
    } else {
      card.effect(gameState.player, gameState);
      // Show block gained
      const blockGained = gameState.player.block - oldPlayerBlock;
      if (blockGained > 0) {
        addBlockNumber(gameState.player.x, gameState.player.y - 20, blockGained);
      }
    }
    
    // Move card to discard pile
    gameState.discardPile.push(card);
    gameState.hand.splice(cardIndex, 1);
    
    // Update selected card index
    if (gameState.selectedCardIndex >= gameState.hand.length) {
      gameState.selectedCardIndex = Math.max(0, gameState.hand.length - 1);
    }
    
    // Check if enemy is defeated
    if (gameState.currentEnemy.health <= 0) {
      handleEnemyDefeated();
    }
  }

  // Function to handle enemy being defeated
  function handleEnemyDefeated() {
    gameState.battleCount++;
    
    // Restore player health after winning battle (25% of max health)
    const healthRestore = Math.floor(gameState.player.maxHealth * 0.25);
    gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + healthRestore);
    
    // Show health restoration animation
    addDamageNumber(gameState.player.x, gameState.player.y - 20, "+" + healthRestore, [60, 220, 120]);
    
    // Check if all enemies are defeated
    if (gameState.currentEnemyIndex === gameState.totalEnemies - 1) {
      // Player won the game
      gameState.gamePhase = "GAME_OVER_WIN";
      logGameInfo("Game over - Win", { battlesWon: gameState.battleCount });
    } else {
      // Show rewards
      gameState.battleState = "REWARD";
      generateRewards();
    }
  }

  // Function to generate card rewards
  function generateRewards() {
    gameState.availableRewards = [];
    gameState.selectedRewardIndex = 0;
    
    // Get 3 random cards from templates
    const usedIndices = new Set();
    
    while (gameState.availableRewards.length < 3) {
      const randomIndex = Math.floor(p.random(CARD_TEMPLATES.length));
      
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        gameState.availableRewards.push(new Card(CARD_TEMPLATES[randomIndex]));
      }
    }
  }

  // Function to select a reward
  function selectReward(index) {
    if (index < 0 || index >= gameState.availableRewards.length) return;
    
    // Add selected card to deck
    const selectedCard = gameState.availableRewards[index];
    gameState.deck.push(selectedCard);
    
    // Move to next enemy
    gameState.currentEnemyIndex++;
    gameState.currentEnemy = gameState.enemies[gameState.currentEnemyIndex];
    
    // Start next battle
    startBattle();
  }

  // Function to end player turn
  function endPlayerTurn() {
    if (gameState.turn !== "PLAYER") return;
    
    // Move hand to discard pile
    gameState.discardPile = [...gameState.discardPile, ...gameState.hand];
    gameState.hand = [];
    
    // Start enemy turn
    gameState.turn = "ENEMY";
    gameState.battleState = "ENEMY_TURN";
    
    // Enemy takes its turn
    setTimeout(() => {
      if (gameState.gamePhase === "PLAYING") {
        const oldPlayerHealth = gameState.player.health;
        
        // Add attack animation
        const intention = gameState.currentEnemy.getCurrentIntention();
        if (intention === "ATTACK" || intention === "HEAVY_ATTACK") {
          addEnemyAttackAnimation(
            gameState.currentEnemy.x,
            gameState.currentEnemy.y,
            gameState.player.x,
            gameState.player.y,
            intention === "HEAVY_ATTACK" ? gameState.currentEnemy.heavyAttackDamage : gameState.currentEnemy.attackDamage
          );
        }
        
        gameState.currentEnemy.takeTurn(gameState.player);
        
        // Show damage to player
        const damage = oldPlayerHealth - gameState.player.health;
        if (damage > 0) {
          addDamageNumber(gameState.player.x, gameState.player.y - 20, damage);
          gameState.player.hitFlash = 10;
        }
        
        // Check if player is defeated
        if (gameState.player.health <= 0) {
          gameState.gamePhase = "GAME_OVER_LOSE";
          logGameInfo("Game over - Lose", { battlesWon: gameState.battleCount });
        } else {
          // Start player turn
          startPlayerTurn();
        }
      }
    }, 1000);
  }

  // Function to start player turn
  function startPlayerTurn() {
    // Reset player for new turn
    gameState.player.resetForNewTurn();
    
    // Reset energy
    gameState.energy = MAX_ENERGY;
    
    // Draw new hand
    drawCard(gameState, STARTING_HAND_SIZE);
    
    // Set turn to player
    gameState.turn = "PLAYER";
    gameState.battleState = "SELECT_CARD";
    gameState.selectedCardIndex = 0;
  }

  // Key pressed handler
  p.keyPressed = function() {
    // Log key press
    logInput("keyPressed", { key: p.key, keyCode: p.keyCode });
    
    // Handle global keys
    if (p.keyCode === 82) { // R key - restart
      if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame();
      }
    } else if (p.keyCode === 27) { // ESC key - pause
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        logGameInfo("Game paused", {});
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        logGameInfo("Game resumed", {});
      }
    } else if (p.keyCode === 13) { // ENTER key - start
      if (gameState.gamePhase === "START") {
        startGame();
      }
    }
    
    // Handle game-specific keys when playing
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN") {
      handleGameplayKey(p.keyCode);
    }
    
    // Prevent default behavior for game keys
    if ([32, 37, 38, 39, 40].includes(p.keyCode)) {
      return false;
    }
  };

  // Function to handle gameplay keys
  function handleGameplayKey(keyCode) {
    // If viewing a pile, handle pile navigation
    if (gameState.viewingPile) {
      if (keyCode === 37 || keyCode === 39) { // LEFT/RIGHT - switch pile view
        gameState.viewingPile = gameState.viewingPile === "DRAW" ? "DISCARD" : "DRAW";
      } else {
        gameState.viewingPile = null; // Any other key closes the view
      }
      return;
    }
    
    // If in reward state, handle reward selection
    if (gameState.battleState === "REWARD") {
      if (keyCode === 38) { // UP - navigate rewards
        gameState.selectedRewardIndex = Math.max(0, gameState.selectedRewardIndex - 1);
      } else if (keyCode === 40) { // DOWN - navigate rewards
        gameState.selectedRewardIndex = Math.min(gameState.availableRewards.length - 1, gameState.selectedRewardIndex + 1);
      } else if (keyCode === 32) { // SPACE - select reward
        selectReward(gameState.selectedRewardIndex);
      }
      return;
    }
    
    // Handle normal gameplay keys
    if (gameState.turn === "PLAYER") {
      if (keyCode === 38) { // UP - navigate cards
        gameState.selectedCardIndex = Math.max(0, gameState.selectedCardIndex - 1);
      } else if (keyCode === 40) { // DOWN - navigate cards
        gameState.selectedCardIndex = Math.min(gameState.hand.length - 1, gameState.selectedCardIndex + 1);
      } else if (keyCode === 32) { // SPACE - play card
        playCard(gameState.selectedCardIndex);
      } else if (keyCode === 90) { // Z - end turn
        endPlayerTurn();
      } else if (keyCode === 16) { // SHIFT - view draw pile
        gameState.viewingPile = "DRAW";
      } else if (keyCode === 39) { // RIGHT - view discard pile
        gameState.viewingPile = "DISCARD";
      }
    }
  }

  // Function to handle automated test actions
  function handleTestAction(keyCode) {
    // Log test action
    logInput("testAction", { keyCode });
    
    // Simulate key press
    handleGameplayKey(keyCode);
  }

  // Function to log game info
  function logGameInfo(status, data) {
    p.logs.game_info.push({
      "game_status": status,
      "data": data,
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }

  // Function to log player info
  function logPlayerInfo() {
    if (!gameState.player) return;
    
    p.logs.player_info.push({
      "screen_x": gameState.player.x,
      "screen_y": gameState.player.y,
      "game_x": gameState.player.x,
      "game_y": gameState.player.y,
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }

  // Function to log input
  function logInput(inputType, data) {
    p.logs.inputs.push({
      "input_type": inputType,
      "data": data,
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }
});

// Set control mode function
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(button => {
    button.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else {
    document.getElementById(`${mode.toLowerCase()}_ModeBtn`).classList.add('active');
  }
  
  // Log control mode change
  gameInstance.logs.game_info.push({
    "game_status": "Control mode changed",
    "data": { mode },
    "framecount": gameInstance.frameCount,
    "timestamp": Date.now()
  });
};

// Expose the game instance globally
window.gameInstance = gameInstance;