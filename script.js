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
    this.memoryStats = {
      totalGames: 0,
      correctPatterns: 0,
      longestPattern: 0,
      currentStreak: 0,
      losses: 0
    };
    this.reactionTestRunning = false;
    this.reactionTestStarted = false;
    this.clickTimes = []; // Track timestamps of each click
    this.clickPoints = 0; // Track points earned in the current game
    this.mathCorrect = 0; // Track correct answers
    this.mathWrong = 0; // Track wrong answers
    this.mathPoints = 0; // Track points earned in the current game
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

    document.getElementById('start-reaction-test').addEventListener('click', () => {
      if (!this.reactionTestRunning) {
        // Start the test for the first time
        this.startReactionTest();
        this.reactionTestRunning = true;
        this.reactionTestStarted = true;
        document.getElementById('start-reaction-test').textContent = 'Restart Test';
      } else {
        // Restart the test immediately
        this.initReactionTest();
        this.startReactionTest(); // Automatically start the test after resetting
      }
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
    
    // Add this line to properly clean up click test
    if (this.currentMode === 'click') {
      document.removeEventListener('click', this.handleClickTestBound);
      clearTimeout(this.clickTimer);
    }

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
    this.reactionTestRunning = false; // Reset the flag
    this.reactionTestStarted = false; // Reset the flag
    this.updateAverage();
    this.updateProgressIndicator();
    document.getElementById('start-reaction-test').textContent = 'Start Reaction Test';
    document.querySelector('.reaction-box').textContent = 'Click to start';
    document.querySelector('.reaction-box').classList.add('waiting');
    document.querySelector('.reaction-box').classList.remove('ready');
    document.querySelector('.reaction-box').style.pointerEvents = 'none'; // Disable clicks initially
  }

  startReactionTest() {
    if (this.tryCount >= this.maxTries) {
      this.endReactionTest();
      return;
    }

    const box = document.querySelector('.reaction-box');
    box.style.pointerEvents = 'auto'; // Enable clicks on the reaction box
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
    // Only allow clicks if the test has started
    if (!this.reactionTestStarted) return;

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
    // Calculate results
    const totalPoints = this.reactionTimes.reduce((sum, time) => sum + this.calculatePoints(time), 0);
    const averageTime = this.calculateAverage();
  
    // Show results modal
    this.showReactionResults(totalPoints, averageTime);
  
    // Reset the test
    this.initReactionTest();
  }

  showReactionResults(totalPoints, averageTime) {
    const modal = document.getElementById('reactionResultModal');
    const resultText = document.getElementById('reactionResultText');

    // Display results
    resultText.innerHTML = `
      🏆 Total Points: ${totalPoints}<br>
      ⏱️ Average Time: ${averageTime} ms
    `;

    // Show the modal
    modal.style.display = 'flex';
  }

  closeReactionModal() {
    const modal = document.getElementById('reactionResultModal');
    modal.style.display = 'none';
  }

  setupModalListeners() {
    // Add event listener for the close button
    document.getElementById('closeReactionModalBtn').addEventListener('click', () => {
      this.closeReactionModal();
    });
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
    const clickBox = document.querySelector('.click-box');
    clickBox.textContent = 'Click Start';
    document.getElementById('clicks').textContent = '0';
    
    // Reset time bar
    document.querySelector('.time-bar-progress').style.transform = 'scaleX(0)';
    
    // Clear any existing listeners
    document.removeEventListener('click', this.handleClickTestBound);
    document.getElementById('start-click-test').removeEventListener('click', this.startClickTestBound);
    
    // Add new listeners
    this.handleClickTestBound = this.handleClickTest.bind(this);
    this.startClickTestBound = this.startClickTest.bind(this);
    document.getElementById('start-click-test').addEventListener('click', this.startClickTestBound);
  }

  startClickTest() {
    if (this.clickTestRunning) return;

    this.clickTestRunning = true;
    this.clickCount = 0;
    this.clickTimes = []; // Reset click timestamps
    this.clickPoints = 0; // Reset points
    this.updateCurrentResults(); // Update the results box

    const clickBox = document.querySelector('.click-box');
    clickBox.textContent = 'GO! Click anywhere!';
    document.getElementById('clicks').textContent = '0';

    // Start progress animation
    const progressBar = document.querySelector('.time-bar-progress');
    progressBar.style.transform = 'scaleX(1)';
    progressBar.style.transition = 'transform 5s linear';

    // Add click listener
    document.addEventListener('click', this.handleClickTestBound);

    // End after 5 seconds
    this.clickTimer = setTimeout(() => {
      this.endClickTest();
    }, 5000);
  }

  handleClickTest() {
    if (this.clickTestRunning) {
      this.clickCount++;
      this.clickTimes.push(Date.now()); // Record the timestamp of the click
      this.updateCurrentResults(); // Update the results box
      document.getElementById('clicks').textContent = this.clickCount;
    }
  }

  updateCurrentResults() {
    // Calculate clicks per second (cps)
    let cps = 0;
    if (this.clickTimes.length > 1) {
      const totalTime = (this.clickTimes[this.clickTimes.length - 1] - this.clickTimes[0]) / 1000; // Convert to seconds
      cps = (this.clickCount / totalTime).toFixed(1);
    }

    // Calculate points (example: 1 point per click)
    this.clickPoints = this.clickCount;

    // Update the current results box
    document.getElementById('current-clicks').textContent = this.clickCount;
    document.getElementById('current-cps').textContent = cps;
    document.getElementById('current-points').textContent = this.clickPoints;
  }

  endClickTest() {
    if (!this.clickTestRunning) return;

    this.clickTestRunning = false;
    document.removeEventListener('click', this.handleClickTestBound);

    const cps = (this.clickCount / 5).toFixed(1); // Calculate final CPS

    // Add points earned to the total score
    this.updateScore(this.clickPoints);

    // Show results
    this.showClickResults(this.clickCount, cps);
    this.showPercentile('click', cps);
  }

  showClickResults(count, cps) {
    const modal = document.getElementById('clickResultModal');
    document.getElementById('clickResultText').textContent = 
      `🏆 ${count} Clicks\n🚀 ${cps} CPS`;
    modal.style.display = 'flex';
  }

  closeClickModal() {
    document.getElementById('clickResultModal').style.display = 'none';
    // Reset click test properly
    this.newClickTest();
  }

  // ================= MEMORY MODE =================
setupMemoryGrid() {
  const grid = document.querySelector('.memory-grid');
  grid.innerHTML = '';
  for (let i = 0; i < 16; i++) {
      const tile = document.createElement('div');
      tile.className = 'memory-tile';
      tile.dataset.value = i;
      grid.appendChild(tile);
  }
}

newMemoryGame() {
  this.memoryPattern = this.generateMemoryPattern();
  this.userInput = [];
  this.memoryProgress = 0;
  this.isShowingPattern = true;
  this.memoryStats.totalGames++;
  
  document.querySelectorAll('.memory-tile').forEach(tile => {
      tile.classList.remove('active', 'correct', 'incorrect');
  });
  
  this.showMemoryPattern()
      .then(() => {
          this.isShowingPattern = false;
          this.addMemoryInputListeners();
      });
}
async handleMemoryClick(e) {
  if (this.isShowingPattern) return;

  const clickedTile = e.target.closest('.memory-tile');
  const tileIndex = parseInt(clickedTile.dataset.value);
  const expectedTile = this.memoryPattern[this.userInput.length];

  clickedTile.classList.add(tileIndex === expectedTile ? 'correct' : 'incorrect');

  if (tileIndex === expectedTile) {
    this.userInput.push(tileIndex);

    if (this.userInput.length === this.memoryPattern.length) {
      await this.showSuccessFeedback();
      this.updateScore(25 + (this.memoryPattern.length * 5));
      this.memoryStats.correctPatterns++;
      this.memoryStats.currentStreak++;
      this.memoryStats.longestPattern = Math.max(
        this.memoryStats.longestPattern, 
        this.memoryPattern.length
      );
      this.newMemoryGame();
    }
  } else {
    await this.showErrorFeedback();
    this.loseLife();
    if (this.lives > 0) this.newMemoryGame();
  }

  setTimeout(() => {
    clickedTile.classList.remove('correct', 'incorrect');
  }, 500);

}

showMemoryStats() {
  const modal = document.getElementById('memory-stats-modal');
  const statsHTML = `
      <h2>🧠 Memory Stats</h2>
      <div class="memory-stats-grid">
          <div>Total Games:</div><div>${this.memoryStats.totalGames}</div>
          <div>Correct Patterns:</div><div>${this.memoryStats.correctPatterns}</div>
          <div>Longest Pattern:</div><div>${this.memoryStats.longestPattern}</div>
          <div>Current Streak:</div><div>${this.memoryStats.currentStreak}</div>
      </div>
      <button onclick="game.resetMemoryGame()">Try Again</button>
  `;
  
  modal.querySelector('.modal-content').innerHTML = statsHTML;
  modal.style.display = 'flex';
}

resetMemoryGame() {
  this.memoryStats = {
      totalGames: 0,
      correctPatterns: 0,
      longestPattern: 0,
      currentStreak: 0,
      losses: 0
  };
  this.lives = 3;
  this.score = 0;
  document.getElementById('lives').textContent = 3;
  document.getElementById('score').textContent = 0;
  document.getElementById('memory-stats-modal').style.display = 'none';
  this.newMemoryGame();
}

generateMemoryPattern() {
  const baseLength = 3; // Starting pattern length
  const difficultyLevel = Math.floor(this.score / 50); // Increase length every 50 points
  const patternLength = baseLength + difficultyLevel;
  
  const pattern = [];
  let previousTile = -1;
  
  for (let i = 0; i < patternLength; i++) {
      let newTile;
      do {
          newTile = Math.floor(Math.random() * 16);
      } while (newTile === previousTile); // Prevent consecutive duplicates
      
      pattern.push(newTile);
      previousTile = newTile;
  }
  
  return pattern;
}

async showMemoryPattern() {
  const tiles = document.querySelectorAll('.memory-tile');
  this.removeMemoryInputListeners();
  
  for (const tileIndex of this.memoryPattern) {
      await new Promise(resolve => {
          tiles[tileIndex].classList.add('active');
          setTimeout(() => {
              tiles[tileIndex].classList.remove('active');
              resolve();
          }, 1000);
      });
      await new Promise(resolve => setTimeout(resolve, 300)); // Pause between tiles
  }
}

addMemoryInputListeners() {
  this.memoryClickHandler = (e) => this.handleMemoryClick(e);
  document.querySelectorAll('.memory-tile').forEach(tile => {
      tile.addEventListener('click', this.memoryClickHandler);
  });
}

removeMemoryInputListeners() {
  document.querySelectorAll('.memory-tile').forEach(tile => {
      tile.removeEventListener('click', this.memoryClickHandler);
  });
}

async handleMemoryClick(e) {
  if (this.isShowingPattern) return;
  
  const clickedTile = e.target.closest('.memory-tile');
  if (!clickedTile) return;
  
  const tileIndex = parseInt(clickedTile.dataset.value);
  const expectedTile = this.memoryPattern[this.userInput.length];
  
  // Visual feedback
  clickedTile.classList.add(tileIndex === expectedTile ? 'correct' : 'incorrect');
  
  if (tileIndex === expectedTile) {
      this.userInput.push(tileIndex);
      
      if (this.userInput.length === this.memoryPattern.length) {
          // Complete pattern
          await this.showSuccessFeedback();
          this.updateScore(25);
          this.newMemoryGame();
      }
  } else {
      // Incorrect pattern
      await this.showErrorFeedback();
      this.loseLife();
      this.newMemoryGame();
  }
  
  setTimeout(() => {
      clickedTile.classList.remove('correct', 'incorrect');
  }, 500);
}

async showSuccessFeedback() {
  const tiles = document.querySelectorAll('.memory-tile');
  for (const tile of tiles) {
      tile.classList.add('correct');
      await new Promise(resolve => setTimeout(resolve, 50));
      tile.classList.remove('correct');
  }
}

async showErrorFeedback() {
  const tiles = document.querySelectorAll('.memory-tile');
  for (const tile of tiles) {
      tile.classList.add('incorrect');
  }
  await new Promise(resolve => setTimeout(resolve, 1000));
  for (const tile of tiles) {
      tile.classList.remove('incorrect');
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
    document.querySelector('.math-input').focus(); // Ensure the input field is focused
  }

  checkMathAnswer() {
    const inputField = document.querySelector('.math-input');
    const userAnswer = parseFloat(inputField.value);
    if (isNaN(userAnswer)) return;

    if (userAnswer === this.currentAnswer) {
      this.mathCorrect++; // Increment correct answers
      this.updateScore(10); // Award points
      this.mathPoints += 10; // Track points earned in this game
      this.streak++; // Increment streak
    } else {
      this.mathWrong++; // Increment wrong answers
      this.loseLife();
      this.streak = 0; // Reset streak
    }

    // Update the current progress box
    this.updateMathProgress();

    // Update the streak display
    document.getElementById('streak').textContent = this.streak;

    // Clear the input field and generate a new problem
    inputField.value = '';
    this.newMathProblem();
  }

  updateMathProgress() {
    // Calculate accuracy
    const totalAttempts = this.mathCorrect + this.mathWrong;
    const accuracy = totalAttempts > 0 ? ((this.mathCorrect / totalAttempts) * 100).toFixed(1) : 0;

    // Update the current progress box
    document.getElementById('math-correct').textContent = this.mathCorrect;
    document.getElementById('math-wrong').textContent = this.mathWrong;
    document.getElementById('math-accuracy').textContent = `${accuracy}%`;
    document.getElementById('math-streak').textContent = this.streak;
    document.getElementById('math-points').textContent = this.mathPoints;
  }

  showMathResults() {
    const modal = document.getElementById('mathResultModal');
    const resultText = document.getElementById('mathResultText');

    // Calculate accuracy
    const totalAttempts = this.mathCorrect + this.mathWrong;
    const accuracy = totalAttempts > 0 ? ((this.mathCorrect / totalAttempts) * 100).toFixed(1) : 0;

    // Display results
    resultText.innerHTML = `
      🏆 Correct Answers: ${this.mathCorrect}<br>
      ❌ Wrong Answers: ${this.mathWrong}<br>
      🎯 Accuracy: ${accuracy}%<br>
      🔥 Longest Streak: ${this.streak}<br>
      💯 Points Earned: ${this.mathPoints}
    `;

    // Show the modal
    modal.style.display = 'flex';
  }

  closeMathModal() {
    const modal = document.getElementById('mathResultModal');
    modal.style.display = 'none';
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
      this.showMathResults(); // Show math results when lives reach 0
    }
  }

  showGameOverStats() {
    const modal = document.getElementById('memory-stats-modal');
    const statsHTML = `
      <h2>💀 Game Over!</h2>
      <div class="memory-stats-grid">
        <div>Final Score:</div><div>${this.score}</div>
        <div>Longest Pattern:</div><div>${this.memoryStats.longestPattern}</div>
        <div>Correct Patterns:</div><div>${this.memoryStats.correctPatterns}</div>
        <div>Total Games:</div><div>${this.memoryStats.totalGames}</div>
      </div>
      <button onclick="game.resetGame()">Try Again</button>
    `;
    
    modal.querySelector('.modal-content').innerHTML = statsHTML;
    modal.style.display = 'flex';
  }

  resetGame() {
    this.score = 0;
    this.lives = 3;
    this.streak = 0;
    this.memoryStats = {
      totalGames: 0,
      correctPatterns: 0,
      longestPattern: 0,
      currentStreak: 0,
      losses: 0
    };

    document.getElementById('score').textContent = 0;
    document.getElementById('lives').textContent = 3;
    document.getElementById('streak').textContent = 0;
    document.getElementById('memory-stats-modal').style.display = 'none';
    
    // Reset current mode
    if (this.currentMode === 'memory') {
      this.newMemoryGame();
    } else {
      this.switchMode(this.currentMode);
    }
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
