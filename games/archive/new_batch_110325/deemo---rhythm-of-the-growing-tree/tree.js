// tree.js - Tree growth visualization
import { TREE_BASE_X, TREE_BASE_Y, gameState } from './globals.js';

export class Tree {
  constructor(p) {
    this.p = p;
    this.baseX = TREE_BASE_X;
    this.baseY = TREE_BASE_Y;
    this.animationProgress = 0;
  }

  update() {
    // Smooth animation progress
    this.animationProgress += 0.02;
  }

  render() {
    const p = this.p;
    const height = gameState.treeHeight;
    const pixelHeight = height * 10; // 10 pixels per meter

    p.push();

    // Ground
    p.noStroke();
    p.fill(80, 60, 40);
    p.rect(0, this.baseY, p.width, p.height - this.baseY);

    // Tree trunk
    const trunkWidth = 20;
    p.fill(100, 70, 40);
    p.rect(
      this.baseX - trunkWidth / 2,
      this.baseY - pixelHeight,
      trunkWidth,
      pixelHeight
    );

    // Tree branches (appear as tree grows)
    if (height > 3) {
      this.renderBranches(pixelHeight);
    }

    // Tree leaves (appear as tree grows)
    if (height > 2) {
      this.renderLeaves(pixelHeight);
    }

    // Glowing effect at top
    if (height > 1) {
      p.noStroke();
      p.fill(150, 255, 150, 100);
      p.ellipse(this.baseX, this.baseY - pixelHeight, 30, 30);
    }

    p.pop();
  }

  renderBranches(height) {
    const p = this.p;
    const numBranches = Math.floor(gameState.treeHeight / 3);
    
    p.stroke(100, 70, 40);
    p.strokeWeight(3);

    for (let i = 0; i < numBranches; i++) {
      const branchY = this.baseY - (height * (i + 1) / (numBranches + 1));
      const branchLength = 25;
      const side = i % 2 === 0 ? 1 : -1;
      
      p.line(
        this.baseX,
        branchY,
        this.baseX + side * branchLength,
        branchY - 10
      );
    }
  }

  renderLeaves(height) {
    const p = this.p;
    const numLeaves = Math.floor(gameState.treeHeight / 2);
    
    p.noStroke();
    p.fill(50, 200, 80, 180);

    for (let i = 0; i < numLeaves; i++) {
      const leafY = this.baseY - (height * (i + 0.5) / numLeaves);
      const side = i % 2 === 0 ? 1 : -1;
      const offset = side * (20 + Math.sin(this.animationProgress + i) * 5);
      
      p.ellipse(this.baseX + offset, leafY, 15, 20);
    }
  }
}