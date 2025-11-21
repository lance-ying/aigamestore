// game.js - Main game file
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, BLOCK_TYPES, ITEM_TYPES, getGameState } from './globals.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Enemy, Boss } from './enemies.js';
import { RECIPES, craftItem, renderCraftingMenu } from './crafting.js';
import { renderUI, addMessage } from './ui.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let keys = {
    left: false,
    right: false,
    up: false,
    attack: false,
    place: false,
    craft: false
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    initGame();
  };

  function initGame() {
    // Create world
    gameState.world = new World(p);
    
    // Create player at spawn point
    const spawnX = 50 * TILE_SIZE;
    const spawnY = 20 * TILE_SIZE;
    gameState.player = new Player(p, spawnX, spawnY);
    
    // Initialize entities array
    gameState.entities = [gameState.player];
    
    // Reset game state
    gameState.time = 0;
    gameState.score = 0;
    gameState.craftingOpen = false;
    gameState.defeatedBosses = [];
    gameState.spawnedBosses = [];
    gameState.messageQueue = [];
    gameState.particleEffects = [];
    
    // Camera
    gameState.camera = { x: 0, y: 0 };
    
    logGameInfo("Game initialized");
  }

  p.draw = function() {
    p.background(135, 206, 235);
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderUI(p, gameState);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderUI(p, gameState);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderWorld();
      renderUI(p, gameState);
      return;
    }
    
    // Playing phase
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Get automated testing input if in test mode
      if (gameState.controlMode !== "HUMAN") {
        const action = get_automated_testing_action(gameState);
        applyAutomatedAction(action);
      }
      
      updateGame();
      renderWorld();
      
      if (gameState.craftingOpen) {
        renderCraftingMenu(p, gameState.player);
      }
      
      renderUI(p, gameState);
    }
  };

  function updateGame() {
    const player = gameState.player;
    const world = gameState.world;
    
    // Update time
    gameState.time++;
    
    // Update player
    player.update(world, keys);
    
    // Update camera to follow player
    gameState.camera.x = Math.max(0, Math.min(player.x - CANVAS_WIDTH / 2, 
                                               TILE_SIZE * 200 - CANVAS_WIDTH));
    gameState.camera.y = Math.max(0, Math.min(player.y - CANVAS_HEIGHT / 2, 
                                               TILE_SIZE * 100 - CANVAS_HEIGHT));
    
    // Update enemies
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
      const entity = gameState.entities[i];
      if (entity === player) continue;
      
      if (entity.active) {
        entity.update(world, player);
      } else {
        // Remove dead enemies
        gameState.entities.splice(i, 1);
        gameState.score += entity instanceof Boss ? 500 : 50;
        
        if (entity instanceof Boss) {
          gameState.defeatedBosses.push(entity.tier);
          addMessage(gameState, `${entity.name} defeated!`, [255, 215, 0]);
          
          // Check win condition
          if (gameState.defeatedBosses.length >= 5) {
            gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
            logGameInfo("Game won!");
          }
        }
      }
    }
    
    // Spawn enemies based on time
    if (p.frameCount % 180 === 0) {
      spawnEnemy();
    }
    
    // Spawn bosses
    spawnBoss();
    
    // Check loss condition
    if (player.health <= 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      logGameInfo("Game over - player died");
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0) {
      logPlayerInfo();
    }
  }

  function spawnEnemy() {
    const isNight = (gameState.time % gameState.dayLength) >= gameState.dayLength / 2;
    if (!isNight && p.random() > 0.3) return;
    
    const player = gameState.player;
    const spawnDistance = 400;
    const side = p.random() > 0.5 ? 1 : -1;
    const x = player.x + side * spawnDistance;
    const y = player.y;
    
    if (x < 0 || x > TILE_SIZE * 200) return;
    
    const enemy = new Enemy(p, x, y, 'basic');
    gameState.entities.push(enemy);
  }

  function spawnBoss() {
    const bossesDefeated = gameState.defeatedBosses.length;
    const bossesSpawned = gameState.spawnedBosses.length;
    
    if (bossesSpawned >= 5) return;
    if (bossesDefeated < bossesSpawned) return;
    
    // Check if player has enough resources for next tier
    const player = gameState.player;
    const tier = bossesSpawned;
    
    let shouldSpawn = false;
    if (tier === 0) shouldSpawn = true;
    else if (tier === 1 && player.hasItem(ITEM_TYPES.STONE, 20)) shouldSpawn = true;
    else if (tier === 2 && player.hasItem(ITEM_TYPES.IRON, 30)) shouldSpawn = true;
    else if (tier === 3 && player.hasItem(ITEM_TYPES.GOLD, 40)) shouldSpawn = true;
    else if (tier === 4 && player.hasItem(ITEM_TYPES.DIAMOND, 50)) shouldSpawn = true;
    
    if (shouldSpawn) {
      const spawnX = player.x + 500;
      const spawnY = 30 * TILE_SIZE;
      const boss = new Boss(p, spawnX, spawnY, tier);
      gameState.entities.push(boss);
      gameState.spawnedBosses.push(tier);
      addMessage(gameState, `${boss.name} has appeared!`, [255, 0, 0]);
    }
  }

  function renderWorld() {
    // Sky color based on time
    const timeInDay = gameState.time % gameState.dayLength;
    const dayProgress = timeInDay / gameState.dayLength;
    let skyColor;
    
    if (dayProgress < 0.5) {
      // Day
      skyColor = [135, 206, 235];
    } else {
      // Night
      const nightProgress = (dayProgress - 0.5) * 2;
      skyColor = [
        135 - nightProgress * 100,
        206 - nightProgress * 170,
        235 - nightProgress * 200
      ];
    }
    
    p.background(...skyColor);
    
    // Render world
    gameState.world.render(p, gameState.camera);
    
    // Render entities
    for (const entity of gameState.entities) {
      entity.render(p, gameState.camera);
    }
  }

  p.keyPressed = function() {
    logInput("keyPressed", p.key, p.keyCode);
    
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        logGameInfo("Game started");
      }
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        logGameInfo("Game paused");
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        logGameInfo("Game resumed");
      }
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        initGame();
        gameState.gamePhase = GAME_PHASES.START;
        logGameInfo("Game restarted");
      }
    }
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.keyCode === 37) keys.left = true;
      if (p.keyCode === 39) keys.right = true;
      if (p.keyCode === 38) keys.up = true;
      if (p.keyCode === 90) keys.attack = true; // Z
      if (p.keyCode === 32) keys.place = true; // SPACE
      if (p.keyCode === 16) { // SHIFT
        gameState.craftingOpen = !gameState.craftingOpen;
      }
      
      // Crafting hotkeys
      if (gameState.craftingOpen) {
        handleCrafting(p.key);
      }
    }
  };

  p.keyReleased = function() {
    if (p.keyCode === 37) keys.left = false;
    if (p.keyCode === 39) keys.right = false;
    if (p.keyCode === 38) keys.up = false;
    if (p.keyCode === 90) {
      if (keys.attack) {
        handleAttack();
      }
      keys.attack = false;
    }
    if (p.keyCode === 32) {
      if (keys.place) {
        handlePlace();
      }
      keys.place = false;
    }
  };

  function handleAttack() {
    const player = gameState.player;
    const world = gameState.world;
    const attackData = player.performAttack();
    
    // Check for enemy hits
    let hitEnemy = false;
    for (const entity of gameState.entities) {
      if (entity === player || !entity.active) continue;
      
      const dx = entity.x - attackData.x;
      const dy = entity.y - attackData.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        const damage = player.attackDamage * (1 + attackData.charge / player.maxAttackCharge);
        entity.takeDamage(damage);
        hitEnemy = true;
        gameState.score += Math.floor(damage);
      }
    }
    
    // If no enemy hit, try mining
    if (!hitEnemy) {
      const block = world.getBlock(attackData.tileX, attackData.tileY);
      if (block !== BLOCK_TYPES.AIR && block !== BLOCK_TYPES.BEDROCK) {
        const miningPower = getMiningPower(player);
        const blockHardness = getBlockHardness(block);
        
        if (miningPower >= blockHardness) {
          world.setBlock(attackData.tileX, attackData.tileY, BLOCK_TYPES.AIR);
          giveBlockReward(player, block);
          gameState.score += 10;
        }
      }
    }
  }

  function handlePlace() {
    const player = gameState.player;
    const world = gameState.world;
    
    // Try to place dirt block if player has any
    if (player.hasItem(ITEM_TYPES.DIRT, 1)) {
      const dir = player.facingRight ? 1 : -1;
      const placeX = Math.floor((player.x + dir * 30) / TILE_SIZE);
      const placeY = Math.floor(player.y / TILE_SIZE);
      
      if (world.getBlock(placeX, placeY) === BLOCK_TYPES.AIR) {
        world.setBlock(placeX, placeY, BLOCK_TYPES.DIRT);
        player.removeItem(ITEM_TYPES.DIRT, 1);
      }
    }
  }

  function handleCrafting(key) {
    const items = [
      ITEM_TYPES.STONE_PICKAXE,
      ITEM_TYPES.IRON_PICKAXE,
      ITEM_TYPES.GOLD_PICKAXE,
      ITEM_TYPES.DIAMOND_PICKAXE,
      ITEM_TYPES.MYTHRIL_PICKAXE,
      ITEM_TYPES.STONE_SWORD,
      ITEM_TYPES.IRON_SWORD,
      ITEM_TYPES.GOLD_SWORD,
      ITEM_TYPES.DIAMOND_SWORD,
      ITEM_TYPES.MYTHRIL_SWORD
    ];
    
    const keyMap = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    const index = keyMap.indexOf(key);
    
    if (index >= 0 && index < items.length) {
      const item = items[index];
      if (craftItem(gameState.player, item)) {
        addMessage(gameState, `Crafted ${item}!`, [0, 255, 0]);
        
        // Auto-equip
        if (item.includes('pickaxe')) {
          gameState.player.equippedPickaxe = item;
          gameState.player.miningPower = RECIPES[item].miningPower;
        } else if (item.includes('sword')) {
          gameState.player.equippedSword = item;
          gameState.player.attackDamage = RECIPES[item].damage;
        }
      }
    }
  }

  function getMiningPower(player) {
    if (!player.equippedPickaxe) return 1;
    return RECIPES[player.equippedPickaxe]?.miningPower || 1;
  }

  function getBlockHardness(block) {
    const hardness = {
      [BLOCK_TYPES.DIRT]: 1,
      [BLOCK_TYPES.GRASS]: 1,
      [BLOCK_TYPES.STONE]: 2,
      [BLOCK_TYPES.IRON_ORE]: 3,
      [BLOCK_TYPES.GOLD_ORE]: 4,
      [BLOCK_TYPES.DIAMOND_ORE]: 5,
      [BLOCK_TYPES.MYTHRIL_ORE]: 6,
      [BLOCK_TYPES.BEDROCK]: 999
    };
    return hardness[block] || 1;
  }

  function giveBlockReward(player, block) {
    switch (block) {
      case BLOCK_TYPES.DIRT:
      case BLOCK_TYPES.GRASS:
        player.addItem(ITEM_TYPES.DIRT, 1);
        break;
      case BLOCK_TYPES.STONE:
        player.addItem(ITEM_TYPES.STONE, 1);
        break;
      case BLOCK_TYPES.IRON_ORE:
        player.addItem(ITEM_TYPES.IRON, 1);
        break;
      case BLOCK_TYPES.GOLD_ORE:
        player.addItem(ITEM_TYPES.GOLD, 1);
        break;
      case BLOCK_TYPES.DIAMOND_ORE:
        player.addItem(ITEM_TYPES.DIAMOND, 1);
        break;
      case BLOCK_TYPES.MYTHRIL_ORE:
        player.addItem(ITEM_TYPES.MYTHRIL, 1);
        break;
    }
  }

  function applyAutomatedAction(action) {
    // Reset keys
    keys.left = false;
    keys.right = false;
    keys.up = false;
    keys.attack = false;
    keys.place = false;
    
    // Apply action
    if (action.left) keys.left = true;
    if (action.right) keys.right = true;
    if (action.jump) keys.up = true;
    if (action.attack) keys.attack = true;
    if (action.place) keys.place = true;
    if (action.craft) {
      gameState.craftingOpen = true;
      if (action.craftItem) {
        handleCrafting(action.craftItem);
      }
    }
    
    // Handle attack release
    if (action.attackRelease) {
      handleAttack();
      keys.attack = false;
    }
  }

  function logGameInfo(data) {
    p.logs.game_info.push({
      data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logInput(inputType, key, keyCode) {
    p.logs.inputs.push({
      input_type: inputType,
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logPlayerInfo() {
    if (!gameState.player) return;
    
    p.logs.player_info.push({
      screen_x: gameState.player.x - gameState.camera.x,
      screen_y: gameState.player.y - gameState.camera.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
});

window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' : 'test_2_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};