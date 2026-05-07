/**
 * train.js
 * Train entity that moves along lines carrying passengers.
 */

import { CONFIG, COLORS, gameState, SHAPES } from './globals.js';
import { distance, lerp, setFillColor } from './utils.js';

export class Train {
    constructor(lineIndex) {
        this.lineIndex = lineIndex;
        this.passengers = [];
        this.capacity = CONFIG.TRAIN_CAPACITY;
        
        // Movement state
        this.currentStationIndex = 0;
        this.nextStationIndex = 1;
        this.progress = 0; // 0.0 to 1.0 along segment
        this.direction = 1; // 1 = forward, -1 = backward
        this.state = "MOVING"; // MOVING, DWELLING
        this.dwellTimer = 0;
        this.dwellDuration = 1.0; // Seconds to wait at station
        
        // Position for rendering
        this.x = 0;
        this.y = 0;
        this.angle = 0;
    }

    update(dt) {
        const line = gameState.lines[this.lineIndex];
        if (!line || line.stations.length < 2) return;

        // Ensure indices valid (if line modified)
        if (this.currentStationIndex >= line.stations.length) {
            this.currentStationIndex = line.stations.length - 1;
            this.nextStationIndex = this.currentStationIndex - 1;
            this.direction = -1;
            this.progress = 0;
        }

        if (this.state === "MOVING") {
            this.handleMoving(dt, line);
        } else if (this.state === "DWELLING") {
            this.handleDwelling(dt, line);
        }
    }

    handleMoving(dt, line) {
        const stA = line.stations[this.currentStationIndex];
        const stB = line.stations[this.nextStationIndex];
        
        // Calculate segment length
        const dist = distance(stA.x, stA.y, stB.x, stB.y);
        const speed = CONFIG.TRAIN_SPEED * 20; // Scale speed
        
        // Update progress
        const increment = (speed * dt) / dist;
        this.progress += increment;

        // Interpolate position
        this.x = lerp(stA.x, stB.x, this.progress);
        this.y = lerp(stA.y, stB.y, this.progress);
        this.angle = Math.atan2(stB.y - stA.y, stB.x - stA.x);

        // Arrived?
        if (this.progress >= 1.0) {
            this.progress = 0;
            this.currentStationIndex = this.nextStationIndex;
            this.state = "DWELLING";
            this.dwellTimer = 0;
            
            // Snap to station
            this.x = stB.x;
            this.y = stB.y;
        }
    }

    handleDwelling(dt, line) {
        this.dwellTimer += dt;
        
        // Exchange passengers happen instantly at start of dwell (simple)
        if (this.dwellTimer <= dt) { 
            this.exchangePassengers(line.stations[this.currentStationIndex]);
        }

        if (this.dwellTimer >= this.dwellDuration) {
            this.state = "MOVING";
            this.determineNextStation(line);
        }
    }

    determineNextStation(line) {
        // Logic for next station
        if (this.direction === 1) {
            if (this.currentStationIndex < line.stations.length - 1) {
                this.nextStationIndex = this.currentStationIndex + 1;
            } else {
                // End of line
                if (line.isLoop) {
                    this.nextStationIndex = 0; // Loop around
                } else {
                    this.direction = -1;
                    this.nextStationIndex = this.currentStationIndex - 1;
                }
            }
        } else {
            if (this.currentStationIndex > 0) {
                this.nextStationIndex = this.currentStationIndex - 1;
            } else {
                // Start of line
                if (line.isLoop) {
                     this.nextStationIndex = line.stations.length - 1; // Loop back
                } else {
                    this.direction = 1;
                    this.nextStationIndex = this.currentStationIndex + 1;
                }
            }
        }
    }

    exchangePassengers(station) {
        // 1. Unload passengers
        for (let i = this.passengers.length - 1; i >= 0; i--) {
            const pass = this.passengers[i];
            
            // Arrived at destination?
            if (pass.targetType === station.type) {
                this.passengers.splice(i, 1);
                gameState.passengersDelivered++;
                gameState.score += CONFIG.SCORE_PER_DELIVERY;
                // Add visual effect here?
                gameState.particles.push(new ScoreParticle(station.x, station.y));
            } else {
                // Check transfer?
                // If the next step in their route suggests changing lines, unload here.
                // Re-check route from CURRENT station
                if (gameState.networkGraph && gameState.networkGraph[station.id]) {
                    const route = gameState.networkGraph[station.id][pass.targetType];
                    // If route says take different line, get off
                    if (route && route.lineIndex !== this.lineIndex) {
                        this.passengers.splice(i, 1);
                        station.addPassenger(pass); // Wait at station again
                    }
                }
            }
        }

        // 2. Load passengers
        // Capacity check
        const space = this.capacity - this.passengers.length;
        if (space <= 0) return;

        // Iterate waiting passengers
        // Only pick up those whose path includes this line NEXT
        const boarding = [];
        for (const pass of station.passengers) {
            if (boarding.length >= space) break;

            if (gameState.networkGraph && gameState.networkGraph[station.id]) {
                const route = gameState.networkGraph[station.id][pass.targetType];
                if (route && route.lineIndex === this.lineIndex) {
                    // Correct direction check could be added here for realism, 
                    // but for simplicity, they board if the line is correct. 
                    // (They might travel wrong way for a bit, but will eventually get there).
                    boarding.push(pass);
                }
            }
        }

        // Move from station to train
        boarding.forEach(pass => {
            station.removePassenger(pass);
            this.passengers.push(pass);
        });
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.angle);
        
        // Draw Train Body
        setFillColor(p, COLORS.LINES[this.lineIndex]);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, 24, 12, 4);
        
        // Draw Passengers inside
        p.fill(255);
        this.passengers.forEach((pass, i) => {
            const xOff = -8 + i * 5;
            p.circle(xOff, 0, 3);
        });
        
        p.pop();
    }
}

class ScoreParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 1.0;
        this.vy = -1;
    }
    
    update() {
        this.y += this.vy;
        this.life -= 0.02;
    }
    
    render(p) {
        if (this.life <= 0) return;
        p.fill(50, 200, 50, this.life * 255);
        p.noStroke();
        p.textSize(12);
        p.text("+10", this.x, this.y);
    }
}