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
    const inputField = document.querySelector('.math-input');

    // Remove previous listener to prevent multiple triggers
    inputField.removeEventListener('keypress', handleMathInput);
    inputField.addEventListener('keypress', handleMathInput);
}

function handleMathInput(e) {
    if (e.key === 'Enter') {
        const userAnswer = parseFloat(e.target.value);
        if (userAnswer === currentProblem.answer) {
            difficulty++; // Increase difficulty only on correct answer
            newMathProblem();
        } else {
            loseLife(); // Lose life only on wrong answer
        }
    }
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
        document.getElementById('final-score').textContent = `Score: ${difficulty - 1}`;
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

// Clear Timeouts
function clearTimeouts() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    document.body.insertAdjacentHTML('beforeend', `
        <div id="game-over" style="display:none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.8); color: white; padding: 2rem; text-align: center; border-radius: 10px;">
            <h2>Game Over!</h2>
            <p id="final-score">Final Score: 0</p>
            <button onclick="initGame()">Restart</button>
        </div>
    `);
    initGame();
});