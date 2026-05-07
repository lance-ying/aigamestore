/**
 * station.js
 * Station entity definition.
 */

import { CONFIG, COLORS, SHAPES, gameState, GAME_PHASES } from './globals.js';
import { generateID, setStrokeColor, setFillColor } from './utils.js';

export class Station {
    constructor(x, y, type) {
        this.id = generateID();
        this.x = x;
        this.y = y;
        this.type = type; // SHAPES enum
        this.passengers = []; // Array of Passengers waiting
        this.capacity = CONFIG.STATION_CAPACITY;
        
        // Overcrowding
        this.overcrowdTimer = 0;
        this.isOvercrowded = false;
        
        // Animation
        this.spawnScale = 0; // 0 to 1 for pop-in effect
    }

    update(dt) {
        // Spawn animation
        if (this.spawnScale < 1) {
            this.spawnScale = Math.min(1, this.spawnScale + dt * 2);
        }

        // Overcrowding Logic
        if (this.passengers.length > this.capacity) {
            this.isOvercrowded = true;
            this.overcrowdTimer += dt * 1000;
            
            // Check Lose Condition
            if (this.overcrowdTimer > CONFIG.OVERCROWD_TIMER_MS) {
                if (gameState.gamePhase === GAME_PHASES.PLAYING) {
                    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
                }
            }
        } else {
            this.isOvercrowded = false;
            this.overcrowdTimer = Math.max(0, this.overcrowdTimer - dt * 500); // Cooldown
        }
    }

    addPassenger(passenger) {
        this.passengers.push(passenger);
    }

    removePassenger(passenger) {
        const index = this.passengers.indexOf(passenger);
        if (index > -1) {
            this.passengers.splice(index, 1);
        }
    }

    render(p) {
        const r = CONFIG.STATION_RADIUS * this.spawnScale;
        
        p.push();
        p.translate(this.x, this.y);
        
        // Draw Overcrowd Timer (Arc around station)
        if (this.overcrowdTimer > 0) {
            p.noFill();
            p.strokeWeight(4);
            const ratio = this.overcrowdTimer / CONFIG.OVERCROWD_TIMER_MS;
            
            // Pulse red if critical
            if (ratio > 0.7 && p.frameCount % 20 < 10) {
                setStrokeColor(p, [255, 0, 0]);
            } else {
                setStrokeColor(p, COLORS.OVERCROWD_WARNING);
            }
            
            p.arc(0, 0, r * 3.5, r * 3.5, -p.PI / 2, -p.PI / 2 + ratio * p.TWO_PI);
        }

        // Draw Station Shape
        p.strokeWeight(3);
        setStrokeColor(p, COLORS.STATION_BORDER);
        setFillColor(p, COLORS.STATION_FILL);

        if (this.type === SHAPES.CIRCLE) {
            p.circle(0, 0, r * 2);
        } else if (this.type === SHAPES.SQUARE) {
            p.rectMode(p.CENTER);
            p.rect(0, 0, r * 1.8, r * 1.8);
        } else if (this.type === SHAPES.TRIANGLE) {
            p.triangle(0, -r, r, r * 0.8, -r, r * 0.8);
        }

        // Draw Waiting Passengers
        this.renderPassengers(p, r);

        p.pop();
    }

    renderPassengers(p, stationRadius) {
        // Passengers arrange themselves to the side of the station
        const spacing = 10;
        const startX = stationRadius + 10;
        
        this.passengers.forEach((pass, i) => {
            // Group into rows of 3
            const row = Math.floor(i / 3);
            const col = i % 3;
            
            const px = startX + row * spacing;
            const py = (col - 1) * spacing;
            
            pass.renderAt(p, px, py);
        });
    }
}