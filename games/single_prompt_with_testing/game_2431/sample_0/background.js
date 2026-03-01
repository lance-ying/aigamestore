/**
 * Handles the dynamic background rendering including seasonal changes,
 * clouds, and environment details.
 */

import { gameState, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Background {
    constructor() {
        this.clouds = [];
        this.initClouds();
    }

    initClouds() {
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * 150,
                speed: Math.random() * 0.5 + 0.1,
                size: Math.random() * 0.5 + 0.5
            });
        }
    }

    update() {
        // Update seasonal progress based on score
        // Change season every 20 points
        const seasonDuration = 50;
        gameState.currentSeasonIndex = Math.floor(gameState.score / seasonDuration) % COLORS.SEASONS.length;

        // Move clouds
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > CANVAS_WIDTH + 100) {
                cloud.x = -100;
                cloud.y = Math.random() * 150;
            }
        });
    }

    render(p) {
        const season = COLORS.SEASONS[gameState.currentSeasonIndex];

        // Draw Sky Gradient
        this.drawGradient(p, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 
            p.color(season.skyTop), p.color(season.skyBottom));

        // Draw Clouds
        p.noStroke();
        p.fill(255, 255, 255, 200);
        this.clouds.forEach(cloud => {
            p.push();
            p.translate(cloud.x, cloud.y);
            p.scale(cloud.size);
            p.circle(0, 0, 60);
            p.circle(30, -10, 70);
            p.circle(60, 0, 60);
            p.pop();
        });

        // Draw Mountains / Background Hills
        p.fill(season.ground[0] * 0.8, season.ground[1] * 0.8, season.ground[2] * 0.8);
        p.beginShape();
        p.vertex(0, CANVAS_HEIGHT);
        p.vertex(0, CANVAS_HEIGHT - 100);
        p.vertex(CANVAS_WIDTH / 4, CANVAS_HEIGHT - 180);
        p.vertex(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 120);
        p.vertex(CANVAS_WIDTH * 0.75, CANVAS_HEIGHT - 200);
        p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT - 100);
        p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.endShape(p.CLOSE);

        // Draw Ground
        p.fill(season.ground);
        p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

        // Draw some details on ground (grass/snow)
        if (season.name === "Winter") {
            p.fill(255); // Snow piles
            p.circle(50, CANVAS_HEIGHT - 10, 30);
            p.circle(CANVAS_WIDTH - 50, CANVAS_HEIGHT - 20, 40);
        } else {
            p.fill(season.leaves); // Grass tufts
            for(let i=0; i<CANVAS_WIDTH; i+=40) {
                p.triangle(i, CANVAS_HEIGHT-50, i+5, CANVAS_HEIGHT-60, i+10, CANVAS_HEIGHT-50);
            }
        }
    }

    drawGradient(p, x, y, w, h, c1, c2) {
        p.noFill();
        for (let i = y; i <= y + h; i+=2) { // Step 2 for performance
            let inter = p.map(i, y, y + h, 0, 1);
            let c = p.lerpColor(c1, c2, inter);
            p.stroke(c);
            p.line(x, i, x + w, i);
        }
    }
}