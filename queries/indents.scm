; C-style indentation for Zen-C

; Statements that begin an indented block
[
  (function_definition)
  (struct_definition)
  (enum_definition)
  (union_definition)
  (trait_definition)
  (impl_block)
  (if_statement)
  (for_statement)
  (while_statement)
  (loop_statement)
  (repeat_statement)
  (match_statement)
  (match_expression)
  (guard_statement)
  (unless_statement)
  (block)
  (raw_block)
  (asm_expression)
  (comptime_block)
] @indent.begin

; Match arms indent their body
(match_arm "=>" @indent.begin)

; Closing brace ends indent and aligns with opening
"}" @indent.branch @indent.end

; Else aligns with if
"else" @indent.branch

; Preprocessor at column 0
[
  (define_directive)
  (include_directive)
  (ifdef_directive)
  (ifndef_directive)
  (endif_directive)
  (else_directive)
  (elif_directive)
  (undef_directive)
  (pragma_directive)
] @indent.zero

; Build directives at column 0
(build_directive) @indent.zero

; Comments follow context
(line_comment) @indent.auto
(block_comment) @indent.auto
