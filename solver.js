/**
 * Tetonor Solver - Finds a valid 8-pair combination that satisfies
 * both the grid equations and the known strip values.
 */
class TetonorSolver {
    /**
     * Solve a Tetonor puzzle
     * @param {Array} gridNumbers - The 16 numbers in the grid
     * @param {Array} stripValues - The 16 values in the strip (some might be null)
     * @param {number} maxAttempts - Limit the search space
     * @returns {Object|null} - The solution or null if not found
     */
    solve(gridNumbers, stripValues, maxAttempts = 20000) {
        const allPairs = this.findConsistentPairs(gridNumbers);

        // Try to find the correct 8-pair combination
        const solution = this.findOptimalCombination(allPairs, stripValues, maxAttempts);

        if (solution) {
            // Map the pairs to grid usage
            const result = {
                strip: solution.strip,
                grid: Array(16).fill(null)
            };

            // For each of the 8 pairs, we need to find which grid cells it corresponds to
            // Note: Each pair must be used exactly twice (once for add, once for mult)
            // across all 16 cells.

            // To be totally safe, let's track which grid cells are filled
            const filledCells = new Set();

            solution.pairs.forEach(p => {
                const [a, b] = p.pair;
                // Find one add use and one mult use for this specific pair in this combination
                // Note: The 'uses' in p are all possible uses, we only need the ones 
                // that fit this specific puzzle instance.

                let addUse = p.uses.find(u => !filledCells.has(u.add.index));
                if (addUse) {
                    result.grid[addUse.add.index] = { num1: a, op: '+', num2: b };
                    filledCells.add(addUse.add.index);
                }

                let multUse = p.uses.find(u => !filledCells.has(u.mult.index));
                if (multUse) {
                    result.grid[multUse.mult.index] = { num1: a, op: '×', num2: b };
                    filledCells.add(multUse.mult.index);
                }
            });

            return result;
        }

        return null;
    }

    /**
     * Find all pairs that work for both addition and multiplication within the grid
     */
    findConsistentPairs(gridNumbers) {
        const pairMap = new Map();

        for (let i = 0; i < gridNumbers.length; i++) {
            const multNum = gridNumbers[i];
            const multPairs = this.getDivisorPairs(multNum);

            for (let j = 0; j < gridNumbers.length; j++) {
                if (i === j) continue;

                const addNum = gridNumbers[j];

                for (const multPair of multPairs) {
                    const [a, b] = multPair;
                    if (a + b === addNum) {
                        const key = `${a},${b}`;
                        if (!pairMap.has(key)) {
                            pairMap.set(key, {
                                pair: [a, b],
                                uses: []
                            });
                        }
                        pairMap.get(key).uses.push({
                            mult: { value: multNum, index: i },
                            add: { value: addNum, index: j }
                        });
                    }
                }
            }
        }

        return Array.from(pairMap.values());
    }

    /**
     * Get all divisor pairs of a number
     */
    getDivisorPairs(n) {
        const pairs = [];
        for (let i = 1; i <= Math.sqrt(n); i++) {
            if (n % i === 0) {
                const pair = [i, n / i].sort((a, b) => a - b);
                pairs.push(pair);
            }
        }
        return pairs;
    }

    /**
     * Find the optimal 8-pair combination using a generator
     */
    findOptimalCombination(allPairs, stripValues, maxAttempts) {
        let tested = 0;

        for (const combo of this.combinations(allPairs, 8)) {
            tested++;
            if (tested > maxAttempts) break;

            const strip = this.buildStripFromPairs(combo);

            if (this.matchesKnownValues(strip, stripValues)) {
                // Double check that all 16 grid cells can be satisfied by these 8 pairs
                // Each pair provides 1 add and 1 mult = 2 cells. 8*2 = 16 cells.
                // We need to ensure there's a unique assignment.
                if (this.canAssignToGrid(combo)) {
                    return {
                        pairs: combo,
                        strip: strip,
                        tested: tested
                    };
                }
            }
        }

        return null;
    }

    /**
     * Verifies that the 8 pairs can actually cover all 16 cells uniquely
     */
    canAssignToGrid(pairs) {
        // This is a bipartite matching problem in theory, but since we know
        // each pair MUST provide one '+' and one '*', and we have 8 pairs 
        // and 16 cells, we just need to ensure we can pick 8 distinct 'add' 
        // indices and 8 distinct 'mult' indices.

        const usedAddIndices = new Set();
        const usedMultIndices = new Set();

        // Simple greedy assignment for verification
        for (const p of pairs) {
            const addUse = p.uses.find(u => !usedAddIndices.has(u.add.index) && !usedMultIndices.has(u.add.index));
            if (!addUse) return false;
            usedAddIndices.add(addUse.add.index);

            const multUse = p.uses.find(u => !usedMultIndices.has(u.mult.index) && !usedAddIndices.has(u.mult.index));
            if (!multUse) return false;
            usedMultIndices.add(multUse.mult.index);
        }

        return usedAddIndices.size === 8 && usedMultIndices.size === 8;
    }

    /**
     * Build standard 16-number strip from pairs
     */
    buildStripFromPairs(pairs) {
        const numbers = [];
        pairs.forEach(p => {
            numbers.push(p.pair[0], p.pair[1]);
        });
        return numbers.sort((a, b) => a - b);
    }

    /**
     * Check if strip matches known puzzle values
     */
    matchesKnownValues(strip, knownStrip) {
        if (strip.length !== knownStrip.length) return false;

        for (let i = 0; i < strip.length; i++) {
            if (knownStrip[i] !== null && knownStrip[i] !== strip[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Combination generator
     */
    *combinations(array, n) {
        if (n === 1) {
            for (const item of array) {
                yield [item];
            }
            return;
        }

        for (let i = 0; i <= array.length - n; i++) {
            for (const combo of this.combinations(array.slice(i + 1), n - 1)) {
                yield [array[i], ...combo];
            }
        }
    }
}
