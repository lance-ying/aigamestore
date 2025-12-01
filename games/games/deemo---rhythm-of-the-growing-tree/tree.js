// tree.js - Tree growth visualization (disabled)
import { TREE_BASE_X, TREE_BASE_Y, gameState } from './globals.js';

export class Tree {
  constructor(p) {
    this.p = p;
    this.baseX = TREE_BASE_X;
    this.baseY = TREE_BASE_Y;
    this.animationProgress = 0;
  }

  update() {
    this.animationProgress += 0.02;
  }

  render() {
    // Tree rendering disabled per feedback
    // The tree visual has been removed from the game
  }

  renderBranches(height) {
    // Disabled
  }

  renderLeaves(height) {
    // Disabled
  }
}