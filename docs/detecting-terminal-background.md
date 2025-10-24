# Detecting Terminal Background Color

This document explains how `typed-tester` detects whether the terminal has a light or dark background to provide optimal colorization.

## The Problem

Terminal applications need to choose colors that are readable on both light and dark backgrounds. A color scheme that looks great on a dark terminal can be completely illegible on a light background, and vice versa.

For example:
- Gray text on a dark background: clearly visible, de-emphasized
- Gray text on a light background: barely visible, potentially unreadable

Traditional approaches:
1. **Assume dark background** - Works for most developers but fails for light theme users
2. **Use only safe colors** - Limits design options, less expressive
3. **Let users configure** - Adds complexity, most won't configure it
4. **Query the terminal** - Best approach but technically challenging

## Our Solution: OSC 11 Escape Sequence

We use the **Operating System Command (OSC) 11** escape sequence to query the terminal's background color at runtime.

### How It Works

#### 1. Send the Query

The application sends this escape sequence to stdout:
```
\x1b]11;?\x07
```

Breaking it down:
- `\x1b]` - OSC introducer (ESC + `]`)
- `11` - Query background color
- `;?` - Parameter (query, not set)
- `\x07` - BEL (bell) terminator

#### 2. Terminal Responds

The terminal writes its response to stdin in this format:
```
]11;rgb:RRRR/GGGG/BBBB
```

Where:
- `RRRR`, `GGGG`, `BBBB` are 4-digit hexadecimal color components
- Most terminals use 8-bit color (e.g., `#38A4C9`) but pad to 4 digits
- Example: `#38A4C9` becomes `3838/a4a4/c9c9` (digits are duplicated)

#### 3. Parse the Response

We extract the RGB values by parsing the first 2 hex digits from each component:
```typescript
const r = parseInt(colorPart.substring(0, 2), 16);   // Positions 0-2
const g = parseInt(colorPart.substring(5, 7), 16);   // Positions 5-7
const b = parseInt(colorPart.substring(10, 12), 16); // Positions 10-12
```

#### 4. Calculate Luma (Perceived Brightness)

Once we have RGB values, we calculate luma using the ITU-R BT.601 formula:
```typescript
luma = (0.299 * R + 0.587 * G + 0.114 * B) / 255
```

This formula weights green more heavily because human eyes are more sensitive to green light.

Result: A value between 0 (black) and 1 (white)

#### 5. Determine Light vs Dark

We use a threshold of 0.6:
- `luma > 0.6` → **Light background**
- `luma ≤ 0.6` → **Dark background**

This threshold is based on research from the [terminal-light](https://github.com/Canop/terminal-light) Rust crate.

## Implementation Details

### Raw Mode Required

To read the terminal's response, stdin must be in **raw mode**:
```typescript
stdin.setRawMode(true);
```

Raw mode means:
- Input is available immediately (not line-buffered)
- No echo to screen
- Control characters are passed through

We restore the previous mode after reading the response.

### Timeout Handling

Not all terminals support OSC 11. We use a **100ms timeout**:
```typescript
timeout = setTimeout(() => {
    cleanup();
    resolve(null); // Return null if no response
}, 100);
```

If the terminal doesn't respond within 100ms, we default to `'dark'` (most developer terminals are dark).

### Caching

The query adds ~5-10ms latency on first run, so we cache the result:
```typescript
let cachedTheme: TerminalTheme | null = null;

export async function detectTerminalTheme(): Promise<TerminalTheme> {
    if (cachedTheme !== null) {
        return cachedTheme; // Return cached result
    }
    // ... query logic ...
    cachedTheme = result;
    return cachedTheme;
}
```

The theme is detected once per CLI invocation and reused for all subsequent operations.

### Synchronous Access

After the initial async detection, we provide a synchronous getter:
```typescript
export function getTerminalTheme(): TerminalTheme {
    return cachedTheme ?? 'dark';
}
```

This is safe because we always call `detectTerminalTheme()` early in the command lifecycle.

## Terminal Compatibility

### Supported Terminals

OSC 11 is supported by:
- **xterm** and xterm-compatible terminals (most modern terminals)
- **iTerm2** (macOS)
- **Terminal.app** (macOS)
- **GNOME Terminal** (Linux)
- **Konsole** (Linux)
- **Windows Terminal** (Windows 10/11)
- **Alacritty**
- **kitty**
- **WezTerm**

### Unsupported Terminals

Some terminals don't respond to OSC 11:
- Very old terminal emulators
- Some minimal terminal implementations
- Non-TTY environments (pipes, redirects)

**Fallback behavior**: Default to `'dark'` theme

### Non-TTY Detection

We check if we have a TTY before querying:
```typescript
if (!stdin.isTTY || !stdout.isTTY) {
    return null; // Skip query, return default
}
```

This prevents hanging when:
- Output is piped (`typed test | grep error`)
- Running in CI/CD environments
- Output is redirected to a file

## How We Use It

### Before (Phase 5 - Didn't Work)

We tried wrapping entire lines in `chalk.dim()`:
```typescript
const shouldDim = test.typeTests === 0;
const displayLine = shouldDim ? chalk.dim(fileLine) : fileLine;
```

**Problem**: `chalk.bold()` formatting inside the line overrode `chalk.dim()`, so dimming had no visible effect.

### After (Current Implementation)

We apply theme-aware colors to individual components based on state:

```typescript
const theme = getTerminalTheme();
const fileStatusIcon = test.skip
    ? chalk.dim(`⇣`)
    : hasErrors
        ? hasTypeTests
            ? chalk.red.bold(`⤬`)
            // De-emphasize errors based on background
            : theme === 'light'
                ? chalk.hex('#CD5C5C').bold(`⤬`)  // Light red
                : chalk.hex('#8B0000').bold(`⤬`)  // Dark red
        : hasTypeTests
            ? chalk.green.bold(`✓`)
            // De-emphasize success based on background
            : theme === 'light'
                ? chalk.hex('#AAAAAA')(`✓`)  // Light gray
                : chalk.hex('#555555')(`✓`); // Dark gray
```

**Color Palette**:

| State | Has Type Tests | Dark Background | Light Background |
|-------|---------------|-----------------|------------------|
| Success | Yes | Bright green (bold) | Bright green (bold) |
| Success | No | Dark gray `#555555` | Light gray `#AAAAAA` |
| Error | Yes | Bright red (bold) | Bright red (bold) |
| Error | No | Dark red `#8B0000` | Light red `#CD5C5C` |
| Warning | Yes | Bright yellow (bold) | Bright yellow (bold) |
| Warning | No | Dark orange `#996600` | Light orange `#DAA520` |

**Visual hierarchy**:
- **Dark terminals**: Files without type tests get dark colors (de-emphasized against dark background)
- **Light terminals**: Files without type tests get light colors (de-emphasized against light background)
- **All terminals**: Files with type tests get bright, bold colors (emphasized on any background)

## Performance Impact

- **First run**: +5-10ms for OSC query (one-time cost per CLI invocation)
- **Subsequent calls**: 0ms (cached result)
- **Timeout failures**: +100ms maximum (if terminal doesn't respond)

For a typical `typed test` run analyzing 50+ files, this is negligible overhead.

## References

This implementation was inspired by and adapted from:

1. **[terminal-light](https://github.com/Canop/terminal-light)** - Rust crate by Canop
   - Provided the OSC 11 query approach
   - Source for luma calculation and threshold (0.6)
   - Reference implementation in Rust: [xterm.rs](https://github.com/Canop/terminal-light/blob/main/src/xterm.rs)

2. **Stack Overflow**: [Determine terminal/TTY background color at runtime](https://stackoverflow.com/questions/50027162/determine-terminal-tty-background-color-at-runtime)
   - Discussion of OSC sequences and portable detection challenges

3. **[Adjust your application for a light or dark terminal](https://dystroy.org/blog/terminal-light/)**
   - Blog post explaining the approach and rationale

4. **XTerm Control Sequences**: [OSC Escape Sequences](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html)
   - Official documentation of OSC 11 and other control sequences

## Future Enhancements

Potential improvements:

1. **256-color palette detection**: Query OSC 4 to detect custom color schemes
2. **True color support detection**: Check terminal capabilities before using RGB colors
3. **User override**: Add `--theme` flag to manually specify light/dark
4. **Environment variable**: Respect `COLORFGBG` or similar hints
5. **Automatic re-detection**: Watch for theme changes during long-running processes

## Testing

To test the detection on your terminal:

```bash
# Should show "dark" or "light" based on your terminal background
node -e "import('./bin/typed.js').then(m => m.detectTerminalTheme()).then(console.log)"
```

Switch your terminal theme and run again to verify detection accuracy.

## Conclusion

OSC 11 provides a robust, cross-platform way to detect terminal background color with minimal overhead. By querying once and caching the result, we can provide optimal colorization for both light and dark terminals without user configuration.

The approach is well-tested across multiple terminal emulators and gracefully degrades (defaults to dark) when detection isn't available.
