// Web Maze Game
class MazeGame {
    constructor() {
        this.level = 1;
        this.timeLeft = 30;
        this.timerInterval = null;
        this.gameActive = false;
        this.player = { x: 0, y: 0 };
        this.maze = [];
        this.mazeSize = 8; // Starting size

        this.mazeContainer = document.getElementById('maze-container');
        this.levelDisplay = document.getElementById('level');
        this.timerDisplay = document.getElementById('timer');
        this.messageDisplay = document.getElementById('message');
        this.startBtn = document.getElementById('start-btn');

        this.initControls();
    }

    initControls() {
        this.startBtn.addEventListener('click', () => this.startGame());

        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;

            const key = e.key;
            let newX = this.player.x;
            let newY = this.player.y;

            if (key === 'ArrowUp') newY--;
            else if (key === 'ArrowDown') newY++;
            else if (key === 'ArrowLeft') newX--;
            else if (key === 'ArrowRight') newX++;
            else return;

            e.preventDefault();
            this.movePlayer(newX, newY);
        });
    }

    startGame() {
        this.level = 1;
        this.mazeSize = 8;
        this.startLevel();
    }

    startLevel() {
        this.timeLeft = 30;
        this.gameActive = true;
        this.messageDisplay.textContent = '';
        this.messageDisplay.className = 'message';
        this.startBtn.disabled = true;

        this.generateMaze();
        this.renderMaze();
        this.startTimer();

        this.levelDisplay.textContent = this.level;
    }

    generateMaze() {
        const size = this.mazeSize;
        // Initialize maze with all walls
        this.maze = Array(size).fill(null).map(() => Array(size).fill(1));

        // Starting position
        this.player = { x: 0, y: 0 };
        this.exit = { x: size - 1, y: size - 1 };

        // Carve paths using randomized DFS
        const stack = [[0, 0]];
        this.maze[0][0] = 0;

        const directions = [
            [0, -2], [0, 2], [-2, 0], [2, 0]
        ];

        while (stack.length > 0) {
            const [x, y] = stack[stack.length - 1];

            // Shuffle directions
            const shuffled = directions.sort(() => Math.random() - 0.5);
            let moved = false;

            for (const [dx, dy] of shuffled) {
                const newX = x + dx;
                const newY = y + dy;

                if (newX >= 0 && newX < size && newY >= 0 && newY < size && this.maze[newY][newX] === 1) {
                    this.maze[newY][newX] = 0;
                    this.maze[y + dy/2][x + dx/2] = 0;
                    stack.push([newX, newY]);
                    moved = true;
                    break;
                }
            }

            if (!moved) {
                stack.pop();
            }
        }

        // Ensure exit is accessible
        this.maze[size - 1][size - 1] = 0;

        // Verify exit is reachable, if not, carve a path
        if (!this.isExitReachable()) {
            this.carvePathToExit();
        }
    }

    isExitReachable() {
        // Use BFS to check if exit is reachable from start
        const size = this.mazeSize;
        const visited = Array(size).fill(null).map(() => Array(size).fill(false));
        const queue = [[0, 0]];
        visited[0][0] = true;

        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        while (queue.length > 0) {
            const [x, y] = queue.shift();

            if (x === this.exit.x && y === this.exit.y) {
                return true; // Exit is reachable!
            }

            for (const [dx, dy] of directions) {
                const newX = x + dx;
                const newY = y + dy;

                if (newX >= 0 && newX < size && newY >= 0 && newY < size &&
                    !visited[newY][newX] && this.maze[newY][newX] === 0) {
                    visited[newY][newX] = true;
                    queue.push([newX, newY]);
                }
            }
        }

        return false; // Exit not reachable
    }

    carvePathToExit() {
        // Carve a simple path from start to exit using BFS to find shortest path
        const size = this.mazeSize;
        const visited = Array(size).fill(null).map(() => Array(size).fill(false));
        const parent = Array(size).fill(null).map(() => Array(size).fill(null));
        const queue = [[0, 0]];
        visited[0][0] = true;

        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        // BFS to find any path (ignoring walls temporarily)
        while (queue.length > 0) {
            const [x, y] = queue.shift();

            if (x === this.exit.x && y === this.exit.y) {
                // Backtrack and carve path
                let current = [x, y];
                while (current !== null) {
                    const [cx, cy] = current;
                    this.maze[cy][cx] = 0; // Carve path
                    current = parent[cy][cx];
                }
                return;
            }

            for (const [dx, dy] of directions) {
                const newX = x + dx;
                const newY = y + dy;

                if (newX >= 0 && newX < size && newY >= 0 && newY < size &&
                    !visited[newY][newX]) {
                    visited[newY][newX] = true;
                    parent[newY][newX] = [x, y];
                    queue.push([newX, newY]);
                }
            }
        }
    }

    renderMaze() {
        this.mazeContainer.innerHTML = '';
        const mazeDiv = document.createElement('div');
        mazeDiv.className = 'maze';
        mazeDiv.style.gridTemplateColumns = `repeat(${this.mazeSize}, 30px)`;

        for (let y = 0; y < this.mazeSize; y++) {
            for (let x = 0; x < this.mazeSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;

                if (this.maze[y][x] === 1) {
                    cell.classList.add('wall');
                } else {
                    cell.classList.add('path');
                }

                if (x === this.player.x && y === this.player.y) {
                    cell.classList.add('player');
                }

                if (x === this.exit.x && y === this.exit.y) {
                    cell.classList.add('exit');
                }

                mazeDiv.appendChild(cell);
            }
        }

        this.mazeContainer.appendChild(mazeDiv);
    }

    movePlayer(newX, newY) {
        // Check bounds
        if (newX < 0 || newX >= this.mazeSize || newY < 0 || newY >= this.mazeSize) {
            return;
        }

        // Check if not a wall
        if (this.maze[newY][newX] === 1) {
            return;
        }

        // Update player position
        this.player.x = newX;
        this.player.y = newY;

        this.renderMaze();

        // Check if reached exit
        if (newX === this.exit.x && newY === this.exit.y) {
            this.winLevel();
        }
    }

    startTimer() {
        this.timerDisplay.textContent = this.timeLeft;

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.timerDisplay.textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                this.loseGame();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    winLevel() {
        this.gameActive = false;
        this.stopTimer();

        this.messageDisplay.textContent = `Level ${this.level} Complete! 🎉`;
        this.messageDisplay.className = 'message win';

        this.level++;
        this.mazeSize = Math.min(8 + Math.floor(this.level / 2), 20); // Increase difficulty

        setTimeout(() => {
            this.startLevel();
        }, 2000);
    }

    loseGame() {
        this.gameActive = false;
        this.stopTimer();

        this.messageDisplay.textContent = `Time's Up! You reached level ${this.level}`;
        this.messageDisplay.className = 'message lose';

        this.startBtn.disabled = false;
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new MazeGame();
    console.log('Web Maze game initialized!');
});
