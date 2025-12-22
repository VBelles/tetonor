// Tetonor Puzzle Validator

class TetonorValidator {
    /**
     * Validate a puzzle solution
     * @param {Object} puzzle - The puzzle object with grid, strip, and solution
     * @param {Object} userInputs - Object containing stripInputs and gridInputs
     * @returns {Object} - Validation result with success flag, errors, and visual feedback
     */
    static validate(puzzle, userInputs) {
        const result = {
            success: true,
            errors: [],
            stripFeedback: [],
            gridFeedback: []
        };

        // 1. Build the current user strip (known values + filled inputs)
        const userStrip = [];
        const stripCounts = new Map();

        puzzle.strip.forEach((value, index) => {
            let finalValue = value;
            if (value === null) {
                finalValue = userInputs.stripInputs[index];
                const correctValue = puzzle.solution.strip[index];
                const isCorrect = finalValue === correctValue;

                result.stripFeedback.push({ index, correct: isCorrect });
                if (!isCorrect) result.success = false;
            }

            if (finalValue !== null && !isNaN(finalValue)) {
                userStrip.push(finalValue);
                stripCounts.set(finalValue, (stripCounts.get(finalValue) || 0) + 1);
            }
        });

        // 2. Validate grid equations and collect pair usage
        const addPairs = [];
        const multPairs = [];
        const cellCorrectStatus = new Array(16).fill(false);

        userInputs.gridInputs.forEach((gridInput, i) => {
            const { num1, op, num2 } = gridInput;
            const gridValue = puzzle.grid[i];

            if (!isNaN(num1) && !isNaN(num2) && op) {
                const result_calc = op === '+' ? num1 + num2 : num1 * num2;
                const mathCorrect = result_calc === gridValue;

                if (mathCorrect) {
                    cellCorrectStatus[i] = true;
                    const pair = [num1, num2].sort((a, b) => a - b);
                    if (op === '+') addPairs.push(pair);
                    else multPairs.push(pair);
                } else {
                    result.errors.push(`Cell ${i + 1}: Math is incorrect (${num1} ${op} ${num2} ≠ ${gridValue})`);
                }
            } else {
                result.errors.push(`Cell ${i + 1}: Missing or invalid inputs`);
            }

            result.gridFeedback.push({ index: i, correct: cellCorrectStatus[i] });
        });

        // 3. Check rule: Each addition pair must have a matching multiplication pair
        const multPairsCopy = multPairs.map(p => p.join(','));
        const matchedPairs = [];
        const unmatchedAdd = [];

        addPairs.forEach(pair => {
            const pairStr = pair.join(',');
            const idx = multPairsCopy.indexOf(pairStr);
            if (idx !== -1) {
                matchedPairs.push(pair);
                multPairsCopy.splice(idx, 1);
            } else {
                unmatchedAdd.push(pair);
            }
        });

        unmatchedAdd.forEach(pair => {
            result.errors.push(`Pair [${pair.join(',')}] used for addition but not for multiplication`);
            result.success = false;
        });

        multPairsCopy.forEach(pairStr => {
            result.errors.push(`Pair [${pairStr}] used for multiplication but not for addition`);
            result.success = false;
        });

        // 4. Check if we have exactly 8 matched pairs (making 16 numbers)
        if (matchedPairs.length !== 8) {
            result.success = false;
            if (matchedPairs.length < 8) {
                result.errors.push(`Only ${matchedPairs.length} complete pairs found (need 8)`);
            }
        }

        // 5. Check if the numbers used in matched pairs match the strip counts
        if (matchedPairs.length === 8) {
            const usedCounts = new Map();
            matchedPairs.forEach(pair => {
                pair.forEach(num => {
                    usedCounts.set(num, (usedCounts.get(num) || 0) + 1);
                });
            });

            // Check strip counts against used counts
            stripCounts.forEach((count, num) => {
                const used = usedCounts.get(num) || 0;
                if (used !== count) {
                    result.errors.push(`Number ${num} appears ${count} times in strip but is used in ${used} pairs`);
                    result.success = false;
                }
            });

            usedCounts.forEach((used, num) => {
                if (!stripCounts.has(num)) {
                    result.errors.push(`Number ${num} is used in a pair but is not in the strip`);
                    result.success = false;
                }
            });
        }

        if (!result.success && result.gridFeedback.every(f => f.correct) && result.stripFeedback.every(f => f.correct)) {
            // If math and strip values are "correct" but rules are violated
            // This happens if the user used the correct values but in the wrong combinations or repeated them
            result.errors.push("Rules violation: Each pair from the strip must be used exactly once for addition and once for multiplication.");
        }

        return result;
    }

    /**
     * Format error messages for display
     */
    static formatErrorMessage(validationResult) {
        if (validationResult.success) {
            return '🎉 Perfect! All answers correct!\nAll pairs used exactly once for + and once for ×!';
        }

        let message = 'Some answers are incorrect or violate rules.\nGreen = correct math, Red = error.';

        if (validationResult.errors.length > 0) {
            const uniqueErrors = [...new Set(validationResult.errors)];
            const maxErrors = 6;
            message += '\n\nErrors/Hints:\n• ' + uniqueErrors.slice(0, maxErrors).join('\n• ');
            if (uniqueErrors.length > maxErrors) {
                message += `\n... and ${uniqueErrors.length - maxErrors} more`;
            }
        }

        return message;
    }
}
