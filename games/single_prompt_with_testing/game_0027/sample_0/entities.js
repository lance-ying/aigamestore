// entities.js - Game entities and objects

import { GRID_SIZE, TYPE_BABA, TYPE_WALL, TYPE_ROCK, TYPE_FLAG, TYPE_GRASS, TYPE_WATER } from './globals.js';

export class Entity {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.gridX = x;
    this.gridY = y;
    this.prevX = x;
    this.prevY = y;
    this.animProgress = 0;
    this.deleted = false;
  }

  update() {
    // Smooth animation
    if (this.animProgress < 1) {
      this.animProgress += 0.3;
      if (this.animProgress > 1) this.animProgress = 1;
    }
  }

  startMove(newGridX, newGridY) {
    this.prevX = this.gridX;
    this.prevY = this.gridY;
    this.gridX = newGridX;
    this.gridY = newGridY;
    this.animProgress = 0;
  }

  getCurrentX() {
    const prevScreenX = this.prevX * GRID_SIZE;
    const currentScreenX = this.gridX * GRID_SIZE;
    return prevScreenX + (currentScreenX - prevScreenX) * this.animProgress;
  }

  getCurrentY() {
    const prevScreenY = this.prevY * GRID_SIZE;
    const currentScreenY = this.gridY * GRID_SIZE;
    return prevScreenY + (currentScreenY - prevScreenY) * this.animProgress;
  }

  render(p) {
    const x = this.getCurrentX();
    const y = this.getCurrentY();
    const size = GRID_SIZE;

    p.push();
    p.translate(x + size / 2, y + size / 2);

    switch (this.type) {
      case TYPE_BABA:
        this.renderBaba(p, size);
        break;
      case TYPE_WALL:
        this.renderWall(p, size);
        break;
      case TYPE_ROCK:
        this.renderRock(p, size);
        break;
      case TYPE_FLAG:
        this.renderFlag(p, size);
        break;
      case TYPE_GRASS:
        this.renderGrass(p, size);
        break;
      case TYPE_WATER:
        this.renderWater(p, size);
        break;
    }

    p.pop();
  }

  renderBaba(p, size) {
    // Cute character with animation
    const bounce = Math.sin(p.frameCount * 0.1) * 2;
    p.fill(255, 255, 255);
    p.noStroke();
    // Body
    p.ellipse(0, bounce, size * 0.6, size * 0.7);
    // Ears
    p.ellipse(-size * 0.2, -size * 0.3 + bounce, size * 0.15, size * 0.3);
    p.ellipse(size * 0.2, -size * 0.3 + bounce, size * 0.15, size * 0.3);
    // Eyes
    p.fill(0);
    p.ellipse(-size * 0.1, -size * 0.05 + bounce, size * 0.08);
    p.ellipse(size * 0.1, -size * 0.05 + bounce, size * 0.08);
    // Nose
    p.fill(255, 150, 150);
    p.ellipse(0, size * 0.05 + bounce, size * 0.1, size * 0.08);
  }

  renderWall(p, size) {
    p.fill(80, 80, 100);
    p.stroke(60, 60, 80);
    p.strokeWeight(2);
    p.rect(-size * 0.45, -size * 0.45, size * 0.9, size * 0.9);
    // Brick pattern
    p.stroke(60, 60, 80);
    p.line(-size * 0.45, 0, size * 0.45, 0);
    p.line(0, -size * 0.45, 0, 0);
    p.line(0, 0, 0, size * 0.45);
  }

  renderRock(p, size) {
    p.fill(120, 100, 80);
    p.stroke(90, 70, 60);
    p.strokeWeight(2);
    p.beginShape();
    p.vertex(-size * 0.35, size * 0.2);
    p.vertex(-size * 0.2, -size * 0.3);
    p.vertex(size * 0.1, -size * 0.35);
    p.vertex(size * 0.35, -size * 0.1);
    p.vertex(size * 0.3, size * 0.3);
    p.vertex(0, size * 0.35);
    p.endShape(p.CLOSE);
  }

  renderFlag(p, size) {
    // Pole
    p.stroke(100, 70, 50);
    p.strokeWeight(3);
    p.line(0, -size * 0.4, 0, size * 0.4);
    // Flag
    p.noStroke();
    p.fill(255, 220, 0);
    p.beginShape();
    p.vertex(0, -size * 0.4);
    p.vertex(size * 0.35, -size * 0.25);
    p.vertex(0, -size * 0.1);
    p.endShape(p.CLOSE);
  }

  renderGrass(p, size) {
    p.noStroke();
    p.fill(100, 180, 100);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * p.TWO_PI + p.frameCount * 0.01;
      const dist = size * 0.15;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      p.ellipse(x, y, size * 0.15, size * 0.2);
    }
  }

  renderWater(p, size) {
    const wave = Math.sin(p.frameCount * 0.05) * 3;
    p.fill(80, 150, 220);
    p.noStroke();
    p.rect(-size * 0.45, -size * 0.45, size * 0.9, size * 0.9);
    // Wave effect
    p.fill(100, 170, 240, 150);
    p.ellipse(0, wave, size * 0.6, size * 0.3);
  }
}

export class WordBlock {
  constructor(wordType, word, x, y) {
    this.wordType = wordType; // NOUN, IS, PROPERTY
    this.word = word;
    this.x = x;
    this.y = y;
    this.gridX = x;
    this.gridY = y;
    this.prevX = x;
    this.prevY = y;
    this.animProgress = 0;
    this.deleted = false;
  }

  update() {
    if (this.animProgress < 1) {
      this.animProgress += 0.3;
      if (this.animProgress > 1) this.animProgress = 1;
    }
  }

  startMove(newGridX, newGridY) {
    this.prevX = this.gridX;
    this.prevY = this.gridY;
    this.gridX = newGridX;
    this.gridY = newGridY;
    this.animProgress = 0;
  }

  getCurrentX() {
    const prevScreenX = this.prevX * GRID_SIZE;
    const currentScreenX = this.gridX * GRID_SIZE;
    return prevScreenX + (currentScreenX - prevScreenX) * this.animProgress;
  }

  getCurrentY() {
    const prevScreenY = this.prevY * GRID_SIZE;
    const currentScreenY = this.gridY * GRID_SIZE;
    return prevScreenY + (currentScreenY - prevScreenY) * this.animProgress;
  }

  render(p) {
    const x = this.getCurrentX();
    const y = this.getCurrentY();
    const size = GRID_SIZE;

    p.push();
    p.translate(x + size / 2, y + size / 2);

    // Color based on word type
    const colors = {
      NOUN: [255, 180, 180],
      IS: [200, 200, 200],
      PROPERTY: [180, 220, 255]
    };
    const col = colors[this.wordType] || [200, 200, 200];

    p.fill(...col);
    p.stroke(col[0] * 0.7, col[1] * 0.7, col[2] * 0.7);
    p.strokeWeight(2);
    p.rect(-size * 0.45, -size * 0.45, size * 0.9, size * 0.9, 5);

    // Text
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(size * 0.25);
    p.text(this.word, 0, 0);

    p.pop();
  }
}