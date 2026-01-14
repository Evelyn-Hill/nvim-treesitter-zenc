/**
 * @file Tree-sitter grammar for Zen-C
 * @author Zen-C Contributors
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  COMMENT: 0,
  ASSIGN: 1,
  TERNARY: 2,
  OR: 3,
  AND: 4,
  BITOR: 5,
  BITXOR: 6,
  BITAND: 7,
  EQUALITY: 8,
  COMPARE: 9,
  SHIFT: 10,
  ADD: 11,
  MULT: 12,
  UNARY: 13,
  POSTFIX: 14,
  CALL: 15,
  MEMBER: 16,
};

module.exports = grammar({
  name: 'zenc',

  extras: $ => [
    /\s/,
    $.line_comment,
    $.block_comment,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    // Statement/expression context ambiguity
    [$._item, $._statement],
    [$._item, $._expression],

    // Lambda vs tuple/expression
    [$._expression, $.lambda_parameter],

    // Pattern matching
    [$.identifier_pattern, $.enum_pattern],

    // Labels in break/continue
    [$.label_identifier, $._expression],
    [$.label_identifier, $.macro_invocation],

    // Array type vs prefix types
    [$.array_type, $.pointer_type],
    [$.array_type, $.optional_type],
    [$.array_type, $.reference_type],
    [$.array_type, $.function_type],

    // Statement vs expression forms
    [$.if_statement, $.if_expression],
    [$.match_statement, $.match_expression],

    // Type vs expression in sizeof/typeof
    [$._type, $._expression],

    // Member access vs method call
    [$.member_expression, $.method_call_expression],

    // Match arm body vs range
    [$.match_arm, $.range_expression],

    // Cast vs unary dereference
    [$.unary_expression, $.cast_expression],

    // Block vs array initializer
    [$.block, $.array_expression],
  ],

  supertypes: $ => [
    $._statement,
    $._expression,
    $._type,
    $._literal,
    $._pattern,
  ],

  rules: {
    source_file: $ => repeat($._item),

    _item: $ => choice(
      $.build_directive,
      $.preprocessor_directive,
      $.function_definition,
      $.struct_definition,
      $.enum_definition,
      $.union_definition,
      $.impl_block,
      $.trait_definition,
      $.variable_declaration,
      $.const_declaration,
      $.import_statement,
      $.plugin_import,
      $.comptime_block,
      $._statement,
    ),

    // ============================================
    // Build Directives (//> ...)
    // ============================================
    build_directive: $ => seq(
      '//>',
      field('directive', $.build_directive_type),
      optional(seq(':', field('value', $.build_directive_value))),
      /\r?\n/,
    ),

    build_directive_type: $ => choice(
      'include',
      'lib',
      'link',
      'cflags',
      'define',
      'pkg-config',
      'shell',
      'get',
      'immutable-by-default',
    ),

    build_directive_value: $ => /[^\r\n]+/,

    // ============================================
    // C Preprocessor Directives
    // ============================================
    preprocessor_directive: $ => choice(
      $.define_directive,
      $.include_directive,
      $.ifdef_directive,
      $.ifndef_directive,
      $.endif_directive,
      $.else_directive,
      $.elif_directive,
      $.undef_directive,
      $.pragma_directive,
      $.error_directive,
      $.warning_directive,
    ),

    define_directive: $ => seq(
      '#define',
      field('name', $.identifier),
      optional(field('value', $.preprocessor_value)),
      /\r?\n/,
    ),

    include_directive: $ => seq(
      '#include',
      field('path', choice($.string_literal, $.system_include_path)),
      /\r?\n/,
    ),

    system_include_path: $ => /<[^>\r\n]+>/,

    ifdef_directive: $ => seq('#ifdef', $.identifier, /\r?\n/),
    ifndef_directive: $ => seq('#ifndef', $.identifier, /\r?\n/),
    endif_directive: $ => seq('#endif', /\r?\n/),
    else_directive: $ => seq('#else', /\r?\n/),
    elif_directive: $ => seq('#elif', $.preprocessor_value, /\r?\n/),
    undef_directive: $ => seq('#undef', $.identifier, /\r?\n/),
    pragma_directive: $ => seq('#pragma', $.preprocessor_value, /\r?\n/),
    error_directive: $ => seq('#error', $.preprocessor_value, /\r?\n/),
    warning_directive: $ => seq('#warning', $.preprocessor_value, /\r?\n/),

    preprocessor_value: $ => /[^\r\n]+/,

    // ============================================
    // Comments
    // ============================================
    line_comment: $ => token(prec(PREC.COMMENT, seq('//', /[^>\r\n][^\r\n]*|[\r\n]/))),
    block_comment: $ => token(prec(PREC.COMMENT, seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'))),

    // ============================================
    // Attributes
    // ============================================
    attribute: $ => seq(
      '@',
      field('name', $.attribute_name),
      optional($.attribute_arguments),
    ),

    attribute_name: $ => choice(
      'must_use',
      'deprecated',
      'inline',
      'noinline',
      'packed',
      'align',
      'constructor',
      'destructor',
      'unused',
      'weak',
      'section',
      'noreturn',
      'derived',
      'cold',
      'hot',
      'pure',
      'const',
      'extern',
      'export',
      $.identifier,
    ),

    attribute_arguments: $ => seq(
      '(',
      sepBy(',', $._expression),
      ')',
    ),

    attribute_list: $ => repeat1($.attribute),

    // ============================================
    // Variable and Constant Declarations
    // ============================================
    variable_declaration: $ => seq(
      optional($.attribute_list),
      optional('autofree'),
      'var',
      optional('mut'),
      field('name', $.identifier),
      optional(seq(':', field('type', $._type))),
      optional(seq('=', field('value', $._expression))),
      ';',
    ),

    const_declaration: $ => seq(
      optional($.attribute_list),
      'const',
      field('name', $.identifier),
      optional(seq(':', field('type', $._type))),
      '=',
      field('value', $._expression),
      ';',
    ),

    // ============================================
    // Function Definitions
    // ============================================
    function_definition: $ => seq(
      optional($.attribute_list),
      optional('async'),
      optional('pub'),
      'fn',
      field('name', $.identifier),
      optional($.generic_parameters),
      field('parameters', $.parameter_list),
      optional(seq('->', field('return_type', $._type))),
      field('body', $.block),
    ),

    parameter_list: $ => seq(
      '(',
      sepBy(',', choice($.parameter, $.self_parameter)),
      ')',
    ),

    parameter: $ => seq(
      optional('mut'),
      field('name', $.identifier),
      ':',
      field('type', $._type),
      optional(seq('=', field('default', $._expression))),
    ),

    self_parameter: $ => seq(
      optional('mut'),
      'self',
    ),

    // ============================================
    // Generics
    // ============================================
    generic_parameters: $ => seq(
      '<',
      sepBy1(',', $.generic_parameter),
      '>',
    ),

    generic_parameter: $ => seq(
      field('name', $.type_identifier),
      optional(seq(':', field('bounds', $.type_bounds))),
    ),

    type_bounds: $ => sepBy1('+', $._type),

    generic_arguments: $ => seq(
      '<',
      sepBy1(',', $._type),
      '>',
    ),

    // ============================================
    // Type System
    // ============================================
    _type: $ => choice(
      $.primitive_type,
      $.type_identifier,
      $.generic_type,
      $.array_type,
      $.pointer_type,
      $.optional_type,
      $.function_type,
      $.tuple_type,
      $.reference_type,
    ),

    primitive_type: $ => choice(
      'int', 'uint',
      'i8', 'i16', 'i32', 'i64', 'i128',
      'u8', 'u16', 'u32', 'u64', 'u128',
      'isize', 'usize',
      'byte',
      'f32', 'f64',
      'bool',
      'char',
      'string',
      'void', 'u0',
    ),

    type_identifier: $ => /[A-Z][a-zA-Z0-9_]*/,

    generic_type: $ => prec(1, seq(
      field('name', $.type_identifier),
      field('arguments', $.generic_arguments),
    )),

    array_type: $ => seq(
      field('element', $._type),
      '[',
      optional(field('size', $._expression)),
      ']',
    ),

    pointer_type: $ => seq(
      '*',
      optional(choice('const', 'mut')),
      field('inner', $._type),
    ),

    optional_type: $ => seq(
      '?',
      field('inner', $._type),
    ),

    function_type: $ => seq(
      'fn',
      '(',
      sepBy(',', $._type),
      ')',
      optional(seq('->', $._type)),
    ),

    tuple_type: $ => seq(
      '(',
      sepBy1(',', $._type),
      ')',
    ),

    reference_type: $ => seq(
      '&',
      optional('mut'),
      field('inner', $._type),
    ),

    // ============================================
    // Struct Definition
    // ============================================
    struct_definition: $ => seq(
      optional($.attribute_list),
      optional('pub'),
      'struct',
      field('name', $.type_identifier),
      optional($.generic_parameters),
      '{',
      repeat($.struct_field),
      '}',
    ),

    struct_field: $ => choice(
      $.field_definition,
      $.composition_field,
    ),

    field_definition: $ => seq(
      optional($.attribute_list),
      optional('pub'),
      field('name', $.identifier),
      ':',
      field('type', $._type),
      optional(seq(':', field('bitfield_size', $.integer_literal))),
      optional(seq('=', field('default', $._expression))),
      choice(';', ','),
    ),

    composition_field: $ => seq(
      'use',
      field('type', $._type),
      ';',
    ),

    // ============================================
    // Enum Definition
    // ============================================
    enum_definition: $ => seq(
      optional($.attribute_list),
      optional('pub'),
      'enum',
      field('name', $.type_identifier),
      optional($.generic_parameters),
      '{',
      sepBy(',', $.enum_variant),
      optional(','),
      '}',
    ),

    enum_variant: $ => seq(
      optional($.attribute_list),
      field('name', $.identifier),
      optional(choice(
        seq('=', field('value', $._expression)),
        seq('(', sepBy(',', $.enum_variant_field), ')'),
        seq('{', repeat($.field_definition), '}'),
      )),
    ),

    enum_variant_field: $ => seq(
      optional(field('name', seq($.identifier, ':'))),
      field('type', $._type),
    ),

    // ============================================
    // Union Definition
    // ============================================
    union_definition: $ => seq(
      optional($.attribute_list),
      optional('pub'),
      'union',
      field('name', $.type_identifier),
      optional($.generic_parameters),
      '{',
      repeat($.field_definition),
      '}',
    ),

    // ============================================
    // Impl Block
    // ============================================
    impl_block: $ => seq(
      'impl',
      optional($.generic_parameters),
      optional(seq(field('trait', $.type_identifier), 'for')),
      field('type', $._type),
      '{',
      repeat($.impl_item),
      '}',
    ),

    impl_item: $ => choice(
      $.function_definition,
      $.const_declaration,
    ),

    // ============================================
    // Trait Definition
    // ============================================
    trait_definition: $ => seq(
      optional($.attribute_list),
      optional('pub'),
      'trait',
      field('name', $.type_identifier),
      optional($.generic_parameters),
      optional(seq(':', field('bounds', $.type_bounds))),
      '{',
      repeat($.trait_item),
      '}',
    ),

    trait_item: $ => choice(
      $.trait_function,
      $.const_declaration,
    ),

    trait_function: $ => seq(
      optional($.attribute_list),
      optional('async'),
      'fn',
      field('name', $.identifier),
      optional($.generic_parameters),
      field('parameters', $.parameter_list),
      optional(seq('->', field('return_type', $._type))),
      choice($.block, ';'),
    ),

    // ============================================
    // Import Statements
    // ============================================
    import_statement: $ => seq(
      'import',
      field('path', $.import_path),
      optional(seq('as', field('alias', $.identifier))),
      ';',
    ),

    import_path: $ => sepBy1('::', $.identifier),

    plugin_import: $ => seq(
      'import',
      'plugin',
      field('name', $.string_literal),
      ';',
    ),

    // ============================================
    // Statements
    // ============================================
    _statement: $ => choice(
      $.expression_statement,
      $.variable_declaration,
      $.const_declaration,
      $.return_statement,
      $.break_statement,
      $.continue_statement,
      $.if_statement,
      $.match_statement,
      $.for_statement,
      $.while_statement,
      $.loop_statement,
      $.repeat_statement,
      $.guard_statement,
      $.unless_statement,
      $.defer_statement,
      $.block,
      $.empty_statement,
    ),

    expression_statement: $ => seq(
      $._expression,
      ';',
    ),

    return_statement: $ => seq(
      'return',
      optional($._expression),
      ';',
    ),

    break_statement: $ => seq(
      'break',
      optional(field('label', $.label_identifier)),
      optional($._expression),
      ';',
    ),

    continue_statement: $ => seq(
      'continue',
      optional(field('label', $.label_identifier)),
      ';',
    ),

    // ============================================
    // Control Flow
    // ============================================
    if_statement: $ => prec.right(seq(
      'if',
      field('condition', $._expression),
      field('consequence', $.block),
      optional(seq(
        'else',
        field('alternative', choice($.block, $.if_statement)),
      )),
    )),

    match_statement: $ => seq(
      'match',
      field('value', $._expression),
      '{',
      repeat($.match_arm),
      '}',
    ),

    match_arm: $ => seq(
      field('pattern', $._pattern),
      optional(seq('if', field('guard', $._expression))),
      '=>',
      field('body', choice($._expression, $.block)),
      optional(','),
    ),

    for_statement: $ => seq(
      optional(seq(field('label', $.label), ':')),
      'for',
      field('pattern', $._pattern),
      'in',
      field('iterator', $._expression),
      optional(seq('step', field('step', $._expression))),
      field('body', $.block),
    ),

    while_statement: $ => seq(
      optional(seq(field('label', $.label), ':')),
      'while',
      field('condition', $._expression),
      field('body', $.block),
    ),

    loop_statement: $ => seq(
      optional(seq(field('label', $.label), ':')),
      'loop',
      field('body', $.block),
    ),

    repeat_statement: $ => seq(
      'repeat',
      field('count', $._expression),
      field('body', $.block),
    ),

    guard_statement: $ => seq(
      'guard',
      field('condition', $._expression),
      'else',
      field('body', $.block),
    ),

    unless_statement: $ => seq(
      'unless',
      field('condition', $._expression),
      field('body', $.block),
    ),

    defer_statement: $ => choice(
      seq('defer', $._expression, ';'),
      seq('defer', $.block),
    ),

    block: $ => seq(
      '{',
      repeat($._statement),
      optional($._expression),
      '}',
    ),

    empty_statement: $ => ';',

    label: $ => $.identifier,
    label_identifier: $ => $.identifier,

    // ============================================
    // Patterns
    // ============================================
    _pattern: $ => choice(
      $.identifier_pattern,
      $.literal_pattern,
      $.tuple_pattern,
      $.struct_pattern,
      $.enum_pattern,
      $.range_pattern,
      $.or_pattern,
      $.wildcard_pattern,
      $.rest_pattern,
    ),

    identifier_pattern: $ => seq(
      optional('mut'),
      $.identifier,
    ),

    literal_pattern: $ => $._literal,

    tuple_pattern: $ => seq(
      '(',
      sepBy(',', $._pattern),
      ')',
    ),

    struct_pattern: $ => seq(
      field('type', $.type_identifier),
      '{',
      sepBy(',', $.field_pattern),
      optional(','),
      '}',
    ),

    field_pattern: $ => choice(
      seq(field('name', $.identifier), ':', field('pattern', $._pattern)),
      $.identifier,
      $.rest_pattern,
    ),

    enum_pattern: $ => seq(
      field('name', $.identifier),
      optional(seq('(', sepBy(',', $._pattern), ')')),
    ),

    range_pattern: $ => prec.left(seq(
      field('start', $._literal),
      choice('..', '..='),
      field('end', $._literal),
    )),

    or_pattern: $ => prec.left(seq(
      $._pattern,
      '|',
      $._pattern,
    )),

    wildcard_pattern: $ => '_',

    rest_pattern: $ => '..',

    // ============================================
    // Expressions
    // ============================================
    _expression: $ => choice(
      $._literal,
      $.identifier,
      $.binary_expression,
      $.comparison_expression,
      $.equality_expression,
      $.unary_expression,
      $.assignment_expression,
      $.compound_assignment_expression,
      $.call_expression,
      $.method_call_expression,
      $.member_expression,
      $.scoped_identifier,
      $.index_expression,
      $.range_expression,
      $.ternary_expression,
      $.if_expression,
      $.match_expression,
      $.lambda_expression,
      $.block_lambda_expression,
      $.tuple_expression,
      $.array_expression,
      $.struct_expression,
      $.parenthesized_expression,
      $.cast_expression,
      $.sizeof_expression,
      $.typeof_expression,
      $.try_expression,
      $.await_expression,
      $.null_coalescing_expression,
      $.null_coalescing_assignment,
      $.safe_navigation_expression,
      $.embed_expression,
      $.comptime_block,
      $.asm_expression,
      $.raw_block,
      $.print_expression,
      $.input_expression,
      $.macro_invocation,
      $.type_identifier,
    ),

    binary_expression: $ => choice(
      ...[
        ['+', PREC.ADD],
        ['-', PREC.ADD],
        ['*', PREC.MULT],
        ['/', PREC.MULT],
        ['%', PREC.MULT],
        ['<<', PREC.SHIFT],
        ['>>', PREC.SHIFT],
        ['&', PREC.BITAND],
        ['^', PREC.BITXOR],
        ['|', PREC.BITOR],
        ['&&', PREC.AND],
        ['||', PREC.OR],
      ].map(([op, precedence]) =>
        prec.left(precedence, seq(
          field('left', $._expression),
          field('operator', op),
          field('right', $._expression),
        ))
      ),
    ),

    comparison_expression: $ => prec.left(PREC.COMPARE, seq(
      field('left', $._expression),
      field('operator', choice('<', '>', '<=', '>=')),
      field('right', $._expression),
    )),

    equality_expression: $ => prec.left(PREC.EQUALITY, seq(
      field('left', $._expression),
      field('operator', choice('==', '!=')),
      field('right', $._expression),
    )),

    unary_expression: $ => prec(PREC.UNARY, seq(
      field('operator', choice('-', '!', '~', '*', '&', '&mut')),
      field('operand', $._expression),
    )),

    assignment_expression: $ => prec.right(PREC.ASSIGN, seq(
      field('left', $._expression),
      '=',
      field('right', $._expression),
    )),

    compound_assignment_expression: $ => prec.right(PREC.ASSIGN, seq(
      field('left', $._expression),
      field('operator', choice('+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=')),
      field('right', $._expression),
    )),

    call_expression: $ => prec(PREC.CALL, seq(
      field('function', $._expression),
      '(',
      sepBy(',', $.argument),
      ')',
    )),

    argument: $ => seq(
      optional(seq(field('name', $.identifier), ':')),
      field('value', $._expression),
    ),

    method_call_expression: $ => prec(PREC.MEMBER, seq(
      field('object', $._expression),
      '.',
      field('method', $.identifier),
      optional($.generic_arguments),
      '(',
      sepBy(',', $.argument),
      ')',
    )),

    member_expression: $ => prec(PREC.MEMBER, seq(
      field('object', $._expression),
      '.',
      field('member', choice($.identifier, $.integer_literal)),
    )),

    scoped_identifier: $ => prec(PREC.MEMBER, seq(
      field('scope', choice($.type_identifier, $.scoped_identifier)),
      '::',
      field('name', $.identifier),
    )),

    index_expression: $ => prec(PREC.POSTFIX, seq(
      field('object', $._expression),
      '[',
      field('index', $._expression),
      ']',
    )),

    range_expression: $ => prec.left(seq(
      optional(field('start', $._expression)),
      choice('..', '..='),
      optional(field('end', $._expression)),
    )),

    ternary_expression: $ => prec.right(PREC.TERNARY, seq(
      'if',
      field('condition', $._expression),
      '?',
      field('consequence', $._expression),
      ':',
      field('alternative', $._expression),
    )),

    if_expression: $ => prec.right(seq(
      'if',
      field('condition', $._expression),
      field('consequence', $.block),
      optional(seq('else', field('alternative', choice($.block, $.if_expression)))),
    )),

    match_expression: $ => seq(
      'match',
      field('value', $._expression),
      '{',
      repeat($.match_arm),
      '}',
    ),

    lambda_expression: $ => prec.right(seq(
      choice(
        field('parameter', $.identifier),
        seq('(', sepBy(',', $.lambda_parameter), ')'),
      ),
      '->',
      field('body', $._expression),
    )),

    lambda_parameter: $ => seq(
      field('name', $.identifier),
      optional(seq(':', field('type', $._type))),
    ),

    block_lambda_expression: $ => seq(
      'fn',
      '(',
      sepBy(',', $.lambda_parameter),
      ')',
      optional(seq('->', field('return_type', $._type))),
      field('body', $.block),
    ),

    tuple_expression: $ => seq(
      '(',
      $._expression,
      ',',
      sepBy(',', $._expression),
      optional(','),
      ')',
    ),

    array_expression: $ => seq(
      '{',
      sepBy(',', $._expression),
      optional(','),
      '}',
    ),

    struct_expression: $ => prec(1, seq(
      field('type', $.type_identifier),
      '{',
      sepBy(',', $.field_initializer),
      optional(','),
      '}',
    )),

    field_initializer: $ => choice(
      seq(field('name', $.identifier), ':', field('value', $._expression)),
      $.identifier,
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    cast_expression: $ => prec.left(PREC.UNARY, seq(
      field('value', $._expression),
      'as',
      field('type', $._type),
    )),

    sizeof_expression: $ => seq(
      'sizeof',
      '(',
      choice($._type, $._expression),
      ')',
    ),

    typeof_expression: $ => seq(
      'typeof',
      '(',
      $._expression,
      ')',
    ),

    try_expression: $ => prec(PREC.POSTFIX, seq(
      field('expression', $._expression),
      '?',
    )),

    await_expression: $ => prec.right(seq(
      'await',
      field('expression', $._expression),
    )),

    null_coalescing_expression: $ => prec.left(PREC.OR, seq(
      field('left', $._expression),
      '??',
      field('right', $._expression),
    )),

    null_coalescing_assignment: $ => prec.right(PREC.ASSIGN, seq(
      field('left', $._expression),
      '??=',
      field('right', $._expression),
    )),

    safe_navigation_expression: $ => prec(PREC.MEMBER, seq(
      field('object', $._expression),
      '?.',
      field('member', $.identifier),
    )),

    embed_expression: $ => seq(
      'embed',
      field('path', $.string_literal),
    ),

    comptime_block: $ => seq(
      'comptime',
      field('body', $.block),
    ),

    asm_expression: $ => seq(
      'asm',
      optional('volatile'),
      '{',
      repeat($.asm_content),
      repeat($.asm_operand),
      '}',
    ),

    raw_block: $ => seq(
      'raw',
      '{',
      optional($.raw_content),
      '}',
    ),

    raw_content: $ => /[^}]+/,

    asm_content: $ => $.string_literal,

    asm_operand: $ => seq(
      ':',
      choice('out', 'in', 'clobber', 'inout'),
      '(',
      choice($.identifier, $.string_literal),
      ')',
    ),

    print_expression: $ => choice(
      $.print_call,
      $.println_call,
      $.println_bare,
      $.eprint_call,
      $.eprintln_call,
      $.print_shorthand,
    ),

    print_call: $ => seq('print', '(', $.interpolated_string, ')'),
    println_call: $ => prec(2, seq('println', '(', $.interpolated_string, ')')),
    println_bare: $ => prec(1, seq('println', $.interpolated_string)),
    eprint_call: $ => seq('eprint', '(', $.interpolated_string, ')'),
    eprintln_call: $ => seq('eprintln', '(', $.interpolated_string, ')'),

    print_shorthand: $ => prec.right(20, choice(
      seq($.string_literal, token.immediate('..')),     // print (no newline)
      prec(21, seq('!', $.string_literal, token.immediate('..'))), // eprint (must come before eprintln)
      seq('!', $.string_literal),       // eprintln
    )),

    interpolated_string: $ => seq(
      '"',
      repeat(choice(
        $.string_content,
        $.interpolation,
        $.escape_sequence,
      )),
      '"',
    ),

    interpolation: $ => seq(
      '{',
      $._expression,
      optional(seq(':', $.format_spec)),
      '}',
    ),

    format_spec: $ => /[^}]+/,

    input_expression: $ => prec.right(seq(
      '?',
      field('prompt', $.string_literal),
      optional(seq('(', field('variable', $.identifier), ')')),
    )),

    macro_invocation: $ => seq(
      field('name', $.identifier),
      '!',
      choice(
        seq('(', optional($.macro_arguments), ')'),
        seq('[', optional($.macro_arguments), ']'),
        seq('{', optional($.macro_arguments), '}'),
      ),
    ),

    macro_arguments: $ => /[^()\[\]{}]*((\([^()]*\)|\[[^\[\]]*\]|\{[^{}]*\})[^()\[\]{}]*)*/,

    // ============================================
    // Literals
    // ============================================
    _literal: $ => choice(
      $.integer_literal,
      $.float_literal,
      $.string_literal,
      $.char_literal,
      $.boolean_literal,
      $.null_literal,
    ),

    integer_literal: $ => token(choice(
      /0x[0-9a-fA-F_]+/,
      /0o[0-7_]+/,
      /0b[01_]+/,
      /[0-9][0-9_]*/,
    )),

    float_literal: $ => token(choice(
      /[0-9][0-9_]*\.[0-9][0-9_]*([eE][+-]?[0-9_]+)?/,
      /[0-9][0-9_]*[eE][+-]?[0-9_]+/,
    )),

    string_literal: $ => seq(
      '"',
      repeat(choice(
        $.string_content,
        $.escape_sequence,
      )),
      '"',
    ),

    string_content: $ => token.immediate(prec(1, /[^"\\{]+/)),

    escape_sequence: $ => token.immediate(seq(
      '\\',
      choice(
        /[\\'"nrt0]/,
        /x[0-9a-fA-F]{2}/,
        /u\{[0-9a-fA-F]+\}/,
        /[0-7]{1,3}/,
      ),
    )),

    char_literal: $ => seq(
      "'",
      choice(
        $.char_content,
        $.escape_sequence,
      ),
      "'",
    ),

    char_content: $ => token.immediate(/[^'\\]/),

    boolean_literal: $ => choice('true', 'false'),

    null_literal: $ => choice('null', 'NULL', 'nil'),

    // ============================================
    // Identifiers
    // ============================================
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});

/**
 * Creates a rule that matches a sequence separated by a delimiter.
 * @param {RuleOrLiteral} delimiter - The separator
 * @param {RuleOrLiteral} rule - The rule to repeat
 * @returns {SeqRule}
 */
function sepBy(delimiter, rule) {
  return optional(sepBy1(delimiter, rule));
}

/**
 * Creates a rule that matches one or more occurrences separated by a delimiter.
 * @param {RuleOrLiteral} delimiter - The separator
 * @param {RuleOrLiteral} rule - The rule to repeat
 * @returns {SeqRule}
 */
function sepBy1(delimiter, rule) {
  return seq(rule, repeat(seq(delimiter, rule)));
}
