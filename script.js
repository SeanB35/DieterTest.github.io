class DieterBench {
  constructor() {
    this.modes = ['reaction', 'click', 'memory', 'math', 'chimp', 'visual'];
    this.currentMode = 'reaction';
    this.score = 0;
    this.lives = {
      reaction: 3,
      click: 3,
      memory: 3,
      math: 3,
      chimp: 3,  // Add chimp
      visual: 3   // Add visual
    };
    this.streak = 0;
    this.chimpInput = [];
    this.visualInput = [];
    this.mathOperation = 'mixed';
    this.clickTestRunning = false;
    this.reactionTimes = [];
    this.startTime = null;
    this.timeoutId = null;
    this.tryCount = 0;
    this.maxTries = 10;
    this.benchmarks = {
      reaction: [350, 300, 250, 200, 150],
      click: [5, 7, 9, 11, 13],
      memory: [3, 4, 5, 6, 7],
      math: [10, 20, 30, 40, 50],
      chimp: [3, 5, 7, 9, 11],  // Levels
      visual: [4, 6, 8, 10, 12] // Pattern length
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
    this.chimpLevel = 1;
    this.chimpSequence = [];
    this.visualPattern = [];
    this.visualInput = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupMathMode();
    this.setupMemoryGrid();
    this.switchMode('reaction');
    this.updateRank();
    this.setupModalListeners(); // Add this
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
    document.getElementById('closeReactionModalBtn')?.addEventListener('click', () => this.closeReactionModal());
    document.getElementById('closeClickModalBtn')?.addEventListener('click', () => this.closeClickModal());
    document.getElementById('closeMathModalBtn')?.addEventListener('click', () => this.closeMathModal());
    document.getElementById('closeMemoryModalBtn')?.addEventListener('click', () => this.closeMemoryStatsModal());
    document.getElementById('start-chimp-test').addEventListener('click', () => this.startChimpTest());
  document.getElementById('closeChimpModalBtn')?.addEventListener('click', () => this.closeChimpModal());
  document.getElementById('closeVisualModalBtn')?.addEventListener('click', () => this.closeVisualModal());
  }

  switchMode(newMode) {
    // Add these lines for cleanup
    if (this.currentMode === 'click') {
      document.removeEventListener('click', this.handleClickTestBound);
      clearTimeout(this.clickTimer);
    }
    if (this.currentMode === 'chimp') {
      document.querySelector('.chimp-container').innerHTML = '';
    }
    
    // Add cleanup for visual mode
    if (this.currentMode === 'visual') {
      this.removeVisualListeners();
    }
  
    // Update mode display
    this.modes.forEach((mode) => {
      document.getElementById(`${mode}-mode`).classList.remove('active');
      document.querySelector(`[data-mode="${mode}"]`).classList.remove('active');
    });
  
    document.getElementById(`${newMode}-mode`).classList.add('active');
    document.querySelector(`[data-mode="${newMode}"]`).classList.add('active');
    this.currentMode = newMode;
  
    // Handle mode-specific initialization
    if (newMode === 'reaction') {
      this.initReactionTest();
    } else if (newMode === 'click') {
      this.newClickTest();
    } else if (newMode === 'memory') {
      this.newMemoryGame();
      this.updateMemoryProgressBox();
    } else if (newMode === 'math') {
      this.newMathProblem();
    } else if (newMode === 'chimp') {  // Add chimp initialization
      this.chimpLevel = 1;
  this.chimpInput = [];
  document.querySelector('.chimp-container').innerHTML = '';
    } else if (newMode === 'visual') {  // Add visual initialization
      this.newVisualGame();
    }
    
    document.getElementById('lives').textContent = this.lives[newMode];
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
  removeVisualListeners() {
    document.querySelectorAll('.visual-tile').forEach(tile => {
      tile.removeEventListener('click', this.visualClickHandler);
    });
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
  updateMemoryProgressBox() {
    document.getElementById('memory-correct').textContent = this.memoryStats.correctPatterns;
    document.getElementById('memory-streak').textContent = this.memoryStats.currentStreak;
    document.getElementById('memory-points').textContent = this.score;
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
    document.getElementById('closeChimpModalBtn')?.addEventListener('click', () => this.closeChimpModal());
  document.getElementById('closeVisualModalBtn')?.addEventListener('click', () => this.closeVisualModal());
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
    // Reset time bar properly
    const progressBar = document.querySelector('.time-bar-progress');
    progressBar.style.transition = 'none';
    progressBar.style.transform = 'scaleX(0)';
    setTimeout(() => {
      progressBar.style.transition = 'transform 5s linear';
    }, 10);
    this.newClickTest();
  }

  // ================= MEMORY MODE =================
  setupMemoryGrid() {
    const grid = document.querySelector('.memory-grid');
    grid.innerHTML = '';
    // Create 4x4 grid (16 tiles)
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

  // Clear and regenerate progress bubbles
  const progress = document.querySelector('#memory-mode .progress-indicator');
  progress.innerHTML = '';
  this.memoryPattern.forEach(() => {
    progress.innerHTML += '<div class="progress-bubble"></div>';
  });

  // Reset tiles
  document.querySelectorAll('.memory-tile').forEach(tile => {
    tile.classList.remove('active', 'correct', 'incorrect');
  });
  
  this.showMemoryPattern().then(() => {
    this.isShowingPattern = false;
    this.addMemoryInputListeners();
  });
}
async handleMemoryClick(e) {
  if (this.isShowingPattern) return;

  const clickedTile = e.target.closest('.memory-tile');
  if (!clickedTile) return;

  const tileIndex = parseInt(clickedTile.dataset.value);
  const expectedIndex = this.memoryPattern[this.userInput.length];

  // Visual feedback
  clickedTile.classList.add(tileIndex === expectedIndex ? 'correct' : 'incorrect');
  
  if (tileIndex === expectedIndex) {
    this.userInput.push(tileIndex);
    
    // Update progress
    document.getElementById('memory-correct').textContent = this.userInput.length;
    this.memoryStats.currentStreak++;
    document.getElementById('memory-streak').textContent = this.memoryStats.currentStreak;
    
    // Check for complete pattern
    if (this.userInput.length === this.memoryPattern.length) {
      this.updateScore(50);
      await this.showSuccessFeedback();
      this.newMemoryGame();
    }
  } else {
    // Handle wrong answer
    this.memoryStats.currentStreak = 0;
    document.getElementById('memory-streak').textContent = 0;
    this.loseLife();
    await this.showErrorFeedback();
    
    if (this.lives.memory > 0) {
      this.newMemoryGame();
    } else {
      this.showGameOverStats();
    }
  }

  // Clear feedback after delay
  setTimeout(() => {
    clickedTile.classList.remove('correct', 'incorrect');
  }, 500);
}
closeMemoryStatsModal() {
  document.getElementById('memory-stats-modal').style.display = 'none';
}
updateMemoryProgress(isCorrect) {
  const bubbles = document.querySelectorAll('#memory-mode .progress-bubble');
  const index = this.userInput.length;
  if (index < bubbles.length) {
    bubbles[index].classList.add(isCorrect ? 'correct' : 'incorrect');
  }
}
async showMemoryPattern() {
  const tiles = document.querySelectorAll('.memory-tile');
  this.removeMemoryInputListeners();
  
  // Flash pattern with clear timing
  for (const index of this.memoryPattern) {
    tiles[index].classList.add('active');
    await new Promise(resolve => setTimeout(resolve, 800));
    tiles[index].classList.remove('active');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  this.addMemoryInputListeners();
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
  const baseLength = 3;
  const difficultyLevel = Math.floor(this.score / 50);
  const patternLength = Math.min(baseLength + difficultyLevel, 8); // Max 8 steps
  
  const pattern = [];
  let previousTile = -1;
  
  while (pattern.length < patternLength) {
    const newTile = Math.floor(Math.random() * 16);
    if (newTile !== previousTile) {
      pattern.push(newTile);
      previousTile = newTile;
    }
  }
  return pattern;
}

async showMemoryPattern() {
  const tiles = document.querySelectorAll('.memory-tile');
  this.removeMemoryInputListeners(); // Ensure listeners are off during pattern display
  
  // Clear any existing active states
  tiles.forEach(tile => tile.classList.remove('active'));
  
  // Show pattern with clear timing
  for (const index of this.memoryPattern) {
    tiles[index].classList.add('active');
    await new Promise(resolve => setTimeout(resolve, 800));
    tiles[index].classList.remove('active');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Reset user input and enable interaction
  this.userInput = [];
  this.addMemoryInputListeners();
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

handleMemoryClick(e) {
  if (this.isShowingPattern) return;
  
  const clickedTile = e.target.closest('.memory-tile');
  clickedTile.classList.add('active');
  
  if (this.memoryPattern.includes(tileIndex)) {
    if (!this.userInput.includes(tileIndex)) {
      this.userInput.push(tileIndex);
      clickedTile.classList.add('correct');
    }
    
    if (this.userInput.length === this.memoryPattern.length) {
      // Success
      this.updateScore(25);
      this.newMemoryGame();
    }
  } else {
    // Handle wrong answer
    clickedTile.classList.add('incorrect');
    this.loseLife();
  }
  
  setTimeout(() => {
    clickedTile.classList.remove('correct', 'incorrect');
  }, 500);
}

async showSuccessFeedback() {
  await Promise.all(
    [...document.querySelectorAll('.memory-tile')].map((tile, i) => 
      new Promise(resolve => {
        if (this.memoryPattern.includes(parseInt(tile.dataset.value))) {
          setTimeout(() => {
            tile.classList.add('correct');
            resolve();
          }, i * 50);
        }
      })
  ));
  
  await new Promise(resolve => setTimeout(resolve, 500));
  document.querySelectorAll('.memory-tile').forEach(t => t.classList.remove('correct'));
}

async showErrorFeedback() {
  document.querySelectorAll('.memory-tile').forEach(tile => {
    if (this.memoryPattern.includes(parseInt(tile.dataset.value))) {
      tile.classList.add('correct');
    }
  });
  await new Promise(resolve => setTimeout(resolve, 1000));
  document.querySelectorAll('.memory-tile').forEach(t => t.classList.remove('correct'));
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
    document.querySelector('.math-input').value = ''; // Clear input on new problem
    document.querySelector('.math-input').focus();
  }

  checkMathAnswer() {
    const inputField = document.querySelector('.math-input');
    const userAnswer = parseFloat(inputField.value);
    if (isNaN(userAnswer)) return;

    if (userAnswer === this.currentAnswer) {
        this.mathCorrect++; // Increment correct answers
        this.mathPoints += 10; // Award points
        this.streak++; // Increase streak
    } else {
        this.mathWrong++; // Increment wrong answers
        this.loseLife(); // Deduct a life
        this.streak = 0; // Reset streak
    }

    inputField.value = '';
    this.newMathProblem(); // Load new problem
    inputField.focus(); // Ensure input stays focused
    this.updateMathProgress(); // Update UI
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
  // ================= CHIMP TEST =================
  startChimpTest() {
  this.chimpInput = [];
  this.chimpSequence = this.generateChimpSequence();
  this.createChimpGrid();
  this.showChimpNumbers();
  document.getElementById('start-chimp-test').style.display = 'none';
}
  createChimpGrid() {
    const container = document.querySelector('.chimp-container');
    container.innerHTML = '';
    
    // Create 5x5 grid
    for (let i = 0; i < 25; i++) {
      const tile = document.createElement('div');
      tile.className = 'chimp-tile';
      container.appendChild(tile);
    }
  }
  generateChimpSequence() {
    const sequence = [];
    const count = this.chimpLevel + 2;
    const indexes = new Set();
    
    while (indexes.size < count) {
      indexes.add(Math.floor(Math.random() * 25));
    }
    
    return Array.from(indexes).map((index, i) => ({
      number: i + 1,
      index: index
    }));
  }
  
  async showChimpNumbers() {
    const tiles = document.querySelectorAll('.chimp-tile');
    
    // Show numbers in random tiles
    this.chimpSequence.forEach(({ index, number }) => {
      tiles[index].textContent = number;
      tiles[index].classList.add('active');
    });
  
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Hide numbers but keep tiles visible
    tiles.forEach(tile => {
      tile.textContent = '';
      tile.classList.remove('active');
    });
    
    this.addChimpListeners();
  }
  
  addChimpListeners() {
    this.chimpClickHandler = (e) => this.handleChimpClick(e);
    document.querySelector('.chimp-container').addEventListener('click', this.chimpClickHandler);
  }
  
  handleChimpClick(e) {
    const tile = e.target.closest('.chimp-tile');
    if (!tile || !tile.textContent) return;
  
    const clickedNumber = parseInt(tile.textContent);
    const expectedNumber = this.chimpSequence[this.chimpInput.length].number;
  
    if (clickedNumber === expectedNumber) {
      tile.classList.add('correct');
      this.chimpInput.push(clickedNumber);
      
      if (this.chimpInput.length === this.chimpSequence.length) {
        this.chimpLevel++;
        this.updateScore(50 * this.chimpLevel);
        this.startChimpTest();
      }
    } else {
      tile.classList.add('incorrect');
      this.loseLife();
      setTimeout(() => {
        tile.classList.remove('incorrect');
        if (this.lives.chimp > 0) {
          this.startChimpTest();
        } else {
          this.showChimpResults();
        }
      }, 1000);
    }
  }
  
  showChimpResults() {
    const modal = document.getElementById('chimpResultModal');
    document.getElementById('chimpResultText').textContent = 
      `🏆 Level Reached: ${this.chimpLevel}\n🔥 Points Earned: ${50 * this.chimpLevel}`;
    modal.style.display = 'flex';
  }
  
  closeChimpModal() {
    document.getElementById('chimpResultModal').style.display = 'none';
    this.chimpLevel = 1;
    this.visualInput = [];
  }

  // ================= VISUAL MEMORY =================
  newVisualGame() {
    const grid = document.querySelector('.visual-grid');
    grid.innerHTML = '';
    
    // Create 5x5 grid
    for (let i = 0; i < 25; i++) {
      const tile = document.createElement('div');
      tile.className = 'visual-tile';
      grid.appendChild(tile);
    }
  
    this.visualPattern = this.generateVisualPattern();
    this.visualInput = [];
    this.showVisualPattern();
  }

  generateVisualPattern() {
    const pattern = [];
    const count = 3 + Math.floor(this.score / 100);
    // Change tiles.length to 25 since we have 5x5 grid
    while (pattern.length < count) {
      const randomIndex = Math.floor(Math.random() * 25);
      if (!pattern.includes(randomIndex)) pattern.push(randomIndex);
    }
    return pattern;
  }

  async showVisualPattern() {
    const tiles = document.querySelectorAll('.visual-tile');
    
    // Show pattern with animation
    for (const index of this.visualPattern) {
      await new Promise(resolve => {
        tiles[index].classList.add('active');
        setTimeout(() => {
          tiles[index].classList.remove('active');
          resolve();
        }, 1000);
      });
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    this.addVisualListeners();
  }

addVisualListeners() {
  this.visualClickHandler = (e) => this.handleVisualClick(e);
  document.querySelectorAll('.visual-tile').forEach(tile => {
    tile.addEventListener('click', this.visualClickHandler);
  });
}
updateVisualProgress(isCorrect = true) {
  const bubbles = document.querySelectorAll('#visual-mode .progress-bubble');
  const index = this.visualInput.length;
  if (index < bubbles.length) {
    bubbles[index].classList.add(isCorrect ? 'correct' : 'incorrect');
  }
}
handleVisualClick(e) {
  const clickedTile = e.target.closest('.visual-tile');
  if (!clickedTile) return;

  const tiles = document.querySelectorAll('.visual-tile');
  const tileIndex = Array.from(tiles).indexOf(clickedTile);
  const expectedIndex = this.visualPattern[this.visualInput.length];

  // Correct tile in correct order
  if (tileIndex === expectedIndex) {
    clickedTile.classList.add('correct');
    clickedTile.style.pointerEvents = 'none';
    this.visualInput.push(tileIndex);

    // Update progress bubbles
    this.updateVisualProgress(true);

    // Check if pattern is complete
    if (this.visualInput.length === this.visualPattern.length) {
      // Calculate points based on pattern length and streak
      const pointsEarned = 50 + (this.visualPattern.length * 10);
      this.updateScore(pointsEarned);
      
      // Success animation
      tiles.forEach(tile => {
        tile.classList.add('correct');
        setTimeout(() => tile.classList.remove('correct'), 500);
      });
      
      setTimeout(() => this.newVisualGame(), 1000);
    }
    document.getElementById('visual-correct').textContent = this.visualInput.length;
  document.getElementById('visual-streak').textContent = this.visualInput.length;
  document.getElementById('visual-points').textContent = this.score;
  } 
  // Wrong tile or wrong order
  else {
    // Visual feedback
    clickedTile.classList.add('incorrect');
    setTimeout(() => clickedTile.classList.remove('incorrect'), 500);

    // Update progress bubbles
    this.updateVisualProgress(false);

    // Deduct life
    this.loseLife();

    // Reset if lives remain
    if (this.lives.visual > 0) {
      setTimeout(() => this.newVisualGame(), 1000);
    } else {
      this.showVisualResults();
    }
    document.getElementById('visual-streak').textContent = '0';
  }
}

showVisualResults() {
  const modal = document.getElementById('visualResultModal');
  document.getElementById('visualResultText').textContent = 
    `🏆 Correct Matches: ${this.visualInput.length}\n🔥 Points Earned: ${this.visualInput.length * 25}`;
  modal.style.display = 'flex';
}

closeVisualModal() {
  document.getElementById('visualResultModal').style.display = 'none';
  this.newVisualGame();
}
  // ================= CORE FUNCTIONS =================
  updateScore(points) {
    this.score += points;
    document.getElementById('score').textContent = this.score;
    this.updateRank();
  }

  loseLife() {
    const currentMode = this.currentMode;
    this.lives[currentMode] = Math.max(0, this.lives[currentMode] - 1);
    document.getElementById('lives').textContent = this.lives[currentMode];

    if (this.lives[currentMode] === 0) {
      switch (currentMode) {
        case 'math':
          this.showMathResults();
          break;
        case 'memory':
          this.showGameOverStats();
          break;
        case 'click':
          // Add click game over handling if needed
          break;
        case 'reaction':
          // Add reaction game over handling if needed
          break;
      }
    }
  }

  showGameOverStats() {
    const modal = document.getElementById('memory-stats-modal');
    const content = document.getElementById('memoryStatsContent');
    
    content.innerHTML = `
      <h2 style="color: var(--accent); text-align: center; margin-bottom: 1.5rem;">Game Over</h2>
      <div class="memory-stats-grid">
        <div>Final Score:</div><div>${this.score}</div>
        <div>Longest Pattern:</div><div>${this.memoryStats.longestPattern}</div>
        <div>Correct Patterns:</div><div>${this.memoryStats.correctPatterns}</div>
        <div>Current Streak:</div><div>${this.memoryStats.currentStreak}</div>
        <div>Total Games:</div><div>${this.memoryStats.totalGames}</div>
        <div>Accuracy:</div><div>${this.memoryStats.totalGames > 0 
          ? Math.round((this.memoryStats.correctPatterns / this.memoryStats.totalGames) * 100) 
          : 0}%</div>
      </div>
      <button id="restartMemoryGame" 
              style="margin-top: 1.5rem; padding: 0.8rem; width: 100%; 
                     background: var(--secondary); color: var(--text);
                     border: none; border-radius: 8px; cursor: pointer;
                     transition: all 0.2s ease;">
        Play Again
      </button>
    `;
    
    modal.style.display = 'flex';
    
    // Add event listener for the restart button
    document.getElementById('restartMemoryGame').addEventListener('click', () => {
      this.resetGame();
      modal.style.display = 'none';
    });
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
    let percentile = 100;
    
    for (let i = 0; i < benchmarks.length; i++) {
      if (value > benchmarks[i]) {
        percentile = 100 - ((i + 1) * 15);
        break;
      }
    }
    
    this.createChart(mode, percentile);
  }

  createChart(mode, percentile) {
    const ctx = document.getElementById('percentileChart');
    
    // Destroy previous chart if it exists
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  
    const modeLabels = {
      reaction: 'Reaction Time (ms)',
      click: 'Click Speed (CPS)',
      memory: 'Memory Pattern Length',
      math: 'Math Problems Solved',
      chimp: 'Chimp Test Level',
      visual: 'Visual Pattern Length'
    };
  
    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [modeLabels[mode]],
        datasets: [{
          label: `Your Performance (Top ${percentile}%)`,
          data: [percentile],
          backgroundColor: 'rgba(100, 255, 218, 0.7)',
          borderColor: 'var(--accent)',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: 'var(--text)',
              callback: (value) => value + '%',
              font: {
                family: "'Fira Code', monospace",
                size: 12
              }
            },
            grid: {
              color: 'rgba(204, 214, 246, 0.1)'
            }
          },
          y: {
            ticks: {
              color: 'var(--text)',
              font: {
                family: "'Fira Code', monospace",
                size: 14
              }
            },
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Top ${context.raw}% of players`;
              }
            },
            bodyFont: {
              family: "'Fira Code', monospace"
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  }
}

const game = new DieterBench();
