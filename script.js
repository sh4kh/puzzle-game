class Game {
  constructor(size) {
    this.size = size;
    this.length = size * size;
    this.wrapper = document.getElementById('game');
    this.matrix = Array(this.size).fill().map(
      () => Array(this.size).fill(),
    );
    this.array = Array(this.length).fill().map((item, index) => index + 1);
    this.moves = 0;
    this.time = {
      seconds: 0,
      minutes: 0,
    };
    this.interval;
    this.isStopped = false;
    this.results5 = [];
    this.results4 = [];
    this.results3 = [];
    this.results = {
      3: [],
      4: [],
      5: [],
    }
  }

  
  //Формируем игровое поле
  build() {
    
    for (let i = 0; i < this.length; i++) {
      const cell = document.createElement('button');
      cell.classList.add('item');
      cell.classList.add(`item-${this.size}`);
      cell.setAttribute('data-value', `${i + 1}`);
      cell.textContent = i + 1;
      this.wrapper.append(cell);
    }
    //Если есть сохраненная игра, то достаем ее из localstorage, иначе строим новое игровое поле
    if (localStorage.getItem('matrix')) {
      this.matrix = JSON.parse(localStorage.getItem('matrix'));
      this.time = JSON.parse(localStorage.getItem('time'));
      this.moves = JSON.parse(localStorage.getItem('moves'));
      this.interval = setInterval(this.startTimer.bind(this), 1000);
    } else {
      this.matrix = this.getMatrix(this.array);
      this.moves = 0;
    }
    //Позиционируем клетки в игровом поле
    this.setPositions(this.matrix);

    //Делаем последнюю клетку "пустой"
    const nodes = this.getNodes();
    nodes[this.length - 1].style.display = 'none';
    this.wrapper.classList.add('start-view');
    this.changeMoves();

    if (this.getResult(this.size)) {
      this.results[this.size] = this.getResult(this.size);
      this.addResultOnPage(this.results[this.size]);
    } else {
      const resultsList = document.getElementById('results-list');
      resultsList.innerHTML = '';
    }
    
  }

  shuffle(matrix) {
    this.wrapper.classList.remove('start-view');
    //Делаем из матрицы массив и перемешиваем его, затем делаем из перемешанного массива матрицу и меняем позиции клеток
    const arrayFromMatrix = matrix.flat();
    shuffleArray(arrayFromMatrix);
    this.matrix = this.getMatrix(arrayFromMatrix);
    this.setPositions(this.matrix);

    //Сброс параметров
    this.isStopped = false;
    document.getElementById('stop').classList.remove('stopped');
    this.wrapper.classList.remove('won');
    this.removeFromStorage();
    this.moves = 0;
    this.changeMoves();
    this.time = {
      seconds: 0,
      minutes: 0
    }
    clearInterval(this.interval);
    this.interval = setInterval(this.startTimer.bind(this), 1000);
    
    //Функция для перемешивания массива
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];
      }
    }
  }

  // Смена позиции по клику
  changePosition(event) {

    if (this.isStopped) {
      clearInterval(this.interval);
      this.interval = setInterval(this.startTimer.bind(this), 1000);
      this.isStopped = false;
      document.getElementById('stop').classList.remove('stopped');
    }
    
    const blankNumber = this.length;
    const buttonNode = event.target.closest('button');

    if (!buttonNode) return;

    const buttonNumber = Number(buttonNode.dataset.value);
    const buttonCoords = findCoordByNumber(buttonNumber, this.matrix);
    const blankCoords = findCoordByNumber(blankNumber, this.matrix);

    const isValid = isValidForSwap(buttonCoords, blankCoords);

    if (isValid) {
      swap(blankCoords, buttonCoords, this.matrix);
      this.setPositions(this.matrix);
      
      setTimeout(() => {
        if (this.isWon()) {
          alert(`Ты решил пазл за ${this.time.minutes}:${this.time.seconds} и за ${this.moves} шагов!`);
          this.saveResult();
          this.stopTimer();
        } 
      }, 100);
      this.moves++;
      this.changeMoves();
    }

    function findCoordByNumber(number, matrix) {
      for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[0].length; x++) {
          if (matrix[y][x] === number) {
            return { x, y };
          }
        }
      }
      return null;
    }

    function isValidForSwap(coords1, coords2) {
      const diffX = Math.abs(coords1.x - coords2.x);
      const diffY = Math.abs(coords1.y - coords2.y);

      return (diffX === 1 || diffY === 1) && (coords1.x === coords2.x || coords1.y === coords2.y);
    }

    function swap(coords1, coords2, matrix) {
      const coords1Number = matrix[coords1.y][coords1.x];
      matrix[coords1.y][coords1.x] = matrix[coords2.y][coords2.x];
      matrix[coords2.y][coords2.x] = coords1Number;
    }
  }

  //Запус таймера
  startTimer() {
    const secondsElem = document.getElementById('seconds');
    const minutesElem = document.getElementById('minutes');
    
    this.time.seconds++;
    secondsElem.textContent = "0" + this.time.seconds;

    if (this.time.seconds > 9) {
      secondsElem.textContent = this.time.seconds;
    }

    if (this.time.seconds > 59) {
      this.time.minutes++
      minutesElem.textContent = "0" + this.time.minutes;
      this.time.seconds = 0; 
    }
  }

  //Остановка таймера
  stopTimer() {
    clearInterval(this.interval);
    this.isStopped = true;

    document.getElementById('stop').classList.add('stopped');
  }

  //Сброс таймера
  resetTimer() {
    clearInterval(this.interval);
    document.getElementById('seconds').textContent = '00';
    document.getElementById('minutes').textContent = '00';
  }

  //Формируем матрицу из массива
  getMatrix(arr) {
    const matrix = Array(this.size).fill().map(
      () => Array(this.size).fill(),
    );

    let y = 0;
    let x = 0;

    for (let i = 0; i < this.length; i++) {
      if (x >= this.size) {
        y++;
        x = 0;
      }

      matrix[y][x] = arr[i];
      x++;
    }
    return matrix;
  }

  getNodes() {
    return this.wrapper.querySelectorAll('.item');
  }


  setNodeStyles(node, x, y) {
    const shiftPs = 100;
    node.style.transform = `translate3D(${x * shiftPs}%, ${y * shiftPs}%, 0)`;
  }

  setPositions(matrix) {
    const nodes = this.getNodes();

    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[0].length; x++) {
        const value = matrix[y][x];
        const node = nodes[value - 1];

        this.setNodeStyles(node, x, y);
      }
    }
  }

  instantWin() {
    this.matrix = this.getMatrix(this.array);
    this.setPositions(this.matrix);
  }


  isWon() {
    const winFlatMatrix = new Array(this.length).fill(0).map((item, i) => i + 1);
    const flatMatrix = this.matrix.flat();

    for (let i = 0; i < winFlatMatrix.length; i++) {
      if (flatMatrix[i] !== winFlatMatrix[i]) {
        return false;
      }
    }
    this.wrapper.classList.add('won');
    return true;
  }

  changeMoves() {
    const movesStats = document.getElementById('moves');
    movesStats.textContent = this.moves;
  }

  save() {
    localStorage.setItem('time', JSON.stringify(this.time));
    localStorage.setItem('matrix', JSON.stringify(this.matrix));
    localStorage.setItem('moves', this.moves);
    localStorage.setItem('size', this.size);

    const saveBtn = document.getElementById('save');
    saveBtn.classList.toggle('saved');

    setTimeout(() => saveBtn.classList.toggle('saved'), 500);
  }

  removeFromStorage() {
    localStorage.removeItem('matrix');
    localStorage.removeItem('time');
    localStorage.removeItem('moves');
  }

  saveResult() {
    const result = {
      time: {
        secondsText: document.getElementById('seconds').textContent,
        minutesText: document.getElementById('minutes').textContent,
      },
      timeInSeconds: this.time.seconds + this.time.minutes * 60,
    }
    console.log('Result', result);
    if (this.results[this.size].length === 5) {
      if (result.timeInSeconds < this.results[this.size][4].timeInSeconds) {
        console.log('results full');
        
        this.results[this.size].pop();
        this.results[this.size].push(result);
      }
    } else {
      console.log('results not full');
      this.results[this.size].push(result);
    }
    localStorage.setItem(`results${this.size}`, JSON.stringify(this.results[this.size]));
    console.log(`result for size ${this.size} saved`);
  }

  getResult(size) {
    let results =  JSON.parse(localStorage.getItem(`results${size}`));
    if (results) {
      results = results.sort(function(a, b) {
        return  a.timeInSeconds - b.timeInSeconds;
      })
    }
    return results;
  }

  addResultOnPage(results) {
    //Добавляем результат на страницу
    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = '';
    for (let i = 0; i < results.length; i++) {
      const li = document.createElement('li');
      li.textContent = `${results[i].time.minutesText}:${results[i].time.secondsText}`;
      resultsList.append(li);
    }
    console.log('get result');
  }
}

let game;

window.onload = function() {
  
  if (localStorage.getItem('size')) {
    game = new Game(Number(localStorage.getItem('size')));
  } else {
    game = new Game(5);
  }
  game.build();

  document.getElementById('shuffle').addEventListener('click', () => game.shuffle(game.matrix));
  game.wrapper.addEventListener('click', (event) => game.changePosition(event));
  document.getElementById('stop').addEventListener('click',() => game.stopTimer());
  document.getElementById('save').addEventListener('click',() => game.save());
  document.getElementById('results').addEventListener('click', () => { 
    document.getElementById('results-list').parentElement.classList.toggle('results-showed');
  })

  document.getElementById('sizes').addEventListener('click', (event) => {
    const changeSizeButton = event.target.closest('.size');

    if (!changeSizeButton) return;

    document.getElementById('game').innerHTML = '';
  
    game.resetTimer();
  
    game = new Game(Number(changeSizeButton.dataset.size));
    game.removeFromStorage();
    game.wrapper.classList.remove('won');
    game.build();
});
}

window.onbeforeunload = function() {
	return true;
};









