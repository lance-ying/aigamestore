// world.js - World generation and background rendering

import { gameState, COLORS, ZONES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Obstacle } from './entities.js';

// ============================================================================
// WORLD INITIALIZATION
// ============================================================================

export function initializeWorld(p) {
    // Create obstacles/boundaries
    createWorldBoundaries();
    createGardenArea();
    createShopsArea();
    createVillageGreen();
    createPondArea();
}

function createWorldBoundaries() {
    // Outer walls
    gameState.obstacles.push(new Obstacle(0, 0, gameState.worldWidth, 10, 'wall'));
    gameState.obstacles.push(new Obstacle(0, 0, 10, gameState.worldHeight, 'wall'));
    gameState.obstacles.push(new Obstacle(gameState.worldWidth - 10, 0, 10, gameState.worldHeight, 'wall'));
    gameState.obstacles.push(new Obstacle(0, gameState.worldHeight - 10, gameState.worldWidth, 10, 'wall'));
}

function createGardenArea() {
    const zone = ZONES.GARDEN;
    
    // Fences
    gameState.obstacles.push(new Obstacle(zone.x + 50, zone.y + 50, 150, 10, 'fence'));
    gameState.obstacles.push(new Obstacle(zone.x + 50, zone.y + 200, 150, 10, 'fence'));
    
    // Hedges
    gameState.obstacles.push(new Obstacle(zone.x + 250, zone.y + 100, 20, 100, 'hedge'));
    
    // Garden shed (small building)
    gameState.obstacles.push(new Obstacle(zone.x + 100, zone.y + 280, 80, 60, 'building'));
}

function createShopsArea() {
    const zone = ZONES.SHOPS;
    
    // Shop building
    gameState.obstacles.push(new Obstacle(zone.x + 50, zone.y + 50, 120, 100, 'building'));
    gameState.obstacles.push(new Obstacle(zone.x + 200, zone.y + 50, 150, 100, 'building'));
    
    // Market stalls
    gameState.obstacles.push(new Obstacle(zone.x + 50, zone.y + 200, 60, 50, 'fence'));
    gameState.obstacles.push(new Obstacle(zone.x + 150, zone.y + 200, 60, 50, 'fence'));
}

function createVillageGreen() {
    const zone = ZONES.VILLAGE_GREEN;
    
    // Benches (small obstacles)
    gameState.obstacles.push(new Obstacle(zone.x + 100, zone.y + 150, 40, 15, 'fence'));
    gameState.obstacles.push(new Obstacle(zone.x + 250, zone.y + 150, 40, 15, 'fence'));
    
    // Decorative hedges
    gameState.obstacles.push(new Obstacle(zone.x + 50, zone.y + 50, 15, 80, 'hedge'));
    gameState.obstacles.push(new Obstacle(zone.x + 350, zone.y + 50, 15, 80, 'hedge'));
}

function createPondArea() {
    const zone = ZONES.POND;
    
    // Pond is mostly open, just some rocks/obstacles
    gameState.obstacles.push(new Obstacle(zone.x + 100, zone.y + 250, 30, 30, 'wall'));
    gameState.obstacles.push(new Obstacle(zone.x + 280, zone.y + 200, 25, 25, 'wall'));
}

// ============================================================================
// WORLD RENDERING
// ============================================================================

export function renderWorld(p) {
    // Draw background layers
    renderSky(p);
    renderGround(p);
    renderZoneDetails(p);
    renderObstacles(p);
    renderPaths(p);
}

function renderSky(p) {
    // Gradient sky
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
        const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
        const c = p.lerpColor(
            p.color(135, 206, 235),
            p.color(200, 230, 255),
            inter
        );
        p.stroke(c);
        p.line(0, y, CANVAS_WIDTH, y);
    }
}

function renderGround(p) {
    p.noStroke();
    
    // Render each zone with appropriate ground color
    for (const [name, zone] of Object.entries(ZONES)) {
        const screenX = zone.x - gameState.cameraX;
        const screenY = zone.y - gameState.cameraY;
        
        // Skip if not visible
        if (screenX + zone.width < 0 || screenX > CANVAS_WIDTH ||
            screenY + zone.height < 0 || screenY > CANVAS_HEIGHT) {
            continue;
        }
        
        switch (name) {
            case 'GARDEN':
                renderGardenGround(p, screenX, screenY, zone.width, zone.height);
                break;
            case 'SHOPS':
                renderShopsGround(p, screenX, screenY, zone.width, zone.height);
                break;
            case 'VILLAGE_GREEN':
                renderVillageGreenGround(p, screenX, screenY, zone.width, zone.height);
                break;
            case 'POND':
                renderPondGround(p, screenX, screenY, zone.width, zone.height);
                break;
        }
    }
}

function renderGardenGround(p, x, y, width, height) {
    // Rich grass
    p.fill(...COLORS.GRASS);
    p.rect(x, y, width, height);
    
    // Grass texture
    for (let i = 0; i < 100; i++) {
        const gx = x + Math.random() * width;
        const gy = y + Math.random() * height;
        p.stroke(...COLORS.GRASS_DARK);
        p.strokeWeight(1);
        p.line(gx, gy, gx, gy + 3);
    }
}

function renderShopsGround(p, x, y, width, height) {
    // Paved area
    p.fill(...COLORS.PATH);
    p.rect(x, y, width, height);
    
    // Paving stones
    p.stroke(150, 140, 120);
    p.strokeWeight(1);
    const stoneSize = 20;
    for (let sx = x; sx < x + width; sx += stoneSize) {
        for (let sy = y; sy < y + height; sy += stoneSize) {
            p.rect(sx, sy, stoneSize - 2, stoneSize - 2);
        }
    }
}

function renderVillageGreenGround(p, x, y, width, height) {
    // Well-maintained grass
    p.fill(100, 180, 80);
    p.rect(x, y, width, height);
    
    // Flowers
    for (let i = 0; i < 30; i++) {
        const fx = x + Math.random() * width;
        const fy = y + Math.random() * height;
        p.fill(255, 100 + Math.random() * 155, 100);
        p.noStroke();
        p.circle(fx, fy, 5);
    }
}

function renderPondGround(p, x, y, width, height) {
    // Water
    p.fill(...COLORS.WATER);
    p.rect(x, y, width, height);
    
    // Water ripples
    p.noFill();
    p.stroke(120, 170, 220, 100);
    p.strokeWeight(2);
    const rippleOffset = (gameState.frameCount * 0.5) % 30;
    for (let r = 0; r < 100; r += 30) {
        p.circle(x + width / 2, y + height / 2, (r + rippleOffset) * 2);
    }
    
    // Some grass around edges
    p.fill(...COLORS.GRASS);
    p.noStroke();
    p.rect(x, y, width, 30); // Top edge
    p.rect(x, y, 30, height); // Left edge
}

function renderZoneDetails(p) {
    // Trees in garden
    const gardenZone = ZONES.GARDEN;
    const treePositions = [
        { x: 80, y: 120 },
        { x: 300, y: 180 },
        { x: 200, y: 320 }
    ];
    
    treePositions.forEach(pos => {
        renderTree(p, gardenZone.x + pos.x - gameState.cameraX, 
                      gardenZone.y + pos.y - gameState.cameraY);
    });
    
    // Pond details
    const pondZone = ZONES.POND;
    renderPondDetails(p, 
        pondZone.x + 200 - gameState.cameraX, 
        pondZone.y + 250 - gameState.cameraY
    );
}

function renderTree(p, x, y) {
    // Trunk
    p.fill(120, 80, 40);
    p.noStroke();
    p.rect(x - 8, y - 30, 16, 40);
    
    // Leaves
    p.fill(60, 140, 60);
    p.circle(x, y - 35, 50);
    p.circle(x - 15, y - 25, 40);
    p.circle(x + 15, y - 25, 40);
    p.fill(80, 160, 80);
    p.circle(x, y - 45, 35);
}

function renderPondDetails(p, x, y) {
    // Lily pads
    p.fill(80, 150, 80);
    p.noStroke();
    p.ellipse(x - 40, y - 20, 30, 25);
    p.ellipse(x + 30, y + 10, 25, 20);
    p.ellipse(x - 10, y + 40, 28, 23);
    
    // Flowers on lily pads
    p.fill(255, 200, 220);
    p.circle(x - 40, y - 20, 8);
    p.circle(x + 30, y + 10, 6);
}

function renderObstacles(p) {
    gameState.obstacles.forEach(obstacle => {
        obstacle.render(p);
    });
}

function renderPaths(p) {
    // Connecting paths between zones
    p.fill(...COLORS.PATH);
    p.noStroke();
    
    // Horizontal paths
    const pathWidth = 60;
    const hPathY = ZONES.GARDEN.height - gameState.cameraY;
    p.rect(0, hPathY - pathWidth / 2, CANVAS_WIDTH, pathWidth);
    
    // Vertical paths
    const vPathX = ZONES.GARDEN.width - gameState.cameraX;
    p.rect(vPathX - pathWidth / 2, 0, pathWidth, CANVAS_HEIGHT);
}