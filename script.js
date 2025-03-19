class DieterBench {

    constructor() {
      // Modes: reaction, click, memory, math
      this.modes = ['reaction', 'click', 'memory', 'math'];
      this.currentMode = 'reaction';
      this.score = 0;
      this.lives = 3;
      this.streak = 0;
      this.mathOperation = 'mixed';
      this.clickTestRunning = false;
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
      // Mode switching
      document.querySelectorAll('.mode-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const mode = e.target.closest('button').dataset.mode;
          this.switchMode(mode);
        });
      });
  
      // Math operations
      document.querySelectorAll('.op-btn').forEach((btn) => {
        btn.addEventListener('click', (e) =>
          this.setMathOperation(e.target.dataset.op)
        );
      });
  
      // Math input: on Enter key, check answer
      document
        .querySelector('.math-input')
        .addEventListener('keypress', (e) => {
          if (e.key === 'Enter') this.checkMathAnswer();
        });
  
      // Reaction mode click listener
      document
        .querySelector('.reaction-box')
        .addEventListener('click', () => this.handleReactionClick());
    }
  
    switchMode(newMode) {
      // Remove active classes for all modes/buttons
      this.modes.forEach((mode) => {
        document.getElementById(`${mode}-mode`).classList.remove('active');
        document
          .querySelector(`[data-mode="${mode}"]`)
          .classList.remove('active');
      });
      // Activate the new mode
      document.getElementById(`${newMode}-mode`).classList.add('active');
      document.querySelector(`[data-mode="${newMode}"]`).classList.add('active');
      this.currentMode = newMode;
  
      // Mode-specific initialization
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
  
    // =============== MATH MODE ===============
    setupMathMode() {
      // Additional math mode setup if needed
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
      this.currentAnswer = eval(
        `${a} ${op === '×' ? '*' : op === '÷' ? '/' : op} ${b}`
      );
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
  
    // =============== REACTION MODE ===============
    initReactionTest() {
      this.reactionTimes = [];
      this.updateAverage();
      this.startReactionTest();
    }
  
    startReactionTest() {
      const box = document.querySelector('.reaction-box');
      box.classList.remove('ready');
      box.classList.add('waiting');
      box.textContent = 'Wait for blue...';
      setTimeout(() => {
        box.classList.remove('waiting');
        box.classList.add('ready');
        box.textContent = 'CLICK NOW!';
        this.startTime = Date.now();
      }, Math.random() * 3000 + 1000);
    }
  
    handleReactionClick() {
      if (this.currentMode !== 'reaction') return;
      const box = document.querySelector('.reaction-box');
      
      if (box.classList.contains('ready')) {
          const reactionTime = Date.now() - this.startTime;
          
          // Update real-time reaction time
          document.getElementById('reaction-time').textContent = reactionTime;
  
          // Add to the array and update average
          this.reactionTimes.push(reactionTime);
          this.updateAverage();
          
          // Show percentile
          this.showPercentile('reaction', reactionTime);
          
          // Start next test
          this.startReactionTest();
      } else {
          box.textContent = 'Too soon!';
          setTimeout(() => this.startReactionTest(), 1000);
      }
  }
  
    updateAverage() {
      const average =
        this.reactionTimes.length > 0
          ? Math.round(
              this.reactionTimes.reduce((a, b) => a + b) / this.reactionTimes.length
            )
          : 0;
      document.getElementById('average').textContent = average;
    }
  
    // =============== MEMORY MODE ===============
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
  
    // In the DieterBench class
generateMemoryPattern() {
  const patternLength = Math.floor(this.score / 10) + 2; // Make it slightly easier to start
  this.memoryPattern = [];
  while (this.memoryPattern.length < patternLength) {
      const newTile = Math.floor(Math.random() * 16);
      if (this.memoryPattern[this.memoryPattern.length - 1] !== newTile) { // Prevent duplicates
          this.memoryPattern.push(newTile);
      }
  }
}

showMemoryPattern() {
  const tiles = document.querySelectorAll('.memory-tile');
  tiles.forEach(tile => tile.classList.remove('active'));
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
          setTimeout(showNextTile, 500); // Add pause between tiles
      }, 1000); // Show each tile for 1 second
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
  
    // =============== CLICK SPEED MODE ===============
    // Replace existing click mode methods with this:
newClickTest() {
  this.clickCount = 0;
  this.clickTestRunning = false;
  this.clickStartTime = null;
  const clickBox = document.querySelector('.click-box');
  clickBox.textContent = "Click to start";
  document.getElementById('clicks').textContent = this.clickCount;
  clickBox.onclick = () => this.handleClickTest();
}

handleClickTest() {
  const clickBox = document.querySelector('.click-box');
  
  if (!this.clickTestRunning) {
      this.clickTestRunning = true;
      this.clickCount = 0;
      this.clickStartTime = Date.now();
      clickBox.textContent = "GO! Click as fast as you can!";
      this.clickTestTimer = setTimeout(() => this.endClickTest(), 5000);
      // Add rapid click listener
      clickBox.onclick = () => {
          this.clickCount++;
          document.getElementById('clicks').textContent = this.clickCount;
      };
  }
}

endClickTest() {
  const clickBox = document.querySelector('.click-box');
  const cps = (this.clickCount / 5).toFixed(1);
  clickBox.textContent = `${this.clickCount} clicks (${cps}/s) - Click to restart`;
  clickBox.onclick = () => this.newClickTest();
  this.clickTestRunning = false;
  
  // Show percentile
  this.showPercentile('click', cps);
}
  
    // =============== CORE FUNCTIONS ===============
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
    // Benchmark data (simplified example)
benchmarks = {
  reaction: [250, 200, 180, 150, 120],
  click: [5, 7, 9, 11, 13], // clicks per second
  memory: [3, 4, 5, 6, 7], // sequence length
  math: [10, 20, 30, 40, 50] // streak
};

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
              borderWidth: 2
          }]
      },
      options: {
          scales: {
              y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                      color: 'var(--text)',
                      callback: value => value + '%'
                  }
              },
              x: {
                  ticks: {
                      color: 'var(--text)'
                  }
              }
          },
          plugins: {
              legend: {
                  labels: {
                      color: 'var(--text)'
                  }
              }
          }
      }
  });
}
  }

  document.addEventListener("DOMContentLoaded", () => {
    function startClickSpeedGame(duration) {
      let timeLeft = duration;
      const timeBar = document.getElementById("time-bar");
      timeBar.style.width = "100%";
      timeBar.style.backgroundColor = "green";
  
      const interval = setInterval(() => {
        timeLeft -= 100;
        const percent = (timeLeft / duration) * 100;
        timeBar.style.width = percent + "%";
  
        // Change color based on remaining time
        if (percent > 50) {
          timeBar.style.backgroundColor = "green";
        } else if (percent > 25) {
          timeBar.style.backgroundColor = "yellow";
        } else {
          timeBar.style.backgroundColor = "red";
        }
  
        if (timeLeft <= 0) {
          clearInterval(interval);
          timeBar.style.width = "0%";
        }
      }, 100);
    }
  
    // Example trigger for testing
    document.querySelector(".click-box").addEventListener("click", () => {
      startClickSpeedGame(5000); // 5 seconds countdown
    });
  });

  const game = new DieterBench();
  