# tree-sitter-zenc

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for the **Zen-C** programming language.

## Features

- Full syntax highlighting for Zen-C (`.zc`, `.zenc` files)
- Variable scoping and definition tracking
- Code folding support
- Indentation rules
- Symbol tagging

## Neovim Installation

### Prerequisites

- Neovim 0.9+ with Tree-sitter support
- [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter) plugin installed
- A C compiler (gcc or clang)

### Option 1: Using nvim-treesitter (Recommended)

Add the following to your Neovim configuration:

**Lua (init.lua or plugin config):**

```lua
local parser_config = require("nvim-treesitter.parsers").get_parser_configs()

parser_config.zenc = {
  install_info = {
    url = "https://github.com/z-libs/tree-sitter-zenc",
    files = { "src/parser.c" },
    branch = "main",
  },
  filetype = "zenc",
}

-- Register the filetype
vim.filetype.add({
  extension = {
    zc = "zenc",
    zenc = "zenc",
  },
})
```

Then install the parser:

```vim
:TSInstall zenc
```

### Option 2: Local Installation from Source

1. **Clone and build the parser:**

```bash
git clone https://github.com/z-libs/tree-sitter-zenc.git
cd tree-sitter-zenc
make
```

2. **Copy the parser to Neovim's parser directory:**

```bash
# Linux/macOS
mkdir -p ~/.local/share/nvim/site/parser
cp zenc.so ~/.local/share/nvim/site/parser/

# Or for a specific Neovim config location
mkdir -p ~/.config/nvim/parser
cp zenc.so ~/.config/nvim/parser/
```

3. **Copy the query files:**

```bash
mkdir -p ~/.config/nvim/queries/zenc
cp queries/*.scm ~/.config/nvim/queries/zenc/
```

4. **Register the filetype in your Neovim config:**

```lua
vim.filetype.add({
  extension = {
    zc = "zenc",
    zenc = "zenc",
  },
})
```

### Option 3: Using lazy.nvim

```lua
{
  "nvim-treesitter/nvim-treesitter",
  build = ":TSUpdate",
  config = function()
    local parser_config = require("nvim-treesitter.parsers").get_parser_configs()

    parser_config.zenc = {
      install_info = {
        url = "https://github.com/z-libs/tree-sitter-zenc",
        files = { "src/parser.c" },
        branch = "main",
      },
      filetype = "zenc",
    }

    vim.filetype.add({
      extension = {
        zc = "zenc",
        zenc = "zenc",
      },
    })

    require("nvim-treesitter.configs").setup({
      ensure_installed = { "zenc" },
      highlight = { enable = true },
      indent = { enable = true },
    })
  end,
}
```

### Option 4: Using packer.nvim

```lua
use {
  "nvim-treesitter/nvim-treesitter",
  run = ":TSUpdate",
  config = function()
    local parser_config = require("nvim-treesitter.parsers").get_parser_configs()

    parser_config.zenc = {
      install_info = {
        url = "https://github.com/z-libs/tree-sitter-zenc",
        files = { "src/parser.c" },
        branch = "main",
      },
      filetype = "zenc",
    }

    vim.filetype.add({
      extension = {
        zc = "zenc",
        zenc = "zenc",
      },
    })

    require("nvim-treesitter.configs").setup({
      highlight = { enable = true },
      indent = { enable = true },
    })
  end,
}
```

## Verifying Installation

1. Open a `.zc` or `.zenc` file
2. Run `:InspectTree` to view the syntax tree
3. Check that highlighting is working with `:TSHighlightCapturesUnderCursor`

## Query Files

| File | Purpose |
|------|---------|
| `highlights.scm` | Syntax highlighting rules |
| `locals.scm` | Variable scope and definition tracking |
| `indents.scm` | Automatic indentation |
| `folds.scm` | Code folding regions |
| `tags.scm` | Symbol tagging for navigation |

## Language Overview

Zen-C is a modern systems programming language with features including:

- Functions with generics and attributes
- Structs, enums, unions, and traits
- Pattern matching with `match`
- Async/await support
- Optional types and null safety (`?`, `?.`, `??`)
- Defer statements for cleanup
- Compile-time evaluation (`comptime`)
- Build directives (`//> link`, `//> include`, etc.)

## Example

```zenc
//> link: -lm

@inline
fn add(a: i32, b: i32) -> i32 {
    return a + b;
}

struct Point {
    x: f64,
    y: f64,
}

impl Point {
    fn new(x: f64, y: f64) -> Point {
        return Point { x: x, y: y };
    }

    fn dist(self) -> f64 {
        return sqrt(self.x * self.x + self.y * self.y);
    }
}

fn main() -> i32 {
    var point = Point::new(3.0, 4.0);
    const distance = point.dist();

    match distance {
        0.0 => print("At origin"),
        _ => print("Distance: {distance}"),
    }

    return 0;
}
```

## License

MIT
