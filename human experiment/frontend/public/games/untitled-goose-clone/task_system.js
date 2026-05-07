import { gameState, ZONES } from './globals.js';
import { dist, isInZone } from './utils.js';

export function initTasks() {
    gameState.tasks = [
        {
            id: 'rake_in_lake',
            text: 'Rake in the Lake',
            completed: false,
            check: () => {
                const rake = gameState.entities.find(e => e.name === 'Rake');
                if (rake && isInZone(rake.mesh.position, ZONES.LAKE)) {
                    return true;
                }
                return false;
            }
        },
        {
            id: 'steal_radio',
            text: 'Steal the Radio (Take it to picnic blanket)',
            completed: false,
            check: () => {
                const radio = gameState.entities.find(e => e.name === 'Radio');
                if (radio && isInZone(radio.mesh.position, ZONES.PICNIC)) {
                    return true;
                }
                return false;
            }
        },
        {
            id: 'honk_gardener',
            text: 'Scare the Gardener with a Honk',
            completed: false,
            check: () => {
                // This is event driven, but we can check state here too
                // Or handled in Goose.honk -> Gardener.hearHonk
                // Let's check gardener state
                if (gameState.gardener && gameState.gardener.state === 'STARTLED') {
                    return true;
                }
                return false;
            }
        },
        {
            id: 'picnic',
            text: 'Have a Picnic (Apple, Sandwich, Thermos)',
            completed: false,
            check: () => {
                const items = ['Apple', 'Sandwich', 'Thermos'];
                let count = 0;
                for (const name of items) {
                    const item = gameState.entities.find(e => e.name === name);
                    if (item && isInZone(item.mesh.position, ZONES.PICNIC)) {
                        count++;
                    }
                }
                return count === 3;
            }
        }
    ];
}

export function checkTasks() {
    let allComplete = true;
    let changed = false;

    for (const task of gameState.tasks) {
        if (!task.completed) {
            if (task.check()) {
                task.completed = true;
                gameState.score += 100;
                changed = true;
                // Visual feedback could go here
            } else {
                allComplete = false;
            }
        }
    }
    
    // Win Condition
    if (allComplete && gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "GAME_OVER_WIN";
    }
}