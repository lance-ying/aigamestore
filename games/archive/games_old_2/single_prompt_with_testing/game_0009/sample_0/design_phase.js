// design_phase.js - Design phase logic and road drawing

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MIN_ROAD_LENGTH,
  MAX_ROAD_SEGMENTS,
  DESIGN_PHASE,
  SIMULATE_PHASE,
  gameState
} from './globals.js';

import { RoadSegment } from './road.js';

let drawStart = null;
let drawEnd = null;
let previewSegment = null;

export function initializeDesignPhase(p) {
  gameState.designPhase = DESIGN_PHASE;
  gameState.roadSegments = [];
  gameState.undoStack = [];
  gameState.selectedTool = "DRAW";
  drawStart = null;
  drawEnd = null;
  previewSegment = null;
}

export function handleDesignInput(p, keyCode) {
  // Space - place road or start simulation
  if (keyCode === 32) {
    if (drawStart === null) {
      // Start drawing from nearest entry point
      const nearest = findNearestPoint(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      if (nearest) {
        drawStart = { x: nearest.x, y: nearest.y };
      }
    } else if (drawEnd !== null) {
      // Place segment
      if (gameState.selectedTool === "DRAW") {
        placeRoadSegment(p);
      } else {
        eraseRoadSegment(p);
      }
    } else if (gameState.roadSegments.length > 0) {
      // Start simulation if we have roads
      startSimulation(p);
    }
    return;
  }
  
  // Shift - toggle draw/erase
  if (keyCode === 16) {
    gameState.selectedTool = gameState.selectedTool === "DRAW" ? "ERASE" : "DRAW";
    return;
  }
  
  // Z - undo
  if (keyCode === 90) {
    if (gameState.roadSegments.length > 0) {
      const removed = gameState.roadSegments.pop();
      gameState.undoStack.push(removed);
    }
    return;
  }
  
  // Arrow keys - move draw end point
  if (drawStart !== null) {
    if (drawEnd === null) {
      drawEnd = { x: drawStart.x + 50, y: drawStart.y };
    }
    
    const speed = 5;
    if (keyCode === 37) drawEnd.x -= speed; // LEFT
    if (keyCode === 39) drawEnd.x += speed; // RIGHT
    if (keyCode === 38) drawEnd.y -= speed; // UP
    if (keyCode === 40) drawEnd.y += speed; // DOWN
    
    // Clamp to canvas
    drawEnd.x = Math.max(20, Math.min(CANVAS_WIDTH - 20, drawEnd.x));
    drawEnd.y = Math.max(20, Math.min(CANVAS_HEIGHT - 20, drawEnd.y));
    
    // Update preview
    updatePreview(p);
  }
}

function findNearestPoint(x, y) {
  let nearest = null;
  let minDist = Infinity;
  
  // Check entry points
  for (const entry of gameState.entryPoints) {
    const dist = Math.sqrt((x - entry.x) ** 2 + (y - entry.y) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearest = entry;
    }
  }
  
  // Check existing road endpoints
  for (const seg of gameState.roadSegments) {
    const dist1 = Math.sqrt((x - seg.x1) ** 2 + (y - seg.y1) ** 2);
    const dist2 = Math.sqrt((x - seg.x2) ** 2 + (y - seg.y2) ** 2);
    
    if (dist1 < minDist) {
      minDist = dist1;
      nearest = { x: seg.x1, y: seg.y1 };
    }
    if (dist2 < minDist) {
      minDist = dist2;
      nearest = { x: seg.x2, y: seg.y2 };
    }
  }
  
  return nearest;
}

function updatePreview(p) {
  if (drawStart && drawEnd) {
    const length = Math.sqrt(
      (drawEnd.x - drawStart.x) ** 2 +
      (drawEnd.y - drawStart.y) ** 2
    );
    
    if (length >= MIN_ROAD_LENGTH) {
      previewSegment = new RoadSegment(
        drawStart.x,
        drawStart.y,
        drawEnd.x,
        drawEnd.y
      );
    } else {
      previewSegment = null;
    }
  }
}

function placeRoadSegment(p) {
  if (!previewSegment) return;
  if (gameState.roadSegments.length >= MAX_ROAD_SEGMENTS) return;
  
  gameState.roadSegments.push(previewSegment);
  
  // Continue from end point
  drawStart = { x: drawEnd.x, y: drawEnd.y };
  drawEnd = null;
  previewSegment = null;
}

function eraseRoadSegment(p) {
  // Find and remove segment near cursor
  if (!drawEnd) return;
  
  for (let i = gameState.roadSegments.length - 1; i >= 0; i--) {
    const seg = gameState.roadSegments[i];
    const dist = seg.distanceToPoint(drawEnd.x, drawEnd.y);
    if (dist < 15) {
      gameState.roadSegments.splice(i, 1);
      break;
    }
  }
}

export function startSimulation(p) {
  gameState.designPhase = SIMULATE_PHASE;
  gameState.simulationTime = 0;
  gameState.simulationRunning = true;
  gameState.vehicles = [];
  gameState.vehiclesSpawned = 0;
  gameState.completedVehicles = 0;
  gameState.jammedTime = 0;
  
  // Calculate total vehicles to spawn
  gameState.totalVehicles = gameState.levelData.targetVehicles;
  
  // Build road network
  gameState.entities = [];
  
  p.logs.game_info.push({
    data: { event: "simulation_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateDesignPhase(p) {
  // Auto-move preview for automated testing
  if (gameState.controlMode !== "HUMAN" && drawStart && !drawEnd) {
    // Find nearest exit
    let nearest = null;
    let minDist = Infinity;
    
    for (const exit of gameState.exitPoints) {
      const dist = Math.sqrt(
        (drawStart.x - exit.x) ** 2 +
        (drawStart.y - exit.y) ** 2
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = exit;
      }
    }
    
    if (nearest) {
      drawEnd = { x: nearest.x, y: nearest.y };
      updatePreview(p);
    }
  }
}

export function drawDesignPhase(p) {
  // Draw grid
  p.stroke(60, 70, 80);
  p.strokeWeight(1);
  for (let x = 0; x < CANVAS_WIDTH; x += 50) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Draw roads
  for (const seg of gameState.roadSegments) {
    seg.draw(p);
  }
  
  // Draw preview
  if (previewSegment) {
    p.push();
    if (gameState.selectedTool === "DRAW") {
      p.stroke(100, 255, 100, 150);
    } else {
      p.stroke(255, 100, 100, 150);
    }
    p.strokeWeight(20);
    p.line(
      previewSegment.x1,
      previewSegment.y1,
      previewSegment.x2,
      previewSegment.y2
    );
    p.pop();
  }
  
  // Draw start point
  if (drawStart) {
    p.fill(255, 255, 100);
    p.noStroke();
    p.circle(drawStart.x, drawStart.y, 10);
  }
  
  // Draw end point cursor
  if (drawEnd) {
    p.fill(255, 255, 100, 150);
    p.noStroke();
    p.circle(drawEnd.x, drawEnd.y, 8);
  }
}