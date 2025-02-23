// Game State Management
let currentMode = 'math';
let lives = 3;
let difficulty = 1;
let currentProblem;
let timeouts = [];

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
function generateMathProblem() {
    const operations = ['+', '-', '*', '/'];
    const op = operations[Math.floor(Math.random() * operations.length)];
    let a = Math.floor(Math.random() * (difficulty * 10)) + 1;
    let b = Math.floor(Math.random() * (difficulty * 10)) + 1;
    
    if (op === '/') a = a * b;
    
    return { problem: `${a} ${op} ${b}`, answer: eval(`${a} ${op} ${b}`) };
}

function newMathProblem() {
    currentProblem = generateMathProblem();
    document.querySelector('.math-problem').textContent = currentProblem.problem;
    document.querySelector('.math-input').value = '';
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
    
    if (currentMode === 'math') {
        setupMathMode();
    } else if (currentMode === 'memory') {
        createMemoryGrid();
    } else {
        spawnTarget();
        document.querySelector('.aim-target').addEventListener('click', handleAimClick);
    }
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

function handleAimClick() {
    this.style.transform = 'scale(1.2)';
    difficulty++;
    clearTimeouts();
    spawnTarget();
}

function loseLife() {
    lives--;
    updateLives();
    if (lives <= 0) {
        alert(`Game Over! Score: ${difficulty}`);
        initGame();
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
initGame();
document.querySelector('.aim-target').addEventListener('click', handleAimClick);