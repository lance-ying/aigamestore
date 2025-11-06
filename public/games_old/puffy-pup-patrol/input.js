// input.js - Input handling and automated testing
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class InputController {
  constructor(p) {
    this.p = p;
    this.testActionIndex = 0;
    this.testTimer = 0;
  }

  getAction() {
    if (gameState.controlMode === 'HUMAN') {
      return this.getHumanAction();
    } else {
      return this.getTestAction();
    }
  }

  getHumanAction() {
    // Returns current state, actual input handled in keyPressed/keyReleased
    return {
      moveUp: this.p.keyIsDown(38),
      moveDown: this.p.keyIsDown(40),
      moveLeft: this.p.keyIsDown(37),
      moveRight: this.p.keyIsDown(39),
      space: false, // handled in keyPressed
      enter: false,
      escape: false,
      r: false
    };
  }

  getTestAction() {
    this.testTimer++;

    const action = {
      moveUp: false,
      moveDown: false,
      moveLeft: false,
      moveRight: false,
      space: false,
      enter: false,
      escape: false,
      r: false
    };

    // TEST_1: Basic testing - start game and make some movements
    if (gameState.controlMode === 'TEST_1') {
      if (gameState.gamePhase === GAME_PHASES.START && this.testTimer > 60) {
        action.enter = true;
        this.testTimer = 0;
      } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        // Move towards center and press space periodically
        const targetX = CANVAS_WIDTH / 2;
        const targetY = CANVAS_HEIGHT / 2;
        
        if (Math.abs(gameState.cursorX - targetX) > 5) {
          action.moveRight = gameState.cursorX < targetX;
          action.moveLeft = gameState.cursorX > targetX;
        }
        if (Math.abs(gameState.cursorY - targetY) > 5) {
          action.moveDown = gameState.cursorY < targetY;
          action.moveUp = gameState.cursorY > targetY;
        }
        
        if (this.testTimer % 120 === 0) {
          action.space = true;
        }
      }
    }

    // TEST_2: Win condition testing - rapidly complete objectives
    if (gameState.controlMode === 'TEST_2') {
      if (gameState.gamePhase === GAME_PHASES.START && this.testTimer > 30) {
        action.enter = true;
        this.testTimer = 0;
      } else if (gameState.showLevelTransition && this.testTimer > 60) {
        action.space = true;
        this.testTimer = 0;
      } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        // Trace pattern quickly
        if (!gameState.isDrawing && this.testTimer % 5 === 0) {
          action.space = true;
        }
        
        // Move in circular pattern
        const angle = this.testTimer * 0.2;
        const radius = 40;
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const targetX = centerX + Math.cos(angle) * radius;
        const targetY = centerY + Math.sin(angle) * radius;
        
        action.moveRight = gameState.cursorX < targetX;
        action.moveLeft = gameState.cursorX > targetX;
        action.moveDown = gameState.cursorY < targetY;
        action.moveUp = gameState.cursorY > targetY;
      } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN && this.testTimer > 120) {
        action.r = true;
      }
    }

    return action;
  }

  executeAction(action) {
    const moveSpeed = 3;

    if (action.moveUp) gameState.cursorY = Math.max(0, gameState.cursorY - moveSpeed);
    if (action.moveDown) gameState.cursorY = Math.min(CANVAS_HEIGHT, gameState.cursorY + moveSpeed);
    if (action.moveLeft) gameState.cursorX = Math.max(0, gameState.cursorX - moveSpeed);
    if (action.moveRight) gameState.cursorX = Math.min(CANVAS_WIDTH, gameState.cursorX + moveSpeed);

    // Space key logic handled in main game loop
    if (action.space) {
      this.handleSpace();
    }
  }

  handleSpace() {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (!gameState.isDrawing) {
        // Start drawing
        gameState.isDrawing = true;
        gameState.drawnPath = [{ x: gameState.cursorX, y: gameState.cursorY }];
      } else {
        // End drawing
        gameState.isDrawing = false;
        this.evaluateDrawing();
      }
    } else if (gameState.showLevelTransition) {
      gameState.showLevelTransition = false;
      gameState.levelTransitionTimer = 0;
    }
  }

  evaluateDrawing() {
    if (!gameState.currentTargetShape || gameState.drawnPath.length < 5) {
      return;
    }

    const accuracy = gameState.currentTargetShape.calculateAccuracy(gameState.drawnPath);
    
    let message = '';
    let scoreChange = 0;
    let shouldHeal = false;

    if (accuracy >= 95) {
      message = 'Perfect!';
      scoreChange = 100;
      shouldHeal = true;
    } else if (accuracy >= 85) {
      message = 'Great!';
      scoreChange = 70;
      shouldHeal = true;
    } else if (accuracy >= 70) {
      message = 'Good!';
      scoreChange = 40;
      shouldHeal = true;
    } else {
      message = 'Miss!';
      scoreChange = -20;
    }

    gameState.score += scoreChange;
    gameState.feedbackMessage = message;
    gameState.feedbackTimer = 60;

    if (shouldHeal) {
      gameState.successfulHeals++;
      gameState.swellingMeter = Math.max(0, gameState.swellingMeter - 25);
      
      // Create particles
      const { createHealingParticles } = require('./particles.js');
      createHealingParticles(this.p, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 30);
    }

    gameState.drawnPath = [];
  }
}