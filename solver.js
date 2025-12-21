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
    solve(gridNumbers, stripValues, maxAttempts = 50000) {
        const allPairs = this.findConsistentPairs(gridNumbers);

        // Try to find the correct 8-pair combination
        const solution = this.findOptimalCombination(allPairs, stripValues, maxAttempts);

        if (solution) {
            // Map the pairs to grid usage
            return {
                strip: solution.strip,
                grid: solution.grid
            };
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
        let solution = null;

        // Pre-claculate known strip counts for pruning
        const knownCounts = new Map();
        stripValues.forEach(v => {
            if (v !== null) knownCounts.set(v, (knownCounts.get(v) || 0) + 1);
        });

        const backtrack = (pairIdx, currentCombo, usedIndices, currentCounts) => {
            if (solution || tested > maxAttempts) return;

            if (currentCombo.length === 8) {
                tested++;
                const strip = this.buildStripFromPairs(currentCombo);
                if (this.matchesKnownValues(strip, stripValues)) {
                    // Unique assignment is guaranteed if we tracked indices correctly,
                    // but we still need the final grid mapping for the UI.
                    const assignment = this.findGridAssignment(currentCombo, Array(16).fill(null));
                    if (assignment) {
                        solution = { pairs: currentCombo, strip, grid: assignment, tested };
                    }
                }
                return;
            }

            for (let i = pairIdx; i < allPairs.length; i++) {
                if (solution) return;
                const p = allPairs[i];
                const [a, b] = p.pair;

                // 1. Pruning by frequency (if we already have too many of a or b compared to known strip)
                // Note: This is an optimistic check. We can't prune if we have fewer than known,
                // only if we have MORE than the possible occurrences. Total spots = 16.
                // Actually, simple count check:
                const countA = (currentCounts.get(a) || 0) + 1;
                const countB = (currentCounts.get(b) || 0) + (a === b ? 1 : 0);

                // If the known strip has N of 'a', and we already used > N, is it invalid?
                // Not necessarily, because some 'a's might be hidden (null).
                // But if we know the TOTAL count of 'a' in the strip (by some logic)? 
                // We don't. We only know partials.
                // However, we know max count of any number can't exceed 16.

                // 2. Pruning by grid availability: At least one "use" must be available
                const availableUse = p.uses.find(u => !usedIndices.has(u.add.index) && !usedIndices.has(u.mult.index));

                if (availableUse) {
                    // Optimistically try all available uses? No, just try the first available for the pair
                    // since any 'use' of the SAME pair is equivalent for the strip check.
                    // If findGridAssignment is used at the end, it will handle multiple uses.

                    const nextUsed = new Set(usedIndices);
                    nextUsed.add(availableUse.add.index);
                    nextUsed.add(availableUse.mult.index);

                    const nextCounts = new Map(currentCounts);
                    nextCounts.set(a, (nextCounts.get(a) || 0) + 1);
                    nextCounts.set(b, (nextCounts.get(b) || 0) + 1);

                    currentCombo.push(p);
                    backtrack(i + 1, currentCombo, nextUsed, nextCounts);
                    currentCombo.pop();
                }
            }
        };

        backtrack(0, [], new Set(), new Map());
        return solution;
    }

    findGridAssignment(pairs, grid, pairIdx = 0) {
        if (pairIdx === pairs.length) return grid;
        const p = pairs[pairIdx];
        const [a, b] = p.pair;
        for (const use of p.uses) {
            if (grid[use.add.index] === null && grid[use.mult.index] === null && use.add.index !== use.mult.index) {
                const nextGrid = [...grid];
                nextGrid[use.add.index] = { num1: a, op: '+', num2: b };
                nextGrid[use.mult.index] = { num1: a, op: '×', num2: b };
                const result = this.findGridAssignment(pairs, nextGrid, pairIdx + 1);
                if (result) return result;
            }
        }
        return null;
    }

    /**
     * Verifies that the 8 pairs can actually cover all 16 cells uniquely
     */


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
