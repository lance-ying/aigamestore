/**
 * game_logic.js
 * Handles core game mechanics: interactions, spawning, and line management.
 */

import { gameState, CONFIG, SHAPES } from './globals.js';
import { Station } from './station.js';
import { Passenger } from './passenger.js';
import { Train } from './train.js';
import { Line } from './line.js';
import { getValidSpawnPosition, distance, isWithinBounds } from './utils.js';
import { rebuildRoutingTable } from './pathfinding.js';

export function initGameLogic(p) {
    // Initial Spawn
    spawnStation(p, SHAPES.CIRCLE);
    spawnStation(p, SHAPES.SQUARE);
    spawnStation(p, SHAPES.TRIANGLE);

    // Init lines
    for (let i = 0; i < CONFIG.MAX_LINES; i++) {
        gameState.lines.push(new Line(i));
        // Give one train per line initially
        gameState.trains.push(new Train(i));
    }
}

export function updateGameLogic(p) {
    const dt = gameState.deltaTime;
    gameState.timeSinceStart += dt;

    // 1. Spawn Stations
    gameState.nextStationTimer -= dt * 1000;
    if (gameState.nextStationTimer <= 0 && gameState.stations.length < CONFIG.MAX_STATIONS) {
        const type = Math.floor(p.random(0, 3));
        spawnStation(p, type);
        // Reset timer (gets faster over time)
        const difficultyMod = Math.min(0.5, gameState.timeSinceStart / 300); // Max 50% faster
        gameState.nextStationTimer = CONFIG.STATION_SPAWN_INTERVAL_START * (1 - difficultyMod);
    }

    // 2. Spawn Passengers
    gameState.nextPassengerTimer -= dt * 1000;
    if (gameState.nextPassengerTimer <= 0) {
        spawnPassenger(p);
        const difficultyMod = Math.min(0.7, gameState.timeSinceStart / 180); 
        gameState.nextPassengerTimer = CONFIG.PASSENGER_SPAWN_INTERVAL_START * (1 - difficultyMod);
    }

    // 3. Update Entities
    gameState.stations.forEach(st => st.update(dt));
    gameState.trains.forEach(tr => tr.update(dt));
    
    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.life <= 0) gameState.particles.splice(i, 1);
    }
}

function spawnStation(p, type) {
    const pos = getValidSpawnPosition(gameState.stations, 80, p);
    if (pos) {
        const station = new Station(pos.x, pos.y, type);
        gameState.stations.push(station);
        p.logs.game_info.push({ event: "STATION_SPAWN", id: station.id, type: type });
    }
}

function spawnPassenger(p) {
    if (gameState.stations.length < 2) return;
    
    // Pick random station
    const station = p.random(gameState.stations);
    
    // Pick random destination different from current station type
    let targetType = station.type;
    while (targetType === station.type) {
        targetType = Math.floor(p.random(0, 3));
    }
    
    station.addPassenger(new Passenger(targetType));
}

// Interaction Handlers

export function handleLineSwitch() {
    gameState.cursor.activeLineIndex = (gameState.cursor.activeLineIndex + 1) % CONFIG.MAX_LINES;
}

export function handleStationInteraction() {
    const cursor = gameState.cursor;
    const line = gameState.lines[cursor.activeLineIndex];
    
    // Find station under cursor
    let targetStation = null;
    for (const st of gameState.stations) {
        if (distance(cursor.x, cursor.y, st.x, st.y) < CONFIG.STATION_RADIUS * 1.5) {
            targetStation = st;
            break;
        }
    }

    if (targetStation) {
        // Logic:
        // 1. If line empty, start line.
        // 2. If line has stations, append to end.
        // 3. If line ends at X, and we click X, ignore?
        // 4. Constraints: No instant teleport, but for prototype, we allow connecting any station to end.
        
        // Check if we are closing a loop
        if (line.stations.length > 2 && targetStation === line.stations[0] && !line.isLoop) {
             line.isLoop = true;
             rebuildRoutingTable();
             return;
        }

        // Standard append
        if (!line.stations.includes(targetStation)) {
            // Check distance logic or allow any? Mini Metro allows any drag.
            // We allow connection.
            const added = line.addStation(targetStation);
            if (added) {
                rebuildRoutingTable();
            }
        }
    }
}

export function handleDeletion() {
    const line = gameState.lines[gameState.cursor.activeLineIndex];
    if (line.stations.length > 0) {
        if (line.isLoop) {
            line.isLoop = false;
        } else {
            line.removeLastStation();
        }
        rebuildRoutingTable();
    }
}