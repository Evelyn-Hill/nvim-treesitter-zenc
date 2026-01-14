; Tree-sitter fold queries for Zen-C

; Foldable blocks
[
  (function_definition)
  (trait_function)
  (struct_definition)
  (enum_definition)
  (union_definition)
  (trait_definition)
  (impl_block)
  (block)
  (if_statement)
  (for_statement)
  (while_statement)
  (loop_statement)
  (repeat_statement)
  (match_statement)
  (match_expression)
  (guard_statement)
  (unless_statement)
  (comptime_block)
  (asm_expression)
] @fold

; Comments can be folded
(block_comment) @fold
