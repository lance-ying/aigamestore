// testController.js - Automated testing controller

import { gameState, GAME_PHASES } from './globals.js';

export class TestController {
  constructor(p) {
    this.p = p;
    this.testMode = null;
    this.testFrame = 0;
  }

  setMode(mode) {
    this.testMode = mode;
    this.testFrame = 0;
  }

  getActions() {
    if (!this.testMode || gameState.gamePhase !== GAME_PHASES.PLAYING) {
      return {
        fire: false,
        reload: false,
        zoomIn: false,
        zoomOut: false,
        quickScope: false,
        panLeft: false,
        panRight: false,
        panUp: false,
        panDown: false
      };
    }

    this.testFrame++;

    if (this.testMode === 'TEST_1') {
      return this.basicTest();
    } else if (this.testMode === 'TEST_2') {
      return this.winTest();
    }

    return {};
  }

  basicTest() {
    // Basic test: zoom, pan, shoot
    const actions = {
      fire: false,
      reload: false,
      zoomIn: false,
      zoomOut: false,
      quickScope: false,
      panLeft: false,
      panRight: false,
      panUp: false,
      panDown: false
    };

    if (this.testFrame === 30) {
      actions.zoomIn = true;
    } else if (this.testFrame === 60) {
      actions.panRight = true;
    } else if (this.testFrame === 90) {
      actions.fire = true;
    } else if (this.testFrame === 120) {
      actions.reload = true;
    }

    return actions;
  }

  winTest() {
    // Aim at each target and shoot
    const actions = {
      fire: false,
      reload: false,
      zoomIn: false,
      zoomOut: false,
      quickScope: false,
      panLeft: false,
      panRight: false,
      panUp: false,
      panDown: false
    };

    if (!gameState.missionStarted) return actions;

    const hostileTargets = gameState.entities.filter(e => e.type === "hostile" && e.alive);
    
    if (hostileTargets.length === 0) return actions;

    // Zoom in at start
    if (this.testFrame === 10) {
      actions.zoomIn = true;
    }

    // Fire at intervals
    if (this.testFrame % 60 === 30 && gameState.ammoInClip > 0) {
      actions.fire = true;
    }

    // Reload if needed
    if (gameState.ammoInClip === 0 && gameState.ammoReserve > 0 && !gameState.isReloading) {
      actions.reload = true;
    }

    // Pan to find targets
    if (this.testFrame % 120 < 60) {
      actions.panRight = true;
    } else {
      actions.panLeft = true;
    }

    return actions;
  }
}