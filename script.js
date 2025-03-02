// Game State Management
let currentMode = 'math';
let lives = 3;
let difficulty = 1;
let currentProblem;
let timeouts = [];
let mathMode = 'mixed';

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

// Math Mode Selection
document.querySelectorAll('.math-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        mathMode = btn.dataset.mathMode;
        initGame();
    });
});

// Math Mode Logic
function generateMathProblem() {
    let a = Math.floor(Math.random() * (difficulty * 10)) + 1;
    let b = Math.floor(Math.random() * (difficulty * 10)) + 1;
    let op;

    switch (mathMode) {
        case 'addition':
            op = '+';
            break;
        case 'subtraction':
            op = '-';
            break;
        case 'multiplication':
            op = '*';
            break;
        case 'division':
            op = '/';
            a = a * b; // Ensure a is divisible by b
            break;
        default:
            const operations = ['+', '-', '*', '/'];
            op = operations[Math.floor(Math.random() * operations.length)];
            if (op === '/') a = a * b;
            break;
    }

    return { problem: `${a} ${op} ${b}`, answer: eval(`${a} ${op} ${b}`) };
}

function newMathProblem() {
    currentProblem = generateMathProblem();
    document.querySelector('.math-problem').textContent = currentProblem.problem;
    document.querySelector('.math-input').value = '';
}

function setupMathMode() {
    newMathProblem();
    document.querySelector('.math-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const userAnswer = parseFloat(e.target.value);
            if (userAnswer === currentProblem.answer) {
                difficulty++;
                newMathProblem();
            } else {
                loseLife();
            }
        }
    });
}

// Memory Mode Logic
function generateMemoryPattern() {
    const gridSize = 3 + difficulty;
    const tiles = gridSize * gridSize;
    const pattern = new Set();
    
    while (pattern.size < difficulty + 2) {
        pattern.add(Math.floor(Math.random() * tiles));
    }
    
    return Array.from(pattern);
}

function createMemoryGrid() {
    const grid = document.querySelector('.memory-grid');
    grid.innerHTML = '';
    const gridSize = 3 + difficulty;
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    
    const pattern = generateMemoryPattern();
    
    for (let i = 0; i < gridSize ** 2; i++) {
        const tile = document.createElement('div');
        tile.className = 'memory-tile';
        if (pattern.includes(i)) tile.dataset.correct = true;
        tile.addEventListener('click', handleTileClick);
        grid.appendChild(tile);
    }
    
    // Show pattern
    pattern.forEach(index => {
        grid.children[index].classList.add('active');
    });
    
    timeouts.push(setTimeout(() => {
        grid.querySelectorAll('.memory-tile').forEach(tile => 
            tile.classList.remove('active'));
    }, 1000 + difficulty * 500));
}

let correctClicks = 0;
function handleTileClick(e) {
    if (e.target.dataset.correct) {
        e.target.style.background = getComputedStyle(document.documentElement).getPropertyValue('--accent');
        correctClicks++;
        if (correctClicks === difficulty + 2) {
            difficulty++;
            createMemoryGrid();
        }
    } else {
        loseLife();
    }
    e.target.removeEventListener('click', handleTileClick);
}

// Aim Trainer Logic
function spawnTarget() {
    const target = document.querySelector('.aim-target');
    const container = document.querySelector('.game-container');
    const bounds = container.getBoundingClientRect();
    
    target.style.left = `${Math.random() * (bounds.width - 50)}px`;
    target.style.top = `${Math.random() * (bounds.height - 50)}px`;
    
    timeouts.push(setTimeout(() => {
        if (currentMode === 'aim') loseLife();
    }, 2000 - difficulty * 150));
}

// Game Logic
function initGame() {
    lives = 3;
    difficulty = 1;
    correctClicks = 0;
    updateLives();
    document.getElementById('game-over').style.display = 'none';
    
    if (currentMode === 'math') {
        setupMathMode();
    } else if (currentMode === 'memory') {
        createMemoryGrid();
    } else {
        spawnTarget();
        document.querySelector('.aim-target').addEventListener('click', handleAimClick);
    }
}

function loseLife() {
    lives--;
    updateLives();
    if (lives <= 0) {
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('final-score').textContent = difficulty;
    }
}

function updateLives() {
    const livesContainer = document.querySelector('.lives');
    livesContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const life = document.createElement('div');
        life.className = `life ${i < lives ? 'active' : ''}`;
        livesContainer.appendChild(life);
    }
}

function clearTimeouts() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    document.body.insertAdjacentHTML('beforeend', `
        <div id="game-over" style="display:none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.8); color: white; padding: 2rem; text-align: center; border-radius: 10px;">
            <h2>Game Over!</h2>
            <p>Final Score: <span id="final-score"></span></p>
            <button onclick="initGame()">Restart</button>
        </div>
    `);
    initGame();
});