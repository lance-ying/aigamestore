// npc.js - NPC entity class

import { ENTITY_NPC, TILE_SIZE } from './globals.js';

export class NPC {
  constructor(p, x, y, name) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = TILE_SIZE * 0.6;
    this.height = TILE_SIZE * 0.8;
    this.type = ENTITY_NPC;
    this.name = name;
    this.questGiver = true;
  }

  render(p, cameraX, cameraY) {
    p.push();
    
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Draw NPC body
    p.fill(200, 100, 50);
    p.rect(screenX, screenY, this.width, this.height * 0.6);
    
    // Draw NPC head
    p.fill(255, 220, 180);
    const headSize = this.width * 0.8;
    p.rect(screenX + this.width / 2 - headSize / 2, screenY - headSize * 0.3, headSize, headSize);
    
    // Draw eyes
    p.fill(0);
    const eyeY = screenY - headSize * 0.1;
    p.rect(screenX + this.width * 0.3, eyeY, 3, 3);
    p.rect(screenX + this.width * 0.6, eyeY, 3, 3);
    
    // Draw quest marker
    if (this.questGiver) {
      p.fill(255, 255, 0);
      p.textSize(20);
      p.textAlign(p.CENTER);
      p.text("!", screenX + this.width / 2, screenY - headSize);
    }
    
    p.pop();
  }
}