// gameLogic.js - Core game logic

import { gameState, GAME_PHASES, LEVEL_CONFIG, INGREDIENTS } from './globals.js';
import { Customer } from './customer.js';

export class GameLogic {
  constructor(p) {
    this.p = p;
    // TAP-BASED ACTION TRACKING
    this.lastActionTime = 0;
    this.actionCooldown = 100; // Minimum time between discrete actions
  }

  initLevel(level) {
    gameState.currentLevel = level;
    gameState.currentWrap = [];
    gameState.customerQueue = [];
    gameState.customersServed = 0;
    gameState.totalCustomersThisLevel = 0;
    gameState.coins = 0;
    gameState.particles = [];
    
    const config = LEVEL_CONFIG[level - 1];
    gameState.reputation = config.initialReputation;
    gameState.nextCustomerTime = this.p.millis() + 2000;
    gameState.levelStartTime = this.p.millis();
    
    // Reset action cooldown
    this.lastActionTime = 0;
  }

  update() {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    const currentTime = this.p.millis();
    const config = LEVEL_CONFIG[gameState.currentLevel - 1];
    
    // Spawn new customers
    if (currentTime >= gameState.nextCustomerTime && 
        gameState.customerQueue.length < 3 &&
        gameState.totalCustomersThisLevel < config.objective.customers) {
      this.spawnCustomer();
      const arrivalTime = this.p.random(config.customerArrivalMin, config.customerArrivalMax);
      gameState.nextCustomerTime = currentTime + arrivalTime;
    }
    
    // Update customers
    const deltaTime = 16.67; // Approximate 60 FPS
    for (let i = gameState.customerQueue.length - 1; i >= 0; i--) {
      const customer = gameState.customerQueue[i];
      const shouldRemove = customer.update(deltaTime);
      
      if (shouldRemove) {
        gameState.customerQueue.splice(i, 1);
      } else if (customer.timer <= 0 && !customer.leaving) {
        // Customer left angry
        this.handleCustomerTimeout(customer);
      }
    }
    
    // Check win condition
    if (gameState.totalCustomersThisLevel >= config.objective.customers &&
        gameState.coins >= config.objective.coins &&
        gameState.customerQueue.length === 0) {
      this.levelComplete();
    }
    
    // Check lose condition
    if (gameState.reputation <= 0) {
      this.gameOver(false);
    }
  }

  spawnCustomer() {
    const positions = [150, 300, 450];
    const index = gameState.customerQueue.length;
    const customer = new Customer(
      this.p,
      gameState.currentLevel,
      positions[index],
      120
    );
    gameState.customerQueue.push(customer);
    gameState.totalCustomersThisLevel++;
    
    // Create arrival particles
    if (typeof window.createParticles === 'function') {
      window.createParticles(positions[index], 80, [200, 200, 255], 8, 'star');
    }
  }

  addIngredient(ingredientKey) {
    // TAP-BASED ACTION: Each call is a discrete single tap
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    if (gameState.customerQueue.length === 0) return;
    
    const currentTime = this.p.millis();
    
    // Enforce cooldown to prevent rapid-fire from held keys
    if (currentTime - this.lastActionTime < this.actionCooldown) {
      return;
    }
    
    // Add exactly ONE ingredient per tap
    gameState.currentWrap.push(ingredientKey);
    gameState.lastAddedIngredient = ingredientKey;
    gameState.lastAddedTime = currentTime;
    this.lastActionTime = currentTime;
    
    // Create particles for visual feedback
    const ingredient = INGREDIENTS[ingredientKey];
    if (ingredient && typeof window.createParticles === 'function') {
      window.createParticles(300, 230, ingredient.color, 5, 'normal');
    }
    
    // Log player action (TAP-BASED)
    this.p.logs.player_info.push({
      action: "add_ingredient_TAP",
      ingredient: ingredientKey,
      wrap_size: gameState.currentWrap.length,
      discrete_action: true,
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  serveOrder() {
    // TAP-BASED ACTION: Each call is a discrete single tap
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    if (gameState.customerQueue.length === 0) return;
    
    const currentTime = this.p.millis();
    
    // Enforce cooldown to prevent accidental double-serves
    if (currentTime - this.lastActionTime < this.actionCooldown) {
      return;
    }
    
    const customer = gameState.customerQueue[0];
    const orderCorrect = this.checkOrder(customer.order, gameState.currentWrap);
    
    this.lastActionTime = currentTime;
    
    if (orderCorrect) {
      const timerPercent = customer.timer / customer.maxTimer;
      let points = 50;
      let coins = 20;
      
      // Timely bonus
      if (timerPercent > 0.5) {
        points += 25;
        coins += 10;
      }
      
      // Perfect order bonus (exact match)
      if (this.isPerfectOrder(customer.order, gameState.currentWrap)) {
        points += 50;
        coins += 15;
      }
      
      gameState.score += points;
      gameState.coins += coins;
      gameState.reputation = Math.min(1.0, gameState.reputation + 0.05);
      gameState.customersServed++;
      
      customer.startLeaving(true);
      
      // Create success particles
      if (typeof window.createParticles === 'function') {
        window.createParticles(300, 230, [255, 215, 0], 20, 'star');
      }
      
      // Log score update (TAP-BASED)
      this.p.logs.player_info.push({
        action: "serve_correct_TAP",
        points_earned: points,
        coins_earned: coins,
        score: gameState.score,
        discrete_action: true,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    } else {
      gameState.reputation = Math.max(0, gameState.reputation - 0.15);
      customer.startLeaving(false);
      
      // Create failure particles
      if (typeof window.createParticles === 'function') {
        window.createParticles(300, 230, [100, 100, 100], 10, 'normal');
      }
      
      this.p.logs.player_info.push({
        action: "serve_incorrect_TAP",
        reputation: gameState.reputation,
        discrete_action: true,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Clear wrap after serving (single discrete action complete)
    gameState.currentWrap = [];
  }

  checkOrder(order, wrap) {
    const wrapCount = {};
    wrap.forEach(ingredient => {
      wrapCount[ingredient] = (wrapCount[ingredient] || 0) + 1;
    });
    
    // Check if all required ingredients are present with at least the required amount
    for (const [ingredient, requiredCount] of Object.entries(order)) {
      if ((wrapCount[ingredient] || 0) < requiredCount) {
        return false;
      }
    }
    
    return true;
  }

  isPerfectOrder(order, wrap) {
    const wrapCount = {};
    wrap.forEach(ingredient => {
      wrapCount[ingredient] = (wrapCount[ingredient] || 0) + 1;
    });
    
    // Check exact match
    for (const [ingredient, requiredCount] of Object.entries(order)) {
      if (wrapCount[ingredient] !== requiredCount) {
        return false;
      }
    }
    
    // Check no extra ingredients
    for (const [ingredient, count] of Object.entries(wrapCount)) {
      if (!order[ingredient]) {
        return false;
      }
    }
    
    return true;
  }

  handleCustomerTimeout(customer) {
    gameState.reputation = Math.max(0, gameState.reputation - 0.2);
    customer.startLeaving(false);
    
    this.p.logs.player_info.push({
      action: "customer_timeout",
      reputation: gameState.reputation,
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  levelComplete() {
    const bonus = 250;
    gameState.score += bonus;
    
    // Create level complete particles
    if (typeof window.createParticles === 'function') {
      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          window.createParticles(
            this.p.random(100, 500),
            this.p.random(100, 300),
            [255, 215, 0],
            3,
            'star'
          );
        }, i * 50);
      }
    }
    
    this.p.logs.game_info.push({
      event: "level_complete",
      level: gameState.currentLevel,
      score: gameState.score,
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.currentLevel >= 5) {
      this.gameOver(true);
    } else {
      gameState.currentLevel++;
      setTimeout(() => {
        this.initLevel(gameState.currentLevel);
      }, 2000);
    }
  }

  gameOver(win) {
    gameState.gamePhase = win ? GAME_PHASES.GAME_OVER_WIN : GAME_PHASES.GAME_OVER_LOSE;
    
    // Update high score
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('shawarmaStackHighScore', gameState.highScore);
      }
    }
    
    this.p.logs.game_info.push({
      event: "game_over",
      win: win,
      final_score: gameState.score,
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
}