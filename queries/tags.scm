; Tree-sitter tags queries for Zen-C
; Used for code navigation and symbol extraction

; Functions
(function_definition
  name: (identifier) @name) @definition.function

(trait_function
  name: (identifier) @name) @definition.method

; Types
(struct_definition
  name: (type_identifier) @name) @definition.class

(enum_definition
  name: (type_identifier) @name) @definition.class

(union_definition
  name: (type_identifier) @name) @definition.class

(trait_definition
  name: (type_identifier) @name) @definition.interface

; Variables
(variable_declaration
  name: (identifier) @name) @definition.var

(const_declaration
  name: (identifier) @name) @definition.constant

; Fields
(field_definition
  name: (identifier) @name) @definition.field

; Enum variants
(enum_variant
  name: (identifier) @name) @definition.constant

; Impl blocks
(impl_block
  type: (_) @name) @definition.impl

; Function calls
(call_expression
  function: (identifier) @name) @reference.call

(method_call_expression
  method: (identifier) @name) @reference.call
