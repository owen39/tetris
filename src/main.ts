const GRID_LENGTH = 30
const ROWS = 24
const COLS = 10
const CANVAS_HEIGHT = GRID_LENGTH * ROWS
const CANVAS_WIDTH = GRID_LENGTH * COLS

const MS_PER_UPDATE = 1000 / 60

const array = Array.from({ length: ROWS }).map(() =>
    Array.from({ length: COLS }).map(() => 0)
)

const canvas = document.getElementById('canvas') as HTMLCanvasElement
canvas.width = CANVAS_WIDTH
canvas.height = CANVAS_HEIGHT
const context = canvas.getContext('2d')

function run() {
    let previous = 0
    let lag = 0
    function loop() {
        const current = performance.now()
        lag += current - previous
        previous = current

        // User input
        processInput()
        // Update game logic
        while (lag >= MS_PER_UPDATE) {
            updateGame()
            lag -= MS_PER_UPDATE
        }

        // Render
        render()

        requestAnimationFrame(loop)
    }

    loop()
}

function processInput() {}

function updateGame() {
    console.log('updating game')
}

function render() {
    if (!context) {
        return
    }

    renderBoard(context)
}

function renderBoard(context: CanvasRenderingContext2D) {
    context.strokeStyle = 'gray'
    context.lineWidth = 1
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (!array[row][col]) {
                context.strokeRect(
                    col * GRID_LENGTH,
                    row * GRID_LENGTH,
                    GRID_LENGTH,
                    GRID_LENGTH
                )
            } else {
                context.fillRect(
                    col * GRID_LENGTH,
                    row * GRID_LENGTH,
                    GRID_LENGTH,
                    GRID_LENGTH
                )
            }
        }
    }
}

run()
