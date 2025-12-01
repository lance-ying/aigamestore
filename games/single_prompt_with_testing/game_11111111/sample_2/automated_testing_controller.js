export function get_automated_testing_action(gameState) {
    const player = gameState.player;
    if (!player) return null;

    let actions = {
        left: false,
        right: false,
        jump: false,
        jumpHold: false,
        attack: false,
        roll: false
    };

    const mode = gameState.controlMode;

    if (mode === "TEST_1") {
        // Strategy: Run Right, Jump obstacles
        actions.right = true;
        
        // Simple Gap Detection: Cast ray ahead
        // Or check nearest platform
        // For simplicity in this env: Jump periodically or if velocity Y is 0 (stuck)
        // Better: Jump if no ground ahead
        
        let groundAhead = false;
        // Look ahead 50px
        const checkX = player.x + 50;
        for (let plat of gameState.platforms) {
            if (checkX >= plat.x && checkX <= plat.x + plat.width && 
                player.y + player.height <= plat.y + 10) {
                groundAhead = true;
                break;
            }
        }
        
        if (!groundAhead && player.onGround) {
            actions.jump = true;
            actions.jumpHold = true;
        }
        
        // Jump if wall ahead
        let wallAhead = false;
        for (let plat of gameState.platforms) {
            if (player.x + player.width + 10 > plat.x && 
                player.x < plat.x && 
                player.y > plat.y) {
                wallAhead = true;
            }
        }
        if (wallAhead && player.onGround) actions.jump = true;
        
    } else if (mode === "TEST_2") {
        // Strategy: Seek enemy and destroy
        let target = null;
        let minDist = 1000;
        
        for (let e of gameState.enemies) {
            let d = Math.abs(player.x - e.x);
            if (d < minDist) {
                minDist = d;
                target = e;
            }
        }
        
        if (target) {
            // Move towards
            if (target.x > player.x + 40) actions.right = true;
            else if (target.x < player.x - 40) actions.left = true;
            
            // Attack if close
            if (minDist < 60) {
                actions.attack = true;
                actions.right = false;
                actions.left = false;
            }
            
            // Roll if projectile or enemy is facing us and close
            if (minDist < 100 && target.facing !== player.facing && Math.random() < 0.05) {
                actions.roll = true;
            }
        } else {
             // No enemies, find door
             actions.right = true;
        }
    }

    return actions;
}

window.get_automated_testing_action = get_automated_testing_action;