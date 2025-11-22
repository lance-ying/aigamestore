import { gameState, GAME_PHASES, CONTROL_MODES, GRID_SIZE, FARM_GRID_WIDTH, FARM_GRID_HEIGHT, CROP_TYPES, ANIMAL_TYPES, WORKSHOP_TYPES, QUEST_DATA } from './globals.js';
import { FarmPlot, Animal, Workshop, Order } from './entities.js';
import { addScore, addCoins, addXP, hasItems, consumeItems, addToInventory } from './utils.js';

export class GameLogic {
  constructor(p) {
    this.p = p;
    this.lastTime = Date.now();
    this.orderSpawnTimer = 0;
    this.orderSpawnInterval = 30000;
  }

  initialize() {
    gameState.farmPlots = [];
    gameState.animals = [];
    gameState.workshops = [];
    gameState.orders = [];
    gameState.inventory = { Feed: 10 };
    gameState.currentQuest = 1;
    gameState.questProgress = {};
    
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const plot = new FarmPlot(
          x * GRID_SIZE + 50,
          y * GRID_SIZE + 50,
          x,
          y
        );
        gameState.farmPlots.push(plot);
        gameState.entities.push(plot);
      }
    }
    
    const chicken1 = new Animal(400, 100, 'CHICKEN');
    const chicken2 = new Animal(450, 100, 'CHICKEN');
    gameState.animals.push(chicken1, chicken2);
    gameState.entities.push(chicken1, chicken2);
    
    const bakery = new Workshop(400, 200, 'BAKERY');
    gameState.workshops.push(bakery);
    gameState.entities.push(bakery);
    
    this.spawnOrder();
  }

  update() {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    gameState.gameTime += deltaTime;
    
    for (const plot of gameState.farmPlots) {
      plot.update(deltaTime);
    }
    
    for (const animal of gameState.animals) {
      animal.update(deltaTime);
    }
    
    for (const workshop of gameState.workshops) {
      workshop.update(deltaTime);
    }
    
    this.orderSpawnTimer += deltaTime;
    if (this.orderSpawnTimer >= this.orderSpawnInterval) {
      this.spawnOrder();
      this.orderSpawnTimer = 0;
    }
    
    for (let i = gameState.orders.length - 1; i >= 0; i--) {
      if (gameState.orders[i].isExpired()) {
        gameState.orders.splice(i, 1);
        gameState.failedOrders++;
        gameState.consecutiveOrders = 0;
        
        if (gameState.failedOrders >= 5) {
          this.triggerGameOver(false, "Too many orders expired!");
        }
      }
    }
    
    this.checkQuestCompletion();
    this.checkLoseConditions();
    
    if (gameState.controlMode === CONTROL_MODES.TEST_1) {
      this.runTestMode1();
    } else if (gameState.controlMode === CONTROL_MODES.TEST_2) {
      this.runTestMode2();
    }
  }

  spawnOrder() {
    const level = gameState.level;
    const availableItems = [];
    
    Object.entries(CROP_TYPES).forEach(([key, crop]) => {
      if (crop.unlockLevel <= level) availableItems.push(key);
    });
    
    Object.entries(ANIMAL_TYPES).forEach(([key, animal]) => {
      if (animal.unlockLevel <= level) availableItems.push(animal.product);
    });
    
    Object.entries(WORKSHOP_TYPES).forEach(([key, workshop]) => {
      if (workshop.unlockLevel <= level) {
        workshop.recipes.forEach(recipe => availableItems.push(recipe.output));
      }
    });
    
    if (availableItems.length === 0) return;
    
    const requirements = {};
    const numItems = Math.min(1 + Math.floor(level / 2), 3);
    
    for (let i = 0; i < numItems; i++) {
      const item = availableItems[Math.floor(Math.random() * availableItems.length)];
      requirements[item] = (requirements[item] || 0) + (1 + Math.floor(Math.random() * level));
    }
    
    const coinReward = 50 + level * 30;
    const xpReward = 20 + level * 10;
    
    const order = new Order(requirements, coinReward, xpReward);
    gameState.orders.push(order);
  }

  checkQuestCompletion() {
    if (!gameState.currentQuest) return;
    
    const quest = QUEST_DATA[gameState.currentQuest];
    if (!quest || quest.stage !== gameState.level) return;
    
    if (hasItems(quest.requirements)) {
      consumeItems(quest.requirements);
      addScore(quest.reward);
      addCoins(quest.reward);
      addXP(quest.reward);
      
      if (gameState.currentQuest === 5) {
        this.triggerGameOver(true, "Farm Fully Renovated!");
      } else {
        gameState.currentQuest++;
        gameState.level++;
        this.unlockNewContent();
      }
    }
  }

  unlockNewContent() {
    const level = gameState.level;
    
    if (level === 2) {
      const cow1 = new Animal(500, 100, 'COW');
      gameState.animals.push(cow1);
      gameState.entities.push(cow1);
      
      const dairy = new Workshop(500, 200, 'DAIRY');
      gameState.workshops.push(dairy);
      gameState.entities.push(dairy);
      
      addScore(200);
    } else if (level === 3) {
      const sugarMill = new Workshop(400, 300, 'SUGARMILL');
      gameState.workshops.push(sugarMill);
      gameState.entities.push(sugarMill);
      
      addScore(200);
    } else if (level === 4) {
      const jamFactory = new Workshop(500, 300, 'JAMFACTORY');
      gameState.workshops.push(jamFactory);
      gameState.entities.push(jamFactory);
      
      addScore(200);
    }
    
    addToInventory('Feed', 5);
  }

  checkLoseConditions() {
    if (gameState.coins < 0 && gameState.actionCount - gameState.lastEarningAction > 50) {
      this.triggerGameOver(false, "Bankruptcy! Unable to continue farming.");
    }
  }

  triggerGameOver(isWin, message) {
    gameState.gamePhase = isWin ? GAME_PHASES.GAME_OVER_WIN : GAME_PHASES.GAME_OVER_LOSE;
    this.p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  runTestMode1() {
    if (this.p.frameCount % 30 === 0) {
      const emptyPlots = gameState.farmPlots.filter(p => p.state === 'empty');
      if (emptyPlots.length > 0) {
        const plot = emptyPlots[0];
        plot.plant('WHEAT');
      }
      
      const readyPlots = gameState.farmPlots.filter(p => p.state === 'ready');
      if (readyPlots.length > 0) {
        readyPlots[0].harvest();
      }
      
      const hungryAnimals = gameState.animals.filter(a => a.state === 'hungry');
      if (hungryAnimals.length > 0 && gameState.inventory['Feed'] > 0) {
        hungryAnimals[0].feed();
      }
      
      const readyAnimals = gameState.animals.filter(a => a.state === 'ready');
      if (readyAnimals.length > 0) {
        readyAnimals[0].collect();
      }
    }
  }

  runTestMode2() {
    if (this.p.frameCount % 10 === 0) {
      const emptyPlots = gameState.farmPlots.filter(p => p.state === 'empty');
      if (emptyPlots.length > 0) {
        const cropTypes = Object.keys(CROP_TYPES).filter(k => CROP_TYPES[k].unlockLevel <= gameState.level);
        const cropType = cropTypes[Math.floor(Math.random() * cropTypes.length)];
        emptyPlots[0].plant(cropType);
      }
      
      const readyPlots = gameState.farmPlots.filter(p => p.state === 'ready');
      if (readyPlots.length > 0) {
        readyPlots[0].harvest();
      }
      
      const hungryAnimals = gameState.animals.filter(a => a.state === 'hungry');
      if (hungryAnimals.length > 0 && gameState.inventory['Feed'] > 0) {
        hungryAnimals[0].feed();
      }
      
      const readyAnimals = gameState.animals.filter(a => a.state === 'ready');
      if (readyAnimals.length > 0) {
        readyAnimals[0].collect();
      }
      
      const idleWorkshops = gameState.workshops.filter(w => w.state === 'idle');
      if (idleWorkshops.length > 0) {
        idleWorkshops[0].startCrafting(0);
      }
      
      const readyWorkshops = gameState.workshops.filter(w => w.state === 'ready');
      if (readyWorkshops.length > 0) {
        readyWorkshops[0].collect();
      }
      
      if (gameState.orders.length > 0 && gameState.orders[0].canFulfill()) {
        gameState.orders[0].fulfill();
        gameState.orders.shift();
      }
      
      if (!gameState.inventory['Feed'] || gameState.inventory['Feed'] < 5) {
        addToInventory('Feed', 10);
      }
      
      if (gameState.coins < 50) {
        addCoins(100);
      }
    }
  }
}