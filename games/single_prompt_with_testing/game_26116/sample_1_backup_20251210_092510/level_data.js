/**
 * Level Generation and Data.
 * Defines the layout of the world.
 */

import { gameState, CANVAS_HEIGHT } from './globals.js';
import { Slime, Bat, Teleporter } from './entities.js';

export class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    
    render(p) {
        // Industrial texture look
        p.fill(80, 70, 70);
        p.stroke(50);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.w, this.h);
        
        // Caution stripes
        p.noStroke();
        p.fill(255, 200, 0, 100);
        for (let i = 0; i < this.w; i += 40) {
            p.rect(this.x + i, this.y, 10, 5);
        }
    }
}

export function buildLevel() {
    gameState.platforms = [];
    gameState.entities = []; // clear old entities
    
    // Level Design Strategy:
    // 0-800: Safe intro
    // 800-1600: Platforming & Pits
    // 1600-2400: Enemy Gauntlet
    // 2400+: End Goal
    
    const floorY = CANVAS_HEIGHT - 40;
    
    // 1. Initial Floor
    gameState.platforms.push(new Platform(0, floorY, 800, 40));
    gameState.platforms.push(new Platform(300, floorY - 80, 200, 20)); // First jump
    gameState.platforms.push(new Platform(600, floorY - 150, 150, 20));
    
    // 2. The Pit Section
    gameState.platforms.push(new Platform(900, floorY, 200, 40));
    gameState.platforms.push(new Platform(1200, floorY - 50, 100, 20)); // Floating
    gameState.platforms.push(new Platform(1400, floorY - 120, 100, 20)); // High
    gameState.platforms.push(new Platform(1600, floorY, 300, 40)); // Safe landing
    
    // 3. Enemy Area
    gameState.platforms.push(new Platform(2000, floorY - 60, 400, 40));
    gameState.platforms.push(new Platform(2100, floorY - 180, 200, 20));
    gameState.platforms.push(new Platform(2500, floorY, 500, 40)); // Final stretch
    
    // 4. Wall
    gameState.platforms.push(new Platform(-20, 0, 20, CANVAS_HEIGHT * 2)); // Left wall
    gameState.platforms.push(new Platform(3000, 0, 20, CANVAS_HEIGHT * 2)); // Right wall

    // Spawn Enemies
    // Slimes on ground
    gameState.entities.push(new Slime(500, floorY - 20));
    gameState.entities.push(new Slime(1000, floorY - 20));
    gameState.entities.push(new Slime(1700, floorY - 20));
    gameState.entities.push(new Slime(2100, floorY - 100)); // On platform
    gameState.entities.push(new Slime(2200, floorY - 100));
    
    // Bats in air
    gameState.entities.push(new Bat(1300, 100));
    gameState.entities.push(new Bat(1800, 150));
    gameState.entities.push(new Bat(2300, 100));
    gameState.entities.push(new Bat(2400, 150));

    // Goal
    const teleporter = new Teleporter(2800, floorY - 80);
    gameState.teleporter = teleporter;
    gameState.entities.push(teleporter);
}