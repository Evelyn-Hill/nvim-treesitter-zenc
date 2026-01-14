; Tree-sitter locals queries for Zen-C

; ============================================
; Scopes
; ============================================

(function_definition) @local.scope
(trait_function) @local.scope
(block) @local.scope
(for_statement) @local.scope
(while_statement) @local.scope
(loop_statement) @local.scope
(if_statement) @local.scope
(match_arm) @local.scope
(lambda_expression) @local.scope
(block_lambda_expression) @local.scope

; ============================================
; Definitions
; ============================================

(variable_declaration
  name: (identifier) @local.definition)

(const_declaration
  name: (identifier) @local.definition)

(parameter
  name: (identifier) @local.definition)

(lambda_parameter
  name: (identifier) @local.definition)

(for_statement
  pattern: (identifier_pattern
    (identifier) @local.definition))

; ============================================
; References
; ============================================

(identifier) @local.reference
