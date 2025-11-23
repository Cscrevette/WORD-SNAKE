// --- Définition des Éléments Audio ---
const bgm = document.getElementById('bgm');
const collectSfx = document.getElementById('collect-sfx');
const gameOverSfx = document.getElementById('gameover-sfx');

collectSfx.volume = 1.0; 
gameOverSfx.volume = 1.0; 


// --- Configuration des Éléments HTML ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('current-score');
const gameOverScreen = document.getElementById('game-over-screen');
const replayButton = document.getElementById('replay-button');
const introScreen = document.getElementById('intro-screen');
const gameContainer = document.getElementById('game-container');
const victoryScreen = document.getElementById('victory-screen'); 
const nextWordButton = document.getElementById('next-word-button'); 
const targetWordDisplay = document.getElementById('target-word'); 
const finalScoreDisplay = document.getElementById('final-score'); 
const startButton = document.getElementById('start-button'); 

// --- Configuration du Jeu et de la Difficulté ---
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// PARAMÈTRES DE DIFFICULTÉ
const BASE_SPEED = 150;
const DIFFICULTY_THRESHOLD = 200;
const DIFFICULTY_SPEED = 100;

let gameSpeed = BASE_SPEED;
let gameLoopInterval;

// --- Dictionnaire et États Spécifiques au Jeu de Mots ---
let DICTIONARY = ["NEON", "PYTHON", "CODE", "ARCADE", "MOT", "SERPENT", "JEU"]; 
const INITIAL_DICTIONARY = [...DICTIONARY]; 
let currentWord = '';         
let lettersToCollect = [];    
let nextLetterIndex = 0;      
let totalScore = 0;           

// --- Couleurs Néon ---
const NEON_COLORS = [
    { fill: '#ff00ff', shadow: '#ff00ff' }, // Magenta
    { fill: '#33ffff', shadow: '#33ffff' }, // Cyan
    { fill: '#00ff7f', shadow: '#00ff7f' }, // Vert Émeraude
    { fill: '#ff4500', shadow: '#ff4500' }, // Orange Rouge
    { fill: '#ffff00', shadow: '#ffff00' }, // Jaune
    { fill: '#8A2BE2', shadow: '#8A2BE2' }  // Bleu Violet
];

// --- VARIABLES DE POWER-UP ---
let lifeUp = null;         
let isImmune = false;      
let immunityTimer = 0;     
const IMMUNITY_DURATION = 5000;
const POWER_UP_SPAWN_CHANCE = 0.15; 

// --- VARIABLES TACTILES (NOUVEAU) ---
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 15; 

let snake = [];
let dx = gridSize;
let dy = 0;
let changingDirection = false;
let snakeColor = NEON_COLORS[0];

// --- Fonctions de Démarrage et Réinitialisation ---

function initializeGame() {
    gameOverScreen.style.display = 'none';
    victoryScreen.style.display = 'none';
    
    isImmune = false;
    lifeUp = null;
    
    if (lettersToCollect.length === 0 || nextLetterIndex >= currentWord.length) {
        selectNewWord();
    }
    
    snake = [
        { x: 10 * gridSize, y: 15 * gridSize },
        { x: 9 * gridSize, y: 15 * gridSize }
    ];
    dx = gridSize;
    dy = 0;
    snakeColor = NEON_COLORS[0];
    
    scoreDisplay.textContent = totalScore;
    
    if (nextLetterIndex === 0) {
        placeLettersOnGrid();
    }
    
    bgm.volume = 0.5; 
    bgm.play().catch(e => console.log("L'utilisateur doit interagir avant de jouer l'audio."));
    
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, gameSpeed); 
}

function selectNewWord() {
    if (DICTIONARY.length === 0) {
        alert("Félicitations ! Vous avez complété tous les mots de notre dictionnaire. La liste est réinitialisée.");
        DICTIONARY = [...INITIAL_DICTIONARY];
    }
    
    const randomIndex = Math.floor(Math.random() * DICTIONARY.length);
    currentWord = DICTIONARY[randomIndex];
    nextLetterIndex = 0;
    
    DICTIONARY.splice(randomIndex, 1); 
}

function placeLettersOnGrid() {
    lettersToCollect = [];
    const positions = new Set();
    
    targetWordDisplay.textContent = currentWord; 
    targetWordDisplay.innerHTML = `<span style="color: var(--neon-red); text-shadow: 0 0 5px var(--neon-red);">${currentWord}</span>`;

    for (let i = 0; i < currentWord.length; i++) {
        let newPos;
        let posKey;
        
        do {
            newPos = {
                x: Math.floor(Math.random() * tileCount) * gridSize,
                y: Math.floor(Math.random() * tileCount) * gridSize,
                letter: currentWord[i],
                color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)] 
            };
            posKey = `${newPos.x},${newPos.y}`;
        } while (positions.has(posKey) || isPositionOnSnake(newPos));

        positions.add(posKey);
        lettersToCollect.push(newPos);
    }
}

function isPositionOnSnake(pos) {
    return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
}

function isPositionOnLetter(pos) {
    return lettersToCollect.some(l => l.x === pos.x && l.y === pos.y);
}

function activateImmunity() {
    if (!isImmune) {
        isImmune = true;
        immunityTimer = IMMUNITY_DURATION;
        console.log("Immunité activée ! (5s)");
    }
}

function spawnLifeUp() {
    if (Math.random() < POWER_UP_SPAWN_CHANCE && lifeUp === null) {
        let newPos;
        let posKey;

        do {
            newPos = {
                x: Math.floor(Math.random() * tileCount) * gridSize,
                y: Math.floor(Math.random() * tileCount) * gridSize,
            };
            posKey = `${newPos.x},${newPos.y}`;
        } while (isPositionOnSnake(newPos) || isPositionOnLetter(newPos));
        
        lifeUp = newPos;
    }
}


// --- Logique de Difficulté (inchangée) ---

function checkDifficultyIncrease() {
    if (totalScore >= DIFFICULTY_THRESHOLD && gameSpeed === BASE_SPEED) {
        
        gameSpeed = DIFFICULTY_SPEED;
        
        clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameLoop, gameSpeed);
        
        console.log("DIFFICULTÉ ACCRUE : Vitesse augmentée à " + gameSpeed + "ms !");
    }
}

// --- Fonctions de Dessin ---

function drawRect(x, y, color, shadowColor, letter = null) {
    ctx.fillStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = shadowColor;
    ctx.fillRect(x, y, gridSize, gridSize);
    ctx.shadowBlur = 0;
    
    if (letter) {
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillStyle = '#000000'; 
        
        ctx.fillText(letter, x + gridSize / 2, y + gridSize / 2);
    }
}

function drawLifeUp() {
    if (lifeUp === null) return;

    drawRect(lifeUp.x, lifeUp.y, '#FFFFFF', '#FFFFFF'); 
    
    ctx.fillStyle = '#FF0000'; 
    ctx.font = '16px monospace'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♥', lifeUp.x + gridSize / 2, lifeUp.y + gridSize / 2); 
}

function drawSnake() {
    for (let i = 0; i < snake.length; i++) {
        if (isImmune && i === 0 && Date.now() % 300 < 150) {
            drawRect(snake[i].x, snake[i].y, '#FFFF00', '#FF4500'); 
        } else {
            drawRect(snake[i].x, snake[i].y, snakeColor.fill, snakeColor.shadow); 
        }
    }
}

function drawLetters() {
    for (const letterPos of lettersToCollect) {
        
        const isNext = letterPos.letter === currentWord[nextLetterIndex];
        
        const fill = isNext ? snakeColor.fill : letterPos.color.fill;
        const shadow = isNext ? snakeColor.shadow : letterPos.color.shadow;
        
        drawRect(letterPos.x, letterPos.y, fill, shadow, letterPos.letter);
    }
}

// --- Logique du Jeu ---

function advanceSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    
    const hitIndex = lettersToCollect.findIndex(
        l => l.x === head.x && l.y === head.y
    );
    
    if (hitIndex !== -1) {
        const collectedLetter = lettersToCollect[hitIndex];
        const requiredLetter = currentWord[nextLetterIndex];
        
        if (collectedLetter.letter === requiredLetter) {
            totalScore += 10;
            scoreDisplay.textContent = totalScore;
            
            checkDifficultyIncrease();
            
            updateTargetWordDisplay();
            
            snakeColor = collectedLetter.color; 
            
            lettersToCollect.splice(hitIndex, 1);
            nextLetterIndex++;

            collectSfx.currentTime = 0; 
            collectSfx.play();
            
            spawnLifeUp(); 
            
            if (nextLetterIndex >= currentWord.length) {
                winGame(); 
                return; 
            }
            
        } else {
            endGame(`ATTENDU : ${requiredLetter} !`);
            return; 
        }
        
    } else {
        if (lifeUp !== null && head.x === lifeUp.x && head.y === lifeUp.y) {
            activateImmunity();
            lifeUp = null; 
            collectSfx.currentTime = 0; 
            collectSfx.play();
        } else {
            snake.pop(); 
        }
    }
}

function updateTargetWordDisplay() {
    const collectedPart = currentWord.substring(0, nextLetterIndex + 1);
    const remainingPart = currentWord.substring(nextLetterIndex + 1);

    targetWordDisplay.innerHTML = 
        `<span style="color: var(--neon-green); text-shadow: 0 0 5px var(--neon-green);">${collectedPart}</span>` + 
        `<span style="color: var(--neon-red); text-shadow: 0 0 5px var(--neon-red);">${remainingPart}</span>`;
}


function checkCollision() {
    const head = snake[0];
    
    // Collision avec soi-même (toujours mortelle)
    for (let i = 4; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }

    // Collision avec les murs
    const hitWall = head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height;
    
    if (hitWall) {
        if (isImmune) {
            // Téléporte le serpent de l'autre côté (wrap around)
            if (head.x < 0) head.x = canvas.width - gridSize;
            else if (head.x >= canvas.width) head.x = 0;
            else if (head.y < 0) head.y = canvas.height - gridSize;
            else if (head.y >= canvas.height) head.y = 0;
            return false; // Collision ignorée
        } else {
            return true; // Collision mortelle
        }
    }

    return false; 
}

function winGame() {
    selectNewWord(); 
    placeLettersOnGrid();
    changingDirection = false;
}

function endGame(reason = "COLLISION MURALE") {
    clearInterval(gameLoopInterval);
    
    document.getElementById('game-over-text').textContent = "GAME OVER";
    console.log(`GAME OVER! Raison: ${reason}`);
    
    gameOverScreen.style.display = 'flex';
    
    bgm.pause();
    bgm.currentTime = 0; 
    gameOverSfx.currentTime = 0; 
    gameOverSfx.play();
    
    totalScore = 0;
    gameSpeed = BASE_SPEED;
}

// --- Boucle Principale du Jeu ---

function gameLoop() {
    changingDirection = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    
    // Gestion du minuteur d'immunité
    if (isImmune) {
        immunityTimer -= gameSpeed; 
        if (immunityTimer <= 0) {
            isImmune = false;
            console.log("Immunité terminée.");
        }
    }
    
    if (checkCollision()) {
        endGame("COLLISION MURALE");
        return;
    }
    
    advanceSnake();
    drawLetters(); 
    drawLifeUp(); 
    drawSnake();
}

// --- Contrôle des Entrées (Clavier) ---

function changeDirection(event) {
    if (changingDirection) return;
    changingDirection = true;

    const LEFT = 37;
    const UP = 38;
    const RIGHT = 39;
    const DOWN = 40;

    const keyPressed = event.keyCode;

    const goingUp = dy === -gridSize;
    const goingDown = dy === gridSize;
    const goingRight = dx === gridSize;
    const goingLeft = dx === -gridSize;

    if (keyPressed === LEFT && !goingRight) {
        dx = -gridSize;
        dy = 0;
    } else if (keyPressed === UP && !goingDown) {
        dx = 0;
        dy = -gridSize;
    } else if (keyPressed === RIGHT && !goingLeft) {
        dx = gridSize;
        dy = 0;
    } else if (keyPressed === DOWN && !goingUp) {
        dx = 0;
        dy = gridSize;
    }
}

// --- Contrôle des Entrées (Tactile) (NOUVEAU) ---

function handleTouchStart(event) {
    event.preventDefault(); 
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

function handleTouchEnd(event) {
    if (gameContainer.style.display === 'none') return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const dxTouch = touchEndX - touchStartX;
    const dyTouch = touchEndY - touchStartY;
    
    const absDx = Math.abs(dxTouch);
    const absDy = Math.abs(dyTouch);
    
    if (absDx > SWIPE_THRESHOLD || absDy > SWIPE_THRESHOLD) {
        let keyPressed;

        if (absDx > absDy) {
            // Mouvement horizontal (Right=39, Left=37)
            keyPressed = (dxTouch > 0) ? 39 : 37; 
        } else {
            // Mouvement vertical (Down=40, Up=38)
            keyPressed = (dyTouch > 0) ? 40 : 38; 
        }

        // Simule l'événement keydown pour changer la direction du serpent
        changeDirection({ keyCode: keyPressed });
    }
}


// --- Contrôle de l'Introduction et des Boutons ---

function startGameSequence() {
    bgm.volume = 0.5; 
    bgm.play().catch(e => console.log("Audio play failed."));
    
    introScreen.style.opacity = '0'; 
    
    setTimeout(() => {
        introScreen.style.display = 'none';
        gameContainer.style.display = 'block';
        
        selectNewWord(); 
        initializeGame(); 
    }, 1000); 
}

function startIntroAndGame() {
    introScreen.style.display = 'flex';
    gameContainer.style.display = 'none';
}

// --- Écouteurs d'Événements (Final) ---
document.addEventListener('keydown', changeDirection);
canvas.addEventListener('touchstart', handleTouchStart, false); // TACTILE NOUVEAU
canvas.addEventListener('touchend', handleTouchEnd, false);     // TACTILE NOUVEAU

replayButton.addEventListener('click', initializeGame); 
nextWordButton.addEventListener('click', () => {
    selectNewWord();
    initializeGame();
});

startButton.addEventListener('click', startGameSequence);
document.addEventListener('DOMContentLoaded', startIntroAndGame);