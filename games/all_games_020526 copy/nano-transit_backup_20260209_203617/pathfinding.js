/**
 * pathfinding.js
 * Implements routing logic for passengers to find their way across the metro network.
 */

import { gameState, SHAPES } from './globals.js';

/**
 * Rebuilds the routing table for the entire network.
 * This is an expensive operation, so it should be called only when the network topology changes
 * (Line added, Line extended, Line removed).
 * 
 * Routing Table Structure:
 * routeTable[startStationID][targetShapeType] = {
 *    nextStationId: number, // The next station to go to
 *    lineIndex: number      // The line to take to get there
 * }
 */
export function rebuildRoutingTable() {
    const table = {};
    
    // Initialize table for all stations
    gameState.stations.forEach(station => {
        table[station.id] = {};
        // Initialize for each shape type
        Object.values(SHAPES).forEach(shape => {
            table[station.id][shape] = null;
        });
    });

    // For each station (source), find path to nearest station of each TYPE (target)
    gameState.stations.forEach(sourceStation => {
        Object.values(SHAPES).forEach(targetShape => {
            // BFS to find the path
            const route = findRoute(sourceStation, targetShape);
            if (route) {
                table[sourceStation.id][targetShape] = route;
            }
        });
    });

    gameState.networkGraph = table;
}

/**
 * BFS to find the first step towards the nearest station of targetShape.
 */
function findRoute(startStation, targetShape) {
    // If start is already the target type, no travel needed (shouldn't happen for spawning logic, but good for safety)
    if (startStation.type === targetShape) return null;

    const queue = [{ station: startStation, firstStep: null }];
    const visited = new Set();
    visited.add(startStation.id);

    while (queue.length > 0) {
        const { station, firstStep } = queue.shift();

        // Check neighbors
        const neighbors = getConnectedNeighbors(station);
        
        for (const neighborInfo of neighbors) {
            const neighbor = neighborInfo.station;
            const lineIdx = neighborInfo.lineIndex;

            if (visited.has(neighbor.id)) continue;
            visited.add(neighbor.id);

            // Calculate the first step taken to get here
            // If we are at the source, this neighbor IS the first step.
            // If we are deeper, the first step is preserved.
            const nextStep = firstStep || { nextStationId: neighbor.id, lineIndex: lineIdx };

            // Found target?
            if (neighbor.type === targetShape) {
                return nextStep;
            }

            queue.push({ station: neighbor, firstStep: nextStep });
        }
    }

    return null; // No path found
}

/**
 * Returns list of { station, lineIndex } connected to the given station
 */
function getConnectedNeighbors(station) {
    const neighbors = [];
    
    gameState.lines.forEach((line, lineIdx) => {
        const idx = line.stations.indexOf(station);
        if (idx !== -1) {
            // Check previous
            if (idx > 0) {
                neighbors.push({ station: line.stations[idx - 1], lineIndex: lineIdx });
            }
            // Check next
            if (idx < line.stations.length - 1) {
                neighbors.push({ station: line.stations[idx + 1], lineIndex: lineIdx });
            }
            // Handle Loops: if last connects to first
            if (line.isLoop) {
                if (idx === 0) {
                     neighbors.push({ station: line.stations[line.stations.length - 1], lineIndex: lineIdx });
                }
                if (idx === line.stations.length - 1) {
                    neighbors.push({ station: line.stations[0], lineIndex: lineIdx });
                }
            }
        }
    });
    
    return neighbors;
}