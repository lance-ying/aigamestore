import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, STATE_LOCATION_SELECT, STATE_SHOP, STATE_HOME_BASE, STATE_CASTING, STATE_WAITING_BITE, STATE_REELING, STATE_FISH_CAUGHT, STATE_LINE_SNAPPED, STATE_LEVEL_COMPLETE, LOCATIONS, GEAR_DATA, FISH_DATA, RARITY_MULTIPLIERS, KEY_ENTER, KEY_SPACE, KEY_ESC, KEY_R, KEY_S, KEY_D, KEY_ARROW_LEFT, KEY_ARROW_UP, KEY_ARROW_RIGHT, KEY_ARROW_DOWN } from './globals.js';
import { Player } from './player.js';
import { Fish } from './fish.js';

export class GameLogic {
  constructor(p) {
    this.p = p;
  }
  
  init() {
    // Initialize player
    gameState.player = new Player(100, 350);
    gameState.entities = [gameState.player];
    
    // Initialize basic gear
    this.equipGear('rod', GEAR_DATA.rods[0]);
    this.equipGear('reel', GEAR_DATA.reels[0]);
    this.equipGear('line', GEAR_DATA.lines[0]);
    this.equipGear('lure', GEAR_DATA.lures[0]);
    
    // Add basic gear to owned
    gameState.ownedGear.push(
      GEAR_DATA.rods[0],
      GEAR_DATA.reels[0],
      GEAR_DATA.lines[0],
      GEAR_DATA.lures[0]
    );
    
    // Load high score
    const saved = localStorage.getItem('reelRelaxHighScore');
    if (saved) {
      gameState.highScore = parseInt(saved);
    }
  }
  
  update() {
    if (gameState.gamePhase === PHASE_PLAYING) {
      this.updatePlaying();
    }
  }
  
  updatePlaying() {
    // Update player
    if (gameState.player) {
      gameState.player.update();
    }
    
    // Update message timer
    if (gameState.messageTimer > 0) {
      gameState.messageTimer--;
    }
    
    // Update based on internal state
    if (gameState.internalState === STATE_CASTING) {
      this.updateCasting();
    } else if (gameState.internalState === STATE_WAITING_BITE) {
      this.updateWaitingBite();
    } else if (gameState.internalState === STATE_REELING) {
      this.updateReeling();
    }
  }
  
  updateCasting() {
    if (gameState.castingCharging) {
      gameState.castingPower = Math.min(100, gameState.castingPower + 1.5);
    }
  }
  
  updateWaitingBite() {
    gameState.biteTimer--;
    
    if (gameState.biteTimer <= 0) {
      // Fish bites!
      this.triggerBite();
    }
  }
  
  updateReeling() {
    const p = this.p;
    
    // Apply fish pull
    gameState.fishPullForce = gameState.currentFish.getPullForce(p);
    gameState.tensionValue += gameState.fishPullForce;
    
    // Check tension bounds
    gameState.tensionValue = Math.max(0, Math.min(100, gameState.tensionValue));
    
    // Check if in green zone
    const sweetSpotSize = 0.2 + (gameState.equippedGear.reel?.sweetSpotBonus || 0) * 0.01;
    const sweetSpotStart = 0.4;
    const sweetSpotEnd = sweetSpotStart + sweetSpotSize;
    
    const inGreenZone = gameState.tensionValue >= sweetSpotStart * 100 && 
                        gameState.tensionValue <= sweetSpotEnd * 100;
    
    if (inGreenZone) {
      gameState.timeInGreenZone++;
      gameState.fishStamina -= 0.5;
    }
    
    gameState.totalReelingTime++;
    
    // Check if in danger zones
    const inDangerZone = gameState.tensionValue < 15 || gameState.tensionValue > 85;
    if (inDangerZone) {
      gameState.lineDurability -= 0.3;
    }
    
    // Check win/lose conditions
    if (gameState.fishStamina <= 0) {
      this.catchFish();
    } else if (gameState.lineDurability <= 0) {
      this.breakLine();
    }
  }
  
  triggerBite() {
    const p = this.p;
    const loc = LOCATIONS.find(l => l.id === gameState.currentLocation);
    
    // Generate fish
    const fishType = p.random(loc.fishTypes);
    const rarity = this.determineRarity(p, loc.rarityWeights);
    gameState.currentFish = new Fish(p, fishType, rarity, loc);
    
    // Start reeling phase
    gameState.internalState = STATE_REELING;
    gameState.tensionValue = 50;
    gameState.fishStamina = gameState.currentFish.maxStamina;
    gameState.lineDurability = gameState.equippedGear.line.durability;
    gameState.timeInGreenZone = 0;
    gameState.totalReelingTime = 0;
    
    this.showMessage("FISH ON!", 60);
    
    // Log
    this.p.logs.game_info.push({
      data: { event: "fish_bite", species: gameState.currentFish.species, rarity: gameState.currentFish.rarity },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
  
  determineRarity(p, weights) {
    const rand = p.random();
    let cumulative = 0;
    
    for (const [rarity, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand <= cumulative) {
        return rarity;
      }
    }
    return 'common';
  }
  
  catchFish() {
    const fish = gameState.currentFish;
    
    // Calculate bonuses
    let totalValue = fish.value;
    
    // Perfect reel bonus
    const perfectReelPercent = gameState.timeInGreenZone / gameState.totalReelingTime;
    if (perfectReelPercent >= 0.9) {
      totalValue += 10;
      this.showMessage("PERFECT REEL! +$10", 90);
    }
    
    // New species bonus
    const isNewSpecies = !gameState.caughtFish.some(f => f.species === fish.species);
    if (isNewSpecies) {
      totalValue += 50;
      this.showMessage("NEW SPECIES! +$50", 90);
    }
    
    // Consecutive catch bonus
    gameState.consecutiveCatches++;
    if (gameState.consecutiveCatches >= 3) {
      totalValue += 20;
      this.showMessage("STREAK BONUS! +$20", 90);
    }
    
    // Lure bonus
    const lureBonus = gameState.equippedGear.lure?.valueBonus || 0;
    totalValue = Math.floor(totalValue * (1 + lureBonus));
    
    // Add to score and cash
    gameState.score += totalValue;
    gameState.cash += totalValue;
    gameState.fishCaughtThisLevel++;
    gameState.totalFishCaught++;
    
    // Add to caught fish
    gameState.caughtFish.push(fish);
    
    // Reset failed attempts
    gameState.failedAttempts = 0;
    
    // Change state
    gameState.internalState = STATE_FISH_CAUGHT;
    
    // Log
    this.p.logs.game_info.push({
      data: { event: "fish_caught", species: fish.species, value: totalValue },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
    
    // Check level complete
    const loc = LOCATIONS.find(l => l.id === gameState.currentLocation);
    if (loc && (gameState.fishCaughtThisLevel >= loc.objectiveFish || gameState.score >= loc.objectiveScore)) {
      setTimeout(() => {
        gameState.internalState = STATE_LEVEL_COMPLETE;
        
        // Unlock next location
        const nextLoc = LOCATIONS.find(l => l.id === gameState.currentLocation + 1);
        if (nextLoc && !gameState.unlockedLocations.includes(nextLoc.id)) {
          gameState.unlockedLocations.push(nextLoc.id);
        }
        
        // Update high score
        if (gameState.score > gameState.highScore) {
          gameState.highScore = gameState.score;
          localStorage.setItem('reelRelaxHighScore', gameState.highScore.toString());
        }
        
        // Check if game won
        if (gameState.currentLocation === 4) {
          gameState.gamePhase = PHASE_GAME_OVER_WIN;
        }
      }, 2000);
    }
  }
  
  breakLine() {
    gameState.internalState = STATE_LINE_SNAPPED;
    gameState.consecutiveCatches = 0;
    gameState.failedAttempts++;
    
    // Log
    this.p.logs.game_info.push({
      data: { event: "line_snapped" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
    
    // Check lose condition
    if (gameState.failedAttempts >= 10 && gameState.cash < 50) {
      setTimeout(() => {
        gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      }, 2000);
    }
  }
  
  startCasting() {
    gameState.internalState = STATE_CASTING;
    gameState.castingPower = 0;
    gameState.castingCharging = false;
  }
  
  performCast() {
    const loc = LOCATIONS.find(l => l.id === gameState.currentLocation);
    if (!loc) return;
    
    // Calculate distance
    const maxDistance = loc.maxCastDistance + (gameState.equippedGear.rod?.castBonus || 0);
    const distance = (gameState.castingPower / 100) * maxDistance;
    
    // Perfect cast bonus
    if (gameState.castingPower >= 95) {
      gameState.score += 5;
      gameState.cash += 5;
      this.showMessage("PERFECT CAST! +$5", 60);
    }
    
    // Set bobber position
    gameState.bobberX = gameState.player.x + 40 + distance;
    gameState.bobberY = 250 + Math.sin(distance * 0.02) * 30; // Arc effect
    gameState.lineDistance = distance;
    
    // Start waiting for bite
    gameState.internalState = STATE_WAITING_BITE;
    
    // Calculate bite timer
    const biteChance = loc.biteChanceBase + (gameState.equippedGear.lure?.biteBonus || 0);
    const biteTime = this.p.random(loc.biteTimeMin, loc.biteTimeMax);
    gameState.biteTimer = Math.floor(biteTime / 16.67); // Convert ms to frames
    
    // Log
    this.p.logs.game_info.push({
      data: { event: "cast", power: gameState.castingPower, distance: distance },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
  
  startReeling() {
    const reelPower = gameState.equippedGear.reel?.reelPower || 1.0;
    gameState.tensionValue -= 1.5 * reelPower;
  }
  
  equipGear(type, item) {
    const slot = type === 'rods' ? 'rod' : type === 'reels' ? 'reel' : type === 'lines' ? 'line' : 'lure';
    gameState.equippedGear[slot] = item;
  }
  
  buyGear(item) {
    if (gameState.cash >= item.cost && !gameState.ownedGear.some(g => g.id === item.id)) {
      gameState.cash -= item.cost;
      gameState.ownedGear.push(item);
      return true;
    }
    return false;
  }
  
  selectLocation(locationId) {
    const loc = LOCATIONS.find(l => l.id === locationId);
    if (loc && gameState.unlockedLocations.includes(locationId)) {
      gameState.currentLocation = locationId;
      gameState.fishCaughtThisLevel = 0;
      gameState.internalState = STATE_CASTING;
      this.startCasting();
      
      // Log
      this.p.logs.game_info.push({
        data: { event: "location_selected", location: loc.name },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  unlockLocation(locationId) {
    const loc = LOCATIONS.find(l => l.id === locationId);
    if (loc && gameState.cash >= loc.unlockCost && !gameState.unlockedLocations.includes(locationId)) {
      gameState.cash -= loc.unlockCost;
      gameState.unlockedLocations.push(locationId);
      this.showMessage(`${loc.name} unlocked!`, 90);
      return true;
    }
    return false;
  }
  
  upgradeHome() {
    if (gameState.homeLevel < 2) {
      const cost = (gameState.homeLevel + 1) * 500;
      if (gameState.cash >= cost) {
        gameState.cash -= cost;
        gameState.homeLevel++;
        this.showMessage("Home upgraded!", 90);
        return true;
      }
    }
    return false;
  }
  
  showMessage(text, duration) {
    gameState.messageText = text;
    gameState.messageTimer = duration;
  }
  
  handleKeyPressed(keyCode) {
    // Log input
    this.p.logs.inputs.push({
      input_type: "keyPressed",
      data: { keyCode: keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.gamePhase === PHASE_START) {
      if (keyCode === KEY_ENTER) {
        gameState.gamePhase = PHASE_PLAYING;
        gameState.internalState = STATE_LOCATION_SELECT;
        
        this.p.logs.game_info.push({
          data: { event: "game_started", phase: PHASE_PLAYING },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      if (keyCode === KEY_ESC) {
        gameState.gamePhase = PHASE_PAUSED;
        
        this.p.logs.game_info.push({
          data: { event: "game_paused" },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      } else {
        this.handlePlayingInput(keyCode);
      }
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      if (keyCode === KEY_ESC) {
        gameState.gamePhase = PHASE_PLAYING;
        
        this.p.logs.game_info.push({
          data: { event: "game_resumed" },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      if (keyCode === KEY_R) {
        this.restart();
      }
    }
    
    // Global restart
    if (keyCode === KEY_R && gameState.gamePhase !== PHASE_START) {
      this.restart();
    }
  }
  
  handlePlayingInput(keyCode) {
    if (gameState.internalState === STATE_LOCATION_SELECT) {
      if (keyCode === KEY_ARROW_UP) {
        gameState.selectedMenuIndex = Math.max(0, gameState.selectedMenuIndex - 1);
      } else if (keyCode === KEY_ARROW_DOWN) {
        gameState.selectedMenuIndex = Math.min(LOCATIONS.length - 1, gameState.selectedMenuIndex + 1);
      } else if (keyCode === KEY_SPACE || keyCode === KEY_ENTER) {
        const loc = LOCATIONS[gameState.selectedMenuIndex];
        if (gameState.unlockedLocations.includes(loc.id)) {
          this.selectLocation(loc.id);
        }
      } else if (keyCode === KEY_D) {
        const loc = LOCATIONS[gameState.selectedMenuIndex];
        this.unlockLocation(loc.id);
      } else if (keyCode === KEY_S) {
        gameState.internalState = STATE_SHOP;
        gameState.selectedMenuIndex = 0;
      } else if (keyCode === 72) { // H key
        gameState.internalState = STATE_HOME_BASE;
        gameState.selectedMenuIndex = 0;
      }
    } else if (gameState.internalState === STATE_SHOP) {
      if (keyCode === KEY_ESC) {
        gameState.internalState = STATE_LOCATION_SELECT;
        gameState.selectedMenuIndex = 0;
      } else if (keyCode === KEY_ARROW_UP) {
        gameState.selectedMenuIndex = Math.max(0, gameState.selectedMenuIndex - 1);
      } else if (keyCode === KEY_ARROW_DOWN) {
        const maxIndex = GEAR_DATA[gameState.shopCategory].length - 1;
        gameState.selectedMenuIndex = Math.min(maxIndex, gameState.selectedMenuIndex + 1);
      } else if (keyCode === KEY_ARROW_LEFT) {
        const categories = ["rods", "reels", "lines", "lures"];
        const currentIndex = categories.indexOf(gameState.shopCategory);
        gameState.shopCategory = categories[Math.max(0, currentIndex - 1)];
        gameState.selectedMenuIndex = 0;
      } else if (keyCode === KEY_ARROW_RIGHT) {
        const categories = ["rods", "reels", "lines", "lures"];
        const currentIndex = categories.indexOf(gameState.shopCategory);
        gameState.shopCategory = categories[Math.min(categories.length - 1, currentIndex + 1)];
        gameState.selectedMenuIndex = 0;
      } else if (keyCode === KEY_S) {
        const item = GEAR_DATA[gameState.shopCategory][gameState.selectedMenuIndex];
        if (gameState.ownedGear.some(g => g.id === item.id)) {
          this.equipGear(gameState.shopCategory, item);
          this.showMessage(`${item.name} equipped!`, 60);
        } else if (this.buyGear(item)) {
          this.equipGear(gameState.shopCategory, item);
          this.showMessage(`${item.name} purchased!`, 60);
        }
      }
    } else if (gameState.internalState === STATE_HOME_BASE) {
      if (keyCode === KEY_ESC) {
        gameState.internalState = STATE_LOCATION_SELECT;
        gameState.selectedMenuIndex = 0;
      } else if (keyCode === KEY_S) {
        this.upgradeHome();
      }
    } else if (gameState.internalState === STATE_CASTING) {
      if (keyCode === KEY_SPACE) {
        gameState.castingCharging = true;
      }
    } else if (gameState.internalState === STATE_REELING) {
      if (keyCode === KEY_SPACE) {
        this.startReeling();
      }
    } else if (gameState.internalState === STATE_FISH_CAUGHT || gameState.internalState === STATE_LINE_SNAPPED) {
      if (keyCode === KEY_SPACE) {
        this.startCasting();
      }
    } else if (gameState.internalState === STATE_LEVEL_COMPLETE) {
      if (keyCode === KEY_SPACE) {
        gameState.internalState = STATE_LOCATION_SELECT;
        gameState.selectedMenuIndex = 0;
      }
    }
  }
  
  handleKeyReleased(keyCode) {
    if (gameState.internalState === STATE_CASTING) {
      if (keyCode === KEY_SPACE && gameState.castingCharging) {
        gameState.castingCharging = false;
        this.performCast();
      }
    }
  }
  
  restart() {
    // Save high score before reset
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      localStorage.setItem('reelRelaxHighScore', gameState.highScore.toString());
    }
    
    // Reset game state
    const highScore = gameState.highScore;
    const controlMode = gameState.controlMode;
    
    Object.assign(gameState, {
      gamePhase: PHASE_START,
      internalState: STATE_LOCATION_SELECT,
      controlMode: controlMode,
      player: null,
      entities: [],
      score: 0,
      cash: 0,
      currentLevel: 1,
      currentLocation: null,
      fishCaughtThisLevel: 0,
      consecutiveCatches: 0,
      highScore: highScore,
      castingPower: 0,
      castingCharging: false,
      tensionValue: 50,
      fishStamina: 100,
      lineDurability: 100,
      reelingProgress: 0,
      fishPullForce: 0,
      timeInGreenZone: 0,
      totalReelingTime: 0,
      currentFish: null,
      bobberX: 0,
      bobberY: 0,
      lineDistance: 0,
      biteTimer: 0,
      messageTimer: 0,
      messageText: "",
      equippedGear: {
        rod: null,
        reel: null,
        line: null,
        lure: null
      },
      ownedGear: [],
      caughtFish: [],
      unlockedLocations: [1],
      selectedMenuIndex: 0,
      shopCategory: "rods",
      homeLevel: 0,
      totalFishCaught: 0,
      failedAttempts: 0
    });
    
    this.init();
    
    this.p.logs.game_info.push({
      data: { event: "game_restarted" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
}