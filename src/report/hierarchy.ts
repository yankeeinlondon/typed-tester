import type { TestFile, TestBlock } from "~/types";

/**
 * Determines whether describe blocks should be shown for this file.
 *
 * Returns `false` only when there's a single top-level describe with no nesting,
 * which would be redundant to show.
 *
 * @param testFile - The test file to analyze
 * @returns `false` if describe level should be hidden (single redundant describe), `true` otherwise
 */
export function shouldShowDescribeLevel(testFile: TestFile): boolean {
    const topLevelBlocks = testFile.blocks || [];

    // No blocks at all - show file-level tests directly
    if (topLevelBlocks.length === 0) {
        return true;
    }

    // Multiple top-level blocks - show all
    if (topLevelBlocks.length > 1) {
        return true;
    }

    // Single block - check if it's redundant
    const singleBlock = topLevelBlocks[0];

    // "Areas OUTSIDE" is special - always show
    if (singleBlock.description === "Areas OUTSIDE of tests blocks") {
        return true;
    }

    // If single block has nested blocks, show it
    if (singleBlock.blocks && singleBlock.blocks.length > 0) {
        return true;
    }

    // Single top-level describe with no nesting - hide it (redundant)
    return false;
}

/**
 * Determines if a specific block is a redundant single describe.
 *
 * A block is redundant when:
 * - It's the only top-level block
 * - It has no nested blocks
 * - It's not the special "Areas OUTSIDE" section
 *
 * @param block - The test block to check
 * @param totalBlocks - Total number of top-level blocks in the file
 * @param hasNestedBlocks - Whether this block has nested describe blocks
 * @returns `true` if this is a redundant single describe
 */
export function isRedundantSingleDescribe(
    block: TestBlock,
    totalBlocks: number,
    hasNestedBlocks: boolean
): boolean {
    // Multiple blocks - never redundant
    if (totalBlocks !== 1) {
        return false;
    }

    // Special "Areas OUTSIDE" section - never redundant
    if (block.description === "Areas OUTSIDE of tests blocks") {
        return false;
    }

    // Has nested blocks - not redundant
    if (hasNestedBlocks) {
        return false;
    }

    // Single block, no nesting, not special - redundant
    return true;
}

/**
 * Calculates the indentation level for a block.
 *
 * - Normal blocks: depth + 1 (0 → 1, 1 → 2, etc.)
 * - Redundant blocks: depth (reduces indent for children)
 *
 * @param depth - Nesting depth (0 = top-level, 1 = first nested, etc.)
 * @param isRedundant - Whether this is a redundant single describe
 * @returns The indent level (number of 4-space indents)
 */
export function getIndentLevel(depth: number, isRedundant: boolean): number {
    if (isRedundant) {
        // Redundant single describe - don't add extra indent
        return depth;
    }

    // Normal block - base indent is 1, each level adds 1
    return depth + 1;
}
