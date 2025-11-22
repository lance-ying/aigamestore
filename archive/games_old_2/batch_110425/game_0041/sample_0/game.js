// game.js - Main game file

import { gameState, GAME_PHASES, BATTLE_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, resetGameState } from './globals.js';
import { Character, createEnemy, createBoss } from './character.js';
import { Battle } from './battle.js';
import { Dungeon } from './dungeon.js';
import { 
  renderStartScreen, 
  renderDungeon, 
  renderBattle, 
  renderPartyMenu, 
  renderPauseScreen, 
  renderGameOverScreen 
} from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let currentDungeon = null;
  let transitionTimer = 0;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Log game start
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    initializeGame();
  };
  
  function initializeGame() {
    resetGameState();
    
    // Create party
    const warrior = new Character("Kael", "HERO");
    warrior.initializeHero("WARRIOR");
    
    const mage = new Character("Lyra", "HERO");
    mage.initializeHero("MAGE");
    
    const rogue = new Character("Zara", "HERO");
    rogue.initializeHero("ROGUE");
    
    const special = new Character("Murushuma", "HERO");
    special.initializeHero("MURUSHUMA");
    
    gameState.party = [warrior, mage, rogue, special];
    gameState.entities = [...gameState.party];
    
    // Create first dungeon
    currentDungeon = new Dungeon(gameState.currentFloor);
    gameState.dungeonX = currentDungeon.entranceX;
    gameState.dungeonY = currentDungeon.entranceY;
    currentDungeon.getTile(gameState.dungeonX, gameState.dungeonY).visited = true;
  }
  
  p.draw = function() {
    p.background(20);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handleKeyPress(action.keyCode);
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.battlePhase === BATTLE_PHASES.NONE) {
        renderDungeon(p, currentDungeon);
        if (gameState.showPartyMenu) {
          renderPartyMenu(p);
        }
      } else {
        if (gameState.currentBattle) {
          gameState.currentBattle.updateAnimation();
          renderBattle(p, gameState.currentBattle);
          
          // Auto-advance battle if all actors ready or waiting
          if (transitionTimer > 0) {
            transitionTimer--;
            if (transitionTimer === 0) {
              const result = gameState.currentBattle.advanceTurn();
              if (result === "VICTORY") {
                handleBattleVictory();
              } else if (result === "DEFEAT") {
                handleBattleDefeat();
              }
            }
          } else if (gameState.battlePhase === BATTLE_PHASES.EXECUTING) {
            transitionTimer = 20; // Wait before next turn
          }
        }
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      if (gameState.battlePhase === BATTLE_PHASES.NONE) {
        renderDungeon(p, currentDungeon);
      } else {
        if (gameState.currentBattle) {
          renderBattle(p, gameState.currentBattle);
        }
      }
      renderPauseScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGameOverScreen(p, true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p, false);
    }
  };
  
  function handleKeyPress(keyCode) {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase transitions
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        initializeGame();
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    // Gameplay controls
    if (gameState.battlePhase === BATTLE_PHASES.NONE) {
      handleDungeonInput(keyCode);
    } else {
      handleBattleInput(keyCode);
    }
  }
  
  function handleDungeonInput(keyCode) {
    if (gameState.showPartyMenu) {
      if (keyCode === 38) { // Up
        gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
      } else if (keyCode === 40) { // Down
        gameState.menuSelection = Math.min(gameState.party.length - 1, gameState.menuSelection + 1);
      } else if (keyCode === 16 || keyCode === 90) { // Shift or Z to close
        gameState.showPartyMenu = false;
        gameState.menuSelection = 0;
      }
      return;
    }
    
    if (keyCode === 90) { // Z - open party menu
      gameState.showPartyMenu = true;
      return;
    }
    
    // Movement
    let newX = gameState.dungeonX;
    let newY = gameState.dungeonY;
    
    if (keyCode === 37) { // Left
      newX--;
    } else if (keyCode === 38) { // Up
      newY--;
    } else if (keyCode === 39) { // Right
      newX++;
    } else if (keyCode === 40) { // Down
      newY++;
    } else if (keyCode === 32) { // Space - interact
      const currentTile = currentDungeon.getTile(gameState.dungeonX, gameState.dungeonY);
      if (currentTile && currentTile.type === "STAIRS") {
        advanceFloor();
      }
      return;
    }
    
    // Check if movement is valid
    if (currentDungeon.isWalkable(newX, newY)) {
      gameState.dungeonX = newX;
      gameState.dungeonY = newY;
      
      // Mark tile as visited
      const tile = currentDungeon.getTile(newX, newY);
      if (tile) tile.visited = true;
      
      // Log player position
      p.logs.player_info.push({
        screen_x: gameState.dungeonX,
        screen_y: gameState.dungeonY,
        game_x: gameState.dungeonX,
        game_y: gameState.dungeonY,
        framecount: p.frameCount
      });
      
      // Check for random encounter
      if (currentDungeon.checkEncounter()) {
        startBattle();
      }
    }
  }
  
  function handleBattleInput(keyCode) {
    if (!gameState.currentBattle) return;
    
    const battle = gameState.currentBattle;
    const currentActor = battle.getCurrentActor();
    
    if (!currentActor || currentActor.type === "ENEMY" || currentActor.actionReady) {
      if (keyCode === 32) { // Space to advance
        gameState.battlePhase = BATTLE_PHASES.EXECUTING;
        const result = battle.advanceTurn();
        if (result === "VICTORY") {
          handleBattleVictory();
        } else if (result === "DEFEAT") {
          handleBattleDefeat();
        } else {
          gameState.battlePhase = BATTLE_PHASES.SELECTING;
        }
      }
      return;
    }
    
    if (battle.actionState === "SELECTING_ACTION") {
      if (keyCode === 37) { // Left
        battle.actionMenuSelection = Math.max(0, battle.actionMenuSelection - 1);
      } else if (keyCode === 39) { // Right
        const maxActions = currentActor.canLearn ? 4 : 3;
        battle.actionMenuSelection = Math.min(maxActions - 1, battle.actionMenuSelection + 1);
      } else if (keyCode === 32) { // Space - confirm
        const actions = ["ATTACK", "SKILL", "DEFEND"];
        if (currentActor.canLearn) actions.push("LEARN");
        battle.selectAction(actions[battle.actionMenuSelection]);
      }
    } else if (battle.actionState === "SELECTING_SKILL") {
      if (keyCode === 38) { // Up
        battle.skillSelection = Math.max(0, battle.skillSelection - 1);
      } else if (keyCode === 40) { // Down
        battle.skillSelection = Math.min(currentActor.equippedSkills.length - 1, battle.skillSelection + 1);
      } else if (keyCode === 32) { // Space - confirm
        battle.selectSkill(battle.skillSelection);
      } else if (keyCode === 16) { // Shift - cancel
        battle.actionState = "SELECTING_ACTION";
      }
    } else if (battle.actionState === "SELECTING_TARGET") {
      const action = currentActor.selectedAction;
      let targets;
      
      if (action.type === "SKILL" && action.skill && action.skill.target.includes("ALLY")) {
        targets = battle.allies.filter(a => a.isAlive());
      } else {
        targets = battle.enemies.filter(e => e.isAlive());
      }
      
      if (keyCode === 37 || keyCode === 38) { // Left or Up
        battle.targetSelection = Math.max(0, battle.targetSelection - 1);
      } else if (keyCode === 39 || keyCode === 40) { // Right or Down
        battle.targetSelection = Math.min(targets.length - 1, battle.targetSelection + 1);
      } else if (keyCode === 32) { // Space - confirm
        battle.selectTarget(battle.targetSelection);
      } else if (keyCode === 16) { // Shift - cancel
        battle.actionState = "SELECTING_ACTION";
        currentActor.selectedAction = null;
      }
    }
  }
  
  function startBattle() {
    const numEnemies = 1 + Math.floor(Math.random() * 2);
    const enemies = [];
    
    for (let i = 0; i < numEnemies; i++) {
      enemies.push(createEnemy(gameState.currentFloor));
    }
    
    gameState.currentBattle = new Battle(enemies);
    gameState.battlePhase = BATTLE_PHASES.SELECTING;
    
    p.logs.game_info.push({
      data: { event: "battle_start", floor: gameState.currentFloor, enemies: numEnemies },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function handleBattleVictory() {
    gameState.battlePhase = BATTLE_PHASES.VICTORY;
    
    // Award exp and ores
    let totalExp = 0;
    let totalOres = 0;
    
    gameState.currentBattle.enemies.forEach(enemy => {
      totalExp += enemy.expReward;
      totalOres += enemy.oreReward;
    });
    
    gameState.party.forEach(char => {
      if (char.isAlive()) {
        char.gainExp(totalExp);
      }
    });
    
    gameState.totalOres += totalOres;
    gameState.score += totalExp;
    gameState.battlesWon++;
    
    p.logs.game_info.push({
      data: { event: "battle_victory", exp: totalExp, ores: totalOres },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Return to dungeon after brief delay
    setTimeout(() => {
      gameState.battlePhase = BATTLE_PHASES.NONE;
      gameState.currentBattle = null;
      
      // Heal party slightly after battle
      gameState.party.forEach(char => {
        if (char.isAlive()) {
          char.heal(Math.floor(char.maxHP * 0.1));
          char.mp = Math.min(char.maxMP, char.mp + Math.floor(char.maxMP * 0.1));
        }
      });
    }, 2000);
  }
  
  function handleBattleDefeat() {
    gameState.battlePhase = BATTLE_PHASES.DEFEAT;
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      data: { event: "battle_defeat", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function advanceFloor() {
    gameState.currentFloor++;
    
    if (gameState.currentFloor > gameState.maxFloor) {
      // Final boss battle
      startBossBattle();
    } else {
      currentDungeon = new Dungeon(gameState.currentFloor);
      gameState.dungeonX = currentDungeon.entranceX;
      gameState.dungeonY = currentDungeon.entranceY;
      currentDungeon.getTile(gameState.dungeonX, gameState.dungeonY).visited = true;
      
      // Heal party when advancing
      gameState.party.forEach(char => {
        if (char.isAlive()) {
          char.hp = char.maxHP;
          char.mp = char.maxMP;
        }
      });
      
      p.logs.game_info.push({
        data: { event: "floor_advance", floor: gameState.currentFloor },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function startBossBattle() {
    const boss = createBoss(gameState.maxFloor);
    gameState.currentBattle = new Battle([boss]);
    gameState.battlePhase = BATTLE_PHASES.SELECTING;
    
    // Override victory handler for boss
    const originalAdvance = gameState.currentBattle.advanceTurn.bind(gameState.currentBattle);
    gameState.currentBattle.advanceTurn = function() {
      const result = originalAdvance();
      if (result === "VICTORY") {
        handleBossVictory();
        return "VICTORY";
      }
      return result;
    };
    
    p.logs.game_info.push({
      data: { event: "boss_battle_start", floor: gameState.currentFloor },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function handleBossVictory() {
    gameState.battlePhase = BATTLE_PHASES.VICTORY;
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    gameState.score += 1000;
    
    p.logs.game_info.push({
      data: { event: "boss_victory", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPress(p.keyCode);
    }
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const modeMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn"
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};