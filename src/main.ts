const GRID_LENGTH = 30
const ROWS = 24
const COLS = 10
const CANVAS_HEIGHT = GRID_LENGTH * ROWS
const CANVAS_WIDTH = GRID_LENGTH * COLS

const IS_DEV_MODE = true

const MS_PER_UPDATE = 1000 / 60

const grid = Array.from({ length: ROWS }).map(() =>
    Array.from({ length: COLS }).map(() => 0)
)

const canvas = document.getElementById('canvas') as HTMLCanvasElement
canvas.width = CANVAS_WIDTH
canvas.height = CANVAS_HEIGHT
const context = canvas.getContext('2d')

class Shape {
    matrix: number[][]
    anchor: {
        row: number
        col: number
    } = {
        row: 0,
        col: 0,
    }

    constructor(matrix: number[][]) {
        this.matrix = matrix
    }

    rotate() {
        this.matrix = getRotatedMatrix(this.matrix)
    }
}

function getRotatedMatrix(matrix: number[][]): number[][] {
    // Transpose
    const rowCount = matrix[0].length
    const result: number[][] = Array.from({ length: rowCount }).map(() => [])
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            result[j].push(matrix[i][j])
        }
    }

    // Reverse
    for (let i = 0; i < result.length; i++) {
        result[i].reverse()
    }

    return result
}

function hasCollision(
    shape: Shape,
    direction: 'left' | 'down' | 'right' | 'rotate'
): boolean {
    let projectedMatrix = shape.matrix
    let projectedAnchor = shape.anchor

    switch (direction) {
        case 'left':
            projectedAnchor = {
                row: shape.anchor.row,
                col: shape.anchor.col - 1,
            }
            break
        case 'down':
            projectedAnchor = {
                row: shape.anchor.row + 1,
                col: shape.anchor.col,
            }
            break
        case 'right':
            projectedAnchor = {
                row: shape.anchor.row,
                col: shape.anchor.col + 1,
            }
            break
        case 'rotate':
            projectedMatrix = getRotatedMatrix(projectedMatrix)
            break
    }

    for (let row = 0; row < projectedMatrix.length; row++) {
        for (let col = 0; col < projectedMatrix[0].length; col++) {
            if (projectedMatrix[row][col] === 0) continue

            if (
                grid[projectedAnchor.row + row]?.[projectedAnchor.col + col] !==
                0
            )
                return true
        }
    }

    return false
}

const myShape = new Shape([
    [0, 0, 0],
    [0, 1, 1],
    [1, 1, 0],
])

const keyMap = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
}

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            keyMap.up = true
            break
        case 'ArrowDown':
            keyMap.down = true
            break
        case 'ArrowLeft':
            keyMap.left = true
            break
        case 'ArrowRight':
            keyMap.right = true
            break
        case 'Space':
            keyMap.space = true
            break
    }
})

document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            keyMap.up = false
            break
        case 'ArrowDown':
            keyMap.down = false
            break
        case 'ArrowLeft':
            keyMap.left = false
            break
        case 'ArrowRight':
            keyMap.right = false
            break
        case 'Space':
            keyMap.space = false
            break
    }
})

function run() {
    let previous = 0
    let lag = 0
    function loop() {
        const current = performance.now()
        lag += current - previous
        previous = current

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

function updateGame() {
    if (keyMap.left && !hasCollision(myShape, 'left')) {
        myShape.anchor.col -= 1
        keyMap.left = false
    }
    if (keyMap.right && !hasCollision(myShape, 'right')) {
        myShape.anchor.col += 1
        keyMap.right = false
    }
    if (keyMap.up && !hasCollision(myShape, 'rotate')) {
        myShape.rotate()
        keyMap.up = false
    }
    if (keyMap.down && !hasCollision(myShape, 'down')) {
        myShape.anchor.row += 1
        keyMap.down = false
    }
}

function render() {
    if (!context) {
        return
    }

    clearBoard(context)
    renderShape(context, myShape)
    renderBoard(context)
}

function clearBoard(context: CanvasRenderingContext2D) {
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
}

function renderBoard(context: CanvasRenderingContext2D) {
    context.strokeStyle = 'gray'
    context.lineWidth = 1
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (!grid[row][col]) {
                context.strokeRect(
                    col * GRID_LENGTH,
                    row * GRID_LENGTH,
                    GRID_LENGTH,
                    GRID_LENGTH
                )
            }
        }
    }

    if (IS_DEV_MODE) {
        for (let row = 0; row < ROWS + 1; row++) {
            context.font = '16px san-serif'
            context.fillStyle = 'gray'
            context.textAlign = 'center'
            context.fillText(
                String(row - 1),
                GRID_LENGTH / 2,
                row * GRID_LENGTH - GRID_LENGTH / 3
            )
        }
        for (let col = 2; col < COLS + 1; col++) {
            context.font = '16px san-serif'
            context.fillStyle = 'gray'
            context.textAlign = 'center'
            context.fillText(
                String(col - 1),
                col * GRID_LENGTH - GRID_LENGTH / 2,
                GRID_LENGTH / 1.5
            )
        }
    }
}

function renderShape(context: CanvasRenderingContext2D, shape: Shape) {
    context.fillStyle = 'black'
    for (let i = 0; i < shape.matrix.length; i++) {
        for (let j = 0; j < shape.matrix[i].length; j++) {
            if (shape.matrix[i][j]) {
                fillGrid(context, shape.anchor.row + i, shape.anchor.col + j)
            }
        }
    }

    if (IS_DEV_MODE) {
        context.fillStyle = 'red'
        context.fillRect(
            shape.anchor.col * GRID_LENGTH + GRID_LENGTH / 4,
            shape.anchor.row * GRID_LENGTH + GRID_LENGTH / 4,
            15,
            15
        )
    }
}

function fillGrid(context: CanvasRenderingContext2D, row: number, col: number) {
    context.fillRect(
        col * GRID_LENGTH,
        row * GRID_LENGTH,
        GRID_LENGTH,
        GRID_LENGTH
    )
}

run()
