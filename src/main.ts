const IS_DEV_MODE = true
const MS_PER_UPDATE = 1000 / 60

type Color =
    | 'red'
    | 'cyan'
    | 'yellow'
    | 'purple'
    | 'green'
    | 'blue'
    | 'orange'
    | 'grey'
type Cell = 0 | Color
type Matrix = Cell[][]

function createShapeType(matrix: number[][], color: Color): Matrix {
    const newMatrix: Matrix = Array.from({ length: matrix.length }).map(() =>
        Array.from({ length: matrix[0].length }).map(() => 0)
    )

    forEachCell(matrix, (cell, row, col) => {
        if (cell) {
            newMatrix[row][col] = color
        }
    })

    return newMatrix
}

const shapeMatrices: Matrix[] = [
    createShapeType(
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        'cyan'
    ),
    createShapeType(
        [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        'blue'
    ),
    createShapeType(
        [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0],
        ],
        'orange'
    ),
    createShapeType(
        [
            [1, 1],
            [1, 1],
        ],
        'yellow'
    ),
    createShapeType(
        [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0],
        ],
        'green'
    ),
    createShapeType(
        [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        'purple'
    ),

    createShapeType(
        [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
        ],
        'red'
    ),
]

function generateNewShape(): Shape {
    const matrix =
        shapeMatrices[Math.floor(Math.random() * shapeMatrices.length)]
    return new Shape(matrix)
}

class GameBoard {
    private downTimer = 0

    grid: Matrix
    rows: number
    cols: number
    cellWidth: number
    canvasId: string
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    activeShape: Shape
    gameSpeed: number = 1000
    keyMap: {
        [key: string]: boolean
    } = {
        up: false,
        down: false,
        left: false,
        right: false,
        space: false,
    }

    constructor(options: {
        rows: number
        cols: number
        cellWidth: number
        canvasId: string
    }) {
        this.rows = options.rows
        this.cols = options.cols
        this.cellWidth = options.cellWidth

        this.grid = Array.from({ length: this.rows }).map(() =>
            Array.from({ length: this.cols }).map(() => 0)
        )

        this.canvasId = options.canvasId
        this.canvas = document.getElementById(
            this.canvasId
        ) as HTMLCanvasElement

        if (!this.canvas) {
            throw new Error('Canvas not found')
        }

        const context = this.canvas.getContext('2d')
        if (context) {
            this.context = context
        } else {
            throw new Error('Canvas context not found')
        }

        this.canvas.width = this.cellWidth * this.cols
        this.canvas.height = this.cellWidth * this.rows

        this.activeShape = generateNewShape()

        this.registerControl()
        this.downTimer = performance.now()
    }

    registerControl() {
        document.addEventListener('keydown', (event) => {
            console.log(event.key.length)
            switch (event.key) {
                case 'ArrowUp':
                    this.keyMap.up = true
                    break
                case 'ArrowDown':
                    this.keyMap.down = true
                    break
                case 'ArrowLeft':
                    this.keyMap.left = true
                    break
                case 'ArrowRight':
                    this.keyMap.right = true
                    break
                case ' ':
                    this.keyMap.space = true
                    break
            }
        })

        document.addEventListener('keyup', (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    this.keyMap.up = false
                    break
                case 'ArrowDown':
                    this.keyMap.down = false
                    break
                case 'ArrowLeft':
                    this.keyMap.left = false
                    break
                case 'ArrowRight':
                    this.keyMap.right = false
                    break
                case 'Space':
                    this.keyMap.space = false
                    break
            }
        })
    }

    run() {
        let previous = 0
        let lag = 0
        const loop = () => {
            const current = performance.now()
            lag += current - previous
            previous = current

            // Update game logic
            while (lag >= MS_PER_UPDATE) {
                this.updateGame()
                lag -= MS_PER_UPDATE
            }

            // Render
            this.render()

            requestAnimationFrame(loop)
        }

        loop()
    }

    updateGame() {
        if (this.keyMap.left && !this.hasCollision('left')) {
            this.activeShape.anchor.col -= 1
            this.keyMap.left = false
        }
        if (this.keyMap.right && !this.hasCollision('right')) {
            this.activeShape.anchor.col += 1
            this.keyMap.right = false
        }
        if (this.keyMap.up && !this.hasCollision('rotate')) {
            this.activeShape.rotate()
            this.keyMap.up = false
        }
        if (this.keyMap.down && !this.hasCollision('down')) {
            this.activeShape.anchor.row += 1
            this.keyMap.down = false
        }
        if (this.keyMap.space) {
            console.log('trying to space')
            while (!this.hasCollision('down')) {
                this.activeShape.anchor.row += 1
            }
            this.keyMap.space = false
            this.downTimer = -this.gameSpeed // Run down clock immediately
        }

        Object.keys((key: string) => {
            this.keyMap[key] = false
        })

        if (performance.now() - this.downTimer > this.gameSpeed) {
            if (this.hasCollision('down')) {
                this.storeShape()
                this.clearRows()
                this.activeShape = generateNewShape()
            } else {
                this.activeShape.anchor.row += 1
            }

            this.downTimer = performance.now()
        }
    }

    hasCollision(direction: 'left' | 'down' | 'right' | 'rotate') {
        let collided = false
        let projectedMatrix = this.activeShape.matrix
        let projectedAnchor = this.activeShape.anchor

        switch (direction) {
            case 'left':
                projectedAnchor = {
                    row: this.activeShape.anchor.row,
                    col: this.activeShape.anchor.col - 1,
                }
                break
            case 'down':
                projectedAnchor = {
                    row: this.activeShape.anchor.row + 1,
                    col: this.activeShape.anchor.col,
                }
                break
            case 'right':
                projectedAnchor = {
                    row: this.activeShape.anchor.row,
                    col: this.activeShape.anchor.col + 1,
                }
                break
            case 'rotate':
                projectedMatrix = getRotatedMatrix(projectedMatrix)
                break
        }

        forEachCell(projectedMatrix, (cell, row, col) => {
            if (
                cell &&
                this.grid[projectedAnchor.row + row]?.[
                    projectedAnchor.col + col
                ] !== 0
            ) {
                collided = true
            }
        })

        return collided
    }

    storeShape() {
        forEachCell(this.activeShape.matrix, (cell, row, col) => {
            if (cell) {
                this.grid[this.activeShape.anchor.row + row][
                    this.activeShape.anchor.col + col
                ] = cell
            }
        })
    }

    clearRows() {
        let toAdd = 0
        for (let row = this.grid.length - 1; row >= 0; row--) {
            if (this.grid[row].every((cell) => cell)) {
                this.grid.splice(row, 1)
                toAdd++
            }
        }
        for (let i = 0; i < toAdd; i++) {
            this.grid.unshift(Array.from({ length: this.cols }).map(() => 0))
        }
    }

    render() {
        this.clearBoard()
        this.renderActiveShape()
        this.renderBoard()
    }

    clearBoard() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    renderBoard() {
        this.context.lineWidth = 1
        forEachCell(this.grid, (cell, row, col) => {
            if (cell) {
                this.context.fillStyle = cell
                this.context.fillRect(
                    col * this.cellWidth,
                    row * this.cellWidth,
                    this.cellWidth,
                    this.cellWidth
                )
            }

            this.context.strokeStyle = 'gray'
            this.context.strokeRect(
                col * this.cellWidth,
                row * this.cellWidth,
                this.cellWidth,
                this.cellWidth
            )
        })

        if (IS_DEV_MODE) {
            for (let row = 0; row < this.rows + 1; row++) {
                this.context.font = '16px san-serif'
                this.context.fillStyle = 'gray'
                this.context.textAlign = 'center'
                this.context.fillText(
                    String(row - 1),
                    this.cellWidth / 2,
                    row * this.cellWidth - this.cellWidth / 3
                )
            }
            for (let col = 2; col < this.cols + 1; col++) {
                this.context.font = '16px san-serif'
                this.context.fillStyle = 'gray'
                this.context.textAlign = 'center'
                this.context.fillText(
                    String(col - 1),
                    col * this.cellWidth - this.cellWidth / 2,
                    this.cellWidth / 1.5
                )
            }
        }
    }

    renderActiveShape() {
        forEachCell(this.activeShape.matrix, (cell, row, col) => {
            if (cell) {
                fillCell(
                    this.context,
                    this.activeShape.anchor.row + row,
                    this.activeShape.anchor.col + col,
                    this.cellWidth,
                    cell
                )
            }
        })

        if (IS_DEV_MODE) {
            this.context.fillStyle = 'red'
            this.context.fillRect(
                this.activeShape.anchor.col * this.cellWidth +
                    this.cellWidth / 4,
                this.activeShape.anchor.row * this.cellWidth +
                    this.cellWidth / 4,
                15,
                15
            )
        }
    }
}

class Shape {
    matrix: Matrix
    anchor: {
        row: number
        col: number
    } = {
        row: 0,
        col: 3,
    }

    constructor(matrix: Matrix) {
        this.matrix = matrix
    }

    rotate() {
        this.matrix = getRotatedMatrix(this.matrix)
    }
}

function getRotatedMatrix(matrix: Matrix): Matrix {
    // Transpose
    const rowCount = matrix[0].length
    const result: Matrix = Array.from({ length: rowCount }).map(() => [])
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

function fillCell(
    context: CanvasRenderingContext2D,
    row: number,
    col: number,
    cellWidth: number,
    color: Color
) {
    context.fillStyle = color
    context.fillRect(col * cellWidth, row * cellWidth, cellWidth, cellWidth)
}

function forEachCell<T>(
    matrix: T[][],
    callback: (value: T, row: number, col: number) => void
) {
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[0].length; col++) {
            callback(matrix[row][col], row, col)
        }
    }
}

const gameBoard = new GameBoard({
    rows: 24,
    cols: 10,
    cellWidth: 30,
    canvasId: 'canvas',
})

gameBoard.run()
