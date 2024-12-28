(() => {
  // src/main.ts
  var GRID_LENGTH = 30;
  var ROWS = 24;
  var COLS = 10;
  var CANVAS_HEIGHT = GRID_LENGTH * ROWS;
  var CANVAS_WIDTH = GRID_LENGTH * COLS;
  var MS_PER_UPDATE = 1e3 / 60;
  var array = Array.from({ length: ROWS }).map(
    () => Array.from({ length: COLS }).map(() => 0)
  );
  var canvas = document.getElementById("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  var context = canvas.getContext("2d");
  function run() {
    let previous = 0;
    let lag = 0;
    function loop() {
      const current = performance.now();
      lag += current - previous;
      previous = current;
      processInput();
      while (lag >= MS_PER_UPDATE) {
        updateGame();
        lag -= MS_PER_UPDATE;
      }
      render();
      requestAnimationFrame(loop);
    }
    loop();
  }
  function processInput() {
  }
  function updateGame() {
    console.log("updating game");
  }
  function render() {
    if (!context) {
      return;
    }
    renderBoard(context);
  }
  function renderBoard(context2) {
    context2.strokeStyle = "gray";
    context2.lineWidth = 1;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (!array[row][col]) {
          context2.strokeRect(
            col * GRID_LENGTH,
            row * GRID_LENGTH,
            GRID_LENGTH,
            GRID_LENGTH
          );
        } else {
          context2.fillRect(
            col * GRID_LENGTH,
            row * GRID_LENGTH,
            GRID_LENGTH,
            GRID_LENGTH
          );
        }
      }
    }
  }
  run();
})();
