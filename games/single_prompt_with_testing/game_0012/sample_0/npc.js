// npc.js - NPC entities

import { TILE_SIZE } from './globals.js';
import { Creo } from './creo.js';

export class NPC {
  constructor(x, y, type, dialogue, creoTeam = null) {
    this.x = x;
    this.y = y;
    this.width = TILE_SIZE * 0.8;
    this.height = TILE_SIZE * 0.8;
    this.type = type; // "TRAINER", "STORY", "HEALER"
    this.dialogue = dialogue;
    this.creoTeam = creoTeam; // For trainers
    this.defeated = false;
    this.interacted = false;
    this.missionId = null;
  }
  
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
  
  canInteract() {
    if (this.type === "TRAINER") {
      return !this.defeated;
    }
    return true;
  }
}

export function createStoryNPC(x, y, missionId, dialogue) {
  const npc = new NPC(x, y, "STORY", dialogue);
  npc.missionId = missionId;
  return npc;
}

export function createTrainerNPC(x, y, name, creoSpecies, levels) {
  const team = creoSpecies.map((species, i) => new Creo(species, levels[i] || 8));
  const dialogue = [
    `Trainer ${name} challenges you!`,
    "Prepare for battle!"
  ];
  return new NPC(x, y, "TRAINER", dialogue, team);
}

export function createHealerNPC(x, y) {
  const dialogue = [
    "Welcome to the Creo Center!",
    "Let me heal your team.",
    "Your Creo are fully healed!"
  ];
  return new NPC(x, y, "HEALER", dialogue);
}