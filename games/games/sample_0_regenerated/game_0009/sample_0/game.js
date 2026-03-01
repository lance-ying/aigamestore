import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, logGameInfo } from './globals.js';
import { InputManager } from './input.js';
import { UIManager } from './ui.js';
import { Player, updateParticles } from './entities.js';
import { LevelGenerator } from './level.js';
import { PhysicsSystem } from './physics.js';
import { randomRange } from './utils.js';

class Game {
    constructor() {
        this.initThree();
        this.input = new InputManager();
        this.ui = new UIManager();
        this.levelGenerator = new LevelGenerator();
        this.lastTime = 0;
        
        // Expose instance
        window.gameInstance = this;
        
        // Initial setup
        this.reset();
        gameState.gamePhase = "START";
        
        // Start loop
        requestAnimationFrame(this.animate.bind(this));
    }
    
    initThree() {
        // Container
        const container = document.getElementById('game-container') || document.body;
        // Ensure container is styled if it's not the pre-made one (fallback)
        if (container === document.body) {
             // Create one if it doesn't exist to be safe
             const div = document.createElement('div');
             div.id = 'game-container';
             div.style.position = 'relative';
             div.style.width = `${CANVAS_WIDTH}px`;
             div.style.height = `${CANVAS_HEIGHT}px`;
             div.style.overflow = 'hidden';
             document.body.appendChild(div);
             gameState.gameContainer = div;
        } else {
             gameState.gameContainer = container;
        }

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
        renderer.shadowMap.enabled = true;
        gameState.gameContainer.appendChild(renderer.domElement);
        gameState.renderer = renderer;
        
        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111);
        scene.fog = new THREE.Fog(0x111111, 10, 50);
        gameState.scene = scene;
        
        // Camera
        const camera = new THREE.PerspectiveCamera(60, CANVAS_WIDTH/CANVAS_HEIGHT, 0.1, 100);
        // Position camera inside the shaft (shaft is -10 to 10 in Z)
        camera.position.set(0, 5, 9);
        camera.lookAt(0, 0, 0);
        gameState.camera = camera;
        
        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        dirLight.shadow.camera.left = -20;
        dirLight.shadow.camera.right = 20;
        scene.add(dirLight);
        
        // Point light attached to player (added in update)
        this.playerLight = new THREE.PointLight(0xffffff, 1, 20);
        scene.add(this.playerLight);
    }
    
    reset() {
        // Clear entities
        if (gameState.entities) {
            // Need to manually remove meshes from scene
            if (gameState.player) gameState.scene.remove(gameState.player.mesh);
            gameState.enemies.forEach(e => gameState.scene.remove(e.mesh));
            gameState.platforms.forEach(p => gameState.scene.remove(p.mesh));
            gameState.collectibles.forEach(c => gameState.scene.remove(c.mesh));
            gameState.projectiles.forEach(p => gameState.scene.remove(p.mesh));
            gameState.particles.forEach(p => gameState.scene.remove(p.mesh));
            // Clear walls (shaft)
            if (gameState.walls) {
                gameState.walls.forEach(w => gameState.scene.remove(w));
            }
        }
        
        gameState.player = null;
        gameState.enemies = [];
        gameState.platforms = [];
        gameState.collectibles = [];
        gameState.projectiles = [];
        gameState.particles = [];
        gameState.walls = [];
        gameState.score = 0;
        gameState.frameCount = 0;
        
        // Reset RNG
        Math.seedrandom('42');
        
        // Generate Level
        this.levelGenerator.init();
        
        // Spawn Player
        gameState.player = new Player(0, 5, 0);
        
        logGameInfo({ action: "reset" });
    }
    
    start() {
        gameState.gamePhase = "PLAYING";
        logGameInfo({ action: "start" });
    }
    
    animate(time) {
        requestAnimationFrame(this.animate.bind(this));
        
        const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1); // Cap dt
        this.lastTime = time;
        gameState.deltaTime = deltaTime;
        
        if (gameState.gamePhase === "PLAYING") {
            gameState.frameCount++;
            this.update(deltaTime);
        }
        
        this.handleTestModes(deltaTime);
        
        // Render
        gameState.renderer.render(gameState.scene, gameState.camera);
        this.ui.render();
    }
    
    update(deltaTime) {
        // Update Player
        if (gameState.player) {
            gameState.player.update(deltaTime, this.input);
            
            // Camera Follow
            const targetY = gameState.player.mesh.position.y + 2;
            // Smooth lerp
            gameState.camera.position.y += (targetY - gameState.camera.position.y) * 0.1;
            gameState.camera.lookAt(0, gameState.camera.position.y - 4, 0); // Look down slightly
            
            // Update light position
            this.playerLight.position.copy(gameState.player.mesh.position);
        }
        
        // Update Enemies
        // Reverse loop for removal
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];
            enemy.update(deltaTime);
            if (enemy.markedForDeletion) {
                gameState.enemies.splice(i, 1);
            }
        }
        
        // Update Projectiles
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            const proj = gameState.projectiles[i];
            proj.update(deltaTime);
            if (proj.markedForDeletion) {
                gameState.projectiles.splice(i, 1);
            }
        }
        
        // Update Collectibles
        for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
            const c = gameState.collectibles[i];
            c.update(deltaTime);
            if (c.markedForDeletion) {
                gameState.collectibles.splice(i, 1);
            }
        }
        
        // Update Particles
        updateParticles();
    }
    
    handleTestModes(deltaTime) {
        // Handle control modes for automated testing
        if (window.setControlMode) {
            // Check if mode changed
        }
        
        const player = gameState.player;
        if (!player) return;

        if (gameState.controlMode === 'TEST_1') {
            // Test movement
            if (gameState.gamePhase === 'START') this.start();
            // Simulate pressing Right
            player.velocity.x += 0.01; 
        } else if (gameState.controlMode === 'TEST_2') {
            // Test shooting/hover
            if (gameState.gamePhase === 'START') this.start();
            // Force player to be in air
            if (player.onGround) player.mesh.position.y += 1;
            // Shoot
            player.shoot();
        } else if (gameState.controlMode === 'TEST_3') {
             // Win test
             if (gameState.gamePhase === 'START') this.start();
             player.mesh.position.y = -gameState.maxDepth - 10;
        }
    }
}

// Global control mode setter for HTML buttons
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Visual update of buttons would happen in HTML script or here if access to DOM
    document.querySelectorAll('.control-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.id.includes(mode)) btn.classList.add('active');
    });
    
    // Reset game for clean test state
    if (window.gameInstance) {
        window.gameInstance.reset();
        gameState.gamePhase = "START";
    }
};

// Start the game
new Game();