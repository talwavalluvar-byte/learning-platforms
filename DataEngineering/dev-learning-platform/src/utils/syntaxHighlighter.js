/* ----------------------------------------------------
   DEVBASE2 - VS CODE / ANTIGRAVITY SYNTAX HIGHLIGHTER
   Colorizes C & C++ code with precise tokenization and punctuation high-contrast support
   ---------------------------------------------------- */

export function highlightCCode(code, lang = 'c') {
  if (!code) return '';

  const tokens = [];
  const addToken = (cls, text) => {
    const safeText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    tokens.push(`<span class="${cls}">${safeText}</span>`);
    return `___TOK_${tokens.length - 1}___`;
  };

  let str = code;

  if (lang === 'python') {
    // 1. Comments (# comment)
    str = str.replace(/(#[^\n]*)/g, (m) => addToken('syn-comment', m));

    // 2. Strings ("""docstring""", ''', "string", 'string')
    str = str.replace(/(""[\s\S]*?"""|'''[\s\S]*?'''|"([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, (m) => addToken('syn-string', m));

    // 3. Numbers
    str = str.replace(/\b(0x[0-9a-fA-F]+|\d+(?:\.\d+)?)\b/g, (m) => addToken('syn-num', m));

    // 4. Python Control & Structure Keywords
    const pyKeywords = [
      'def', 'class', 'import', 'from', 'as', 'if', 'elif', 'else', 'for', 'while',
      'in', 'return', 'try', 'except', 'finally', 'with', 'lambda', 'global', 'nonlocal',
      'pass', 'break', 'continue', 'raise', 'yield', 'assert', 'is', 'not', 'and', 'or'
    ];
    str = str.replace(new RegExp(`\\b(${pyKeywords.join('|')})\\b`, 'g'), (m) => addToken('syn-keyword', m));

    // 5. Constants & Built-in types
    const pyTypes = ['True', 'False', 'None', 'int', 'float', 'str', 'bool', 'list', 'dict', 'set', 'tuple'];
    str = str.replace(new RegExp(`\\b(${pyTypes.join('|')})\\b`, 'g'), (m) => addToken('syn-type-kw', m));

    // 6. Built-in Functions (print, input, range, len, append, etc.)
    const pyFuncs = ['print', 'input', 'range', 'len', 'enumerate', 'zip', 'map', 'filter', 'sum', 'max', 'min', 'append', 'pop'];
    str = str.replace(new RegExp(`\\b(${pyFuncs.join('|')})\\b`, 'g'), (m) => addToken('syn-func', m));

    // Any identifier followed by ( is a function call
    str = str.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, (m, p1) => {
      if (p1.startsWith('___TOK_')) return m;
      return addToken('syn-func', p1) + m.slice(p1.length);
    });

    // Identifiers
    str = str.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (m) => {
      if (m.startsWith('___TOK_')) return m;
      return addToken('syn-var', m);
    });

    // Operators
    str = str.replace(/(\/\/|\*\*|==|!=|<=|>=|\+=|-=|\*=|\/=|[\+\-\*\/%=\&\|\^!<>:\.,\(\)\[\]\{\}])/g, (m) => {
      if (m.startsWith('___TOK_')) return m;
      return addToken('syn-operator', m);
    });
  } else {
    // C, C++, and Java Highlighter
    // 1. Comments (Line & Multi-line)
    str = str.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, (m) => addToken('syn-comment', m));

    // 2. Preprocessor & Package/Import Directives (#include, package, import)
    str = str.replace(/(#(?:include|define|pragma|ifdef|ifndef|endif|else|elif)|import|package)\b/g, (m) => addToken('syn-preproc', m));

    // 3. Header / Package inclusions
    str = str.replace(/(<[a-zA-Z0-9_\.]+\>)/g, (m) => addToken('syn-header', m));

    // 4. Strings & Character literals
    str = str.replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, (m) => addToken('syn-string', m));

    // 5. Numbers (Hex, Floats, Integers)
    str = str.replace(/\b(0x[0-9a-fA-F]+|\d+(?:\.\d+)?f?L?)\b/g, (m) => addToken('syn-num', m));

    // 6. Control & Object Keywords (C/C++/Java)
    const controlKeywords = [
      'using', 'namespace', 'class', 'struct', 'public', 'private', 'protected',
      'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
      'new', 'delete', 'typedef', 'sizeof', 'const', 'static', 'enum', 'virtual', 'override',
      'extends', 'implements', 'interface', 'try', 'catch', 'finally', 'throw', 'throws', 'final'
    ];
    str = str.replace(new RegExp(`\\b(${controlKeywords.join('|')})\\b`, 'g'), (m) => addToken('syn-keyword', m));

    // 7. Primitive & Standard Type Keywords
    const typeKeywords = [
      'int', 'float', 'double', 'char', 'void', 'bool', 'boolean', 'long', 'short', 'unsigned', 'signed', 'byte', 'String'
    ];
    str = str.replace(new RegExp(`\\b(${typeKeywords.join('|')})\\b`, 'g'), (m) => addToken('syn-type-kw', m));

    // 8. Known Classes / Types
    const knownTypes = ['System', 'Scanner', 'String', 'ArrayList', 'List', 'Map', 'HashMap', 'Student', 'vector', 'string', 'Point', 'Node', 'std'];
    str = str.replace(new RegExp(`\\b(${knownTypes.join('|')})\\b`, 'g'), (m) => addToken('syn-type', m));

    // 9. Functions (println, printf, print, cout, cin, endl, etc.)
    const knownFuncs = ['println', 'print', 'printf', 'scanf', 'malloc', 'free', 'calloc', 'realloc', 'cout', 'cin', 'endl', 'main'];
    str = str.replace(new RegExp(`\\b(${knownFuncs.join('|')})\\b`, 'g'), (m) => addToken('syn-func', m));

    // Any identifier followed by ( is a function call
    str = str.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, (m, p1) => {
      if (p1.startsWith('___TOK_')) return m;
      return addToken('syn-func', p1) + m.slice(p1.length);
    });

    // 10. Identifiers
    str = str.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (m) => {
      if (m.startsWith('___TOK_')) return m;
      return addToken('syn-var', m);
    });

    // 11. Delimiters, Operators, Punctuation
    str = str.replace(/(<<|>>|->|::|\+\+|--|&&|\|\||==|!=|<=|>=|\*|\+|-|\/|%|=|\&|\||\^|!|<|>|\.|,|;|:|\(|\)|\[|\]|\{|\})/g, (m) => {
      if (m.startsWith('___TOK_')) return m;
      return addToken('syn-operator', m);
    });
  }

  // Restore tokens
  tokens.forEach((tokHtml, i) => {
    str = str.replace(`___TOK_${i}___`, tokHtml);
  });

  return str;
}
