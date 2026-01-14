; Tree-sitter highlight queries for Zen-C (nvim-treesitter format)

; ============================================
; Keywords
; ============================================

[
  "fn"
  "var"
  "const"
  "mut"
  "pub"
  "struct"
  "enum"
  "union"
  "trait"
  "impl"
  "for"
  "use"
] @keyword

[
  "if"
  "else"
  "match"
  "while"
  "loop"
  "repeat"
  "guard"
  "unless"
] @keyword

[
  "return"
  "break"
  "continue"
] @keyword

[
  "import"
  "plugin"
] @keyword

[
  "async"
  "await"
] @keyword

[
  "defer"
  "autofree"
] @keyword

[
  "as"
  "in"
  "step"
] @keyword

[
  "comptime"
  "embed"
  "asm"
  "volatile"
  "raw"
] @keyword

[
  "sizeof"
  "typeof"
] @keyword

; ============================================
; Operators
; ============================================

[
  "+"
  "-"
  "*"
  "/"
  "%"
  "<<"
  ">>"
  "&"
  "|"
  "^"
  "~"
  "!"
  "&&"
  "||"
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "&="
  "|="
  "^="
  "<<="
  ">>="
  "??"
  "??="
  "?."
  "->"
  "=>"
  ".."
  "..="
] @operator

; ============================================
; Punctuation
; ============================================

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  ";"
  ":"
  "::"
  "."
] @punctuation.delimiter

"?" @punctuation.special

; ============================================
; Types
; ============================================

(primitive_type) @type.builtin

(type_identifier) @type

(generic_parameter
  name: (type_identifier) @type)

(generic_type
  name: (type_identifier) @type)

(pointer_type "*" @type)
(optional_type "?" @type)
(reference_type "&" @type)

; ============================================
; Functions - IMPORTANT: these must come before (identifier) @variable
; ============================================

(function_definition
  name: (identifier) @function)

(trait_function
  name: (identifier) @function)

(call_expression
  function: (identifier) @function.call)

(method_call_expression
  method: (identifier) @function.call)

(scoped_identifier
  scope: (type_identifier) @type
  name: (identifier) @function.call)

; ============================================
; Parameters
; ============================================

(lambda_expression
  parameter: (identifier) @variable.parameter)

(lambda_parameter
  name: (identifier) @variable.parameter)

(parameter
  name: (identifier) @variable.parameter)

(self_parameter
  "self" @variable.builtin)

; ============================================
; Variables and Constants
; ============================================

(variable_declaration
  name: (identifier) @variable)

(const_declaration
  name: (identifier) @constant)

; ============================================
; Fields and Members
; ============================================

(field_definition
  name: (identifier) @field
  type: (_) @type)

(member_expression
  member: (identifier) @field)

(safe_navigation_expression
  member: (identifier) @field)

(field_initializer
  name: (identifier) @field)

(field_pattern
  name: (identifier) @field)

; ============================================
; Structs, Enums, Unions
; ============================================

(struct_definition
  name: (type_identifier) @type)

(enum_definition
  name: (type_identifier) @type)

(union_definition
  name: (type_identifier) @type)

(trait_definition
  name: (type_identifier) @type)

(enum_variant
  name: (identifier) @constant)

(enum_pattern
  name: (identifier) @constant)

(struct_expression
  type: (type_identifier) @type)

; ============================================
; Literals
; ============================================

(integer_literal) @number

(float_literal) @number.float

(boolean_literal) @boolean

(null_literal) @constant.builtin

(string_literal) @string
(interpolated_string) @string
(char_literal) @character
(escape_sequence) @string.escape
(string_content) @string

(interpolation
  "{" @punctuation.special
  "}" @punctuation.special)

; ============================================
; Comments
; ============================================

(line_comment) @comment
(block_comment) @comment

; ============================================
; Attributes
; ============================================

(attribute
  "@" @attribute
  name: (attribute_name) @attribute)

(attribute_name) @attribute

; ============================================
; Labels
; ============================================

(label) @label
(label_identifier) @label

; ============================================
; Patterns
; ============================================

(wildcard_pattern) @variable.builtin
(rest_pattern) @punctuation.special

; ============================================
; Build Directives
; ============================================

(build_directive
  "//>" @keyword
  directive: (build_directive_type) @keyword)

(build_directive_value) @string

; ============================================
; Preprocessor Directives
; ============================================

[
  "#define"
  "#include"
  "#ifdef"
  "#ifndef"
  "#endif"
  "#else"
  "#elif"
  "#undef"
  "#pragma"
  "#error"
  "#warning"
] @keyword

(define_directive
  name: (identifier) @constant)

(system_include_path) @string
(preprocessor_value) @string

; ============================================
; Print/Input Functions
; ============================================

[
  "print"
  "println"
  "eprint"
  "eprintln"
] @function.builtin

; ============================================
; Macro Invocation
; ============================================

(macro_invocation
  name: (identifier) @function.macro
  "!" @punctuation.special)

; ============================================
; Assembly
; ============================================

(asm_expression
  "asm" @keyword
  "volatile" @keyword)

(asm_content) @string

(asm_operand
  ["out" "in" "clobber" "inout"] @keyword)

; Raw C11 blocks
(raw_block
  "raw" @keyword)

(raw_content) @string

; ============================================
; Imports
; ============================================

(import_statement
  path: (import_path) @module)

(plugin_import
  name: (string_literal) @string)

; ============================================
; Impl and Traits
; ============================================

(impl_block
  "impl" @keyword
  trait: (type_identifier)? @type
  "for" @keyword
  type: (_) @type)

; Composition (use in struct)
(composition_field
  "use" @keyword
  type: (_) @type)

; ============================================
; Generic identifiers (lowest priority)
; These are identifiers not captured by more specific rules above
; ============================================

; Identifiers used as expressions (not in specific contexts)
(expression_statement (identifier) @variable)
(binary_expression (identifier) @variable)
(unary_expression (identifier) @variable)
(assignment_expression left: (identifier) @variable)
(assignment_expression right: (identifier) @variable)
(comparison_expression (identifier) @variable)
(equality_expression (identifier) @variable)
(parenthesized_expression (identifier) @variable)
(index_expression object: (identifier) @variable)
(argument value: (identifier) @variable)
(return_statement (identifier) @variable)
(if_statement condition: (identifier) @variable)
(while_statement condition: (identifier) @variable)
(guard_statement condition: (identifier) @variable)
(unless_statement condition: (identifier) @variable)
(await_expression (identifier) @variable)
(null_coalescing_expression (identifier) @variable)
