import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, SUITS, RANKS } from './globals.js';
import { createStandardDeck, shuffleDeck, sortHand, evaluateHand, calculateScore } from './utils.js';
import { Particle, JOKER_DEFINITIONS, Joker } from './entities.js';
import { renderHUD, renderShop, renderHand, renderJokers } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = { game_info: [], inputs: [], player_info: [] };
    
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        gameState.gamePhase = "START";
        
        logGameInfo("START");
    };
    
    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        
        // Automated Testing
        if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
            if (p.frameCount % 30 === 0) { // Action every 0.5s
                const action = get_automated_testing_action(gameState);
                if (action) handleInput(action.keyCode);
            }
        }
        
        p.background(20, 20, 30);
        
        // Screens
        if (gameState.gamePhase === "START") {
            drawStartScreen(p);
        } else if (gameState.gamePhase === "PLAYING") {
            if (gameState.roundPhase === "BLIND") {
                updateGame(p);
                renderGame(p);
            } else if (gameState.roundPhase === "SHOP") {
                renderShop(p);
            }
        } else if (gameState.gamePhase === "PAUSED") {
             renderGame(p); // Draw game behind
             p.fill(0, 0, 0, 150);
             p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
             p.fill(255);
             p.textAlign(p.CENTER, p.CENTER);
             p.textSize(40);
             p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
            renderGame(p);
            drawGameOver(p);
        }
        
        // Global message overlay
        if (gameState.messageTimer > 0) {
            gameState.messageTimer--;
            p.fill(0, 0, 0, 200);
            p.rectMode(p.CENTER);
            p.rect(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 300, 50);
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(24);
            p.text(gameState.message, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
            p.rectMode(p.CORNER);
        }
    };
    
    p.keyPressed = function() {
        handleInput(p.keyCode);
    };
    
    function handleInput(keyCode) {
        p.logs.inputs.push({ type: 'press', key: keyCode, frame: p.frameCount });
        
        // Global Phase Controls
        if (keyCode === 27) { // ESC
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
            return;
        }
        
        if (gameState.gamePhase === "START" && keyCode === 13) {
            startGame();
            return;
        }
        
        if (gameState.gamePhase.startsWith("GAME_OVER") && keyCode === 82) { // R
            resetGame();
            return;
        }
        
        if (gameState.gamePhase !== "PLAYING") return;
        
        // In-Game Controls
        if (gameState.roundPhase === "BLIND") {
            handleBlindInput(keyCode);
        } else {
            handleShopInput(keyCode);
        }
    }
    
    function handleBlindInput(keyCode) {
        const handSize = gameState.hand.length;
        
        if (keyCode === 37) { // Left
            gameState.selectedIndex = (gameState.selectedIndex - 1 + handSize) % handSize;
        } else if (keyCode === 39) { // Right
            gameState.selectedIndex = (gameState.selectedIndex + 1) % handSize;
        } else if (keyCode === 32) { // Space
            const card = gameState.hand[gameState.selectedIndex];
            if (card) card.isSelected = !card.isSelected;
        } else if (keyCode === 38) { // Up - PLAY
            playHand();
        } else if (keyCode === 40) { // Down - DISCARD
            discardHand();
        } else if (keyCode === 90) { // Z - Sort
            const bySuit = (gameState.sortMode === 'suit');
            gameState.hand = sortHand(gameState.hand, !bySuit);
            gameState.sortMode = !bySuit ? 'suit' : 'rank';
        }
    }
    
    function handleShopInput(keyCode) {
        const itemCount = gameState.shopItems.length;
        const totalItems = itemCount + 1; // +1 for Next Round button
        
        if (keyCode === 37) { // Left
            gameState.selectedIndex = (gameState.selectedIndex - 1 + totalItems) % totalItems;
        } else if (keyCode === 39) { // Right
            gameState.selectedIndex = (gameState.selectedIndex + 1) % totalItems;
        } else if (keyCode === 32) { // Space - Buy or Next
            if (gameState.selectedIndex < itemCount) {
                buyItem(gameState.selectedIndex);
            } else {
                nextRound();
            }
        } else if (keyCode === 90) { // Z - Skip (Not impl yet, just next round)
             nextRound();
        } else if (keyCode === 16) { // Shift - Sell (logic complex, skip for now)
             // Sell logic here if needed
        }
    }
    
    function playHand() {
        const selectedCards = gameState.hand.filter(c => c.isSelected);
        
        if (selectedCards.length === 0) {
            showMessage("Select cards!");
            return;
        }
        if (selectedCards.length > 5) {
            showMessage("Max 5 cards!");
            return;
        }
        
        if (gameState.handsLeft <= 0) {
            showMessage("No hands left!");
            return;
        }
        
        const evaluation = evaluateHand(selectedCards);
        const score = calculateScore(evaluation.type, selectedCards, gameState.jokers);
        
        // Add to total
        gameState.currentScore += score.total;
        gameState.handsLeft--;
        
        // Remove cards
        gameState.hand = gameState.hand.filter(c => !c.isSelected);
        
        // Create particles
        spawnParticles(p, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 'text', `${evaluation.type.name}!`);
        spawnParticles(p, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30, 'text', `+${score.total}`);
        
        // Draw new cards
        drawCards(selectedCards.length);
        
        // Reset selection
        gameState.selectedIndex = 0;
        
        checkWinCondition();
    }
    
    function discardHand() {
        const selectedCards = gameState.hand.filter(c => c.isSelected);
        
        if (selectedCards.length === 0) {
            showMessage("Select cards!");
            return;
        }
        if (selectedCards.length > 5) {
            showMessage("Max 5 cards!");
            return;
        }
        
        if (gameState.discardsLeft <= 0) {
            showMessage("No discards!");
            return;
        }
        
        gameState.discardsLeft--;
        
        // Remove cards
        gameState.hand = gameState.hand.filter(c => !c.isSelected);
        
        // Draw new cards
        drawCards(selectedCards.length);
        
        gameState.selectedIndex = 0;
    }
    
    function drawCards(count) {
        for (let i = 0; i < count; i++) {
            if (gameState.deck.length > 0) {
                gameState.hand.push(gameState.deck.pop());
            }
        }
        // Auto sort
        gameState.hand = sortHand(gameState.hand, gameState.sortMode === 'suit');
    }
    
    function buyItem(index) {
        const item = gameState.shopItems[index];
        if (gameState.money >= item.cost) {
            if (gameState.jokers.length < 5) {
                gameState.money -= item.cost;
                gameState.jokers.push(item);
                gameState.shopItems.splice(index, 1);
                showMessage("Bought!");
            } else {
                showMessage("Joker slots full!");
            }
        } else {
            showMessage("Too expensive!");
        }
    }
    
    function nextRound() {
        gameState.round++;
        if (gameState.round > 3) {
            gameState.round = 1;
            gameState.ante++;
        }
        
        // Win Game Check
        if (gameState.ante > 8) {
            gameState.gamePhase = "GAME_OVER_WIN";
            return;
        }
        
        setupRound(p);
    }
    
    function setupRound(pInstance) {
        // Reset Deck
        gameState.deck = createStandardDeck();
        shuffleDeck(gameState.deck, pInstance);
        
        // Reset Hand
        gameState.hand = [];
        drawCards(8); // Hand size 8
        
        // Reset Stats
        gameState.handsLeft = 4;
        gameState.discardsLeft = 3;
        gameState.currentScore = 0;
        gameState.selectedIndex = 0;
        
        // Calc Blind
        const base = 300;
        const multiplier = Math.pow(1.5, gameState.ante - 1) * gameState.round;
        gameState.currentBlind = Math.floor(base * multiplier);
        gameState.targetScore = gameState.currentBlind;
        
        gameState.roundPhase = "BLIND";
        gameState.gamePhase = "PLAYING";
        
        showMessage(`Ante ${gameState.ante} - Round ${gameState.round}`);
    }
    
    function checkWinCondition() {
        if (gameState.currentScore >= gameState.targetScore) {
            // Round Win
            gameState.money += 5; // Base reward
            gameState.money += gameState.handsLeft; // $1 per hand left
            gameState.roundPhase = "SHOP";
            generateShop(p);
            gameState.selectedIndex = 0;
        } else if (gameState.handsLeft === 0) {
            // Game Over
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }
    
    function generateShop(pInstance) {
        gameState.shopItems = [];
        // Add 3 random jokers
        for(let i=0; i<3; i++) {
            const def = pInstance.random(JOKER_DEFINITIONS);
            // Clone joker
            const joker = new Joker(def.id, def.name, def.description, def.cost, def.rarity, def.effectFn);
            gameState.shopItems.push(joker);
        }
    }
    
    function startGame() {
        gameState.money = 0;
        gameState.ante = 1;
        gameState.round = 1;
        gameState.jokers = [];
        gameState.sortMode = 'rank';
        setupRound(p);
    }
    
    function resetGame() {
        gameState.gamePhase = "START";
    }
    
    function showMessage(msg) {
        gameState.message = msg;
        gameState.messageTimer = 60; // 1 sec
    }
    
    function updateGame(pInstance) {
        gameState.particles.forEach(pt => pt.update());
        gameState.particles = gameState.particles.filter(pt => pt.life > 0);
    }
    
    function renderGame(pInstance) {
        renderHUD(pInstance);
        renderJokers(pInstance);
        renderHand(pInstance);
        
        // Render Particles
        gameState.particles.forEach(pt => pt.render(pInstance));
    }
    
    function drawStartScreen(pInstance) {
        pInstance.textAlign(pInstance.CENTER, pInstance.CENTER);
        pInstance.fill(255);
        pInstance.textSize(50);
        pInstance.text("BALATRO LITE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
        pInstance.textSize(20);
        pInstance.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
        
        // Scanlines
        for(let i=0; i<CANVAS_HEIGHT; i+=4) {
            pInstance.fill(0, 0, 0, 50);
            pInstance.rect(0, i, CANVAS_WIDTH, 2);
        }
    }
    
    function drawGameOver(pInstance) {
        pInstance.fill(0, 0, 0, 220);
        pInstance.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        pInstance.fill(gameState.gamePhase === "GAME_OVER_WIN" ? [0, 255, 0] : [255, 0, 0]);
        pInstance.textSize(50);
        pInstance.textAlign(pInstance.CENTER, pInstance.CENTER);
        const txt = gameState.gamePhase === "GAME_OVER_WIN" ? "VICTORY!" : "GAME OVER";
        pInstance.text(txt, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        
        pInstance.fill(255);
        pInstance.textSize(20);
        pInstance.text(`Ante Reached: ${gameState.ante}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
        pInstance.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    }
    
    function spawnParticles(pInstance, x, y, type, text="") {
        if (type === 'text') {
            const pt = new Particle(x, y, 'text');
            pt.text = text;
            gameState.particles.push(pt);
        } else {
            for(let i=0; i<10; i++) {
                gameState.particles.push(new Particle(x, y, type));
            }
        }
    }
    
    function logGameInfo(msg) {
        p.logs.game_info.push({ event: msg, frame: p.frameCount, time: Date.now() });
    }
});

// Expose
window.gameInstance = gameInstance;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode Set:", mode);
};