// Tetonor Puzzle Generator - Browser Version

class TetonorGenerator {
    constructor(seed = null) {
        this.gridSize = 16; // 4x4 grid
        this.stripSize = 16; // 8 pairs = 16 numbers
        this.seed = seed;
        this.rng = seed !== null ? this.createSeededRNG(seed) : null;
    }

    /**
     * Create a seeded random number generator (Mulberry32)
     */
    createSeededRNG(seed) {
        return function () {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    /**
     * Get random number (uses seeded RNG if available)
     */
    random() {
        return this.rng ? this.rng() : Math.random();
    }

    /**
     * Generate a Tetonor puzzle
     */
    generate(difficulty = 'medium') {
        const config = this.getDifficultyConfig(difficulty);
        const pairs = this.generatePairs(config);
        const strip = this.buildStrip(pairs);
        const grid = this.generateGrid(pairs, config);
        const puzzleStrip = this.hideStripValues(strip, config);

        return {
            difficulty,
            grid,
            strip: puzzleStrip,
            solution: {
                strip: strip,
                pairs: pairs.map(p => p.numbers)
            }
        };
    }

    /**
     * Get configuration based on difficulty
     */
    getDifficultyConfig(difficulty) {
        const configs = {
            easy: {
                minNumber: 2,
                maxNumber: 15,
                pairCount: 8,
                revealedPercentage: 0.6
            },
            medium: {
                minNumber: 1,
                maxNumber: 30,
                pairCount: 8,
                revealedPercentage: 0.5
            },
            hard: {
                minNumber: 1,
                maxNumber: 50,
                pairCount: 8,
                revealedPercentage: 0.4
            }
        };
        return configs[difficulty] || configs.medium;
    }

    /**
     * Generate random number pairs
     */
    generatePairs(config) {
        const pairs = [];
        const usedNumbers = new Set();

        while (pairs.length < config.pairCount) {
            const a = this.randomInt(config.minNumber, config.maxNumber);
            const b = this.randomInt(config.minNumber, config.maxNumber);

            if (a === b) continue;

            const [min, max] = a < b ? [a, b] : [b, a];
            const key = `${min},${max}`;

            if (usedNumbers.has(key)) continue;

            usedNumbers.add(key);
            pairs.push({
                numbers: [min, max],
                sum: min + max,
                product: min * max,
                uses: 0
            });
        }

        return pairs;
    }

    /**
     * Build the complete strip from pairs
     */
    buildStrip(pairs) {
        const numbers = [];
        pairs.forEach(pair => {
            numbers.push(pair.numbers[0], pair.numbers[1]);
        });
        return numbers.sort((a, b) => a - b);
    }

    /**
     * Generate grid numbers using the pairs
     */
    generateGrid(pairs, config) {
        const gridItems = [];

        pairs.forEach(pair => {
            gridItems.push({
                value: pair.product,
                operation: 'multiply',
                pair: pair.numbers
            });
            gridItems.push({
                value: pair.sum,
                operation: 'add',
                pair: pair.numbers
            });
        });

        this.shuffleArray(gridItems);
        return gridItems.map(item => item.value);
    }

    /**
     * Hide some strip values to create the puzzle
     */
    hideStripValues(strip, config) {
        const puzzleStrip = [...strip];
        const revealCount = Math.floor(strip.length * config.revealedPercentage);

        const positions = Array.from({ length: strip.length }, (_, i) => i);
        this.shuffleArray(positions);

        for (let i = revealCount; i < positions.length; i++) {
            puzzleStrip[positions[i]] = null;
        }

        return puzzleStrip;
    }

    /**
     * Random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    /**
     * Shuffle array in place (Fisher-Yates)
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
