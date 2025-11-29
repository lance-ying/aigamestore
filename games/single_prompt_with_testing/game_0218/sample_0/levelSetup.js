// levelSetup.js - Level initialization and setup

import { gameState, COLORS } from './globals.js';
import { Character, Artifact, Creature, Platform, PressurePlate, Door } from './entities.js';

export function setupLevel1(p) {
  // Clear existing entities
  gameState.entities = [];
  gameState.collectibles = [];
  gameState.creatures = [];
  gameState.puzzleElements = [];
  gameState.platforms = [];
  gameState.particles = [];
  
  // Reset state
  gameState.artifactsCollected = 0;
  gameState.score = 0;
  gameState.cameraX = 0;
  gameState.doorsOpen = {};
  
  // Create characters
  gameState.brother = new Character(100, 200, 'brother');
  gameState.sister = new Character(150, 200, 'sister');
  gameState.activeCharacter = 'brother';
  gameState.player = gameState.brother;
  gameState.brother.isActive = true;
  gameState.sister.isActive = false;
  
  // Create platforms
  new Platform(200, 300, 120, 20, [100, 150, 80]);
  new Platform(400, 250, 100, 20, [100, 150, 80]);
  new Platform(600, 200, 120, 20, [100, 150, 80]);
  new Platform(800, 280, 100, 20, [100, 150, 80]);
  new Platform(950, 220, 100, 20, [100, 150, 80]);
  
  // Create stepped platforms for puzzle area
  new Platform(350, 320, 80, 15, [120, 100, 150]);
  new Platform(450, 340, 80, 15, [120, 100, 150]);
  
  // Create collectible artifacts
  new Artifact(250, 250, COLORS.crystalBlue);
  new Artifact(450, 200, COLORS.crystalPurple);
  new Artifact(650, 150, COLORS.crystalGreen);
  new Artifact(850, 230, COLORS.crystalBlue);
  new Artifact(1000, 170, COLORS.crystalPurple);
  new Artifact(1100, 100, COLORS.crystalGreen); // Final artifact high up
  
  // Create friendly creatures with hints
  new Creature(300, 280, 'owl');
  new Creature(700, 180, 'fox');
  new Creature(500, 150, 'butterfly');
  
  // Create puzzle elements
  new PressurePlate(380, 360, 'door1');
  new Door(550, 280, 'door1');
  
  // Additional platforms near end
  new Platform(750, 150, 80, 15, [100, 150, 80]);
  new Platform(900, 120, 100, 15, [100, 150, 80]);
  new Platform(1050, 80, 80, 15, [100, 150, 80]);
  
  // Log game start
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { 
        event: 'level_start',
        level: 1,
        totalArtifacts: gameState.totalArtifacts
      },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}