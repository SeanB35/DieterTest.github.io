// Game State Management
let currentMode = 'math';
let lives = 3;
let difficulty = 1;
let currentProblem;
let timeouts = [];
let mathMode = 'mixed';
let correctClicks = 0;
let totalShots = 0;
let totalHits = 0;

// DOM Elements
const mathProblem = document.querySelector('.math-problem');
const mathInput = document.querySelector('.math-input');
const memoryGrid = document.querySelector('.memory-grid');
const aimTarget = document.querySelector('.aim-target');
const livesDisplay = document.querySelector('.lives');
const feedback = document.querySelector('.feedback');
const accuracyDisplay = document.querySelector('.accuracy');

// Mode Switching
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentMode = btn.dataset.mode;
        document.querySelectorAll('.game-mode').forEach(mode => {
            mode.style.display = 'none';
        });
        document.getElementById(`${currentMode}-mode`).style.display = 'block';
        clearTimeouts();
        initGame();
    });
});

// Math Mode Logic
document.querySelectorAll('.math-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        mathMode = btn.dataset.mathMode;
        initGame();
    });
});

function generateMathProblem() {
    let a = Math.floor(Math.random() * (difficulty * 10)) + 1;
    let b = Math.floor(Math.random() * (difficulty * 10)) + 1;
    let op;

    switch(mathMode) {
        case 'addition': op = '+'; break;
        case 'subtraction': op = '-'; break;
        case 'multiplication': op = '*'; break;
        case 'division':
            op = '/';
            a = a * b;
            break;
        default:
            const operations = ['+', '-', '*', '/'];
            op = operations[Math.floor(Math.random() * operations.length)];
            if(op === '/') a = a * b;
    }

    return { 
        problem: `${a} ${op} ${b}`, 
        answer: eval(`${a} ${op} ${b}`) 
    };
}

function handleMathInput(e) {
    if(e.key === 'Enter') {
        const userAnswer = parseFloat(mathInput.value);
        
        if(userAnswer === currentProblem.answer) {
            difficulty++;
            feedback.textContent = 'Correct!';
            feedback.style.color = '#00ff7f';
            newMathProblem();
        } else {
            feedback.textContent = 'Incorrect!';
            feedback.style.color = '#ff4444';
            loseLife();
        }
        mathInput.value = '';
    }
}

function setupMathMode() {
    mathInput.addEventListener('keypress', handleMathInput);
    newMathProblem();
}

function newMathProblem() {
    currentProblem = generateMathProblem();
    mathProblem.textContent = currentProblem.problem;
}

// Memory Mode Logic
function createMemoryGrid() {
    memoryGrid.innerHTML = '';
    const gridSize = 3 + difficulty;
    const pattern = generateMemoryPattern();
    
    memoryGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    
    for(let i = 0; i < gridSize ** 2; i++) {
        const tile = document.createElement('div');
        tile.className = 'memory-tile';
        if(pattern.includes(i)) tile.dataset.correct = true;
        tile.addEventListener('click', handleTileClick);
        memoryGrid.appendChild(tile);
    }

    showMemoryPattern(pattern);
}

function generateMemoryPattern() {
    const gridSize = 3 + difficulty;
    const pattern = new Set();
    while(pattern.size < difficulty + 2) {
        pattern.add(Math.floor(Math.random() * gridSize ** 2));
    }
    return Array.from(pattern);
}

function showMemoryPattern(pattern) {
    pattern.forEach(index => {
        memoryGrid.children[index].classList.add('active');
    });
    
    timeouts.push(setTimeout(() => {
        memoryGrid.querySelectorAll('.memory-tile').forEach(tile => {
            tile.classList.remove('active');
        });
    }, 1000 + difficulty * 500));
}

function handleTileClick(e) {
    if(e.target.dataset.correct) {
        e.target.style.background = '#00ff7f';
        correctClicks++;
        if(correctClicks === difficulty + 2) {
            difficulty++;
            correctClicks = 0;
            createMemoryGrid();
        }
    } else {
        loseLife();
    }
    e.target.removeEventListener('click', handleTileClick);
}

// Aim Mode Logic
function spawnTarget() {
    const container = document.querySelector('.game-container');
    const bounds = container.getBoundingClientRect();
    
    aimTarget.style.left = `${Math.random() * (bounds.width - 50)}px`;
    aimTarget.style.top = `${Math.random() * (bounds.height - 50)}px`;
    
    timeouts.push(setTimeout(() => {
        if(currentMode === 'aim') loseLife();
    }, 2000 - difficulty * 150));
}

function handleAimClick() {
    totalHits++;
    totalShots++;
    difficulty++;
    updateAccuracy();
    spawnTarget();
}

function updateAccuracy() {
    const accuracy = totalShots > 0 
        ? Math.round((totalHits / totalShots) * 100)
        : 100;
    accuracyDisplay.textContent = `Accuracy: ${accuracy}%`;
}

// Core Game Functions
function initGame() {
    lives = 3;
    difficulty = 1;
    correctClicks = 0;
    totalShots = 0;
    totalHits = 0;
    updateLives();
    updateAccuracy();
    document.getElementById('game-over').style.display = 'none';

    mathInput.removeEventListener('keypress', handleMathInput);
    aimTarget.removeEventListener('click', handleAimClick);

    switch(currentMode) {
        case 'math':
            setupMathMode();
            break;
        case 'memory':
            createMemoryGrid();
            break;
        case 'aim':
            aimTarget.addEventListener('click', handleAimClick);
            spawnTarget();
            break;
    }
}

function loseLife() {
    lives--;
    updateLives();
    if(lives <= 0) {
        showGameOver();
    }
}

function updateLives() {
    livesDisplay.innerHTML = Array(3).fill()
        .map((_, i) => `<div class="life ${i < lives ? 'active' : ''}"></div>`)
        .join('');
}

function showGameOver() {
    const gameOver = document.getElementById('game-over');
    gameOver.style.display = 'block';
    document.getElementById('final-score').textContent = difficulty - 1;
}

function clearTimeouts() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.restart-btn').addEventListener('click', initGame);
    initGame();
});