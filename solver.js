// Tetonor solver


const gridNumbers = [
    252, 260, 13, 30,
    25, 144, 36, 30,
    48, 21, 40, 30,
    224, 56, 46, 22
];


const stripValues = [
    1, null, null, 5, 6, null, null, 10,
    null, null, 21, 23, 24, null, 28, null
];


// Helper function to find all divisor pairs of a number
function getDivisorPairs(n) {
    const pairs = [];
    for (let i = 1; i <= Math.sqrt(n); i++) {
        if (n % i === 0) {
            pairs.push([i, n / i]);
            if (i !== n / i) {
                pairs.push([n / i, i]);
            }
        }
    }
    return pairs;
}

// Helper function to find all addition pairs that sum to n
function getAdditionPairs(n, maxValue = 100) {
    const pairs = [];
    for (let i = 1; i <= Math.min(n - 1, maxValue); i++) {
        const complement = n - i;
        if (complement >= 1 && complement <= maxValue) {
            pairs.push([i, complement]);
        }
    }
    return pairs;
}

// For each grid number, find all possible ways to form it
const gridSolutions = gridNumbers.map((num, index) => {
    const multiplicationPairs = getDivisorPairs(num);
    const additionPairs = getAdditionPairs(num);

    return {
        gridNumber: num,
        index: index,
        multiplicationPairs: multiplicationPairs,
        additionPairs: additionPairs
    };
});

// Print solutions for debugging
console.log('=== Grid Solutions ===\n');
gridSolutions.forEach(sol => {
    console.log(`Grid number: ${sol.gridNumber}`);
    console.log(`  Multiplication pairs (a × b = ${sol.gridNumber}):`);
    sol.multiplicationPairs.slice(0, 10).forEach(pair => {
        console.log(`    ${pair[0]} × ${pair[1]} = ${sol.gridNumber}`);
    });
    if (sol.multiplicationPairs.length > 10) {
        console.log(`    ... and ${sol.multiplicationPairs.length - 10} more`);
    }

    console.log(`  Addition pairs (a + b = ${sol.gridNumber}):`);
    sol.additionPairs.slice(0, 10).forEach(pair => {
        console.log(`    ${pair[0]} + ${pair[1]} = ${sol.gridNumber}`);
    });
    if (sol.additionPairs.length > 10) {
        console.log(`    ... and ${sol.additionPairs.length - 10} more`);
    }
    console.log('');
});

console.log('\n=== Known Strip Values ===');
console.log('Strip:', stripValues);
const knownValues = stripValues.filter(v => v !== null);
console.log('Known values:', knownValues);