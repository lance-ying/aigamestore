import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Track } from './track.js';
import { Player, Opponent, ItemBox, SpeedLines, Coin, Barrier } from './entities.js';
import { updateCamera } from './camera.js';
import { initUI, renderUI } from './ui.js';
import { randomRange, randomChoice } from './utils.js';

function init() {
    // 1. Setup Container
    const container = document.createElement('div');
    container.id = 'game-container';
    container.style.width = `${CANVAS_WIDTH}px`;
    container.style.height = `${CANVAS_HEIGHT}px`;
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
    gameState.gameContainer = container;

    // 2. Setup Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    gameState.renderer = renderer;

    // 3. Setup Scene & Camera
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x87CEEB);
    gameState.scene.fog = new THREE.Fog(0x87CEEB, 20, 150);

    gameState.camera = new THREE.PerspectiveCamera(60, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 500);
    
    // 4. Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    gameState.scene.add(ambient);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    gameState.scene.add(dirLight);

    // 5. Initialize Game Objects
    setupGame();
    initUI();
    
    // 6. Events
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    // 7. Start Loop
    requestAnimationFrame(gameLoop);
}

function setupGame() {
    // Clear existing
    if (gameState.track) gameState.scene.remove(gameState.track.mesh);
    // Cleanup speed lines if exists
    if (gameState.speedLines) {
        gameState.speedLines.destroy();
        gameState.speedLines = null;
    }
    
    // Remove entities but keep lights and cameras
    // Use isLight and isCamera properties to properly detect Three.js lights and cameras
    gameState.scene.children = gameState.scene.children.filter(c => c.isLight || c.isCamera); 
    
    gameState.player = null;
    gameState.opponents = [];
    gameState.itemBoxes = [];
    gameState.projectiles = [];
    gameState.coins = [];
    gameState.barriers = [];
    gameState.score = 0; // NEW: Reset score on game setup
    
    // Reset auto-restart state when game is set up
    if (gameState.autoRestartTimeoutId) {
        clearTimeout(gameState.autoRestartTimeoutId);
        gameState.autoRestartTimeoutId = null;
    }
    gameState.autoRestartScheduled = false;

    // Seed random
    Math.seedrandom('42');
    
    // Create Ground Plane (Visual only, physics logic is in Kart class)
    const groundGeo = new THREE.PlaneGeometry(1000, 1000);
    const groundMat = new THREE.MeshStandardMaterial({ 
        color: 0x5c9c54, // Grass green
        roughness: 1.0,
        metalness: 0.0
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5; // Slightly below track level
    ground.receiveShadow = true;
    gameState.scene.add(ground);
    
    // Create Track
    gameState.track = new Track();
    
    // Spawn Player
    const startPos = gameState.track.points[0];
    // Offset slightly
    gameState.player = new Player(startPos.x + 3, startPos.y + 1, startPos.z);
    
    // Face track direction
    const t0 = gameState.track.points[1];
    // Fix: Look at a point at the same height as the player to prevent downward pitch (tilting)
    gameState.player.mesh.lookAt(t0.x, startPos.y + 1, t0.z);
    
    // Spawn Opponents
    const colors = [0x0000FF, 0x00FF00, 0xFFA500];
    for (let i = 0; i < 3; i++) {
        const offX = (i % 2 === 0 ? -1 : 1) * (4 + i);
        // Fix: Spawn opponents ahead of start line (positive Z) so they don't trigger immediate lap completion
        const zOff = 5 * (Math.floor(i/2) + 1); 
        // Simple positioning relative to start - rough approx
        const opp = new Opponent(startPos.x + offX, startPos.y + 1, startPos.z + zOff, colors[i]);
        // Fix: Opponents also need to look straight ahead, not into the ground
        opp.mesh.lookAt(t0.x, startPos.y + 1, t0.z + zOff); // Look parallel to track
        gameState.opponents.push(opp);
    }
    
    // Spawn Item Boxes
    for (let i = 0; i < gameState.track.points.length; i += 20) {
        if (i === 0) continue; // Skip start
        const pt = gameState.track.points[i];
        const box = new ItemBox(pt.x, pt.y + 1, pt.z);
        gameState.itemBoxes.push(box);
    }

    // Spawn Coins (Abundance)
    const trackPoints = gameState.track.points;
    for (let i = 10; i < trackPoints.length; i += 4) {
        // 60% chance to spawn a group of coins at this segment
        if (Math.random() < 0.6) {
            const pt = trackPoints[i];
            const nextPt = trackPoints[(i + 1) % trackPoints.length];
            
            // Calculate track normal (right vector)
            const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
            
            // Spawn a row of 3 coins
            for (let offset = -1; offset <= 1; offset++) {
                const spacing = 3.0;
                const coinPos = pt.clone().add(normal.clone().multiplyScalar(offset * spacing));
                // Add some Y height
                const coin = new Coin(coinPos.x, coinPos.y + 0.8, coinPos.z);
                gameState.coins.push(coin);
            }
        }
    }

    // Spawn Barriers (NEW!)
    const barrierTypes = ['cone', 'barrel', 'box'];
    for (let i = 15; i < trackPoints.length; i += 12) {
        // Place barriers at strategic points on the track
        const pt = trackPoints[i];
        const nextPt = trackPoints[(i + 1) % trackPoints.length];
        
        // Calculate track normal (right vector)
        const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        
        // Randomly place barrier on left, center, or right of track
        const position = randomChoice([-1, 0, 1]); // -1=left, 0=center, 1=right
        const spacing = 4.0;
        const barrierPos = pt.clone().add(normal.clone().multiplyScalar(position * spacing));
        
        const barrierType = randomChoice(barrierTypes);
        const barrier = new Barrier(barrierPos.x, barrierPos.y, barrierPos.z, barrierType);
        gameState.barriers.push(barrier);
    }

    // Initialize Speed Lines
    gameState.speedLines = new SpeedLines();
}

// Function to handle game restart (manual or automatic)
function restartGame() {
    // Clear any pending auto-restart
    if (gameState.autoRestartTimeoutId) {
        clearTimeout(gameState.autoRestartTimeoutId);
        gameState.autoRestartTimeoutId = null;
    }
    gameState.autoRestartScheduled = false; // Reset flag

    setupGame();
    gameState.gamePhase = "START";
}


let lastTime = performance.now();
function gameLoop(now) {
    requestAnimationFrame(gameLoop);
    
    const dt = Math.min((now - lastTime) / 1000, 0.1); // Cap dt
    lastTime = now;
    
    gameState.deltaTime = dt;
    gameState.elapsedTime += dt;
    gameState.frameCount++;
    
    if (gameState.gamePhase === "PLAYING") {
        // Update Entities
        if (gameState.player) gameState.player.update(dt);
        gameState.opponents.forEach(o => o.update(dt));
        gameState.itemBoxes.forEach(b => b.update(dt));
        gameState.projectiles.forEach(p => p.update(dt));
        gameState.coins.forEach(c => c.update(dt));
        gameState.barriers.forEach(b => b.update(dt));
        
        // Handle Physics Interactions
        checkCollisions();
        
        updateRankings();
    }

    // Auto-restart logic
    if (gameState.gamePhase.startsWith("GAME_OVER")) {
        if (!gameState.autoRestartScheduled) {
            gameState.autoRestartScheduled = true;
            gameState.autoRestartTimeoutId = setTimeout(() => {
                restartGame();
            }, 1000); // 1 second
        }
    } else {
        // If game phase is not GAME_OVER, ensure any pending auto-restart is cancelled
        if (gameState.autoRestartTimeoutId) {
            clearTimeout(gameState.autoRestartTimeoutId);
            gameState.autoRestartTimeoutId = null;
            gameState.autoRestartScheduled = false;
        }
    }

    // Update Speed Lines
    if (gameState.speedLines && gameState.player) {
        gameState.speedLines.update(dt, gameState.player.speed);
    }
    
    // NEW: Update score continuously every frame (regardless of phase, but only if player exists)
    if (gameState.player) {
        const rankBonus = (5 - gameState.player.rank) * 1000; // 1st=4000, 4th=1000
        const coinBonus = gameState.player.coins * 100;
        gameState.score = rankBonus + coinBonus;
    }
    
    // Camera always updates (orbit in start, follow in play)
    updateCamera(dt);
    
    // Render
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

function checkCollisions() {
    const karts = [gameState.player, ...gameState.opponents];
    
    // Kart-to-kart collisions
    for (let i = 0; i < karts.length; i++) {
        for (let j = i + 1; j < karts.length; j++) {
            const k1 = karts[i];
            const k2 = karts[j];
            
            if (!k1 || !k2 || k1.dead || k2.dead) continue;
            
            // Simple distance-based collision (cylinders)
            // Ignore Y for collision to prevent driving over each other
            const dx = k1.mesh.position.x - k2.mesh.position.x;
            const dz = k1.mesh.position.z - k2.mesh.position.z;
            const distSq = dx * dx + dz * dz;
            const minDist = 2.2; // Combined radius approx
            
            if (distSq < minDist * minDist) {
                const dist = Math.sqrt(distSq);
                const overlap = minDist - dist;
                
                // Normal vector
                let nx = dx / dist;
                let nz = dz / dist;
                
                // Fallback if exactly on top
                if (dist < 0.001) { nx = 1; nz = 0; }
                
                // 1. Separate positions
                const moveX = nx * overlap * 0.5;
                const moveZ = nz * overlap * 0.5;
                
                k1.mesh.position.x += moveX;
                k1.mesh.position.z += moveZ;
                k2.mesh.position.x -= moveX;
                k2.mesh.position.z -= moveZ;
                
                // 2. Apply Bounce Impulse
                const bounceForce = 20.0;
                k1.bumpVelocity.x += nx * bounceForce;
                k1.bumpVelocity.z += nz * bounceForce;
                k2.bumpVelocity.x -= nx * bounceForce;
                k2.bumpVelocity.z -= nz * bounceForce;
                
                // 3. Friction (slow down on impact)
                k1.speed *= 0.9;
                k2.speed *= 0.9;
            }
        }
    }
    
    // Kart-to-barrier collisions (NEW!)
    gameState.barriers.forEach(barrier => {
        if (barrier.dead) return;
        
        karts.forEach(kart => {
            if (!kart || kart.dead) return;
            
            // Distance-based collision with barrier
            const dx = kart.mesh.position.x - barrier.mesh.position.x;
            const dz = kart.mesh.position.z - barrier.mesh.position.z;
            const distSq = dx * dx + dz * dz;
            const minDist = 1.5 + barrier.radius; // Kart radius ~1.5
            
            if (distSq < minDist * minDist) {
                const dist = Math.sqrt(distSq);
                const overlap = minDist - dist;
                
                // Normal vector from barrier to kart
                let nx = dx / dist;
                let nz = dz / dist;
                
                // Fallback if exactly on top
                if (dist < 0.001) { nx = 1; nz = 0; }
                
                // 1. Push kart away from barrier
                kart.mesh.position.x += nx * overlap;
                kart.mesh.position.z += nz * overlap;
                
                // 2. Apply bounce-back impulse
                const bounceForce = 30.0;
                kart.bumpVelocity.x += nx * bounceForce;
                kart.bumpVelocity.z += nz * bounceForce;
                
                // 3. Slow down kart significantly
                kart.speed *= 0.5;
            }
        });
    });
}

function updateRankings() {
    // Simple ranking based on lap + checkpoint index
    const racers = [gameState.player, ...gameState.opponents];
    racers.sort((a, b) => {
        const scoreA = a.lap * 10000 + a.checkpointIndex;
        const scoreB = b.lap * 10000 + b.checkpointIndex;
        return scoreB - scoreA; // Descending
    });
    
    const playerRank = racers.indexOf(gameState.player) + 1;
    gameState.player.rank = playerRank;
}

function onKeyDown(e) {
    const key = e.key;
    if (gameState.keys.hasOwnProperty(key)) gameState.keys[key] = true;
    if (e.code === 'Space') gameState.keys[" "] = true; // Fix space mapping
    
    // Phase controls
    if (key === 'Enter' && gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
    }
    if (key === 'Escape') {
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    if (key.toLowerCase() === 'r' && gameState.gamePhase.startsWith("GAME_OVER")) {
        // Manual restart takes precedence and cancels auto-restart
        restartGame();
    }
}

function onKeyUp(e) {
    const key = e.key;
    if (gameState.keys.hasOwnProperty(key)) gameState.keys[key] = false;
    if (e.code === 'Space') gameState.keys[" "] = false;
}

// Global hook for controls (used by HTML buttons)
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};

// Init
init();