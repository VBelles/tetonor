# Tetonor Logic Documentation

This document explains the core logic behind the Tetonor puzzle generator and solver.

## 🧩 The Generator (`js/generator.js`)
The generator creates a valid, solvable puzzle from scratch.

### Step-by-Step Process
1. **Seeding**:
   - Accepts a `seed` (number) to guarantee reproducible puzzles.
   - If no seed is provided, it uses a random one.
   - Uses a custom pseudorandom number generator (Mulberry32) so the same seed always produces the same puzzle.

2. **Difficulty Configuration**:
   - Sets parameters based on difficulty (Easy, Medium, Hard):
     - **Range**: Minimum and maximum allowed numbers (e.g., 1-15 for Easy, 1-50 for Hard).
     - **Reveal Percentage**: How many numbers in the bottom strip are initially shown.

3. **Generate Pairs**:
   - Generates **8 unique pairs** of numbers `(A, B)`.
   - Ensures `A != B` (numbers in a pair must be distinct).
   - Checks that the pair has not been generated before for this puzzle.

4. **Build the Strip**:
   - Takes all 16 numbers from the 8 generated pairs.
   - Sorts them numerically to create the "Strip" (the pool of available numbers).

5. **Generate the Grid**:
   - For each of the 8 pairs, it creates two grid cells:
     - **Addition**: `A + B = Sum`
     - **Multiplication**: `A × B = Product`
   - This results in 16 grid values (8 sums + 8 products).
   - The grid values are randomly shuffled so the player doesn't know which pair corresponds to which cell.

6. **Hide Values**:
   - Based on the difficulty's "Reveal Percentage", it replaces some numbers in the Strip with `null`.
   - These missing numbers are what the player must deduce.

---

## 🧠 The Solver (`js/solver.js`)
The solver attempts to find the intended solution for a given grid and partial strip. This is used to verify puzzle validity or provide hints.

### Step-by-Step Process
1. **Find Consistent Pairs**:
   - The solver inspects the 16 numbers in the grid.
   - It iterates through every possible combination of `(GridNumber_A, GridNumber_B)` to see if they could form a "Multiplication & Addition" relationship.
   - *Example*: If the grid has `12` and `7`, the solver checks:
     - Is there a pair `(3, 4)` such that `3×4=12` and `3+4=7`?
     - Yes! So `(3, 4)` is a **Candidate Pair** that explains these two specific grid cells.
   - It builds a list of all such possible candidate pairs.

2. **Find Optimal Combination (Backtracking)**:
   - The goal is to select exactly **8 pairs** from the candidate list that satisfy all rules.
   - **Backtracking Algorithm**:
     - It tries adding candidate pairs one by one to a "Current Solution".
     - **Pruning (Optimization)**:
       - **Frequency Check**: Does adding this pair exceed the count of specific numbers known in the Strip? If the Strip has only one `5`, we can't pick two pairs that both use a `5`.
       - **Grid Usage Check**: Do the grid cells explained by this pair overlap with cells already explained by previously chosen pairs? Each grid cell must be used exactly once.
     - If a valid set of 8 pairs is found, it proceeds to verification.

3. **Verify Against Strip**:
   - The solver constructs a temporary strip from its 8 chosen pairs.
   - It compares this constructed strip against the puzzle's visible strip values.
   - If they match (ignoring hidden `null` values), a valid solution has been found.

4. **Map to Grid**:
   - Finally, the solver maps the solution back to the grid indices to tell the UI exactly which numbers go into which cell.

---

## ✅ The Validator (`js/validator.js`)
The validator checks the *user's* current input against the game rules. This happens in real-time or when "Check" is clicked.

1. **Math Check**: verifies that `Num1 + Num2` or `Num1 × Num2` equals the target number in the grid cell.
2. **Pair Consistency**: Checks that every pair used for an **Addition** cell is also used for a **Multiplication** cell.
   - Rule: You cannot use `(3, 4)` for addition unless you also use `(3, 4)` for multiplication elsewhere.
3. **Strip Consistency**: Ensures the total count of numbers used in the grid matches the numbers available in the strip.

## 🧪 Simulation
You can test the solver's reliability by running simulations in the browser console:
```javascript
// Run 1000 simulations on 'medium' difficulty
TetonorSolver.runSimulations(1000, 'medium');
```
This generates 1000 random puzzles and ensures the solver can solve every single one of them.
