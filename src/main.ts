const IS_DEV_MODE = true
const MS_PER_UPDATE = 1000 / 60

class GameBoard {
    grid: number[][]
    rows: number
    cols: number
    cellWidth: number
    canvasId: string
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    activeShape: Shape
    keyMap = {
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

        this.activeShape = new Shape([
            [0, 0, 0],
            [0, 1, 1],
            [1, 1, 0],
        ])

        this.registerControl()
    }

    registerControl() {
        document.addEventListener('keydown', (event) => {
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
                case 'Space':
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
        console.log('updateGame')
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
    }

    hasCollision(direction: 'left' | 'down' | 'right' | 'rotate') {
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

        for (let row = 0; row < projectedMatrix.length; row++) {
            for (let col = 0; col < projectedMatrix[0].length; col++) {
                if (projectedMatrix[row][col] === 0) continue

                if (
                    this.grid[projectedAnchor.row + row]?.[
                        projectedAnchor.col + col
                    ] !== 0
                )
                    return true
            }
        }

        return false
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
        this.context.strokeStyle = 'gray'
        this.context.lineWidth = 1
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.grid[row][col]) {
                    this.context.strokeRect(
                        col * this.cellWidth,
                        row * this.cellWidth,
                        this.cellWidth,
                        this.cellWidth
                    )
                }
            }
        }

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
        this.context.fillStyle = 'black'
        for (let i = 0; i < this.activeShape.matrix.length; i++) {
            for (let j = 0; j < this.activeShape.matrix[i].length; j++) {
                if (this.activeShape.matrix[i][j]) {
                    fillCell(
                        this.context,
                        this.activeShape.anchor.row + i,
                        this.activeShape.anchor.col + j,
                        this.cellWidth
                    )
                }
            }
        }

        if (IS_DEV_MODE) {
            this.context.fillStyle = 'red'
            this.context.fillRect(
                this.activeShape.anchor.col * this.cellWidth + this.cellWidth / 4,
                this.activeShape.anchor.row * this.cellWidth + this.cellWidth / 4,
                15,
                15
            )
        }
    }
}

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

function fillCell(context: CanvasRenderingContext2D, row: number, col: number, cellWidth: number) {
    context.fillRect(
        col * cellWidth,
        row * cellWidth,
        cellWidth,
        cellWidth
    )
}

const gameBoard = new GameBoard({
    rows: 24,
    cols: 10,
    cellWidth: 30,
    canvasId: 'canvas',
})

gameBoard.run()
