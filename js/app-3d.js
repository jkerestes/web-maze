// First-Person 3D Maze Game with Sprocker Dog
class MazeGame3D {
    constructor() {
        this.level = 1;
        this.timeLeft = 30;
        this.timerInterval = null;
        this.gameActive = false;
        this.levelComplete = false;
        this.maze = [];
        this.mazeSize = 8;

        // Player with position AND direction
        this.player = {
            x: 0.5,
            y: 0.5,
            angle: 0, // Current direction in radians
            targetAngle: 0, // Target direction for smooth rotation
            moveSpeed: 0.05,
            rotSpeed: 0.15, // Speed of smooth rotation
            isRotating: false
        };

        this.lastTurnKey = { left: false, right: false };

        // Canvas setup
        this.canvas = document.getElementById('maze-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Minimap canvas
        this.minimap = document.getElementById('minimap');
        this.minimapCtx = this.minimap.getContext('2d');

        // UI elements
        this.levelDisplay = document.getElementById('level');
        this.timerDisplay = document.getElementById('timer');
        this.messageDisplay = document.getElementById('message');
        this.startBtn = document.getElementById('start-btn');

        this.initControls();
        this.keys = {};

        // Load epic dog image (Doom-style!)
        this.dogImage = new Image();
        this.dogImage.src = 'images/sprocker-doom.png';

        // Draw initial screen
        this.drawWelcomeScreen();
    }

    initControls() {
        this.startBtn.addEventListener('click', () => this.startGame());

        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (this.gameActive) e.preventDefault();
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Start game loop
        this.gameLoop();
    }

    startGame() {
        this.level = 1;
        this.mazeSize = 8;
        this.startLevel();
    }

    startLevel() {
        this.timeLeft = 30;
        this.gameActive = true;
        this.levelComplete = false;
        this.messageDisplay.textContent = '';
        this.messageDisplay.className = 'message';
        this.startBtn.disabled = true;

        this.generateMaze();
        // Player position set by addBoundaryWalls() inside generateMaze()
        this.player.angle = 0;
        this.player.targetAngle = 0;
        this.player.isRotating = false;

        console.log(`Level ${this.level} started. Exit at: (${this.exit.x}, ${this.exit.y}), Maze size: ${this.mazeSize}`);

        this.startTimer();
        this.levelDisplay.textContent = this.level;
    }

    generateMaze() {
        const size = this.mazeSize;
        this.maze = Array(size).fill(null).map(() => Array(size).fill(1));

        // Exit will be set by addBoundaryWalls()
        this.exit = { x: size - 2, y: size - 2 };

        // Carve paths using randomized DFS
        const stack = [[0, 0]];
        this.maze[0][0] = 0;

        const directions = [[0, -2], [0, 2], [-2, 0], [2, 0]];

        while (stack.length > 0) {
            const [x, y] = stack[stack.length - 1];
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

            if (!moved) stack.pop();
        }

        this.maze[size - 1][size - 1] = 0;

        // Ensure reachable
        if (!this.isExitReachable()) {
            this.carvePathToExit();
        }

        // Add boundary walls around the entire maze perimeter
        this.addBoundaryWalls();
    }

    addBoundaryWalls() {
        const size = this.mazeSize;

        // Top and bottom walls
        for (let x = 0; x < size; x++) {
            this.maze[0][x] = 1;
            this.maze[size - 1][x] = 1;
        }

        // Left and right walls
        for (let y = 0; y < size; y++) {
            this.maze[y][0] = 1;
            this.maze[y][size - 1] = 1;
        }

        // Clear start position (player spawns just inside the boundary)
        this.maze[1][1] = 0;
        this.player.x = 1.5;
        this.player.y = 1.5;

        // Clear exit position (just inside boundary)
        this.maze[size - 2][size - 2] = 0;
        this.exit.x = size - 2;
        this.exit.y = size - 2;

        // Make sure there's a path from new start to new exit
        if (!this.isExitReachable()) {
            this.carvePathToExit();
        }
    }

    isExitReachable() {
        const size = this.mazeSize;
        const visited = Array(size).fill(null).map(() => Array(size).fill(false));
        const queue = [[0, 0]];
        visited[0][0] = true;
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        while (queue.length > 0) {
            const [x, y] = queue.shift();
            if (x === this.exit.x && y === this.exit.y) return true;

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
        return false;
    }

    carvePathToExit() {
        const size = this.mazeSize;
        const visited = Array(size).fill(null).map(() => Array(size).fill(false));
        const parent = Array(size).fill(null).map(() => Array(size).fill(null));
        const queue = [[0, 0]];
        visited[0][0] = true;
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        while (queue.length > 0) {
            const [x, y] = queue.shift();
            if (x === this.exit.x && y === this.exit.y) {
                let current = [x, y];
                while (current !== null) {
                    const [cx, cy] = current;
                    this.maze[cy][cx] = 0;
                    current = parent[cy][cx];
                }
                return;
            }

            for (const [dx, dy] of directions) {
                const newX = x + dx;
                const newY = y + dy;
                if (newX >= 0 && newX < size && newY >= 0 && newY < size && !visited[newY][newX]) {
                    visited[newY][newX] = true;
                    parent[newY][newX] = [x, y];
                    queue.push([newX, newY]);
                }
            }
        }
    }

    drawWelcomeScreen() {
        const { ctx, width, height } = this;

        // Sky
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, width, height / 2);

        // Ground
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(0, height / 2, width, height / 2);

        // Welcome text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🐕 Sprocker\'s Maze', width / 2, height / 2 - 40);

        ctx.font = '24px Arial';
        ctx.fillText('Click START GAME to begin!', width / 2, height / 2 + 20);
    }

    gameLoop() {
        if (this.gameActive) {
            this.handleInput();
            this.render3D();
            this.renderMinimap();
        }
        requestAnimationFrame(() => this.gameLoop());
    }

    handleInput() {
        const { moveSpeed, rotSpeed } = this.player;

        // Handle 90-degree rotation (smooth but snapped)
        const leftPressed = this.keys['ArrowLeft'];
        const rightPressed = this.keys['ArrowRight'];

        // Detect key press (not hold)
        if (leftPressed && !this.lastTurnKey.left && !this.player.isRotating) {
            this.player.targetAngle -= Math.PI / 2; // Turn left 90 degrees
            this.player.isRotating = true;
        }
        if (rightPressed && !this.lastTurnKey.right && !this.player.isRotating) {
            this.player.targetAngle += Math.PI / 2; // Turn right 90 degrees
            this.player.isRotating = true;
        }

        this.lastTurnKey.left = leftPressed;
        this.lastTurnKey.right = rightPressed;

        // Smooth rotation towards target
        if (this.player.isRotating) {
            const diff = this.player.targetAngle - this.player.angle;
            if (Math.abs(diff) > 0.01) {
                this.player.angle += diff * rotSpeed;
            } else {
                this.player.angle = this.player.targetAngle;
                this.player.isRotating = false;
            }
        }

        // Movement (only when not rotating)
        if (!this.player.isRotating) {
            let newX = this.player.x;
            let newY = this.player.y;

            if (this.keys['ArrowUp']) {
                newX += Math.cos(this.player.angle) * moveSpeed;
                newY += Math.sin(this.player.angle) * moveSpeed;
            }
            if (this.keys['ArrowDown']) {
                newX -= Math.cos(this.player.angle) * moveSpeed;
                newY -= Math.sin(this.player.angle) * moveSpeed;
            }

            // Collision detection
            const gridX = Math.floor(newX);
            const gridY = Math.floor(newY);

            if (gridX >= 0 && gridX < this.mazeSize &&
                gridY >= 0 && gridY < this.mazeSize &&
                this.maze[gridY] && this.maze[gridY][gridX] === 0) {
                this.player.x = newX;
                this.player.y = newY;
            }

            // Check if reached exit (more lenient check)
            const playerGridX = Math.floor(this.player.x);
            const playerGridY = Math.floor(this.player.y);

            // Debug logging
            if (playerGridX === this.exit.x && playerGridY === this.exit.y) {
                console.log(`Player at exit! Position: (${playerGridX}, ${playerGridY}), Exit: (${this.exit.x}, ${this.exit.y}), levelComplete: ${this.levelComplete}`);
            }

            if (playerGridX === this.exit.x && playerGridY === this.exit.y && !this.levelComplete) {
                console.log('Calling winLevel()!');
                this.winLevel();
            }
        }
    }

    render3D() {
        const { ctx, width, height } = this;

        // Clear canvas
        ctx.fillStyle = '#87CEEB'; // Sky blue
        ctx.fillRect(0, 0, width, height / 2);
        ctx.fillStyle = '#5a4a2a'; // Dirt/ground brown
        ctx.fillRect(0, height / 2, width, height / 2);

        // Raycasting
        const fov = Math.PI / 3; // 60 degree field of view
        const numRays = width;
        const maxDepth = 20;

        for (let i = 0; i < numRays; i++) {
            const rayAngle = this.player.angle - fov / 2 + (i / numRays) * fov;
            const rayDirX = Math.cos(rayAngle);
            const rayDirY = Math.sin(rayAngle);

            let distance = 0;
            let hit = false;
            let hitWall = false;
            let isBoundary = false;

            while (!hit && distance < maxDepth) {
                distance += 0.05;
                const testX = this.player.x + rayDirX * distance;
                const testY = this.player.y + rayDirY * distance;
                const gridX = Math.floor(testX);
                const gridY = Math.floor(testY);

                // Out of bounds = boundary wall (RED)
                if (gridX < 0 || gridX >= this.mazeSize ||
                    gridY < 0 || gridY >= this.mazeSize) {
                    hit = true;
                    hitWall = true;
                    isBoundary = true;
                    distance = maxDepth;
                } else if (this.maze[gridY] && this.maze[gridY][gridX] === 1) {
                    hit = true;
                    hitWall = true;
                    isBoundary = false;
                }
            }

            // Fix fish-eye effect
            distance *= Math.cos(rayAngle - this.player.angle);

            // Calculate wall height
            const wallHeight = distance > 0 ? (height / distance) * 0.5 : height;
            const wallTop = (height - wallHeight) / 2;

            // Draw wall slice
            if (hitWall) {
                // Shade based on distance
                const brightness = Math.max(0, 255 - distance * 20);

                // Check if exit
                const testX = this.player.x + rayDirX * distance;
                const testY = this.player.y + rayDirY * distance;
                const gridX = Math.floor(testX);
                const gridY = Math.floor(testY);

                if (gridX === this.exit.x && gridY === this.exit.y) {
                    // EXIT - Bright green/gold glow
                    const glow = Math.sin(Date.now() / 200) * 30 + 225;
                    ctx.fillStyle = `rgb(${glow * 0.8}, ${glow}, ${glow * 0.3})`;
                    ctx.fillRect(i, wallTop, 1, wallHeight);
                } else if (isBoundary) {
                    // BOUNDARY - Dark rock walls
                    this.drawRockWall(ctx, i, wallTop, wallHeight, brightness, true);
                } else {
                    // REGULAR WALLS - Lighter stone
                    this.drawRockWall(ctx, i, wallTop, wallHeight, brightness, false);
                }
            }
        }

        // Draw FINISH FLAG overlay when looking at exit
        this.drawFinishFlag();

        // Draw DOG VIEW at bottom (like Doom weapon view)
        this.drawDogView();
    }

    drawRockWall(ctx, x, wallTop, wallHeight, brightness, isBoundary) {
        // Base color - dark gray/brown for rock
        let baseR, baseG, baseB;

        if (isBoundary) {
            // Boundary walls - very dark, almost black rock
            baseR = brightness * 0.15;
            baseG = brightness * 0.12;
            baseB = brightness * 0.10;
        } else {
            // Interior walls - medium gray stone
            baseR = brightness * 0.4;
            baseG = brightness * 0.38;
            baseB = brightness * 0.35;
        }

        // Draw base wall slice
        ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
        ctx.fillRect(x, wallTop, 1, wallHeight);

        // Add rock texture variation (every few pixels)
        if (x % 3 === 0) {
            // Random-looking variation based on position
            const variation = Math.sin(x * 0.5 + wallTop * 0.3) * 15;
            const darkSpot = baseR - variation;
            ctx.fillStyle = `rgba(${darkSpot}, ${darkSpot * 0.9}, ${darkSpot * 0.8}, 0.6)`;
            ctx.fillRect(x, wallTop, 1, wallHeight);
        }

        // Add "mortar" lines between stone blocks
        const blockHeight = 40; // Height of each stone block
        for (let by = wallTop; by < wallTop + wallHeight; by += blockHeight) {
            ctx.fillStyle = `rgba(0, 0, 0, 0.4)`;
            ctx.fillRect(x, by, 1, 2);
        }

        // Add vertical cracks/edges
        if (x % 15 === 0) {
            ctx.fillStyle = `rgba(0, 0, 0, 0.5)`;
            ctx.fillRect(x, wallTop, 1, wallHeight);
        }

        // Add highlights for rock edges
        if (x % 8 === 0) {
            const highlight = isBoundary ? 10 : 20;
            ctx.fillStyle = `rgba(${baseR + highlight}, ${baseG + highlight}, ${baseB + highlight}, 0.3)`;
            ctx.fillRect(x, wallTop, 1, Math.min(3, wallHeight));
        }
    }

    drawFinishFlag() {
        const { ctx, width, height } = this;

        // Calculate direction to exit
        const dx = (this.exit.x + 0.5) - this.player.x;
        const dy = (this.exit.y + 0.5) - this.player.y;
        const angleToExit = Math.atan2(dy, dx);
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if exit is in view
        let angleDiff = angleToExit - this.player.angle;
        // Normalize angle difference to -PI to PI
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        const fov = Math.PI / 3;
        if (Math.abs(angleDiff) < fov / 2 && distance < 15) {
            // Exit is in view! Draw flag
            const screenX = width / 2 + (angleDiff / (fov / 2)) * (width / 2);
            const flagSize = Math.max(30, 150 / distance); // Bigger when closer

            // Flag pole
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(screenX - 3, height / 2 - flagSize * 2, 6, flagSize * 2);

            // Animated flag (waving)
            const wave = Math.sin(Date.now() / 100) * 5;
            ctx.fillStyle = '#FFD700'; // Gold
            ctx.beginPath();
            ctx.moveTo(screenX, height / 2 - flagSize * 2);
            ctx.lineTo(screenX + flagSize + wave, height / 2 - flagSize * 1.5);
            ctx.lineTo(screenX + flagSize / 2 + wave / 2, height / 2 - flagSize);
            ctx.closePath();
            ctx.fill();

            // Checkered pattern
            ctx.fillStyle = '#000';
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 2; j++) {
                    if ((i + j) % 2 === 0) {
                        ctx.fillRect(
                            screenX + (i * flagSize / 3) + (j === 1 ? wave / 2 : wave),
                            height / 2 - flagSize * 2 + (j * flagSize / 2),
                            flagSize / 3,
                            flagSize / 2
                        );
                    }
                }
            }

            // "FINISH!" text if close
            if (distance < 3) {
                ctx.fillStyle = '#FFD700';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                ctx.strokeText('FINISH!', width / 2, 100);
                ctx.fillText('FINISH!', width / 2, 100);
            }
        }
    }

    drawDogView() {
        const { ctx, width, height } = this;

        // Only draw if image is loaded
        if (!this.dogImage || !this.dogImage.complete) return;

        // Draw the EPIC Doom-style sprocker with weapons!
        const imageHeight = 380; // Make it big and dramatic!
        const imageWidth = (this.dogImage.width / this.dogImage.height) * imageHeight;

        // Center at bottom
        const x = (width - imageWidth) / 2;
        const y = height - imageHeight + 30; // Show the whole dog with weapons

        ctx.save();

        // Draw the epic battle dog
        ctx.globalAlpha = 1.0; // Full opacity for maximum impact
        ctx.drawImage(this.dogImage, x, y, imageWidth, imageHeight);

        ctx.restore();
    }

    renderMinimap() {
        if (!this.minimapCtx) return;

        const size = 150;
        const cellSize = size / this.mazeSize;
        const ctx = this.minimapCtx;

        ctx.clearRect(0, 0, size, size);

        // Draw maze
        for (let y = 0; y < this.mazeSize; y++) {
            for (let x = 0; x < this.mazeSize; x++) {
                if (this.maze[y] && this.maze[y][x] === 1) {
                    ctx.fillStyle = '#34495e';
                } else if (x === this.exit.x && y === this.exit.y) {
                    ctx.fillStyle = '#27ae60';
                } else {
                    ctx.fillStyle = '#ecf0f1';
                }
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }

        // Draw player
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(
            this.player.x * cellSize,
            this.player.y * cellSize,
            cellSize / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Draw direction line
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.player.x * cellSize, this.player.y * cellSize);
        ctx.lineTo(
            this.player.x * cellSize + Math.cos(this.player.angle) * cellSize,
            this.player.y * cellSize + Math.sin(this.player.angle) * cellSize
        );
        ctx.stroke();
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
        if (this.levelComplete) return; // Prevent multiple calls
        this.levelComplete = true;
        this.gameActive = false;
        this.stopTimer();

        this.messageDisplay.textContent = `Level ${this.level} Complete! Sprocker found the exit! 🐕`;
        this.messageDisplay.className = 'message win';

        this.level++;
        this.mazeSize = Math.min(8 + Math.floor(this.level / 2), 20);

        console.log(`Level complete! Starting level ${this.level} in 2 seconds...`);
        setTimeout(() => {
            console.log(`Starting level ${this.level}`);
            this.startLevel();
        }, 2000);
    }

    loseGame() {
        this.gameActive = false;
        this.stopTimer();
        this.messageDisplay.textContent = `Time's Up! Sprocker reached level ${this.level} 🐾`;
        this.messageDisplay.className = 'message lose';
        this.startBtn.disabled = false;
    }
}

// Initialize game
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Add minimap canvas
        const minimap = document.getElementById('minimap');
        minimap.width = 150;
        minimap.height = 150;

        const game = new MazeGame3D();
        console.log('Sprocker Maze 3D initialized!');
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MazeGame3D;
}
