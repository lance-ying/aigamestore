// testing.js - Automated testing controllers

import { gameState, PHASE_PLAYING } from './globals.js';

export class TestController {
  constructor(mode) {
    this.mode = mode;
    this.actionTimer = 0;
  }

  getAction() {
    if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) {
      return null;
    }

    if (this.mode === "TEST_1") {
      return this.basicTest();
    } else if (this.mode === "TEST_2") {
      return this.winTest();
    }

    return null;
  }

  basicTest() {
    // Simple test: periodic lane changes and jumps
    this.actionTimer++;

    const action = { jump: false, slide: false, left: false, right: false };

    if (this.actionTimer % 60 === 0) {
      action.jump = true;
    }

    if (this.actionTimer % 120 === 30) {
      action.right = true;
    }

    if (this.actionTimer % 120 === 90) {
      action.left = true;
    }

    return action;
  }

  winTest() {
    // Advanced test: try to avoid obstacles and reach the end
    const player = gameState.player;
    const action = { jump: false, slide: false, left: false, right: false };

    // Look ahead for obstacles
    const lookAheadDistance = 200;
    let needJump = false;
    let needSlide = false;
    let dangerInLane = false;

    for (const obstacle of gameState.obstacles) {
      if (!obstacle.active) continue;

      const dx = obstacle.x - player.x;
      if (dx > 0 && dx < lookAheadDistance && obstacle.lane === player.lane) {
        dangerInLane = true;
        if (obstacle.type === "obstacle_low" || obstacle.type === "gap") {
          needJump = true;
        } else if (obstacle.type === "obstacle_high") {
          needSlide = true;
        }
      }
    }

    // Execute action
    if (needJump && player.state === "running") {
      action.jump = true;
    } else if (needSlide && player.state === "running") {
      action.slide = true;
    } else if (dangerInLane && player.state === "running") {
      // Try to change lane if in danger
      if (player.lane > 0) {
        action.left = true;
      } else if (player.lane < 2) {
        action.right = true;
      }
    }

    // Collect items
    for (const item of gameState.items) {
      if (!item.active || item.collected) continue;

      const dx = item.x - player.x;
      if (dx > 0 && dx < 150) {
        if (item.lane < player.lane) {
          action.left = true;
        } else if (item.lane > player.lane) {
          action.right = true;
        }
      }
    }

    return action;
  }

  reset() {
    this.actionTimer = 0;
  }
}