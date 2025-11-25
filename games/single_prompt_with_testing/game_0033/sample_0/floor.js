// floor.js - Floor/Level management

import { CANVAS_WIDTH, CANVAS_HEIGHT, LANGUAGES } from './globals.js';
import { NPC } from './npc.js';
import { GlyphObject } from './glyphObject.js';

export class Floor {
  constructor(index, language, p) {
    this.index = index;
    this.language = language;
    this.y = index * 400;
    this.height = 400;
    this.color = language.color;
    this.npcs = [];
    this.glyphObjects = [];
    
    this.initializeEntities(p);
  }

  initializeEntities(p) {
    // Create NPCs for this floor (2 per floor)
    const npcPositions = [
      { x: 150, y: this.y + 200 },
      { x: 450, y: this.y + 250 }
    ];

    for (let i = 0; i < 2 && i < this.language.glyphs.length; i++) {
      const npc = new NPC(
        npcPositions[i].x,
        npcPositions[i].y,
        this.language.floor,
        i,
        p
      );
      this.npcs.push(npc);
    }

    // Create glyph objects for remaining glyphs
    const objectPositions = [
      { x: 100, y: this.y + 100 },
      { x: 500, y: this.y + 150 },
      { x: 300, y: this.y + 300 }
    ];

    for (let i = 2; i < this.language.glyphs.length && i < 4; i++) {
      const obj = new GlyphObject(
        objectPositions[i - 2].x,
        objectPositions[i - 2].y,
        this.language.floor,
        i,
        p
      );
      this.glyphObjects.push(obj);
    }
  }

  draw(p) {
    p.push();

    // Background for floor
    const bgColor = this.color.map(c => c * 0.3);
    p.fill(...bgColor, 255);
    p.noStroke();
    p.rect(0, this.y, CANVAS_WIDTH, this.height);

    // Floor pattern
    p.stroke(...this.color, 100);
    p.strokeWeight(1);
    for (let i = 0; i < 20; i++) {
      const lineY = this.y + i * 20;
      p.line(0, lineY, CANVAS_WIDTH, lineY);
    }

    // Side pillars
    p.fill(...this.color, 150);
    p.noStroke();
    p.rect(0, this.y, 30, this.height);
    p.rect(CANVAS_WIDTH - 30, this.y, 30, this.height);

    // Floor name plate
    p.fill(255, 255, 240);
    p.stroke(100, 100, 100);
    p.strokeWeight(2);
    p.rect(CANVAS_WIDTH / 2 - 100, this.y + 20, 200, 40, 5);
    p.fill(...this.color);
    p.noStroke();
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(this.language.name, CANVAS_WIDTH / 2, this.y + 30);
    p.textSize(10);
    p.text(`Floor ${this.index + 1}`, CANVAS_WIDTH / 2, this.y + 48);

    // Decorative elements
    this.drawDecorations(p);

    p.pop();
  }

  drawDecorations(p) {
    // Draw cultural symbols on walls
    p.fill(...this.color, 80);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    
    for (let i = 0; i < 3; i++) {
      const symbolY = this.y + 150 + i * 80;
      p.text(this.language.glyphs[i % this.language.glyphs.length].symbol, 50, symbolY);
      p.text(this.language.glyphs[(i + 1) % this.language.glyphs.length].symbol, CANVAS_WIDTH - 50, symbolY);
    }

    // Archway to next floor
    if (this.index < 2) {
      p.fill(...this.color, 100);
      p.stroke(...this.color, 200);
      p.strokeWeight(3);
      p.arc(CANVAS_WIDTH / 2, this.y, 120, 80, p.PI, p.TWO_PI);
      p.noStroke();
      p.fill(0, 0, 0, 100);
      p.rect(CANVAS_WIDTH / 2 - 50, this.y, 100, 40);
    }
  }
}