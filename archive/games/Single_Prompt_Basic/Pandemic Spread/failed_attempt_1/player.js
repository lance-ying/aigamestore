import { gameState, DNA_GAIN_RATE } from './globals.js';

export class Player {
  constructor() {
    this.infectedCountries = 0;
    this.lastDnaUpdate = 0;
    this.dnaMultiplier = 1;
  }
  
  update(p) {
    // Gain DNA points over time based on infected population
    if (gameState.totalInfected > 0 && p.frameCount - this.lastDnaUpdate >= 60 / gameState.gameSpeed) {
      const newDna = DNA_GAIN_RATE * Math.log10(1 + gameState.totalInfected / 10000) * this.dnaMultiplier * gameState.gameSpeed;
      gameState.dnaPoints += newDna;
      this.lastDnaUpdate = p.frameCount;
      
      // Log player info
      p.logs.player_info.push({
        screen_x: 0, // Not applicable for this game
        screen_y: 0, // Not applicable for this game
        game_x: gameState.dnaPoints,
        game_y: gameState.totalInfected,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Calculate overall infection rate
    gameState.infectionRate = gameState.totalPopulation > 0 ? gameState.totalInfected / gameState.totalPopulation : 0;
    
    // Update cure progress
    this.updateCureProgress(p);
    
    // Check win/lose conditions
    this.checkGameConditions(p);
  }
  
  updateCureProgress(p) {
    if (gameState.infectionRate > 0) {
      // Base cure progress rate
      let cureRate = CURE_PROGRESS_RATE;
      
      // Slow down cure based on abilities upgrades
      const drugResistance = gameState.upgradeCategories[2].upgrades[2].level * 
                             gameState.upgradeCategories[2].upgrades[2].effect;
      
      const mutation = gameState.upgradeCategories[2].upgrades[3].level * 
                       gameState.upgradeCategories[2].upgrades[3].effect;
      
      cureRate *= (1 - (drugResistance + mutation));
      
      // Accelerate cure based on symptoms (more noticeable symptoms = faster cure)
      let symptomFactor = 0;
      gameState.upgradeCategories[1].upgrades.forEach(upgrade => {
        symptomFactor += upgrade.level * upgrade.effect * 0.1;
      });
      
      cureRate *= (1 + symptomFactor);
      
      // Update cure progress
      gameState.cureProgress += cureRate * gameState.gameSpeed;
      gameState.cureProgress = Math.min(100, gameState.cureProgress);
    }
  }
  
  checkGameConditions(p) {
    // Win condition: All countries infected
    if (gameState.gamePhase === "PLAYING" && this.infectedCountries >= gameState.countries.length) {
      let allFullyInfected = true;
      for (const country of gameState.countries) {
        if (!country.fullyInfected) {
          allFullyInfected = false;
          break;
        }
      }
      
      if (allFullyInfected) {
        gameState.gamePhase = "GAME_OVER_WIN";
        p.logs.game_info.push({
          game_status: gameState.gamePhase,
          data: {
            totalInfected: gameState.totalInfected,
            cureProgress: gameState.cureProgress
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Lose condition 1: Cure completed
    if (gameState.gamePhase === "PLAYING" && gameState.cureProgress >= 100) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      p.logs.game_info.push({
        game_status: gameState.gamePhase,
        data: {
          totalInfected: gameState.totalInfected,
          cureProgress: gameState.cureProgress,
          reason: "Cure completed"
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Lose condition 2: All infected countries isolated
    if (gameState.gamePhase === "PLAYING" && this.infectedCountries > 0 && this.infectedCountries < gameState.countries.length) {
      let allInfectedClosed = true;
      let anyInfected = false;
      
      for (const country of gameState.countries) {
        if (country.infected > 0) {
          anyInfected = true;
          if (!country.closed) {
            allInfectedClosed = false;
            break;
          }
        }
      }
      
      if (anyInfected && allInfectedClosed) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({
          game_status: gameState.gamePhase,
          data: {
            totalInfected: gameState.totalInfected,
            cureProgress: gameState.cureProgress,
            reason: "All infected countries isolated"
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  purchaseUpgrade(categoryIndex, upgradeIndex) {
    const category = gameState.upgradeCategories[categoryIndex];
    const upgrade = category.upgrades[upgradeIndex];
    
    if (upgrade.level < upgrade.maxLevel && gameState.dnaPoints >= upgrade.cost) {
      gameState.dnaPoints -= upgrade.cost;
      upgrade.level++;
      
      // Increase cost for next level
      upgrade.cost = Math.floor(upgrade.cost * 1.5);
      
      // Adjust DNA multiplier based on symptoms
      if (categoryIndex === 1) { // Symptoms category
        this.dnaMultiplier = 1.0;
        gameState.upgradeCategories[1].upgrades.forEach(symptom => {
          this.dnaMultiplier += symptom.level * 0.1;
        });
      }
      
      return true;
    }
    
    return false;
  }
}