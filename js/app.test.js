const MazeGame = require('./app.js');

// Mock DOM elements for testing
global.document = {
    getElementById: () => ({
        textContent: '',
        innerHTML: '',
        appendChild: () => {},
        disabled: false,
        addEventListener: () => {}  // Add this for button element
    }),
    createElement: () => ({
        className: '',
        classList: { add: () => {} },
        dataset: {},
        appendChild: () => {}
    }),
    addEventListener: () => {}
};

describe('MazeGame', () => {
    let game;

    beforeEach(() => {
        game = new MazeGame();
    });

    describe('generateMaze', () => {
        test('should generate a maze of correct size', () => {
            game.mazeSize = 8;
            game.generateMaze();

            expect(game.maze.length).toBe(8);
            expect(game.maze[0].length).toBe(8);
        });

        test('should place player at start position (0, 0)', () => {
            game.generateMaze();

            expect(game.player.x).toBe(0);
            expect(game.player.y).toBe(0);
        });

        test('should place exit at bottom-right corner', () => {
            game.mazeSize = 8;
            game.generateMaze();

            expect(game.exit.x).toBe(7);
            expect(game.exit.y).toBe(7);
        });

        test('should ensure exit is always reachable', () => {
            // Test multiple maze generations
            for (let i = 0; i < 20; i++) {
                game.mazeSize = 8 + (i % 5); // Test different sizes
                game.generateMaze();

                const reachable = game.isExitReachable();
                expect(reachable).toBe(true);
            }
        });
    });

    describe('isExitReachable', () => {
        test('should return true when path exists', () => {
            // Create simple solvable maze
            game.mazeSize = 3;
            game.maze = [
                [0, 0, 0],
                [1, 1, 0],
                [1, 1, 0]
            ];
            game.player = { x: 0, y: 0 };
            game.exit = { x: 2, y: 2 };

            expect(game.isExitReachable()).toBe(true);
        });

        test('should return false when path blocked', () => {
            // Create unsolvable maze
            game.mazeSize = 3;
            game.maze = [
                [0, 1, 1],
                [1, 1, 1],
                [1, 1, 0]
            ];
            game.player = { x: 0, y: 0 };
            game.exit = { x: 2, y: 2 };

            expect(game.isExitReachable()).toBe(false);
        });
    });

    describe('carvePathToExit', () => {
        test('should make unreachable exit reachable', () => {
            // Start with unsolvable maze
            game.mazeSize = 4;
            game.maze = [
                [0, 1, 1, 1],
                [1, 1, 1, 1],
                [1, 1, 1, 1],
                [1, 1, 1, 0]
            ];
            game.player = { x: 0, y: 0 };
            game.exit = { x: 3, y: 3 };

            expect(game.isExitReachable()).toBe(false);

            // Carve path
            game.carvePathToExit();

            // Should now be reachable
            expect(game.isExitReachable()).toBe(true);
        });

        test('should create a continuous path of 0s from start to exit', () => {
            game.mazeSize = 5;
            game.maze = Array(5).fill(null).map(() => Array(5).fill(1));
            game.maze[0][0] = 0; // Start
            game.maze[4][4] = 0; // Exit
            game.player = { x: 0, y: 0 };
            game.exit = { x: 4, y: 4 };

            game.carvePathToExit();

            // Verify path exists
            expect(game.isExitReachable()).toBe(true);

            // Count carved cells (should have carved some walls)
            let pathCells = 0;
            for (let row of game.maze) {
                pathCells += row.filter(cell => cell === 0).length;
            }
            expect(pathCells).toBeGreaterThan(2); // More than just start and exit
        });
    });

    describe('maze generation stress test', () => {
        test('should generate 50 consecutive solvable mazes', () => {
            const sizes = [6, 8, 10, 12, 15];

            for (let i = 0; i < 50; i++) {
                game.mazeSize = sizes[i % sizes.length];
                game.generateMaze();

                expect(game.isExitReachable()).toBe(true);
            }
        });
    });
});
