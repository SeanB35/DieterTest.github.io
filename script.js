class DieterBench {
  constructor() {
    this.modes = ['reaction', 'click', 'memory', 'math'];
    this.currentMode = 'reaction';
    this.score = 0;
    this.lives = 3;
    this.streak = 0;
    this.mathOperation = 'mixed';
    this.clickTestRunning = false;
    this.reactionTimes = [];
    this.startTime = null;
    this.timeoutId = null;
    this.tryCount = 0;
    this.maxTries = 10;
    this.benchmarks = {
      reaction: [250, 200, 180, 150, 120],
      click: [5, 7, 9, 11, 13],
      memory: [3, 4, 5, 6, 7],
      math: [10, 20, 30, 40, 50],
    };
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupMathMode();
    this.setupMemoryGrid();
    this.switchMode('reaction');
    this.updateRank();
  }

  setupEventListeners() {
    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.closest('button').dataset.mode;
        this.switchMode(mode);
      });
    });

    document.querySelectorAll('.op-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => this.setMathOperation(e.target.dataset.op));
    });

    document.querySelector('.math-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.checkMathAnswer();
    });

    document.querySelector('.reaction-box').addEventListener('click', () => this.handleReactionClick());
  }

  switchMode(newMode) {
    this.modes.forEach((mode) => {
      document.getElementById(`${mode}-mode`).classList.remove('active');
      document.querySelector(`[data-mode="${mode}"]`).classList.remove('active');
    });
    document.getElementById(`${newMode}-mode`).classList.add('active');
    document.querySelector(`[data-mode="${newMode}"]`).classList.add('active');
    this.currentMode = newMode;

    if (newMode === 'reaction') {
      this.initReactionTest();
    } else if (newMode === 'click') {
      this.newClickTest();
    } else if (newMode === 'memory') {
      this.newMemoryGame();
    } else if (newMode === 'math') {
      this.newMathProblem();
    }
  }

  // ================= REACTION MODE =================
  initReactionTest() {
    this.reactionTimes = [];
    this.tryCount = 0;
    this.updateAverage();
    this.updateProgressIndicator();
    this.startReactionTest();
  }

  startReactionTest() {
    if (this.tryCount >= this.maxTries) {
      this.endReactionTest();
      return;
    }

    const box = document.querySelector('.reaction-box');
    box.classList.remove('ready');
    box.classList.add('waiting');
    box.textContent = 'Wait for green...';
    box.style.backgroundColor = '#ff5252';

    const delay = Math.random() * 3000 + 1000;
    this.timeoutId = setTimeout(() => {
      box.classList.remove('waiting');
      box.classList.add('ready');
      box.textContent = 'CLICK NOW!';
      box.style.backgroundColor = '#4caf50';
      this.startTime = Date.now();
    }, delay);
  }

  handleReactionClick() {
    if (this.currentMode !== 'reaction') return;

    const box = document.querySelector('.reaction-box');
    if (box.classList.contains('ready')) {
      const endTime = Date.now();
      const reactionTime = endTime - this.startTime;
      this.reactionTimes.push(reactionTime);
      this.tryCount++;

      document.getElementById('reaction-time').textContent = reactionTime;
      this.updateAverage();
      this.awardPoints(reactionTime);
      this.updateProgressIndicator();
      this.startReactionTest();
    } else if (box.classList.contains('waiting')) {
      box.textContent = 'Too soon!';
      setTimeout(() => this.startReactionTest(), 1000);
    }
  }

  updateAverage() {
    const average =
      this.reactionTimes.length > 0
        ? Math.round(this.reactionTimes.reduce((a, b) => a + b) / this.reactionTimes.length)
        : 0;
    document.getElementById('average').textContent = average;
  }

  awardPoints(reactionTime) {
    const maxPoints = 100;
    const minPoints = 10;
    const maxTime = 1000;
    const points = Math.max(minPoints, maxPoints - Math.floor((reactionTime / maxTime) * (maxPoints - minPoints)));
    this.updateScore(points);
  }

  updateProgressIndicator() {
    const progress = document.querySelectorAll('.progress-bubble');
    progress.forEach((bubble, index) => {
      if (index < this.tryCount) {
        bubble.classList.add('completed');
      } else {
        bubble.classList.remove('completed');
      }
    });
  }

  endReactionTest() {
    const totalPoints = this.reactionTimes.reduce((sum, time) => sum + this.calculatePoints(time), 0);
    const retry = confirm(
      `Game Over!\nTotal Points: ${totalPoints}\nAverage Reaction Time: ${this.calculateAverage()} ms\n\nDo you want to retry?`
    );

    if (retry) {
      this.initReactionTest();
    } else {
      this.switchMode('menu');
    }
  }

  calculatePoints(reactionTime) {
    const maxPoints = 100;
    const minPoints = 10;
    const maxTime = 1000;
    return Math.max(minPoints, maxPoints - Math.floor((reactionTime / maxTime) * (maxPoints - minPoints)));
  }

  calculateAverage() {
    return this.reactionTimes.length > 0
      ? Math.round(this.reactionTimes.reduce((a, b) => a + b) / this.reactionTimes.length)
      : 0;
  }

  // ================= CLICK SPEED MODE =================
  newClickTest() {
    this.clickCount = 0;
    this.clickTestRunning = false;
    this.clickStartTime = null;
    const clickBox = document.querySelector('.click-box');
    clickBox.textContent = 'Click Start';
    document.getElementById('clicks').textContent = this.clickCount;
  
    // Remove previous event listeners
    document.removeEventListener('click', this.handleClickTestBound);
    document.getElementById('start-click-test').removeEventListener('click', this.startClickTestBound);
  
    // Add new event listeners
    this.handleClickTestBound = this.handleClickTest.bind(this);
    this.startClickTestBound = this.startClickTest.bind(this);
    document.getElementById('start-click-test').addEventListener('click', this.startClickTestBound);
  }
  
  startClickTest() {
    if (this.clickTestRunning) return;
  
    this.clickTestRunning = true;
    this.clickCount = 0;
    this.clickStartTime = Date.now();
    document.querySelector('.click-box').textContent = 'GO! Click as fast as you can!';
    document.getElementById('clicks').textContent = this.clickCount;
  
    // Add click event listener to the entire document
    document.addEventListener('click', this.handleClickTestBound);
  
    // Start the timer
    const duration = 5000; // 5 seconds
    const startTime = Date.now();
    const updateTimeBar = () => {
      const elapsed = Date.now() - startTime;
      const timeLeft = 1 - elapsed / duration;
      document.querySelector('.time-left').style.transform = `scaleX(${timeLeft})`;
  
      if (elapsed < duration) {
        requestAnimationFrame(updateTimeBar);
      } else {
        this.endClickTest();
      }
    };
  
    updateTimeBar();
  }
  
  handleClickTest() {
    if (this.clickTestRunning) {
      this.clickCount++;
      document.getElementById('clicks').textContent = this.clickCount;
    }
  }
  
  endClickTest() {
    this.clickTestRunning = false;
    document.removeEventListener('click', this.handleClickTestBound);
  
    const cps = (this.clickCount / 5).toFixed(1);
    document.querySelector('.click-box').textContent = `${this.clickCount} clicks (${cps}/s)`;
    this.showPercentile('click', cps);
  }

  // ================= MEMORY MODE =================
  setupMemoryGrid() {
    const grid = document.querySelector('.memory-grid');
    grid.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const tile = document.createElement('div');
      tile.className = 'memory-tile';
      tile.addEventListener('click', () => this.handleMemoryClick(i));
      grid.appendChild(tile);
    }
  }

  newMemoryGame() {
    const grid = document.querySelector('.memory-grid');
    grid.innerHTML = '';
    this.setupMemoryGrid();
    this.memoryPattern = [];
    this.memoryProgress = 0;
    this.generateMemoryPattern();
    this.showMemoryPattern();
  }

  generateMemoryPattern() {
    const patternLength = Math.floor(this.score / 10) + 2;
    this.memoryPattern = [];
    while (this.memoryPattern.length < patternLength) {
      const newTile = Math.floor(Math.random() * 16);
      if (this.memoryPattern[this.memoryPattern.length - 1] !== newTile) {
        this.memoryPattern.push(newTile);
      }
    }
  }

  showMemoryPattern() {
    const tiles = document.querySelectorAll('.memory-tile');
    tiles.forEach((tile) => tile.classList.remove('active'));
    this.memoryAcceptInput = false;

    let i = 0;
    const showNextTile = () => {
      if (i >= this.memoryPattern.length) {
        this.memoryAcceptInput = true;
        return;
      }

      const index = this.memoryPattern[i];
      tiles[index].classList.add('active');
      setTimeout(() => {
        tiles[index].classList.remove('active');
        i++;
        setTimeout(showNextTile, 500);
      }, 1000);
    };

    showNextTile();
  }

  handleMemoryClick(index) {
    if (!this.memoryAcceptInput) return;

    const tiles = document.querySelectorAll('.memory-tile');
    if (this.memoryPattern[this.memoryProgress] === index) {
      tiles[index].classList.add('active');
      setTimeout(() => tiles[index].classList.remove('active'), 200);
      this.memoryProgress++;
      if (this.memoryProgress === this.memoryPattern.length) {
        this.updateScore(20);
        this.newMemoryGame();
      }
    } else {
      this.loseLife();
      this.newMemoryGame();
    }
  }

  // ================= MATH MODE =================
  setupMathMode() {
    // Additional setup for math mode
  }

  setMathOperation(op) {
    this.mathOperation = op;
    document.querySelectorAll('.op-btn').forEach((btn) =>
      btn.classList.toggle('active', btn.dataset.op === op)
    );
    this.newMathProblem();
  }

  newMathProblem() {
    let a, b, op;
    let opToUse =
      this.mathOperation === 'mixed'
        ? ['+', '-', '×', '÷'][Math.floor(Math.random() * 4)]
        : this.mathOperation;
    const operations = {
      '+': () => [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), '+'],
      '-': () => [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), '-'],
      '×': () => [Math.floor(Math.random() * 12) + 1, Math.floor(Math.random() * 12) + 1, '×'],
      '÷': () => {
        const b = Math.floor(Math.random() * 12) + 1;
        const a = b * (Math.floor(Math.random() * 12) + 1);
        return [a, b, '÷'];
      },
    };
    [a, b, op] = operations[opToUse]();
    this.currentAnswer = eval(`${a} ${op === '×' ? '*' : op === '÷' ? '/' : op} ${b}`);
    document.querySelector('.math-problem').textContent = `${a} ${op} ${b} = ?`;
    document.querySelector('.math-input').value = '';
  }

  checkMathAnswer() {
    const inputField = document.querySelector('.math-input');
    const userAnswer = parseFloat(inputField.value);
    if (isNaN(userAnswer)) return;

    if (userAnswer === this.currentAnswer) {
      this.updateScore(10);
      this.streak++;
      this.newMathProblem();
    } else {
      this.loseLife();
      this.streak = 0;
    }
    document.getElementById('streak').textContent = this.streak;
  }

  // ================= CORE FUNCTIONS =================
  updateScore(points) {
    this.score += points;
    document.getElementById('score').textContent = this.score;
    this.updateRank();
  }

  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    document.getElementById('lives').textContent = this.lives;
    if (this.lives === 0) {
      setTimeout(() => {
        alert(`Game Over! Score: ${this.score}`);
        this.resetGame();
      }, 100);
    }
  }

  resetGame() {
    this.score = 0;
    this.lives = 3;
    this.streak = 0;
    document.getElementById('score').textContent = 0;
    document.getElementById('lives').textContent = 3;
    document.getElementById('streak').textContent = 0;
    this.updateRank();
  }

  updateRank() {
    let rank;
    if (this.score >= 1000) rank = 'Wilson Rank';
    else if (this.score >= 500) rank = 'Professor Cuomo Rank';
    else if (this.score >= 250) rank = 'Freakbiss Rank';
    else if (this.score >= 100) rank = 'Fomas Dieterlito Rank';
    else rank = 'Tom Z-Mode Rank';
    document.getElementById('rank').textContent = rank;
  }

  showPercentile(mode, value) {
    const benchmarks = this.benchmarks[mode];
    let percentile = 0;
    benchmarks.forEach((threshold, index) => {
      if (value > threshold) {
        percentile = (index + 1) * 20;
      }
    });
    this.createChart(mode, percentile);
  }

  createChart(mode, percentile) {
    const ctx = document.getElementById('percentileChart');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your Performance'],
        datasets: [{
          label: `Percentile (Top ${100 - percentile}%)`,
          data: [percentile],
          backgroundColor: 'rgba(100, 255, 218, 0.5)',
          borderColor: 'var(--accent)',
          borderWidth: 2,
        }],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: 'var(--text)',
              callback: (value) => value + '%',
            },
          },
          x: {
            ticks: {
              color: 'var(--text)',
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: 'var(--text)',
            },
          },
        },
      },
    });
  }
}

const game = new DieterBench();
