// Tetonor Puzzle Generator
class TetonorGenerator {
    /**
     * Generate a Tetonor puzzle
     */
    static generate(seed = null, difficulty = 'medium') {
        const rng = seed !== null ? this.createSeededRNG(seed) : () => Math.random();
        const config = this.getDifficultyConfig(difficulty);
        const pairs = this.generatePairs(config, rng);
        const strip = this.buildStrip(pairs);
        const grid = this.generateGrid(pairs, rng);
        const puzzleStrip = this.hideStripValues(strip, config, rng);

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
     * Create a seeded random number generator (Mulberry32)
     */
    static createSeededRNG(seed) {
        return function () {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    /**
     * Get configuration based on difficulty
     */
    static getDifficultyConfig(difficulty) {
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
    static generatePairs(config, rng) {
        const pairs = [];
        const usedNumbers = new Set();
        const maxAttempts = 1000;
        let attempts = 0;

        while (pairs.length < config.pairCount && attempts < maxAttempts) {
            attempts++;
            const a = this.randomInt(config.minNumber, config.maxNumber, rng);
            const b = this.randomInt(config.minNumber, config.maxNumber, rng);

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

        // Fallback if we couldn't find enough pairs (unlikely but safe)
        if (pairs.length < config.pairCount) {
            console.warn("Could not generate enough unique pairs");
        }

        return pairs;
    }

    /**
     * Build the complete strip from pairs
     */
    static buildStrip(pairs) {
        const numbers = [];
        pairs.forEach(pair => {
            numbers.push(pair.numbers[0], pair.numbers[1]);
        });
        return numbers.sort((a, b) => a - b);
    }

    /**
     * Generate grid numbers using the pairs
     */
    static generateGrid(pairs, rng) {
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

        this.shuffleArray(gridItems, rng);
        return gridItems.map(item => item.value);
    }

    /**
     * Hide some strip values to create the puzzle
     */
    static hideStripValues(strip, config, rng) {
        const puzzleStrip = [...strip];
        const revealCount = Math.floor(strip.length * config.revealedPercentage);

        const positions = Array.from({ length: strip.length }, (_, i) => i);
        this.shuffleArray(positions, rng);

        for (let i = revealCount; i < positions.length; i++) {
            puzzleStrip[positions[i]] = null;
        }

        return puzzleStrip;
    }

    /**
     * Random integer between min and max (inclusive)
     */
    static randomInt(min, max, rng) {
        return Math.floor(rng() * (max - min + 1)) + min;
    }

    /**
     * Shuffle array in place (Fisher-Yates)
     */
    static shuffleArray(array, rng) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
