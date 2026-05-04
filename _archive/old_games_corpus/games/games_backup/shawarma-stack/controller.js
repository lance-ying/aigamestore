// controller.js - Automated testing controller

import { gameState, GAME_PHASES, INGREDIENTS, LEVEL_CONFIG } from './globals.js';

export class AutomatedController {
  constructor(p, gameLogic) {
    this.p = p;
    this.gameLogic = gameLogic;
    this.lastActionTime = 0;
    this.actionDelay = 500;
  }

  update() {
    const currentTime = this.p.millis();
    
    if (gameState.controlMode === "HUMAN") return;
    
    if (currentTime - this.lastActionTime < this.actionDelay) return;
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      this.pressEnter();
      this.lastActionTime = currentTime;
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.controlMode === "TEST_1") {
        this.basicTest();
      } else if (gameState.controlMode === "TEST_2") {
        this.winTest();
      }
      this.lastActionTime = currentTime;
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      // Stay on game over screen
    }
  }

  basicTest() {
    // Simple test: add random ingredients and serve
    if (gameState.customerQueue.length > 0) {
      const customer = gameState.customerQueue[0];
      
      if (gameState.currentWrap.length === 0) {
        // Start adding ingredients from order
        const ingredientKeys = Object.keys(customer.order);
        if (ingredientKeys.length > 0) {
          this.gameLogic.addIngredient(ingredientKeys[0]);
        }
      } else if (gameState.currentWrap.length < 3) {
        // Add more ingredients
        const ingredientKeys = Object.keys(customer.order);
        const randomKey = ingredientKeys[this.p.floor(this.p.random(ingredientKeys.length))];
        this.gameLogic.addIngredient(randomKey);
      } else {
        // Serve
        this.gameLogic.serveOrder();
      }
    }
  }

  winTest() {
    // Intelligent test: fulfill orders correctly
    if (gameState.customerQueue.length > 0) {
      const customer = gameState.customerQueue[0];
      
      // Build order correctly
      const wrapCount = {};
      gameState.currentWrap.forEach(ing => {
        wrapCount[ing] = (wrapCount[ing] || 0) + 1;
      });
      
      // Check if we need to add more ingredients
      let needsMoreIngredients = false;
      for (const [ingredient, required] of Object.entries(customer.order)) {
        if ((wrapCount[ingredient] || 0) < required) {
          this.gameLogic.addIngredient(ingredient);
          needsMoreIngredients = true;
          break;
        }
      }
      
      // If order is complete, serve
      if (!needsMoreIngredients && gameState.currentWrap.length > 0) {
        this.gameLogic.serveOrder();
      }
    }
  }

  pressEnter() {
    // Simulate ENTER key press
    this.p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: "Enter", keyCode: 13 },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
}