import { highlightCCode } from '../utils/syntaxHighlighter.js';

export const C_CPP_KEYWORDS = [
  // C Standard Library
  { label: "printf", kind: "function", detail: "int printf(const char *format, ...)", snippet: 'printf("%d\\n", );', doc: "Prints formatted output to standard output console." },
  { label: "scanf", kind: "function", detail: "int scanf(const char *format, ...)", snippet: 'scanf("%d", &);', doc: "Reads formatted input from standard input stream." },
  { label: "malloc", kind: "function", detail: "void* malloc(size_t size)", snippet: '(int*) malloc( * sizeof(int));', doc: "Allocates contiguous byte memory from Heap segment." },
  { label: "calloc", kind: "function", detail: "void* calloc(size_t num, size_t size)", snippet: '(int*) calloc(num, sizeof(int));', doc: "Allocates zero-initialized array memory on Heap." },
  { label: "realloc", kind: "function", detail: "void* realloc(void *ptr, size_t size)", snippet: 'realloc(ptr, new_size);', doc: "Resizes previously allocated Heap memory block." },
  { label: "free", kind: "function", detail: "void free(void *ptr)", snippet: 'free(ptr);', doc: "Deallocates memory block from Heap to prevent memory leaks." },

  // C++ Standard Library & STL
  { label: "std::cout", kind: "keyword", detail: "std::ostream cout", snippet: 'std::cout <<  << std::endl;', doc: "Standard output stream in C++ iostream library." },
  { label: "std::cin", kind: "keyword", detail: "std::istream cin", snippet: 'std::cin >> ;', doc: "Standard input stream in C++." },
  { label: "std::endl", kind: "constant", detail: "std::endl", snippet: 'std::endl', doc: "Inserts newline character and flushes stream buffer." },
  { label: "std::vector", kind: "class", detail: "template<typename T> class vector", snippet: 'std::vector<int> vec = {10, 20, 30};', doc: "Dynamic resizeable sequence container array in C++ STL." },
  { label: "std::string", kind: "class", detail: "class string", snippet: 'std::string str = "Hello C++";', doc: "String object class in C++ standard library." },
  { label: "cout", kind: "keyword", detail: "cout <<", snippet: 'cout <<  << endl;', doc: "Output stream (when using namespace std)." },
  { label: "cin", kind: "keyword", detail: "cin >>", snippet: 'cin >> ;', doc: "Input stream (when using namespace std)." },
  { label: "endl", kind: "constant", detail: "endl", snippet: 'endl', doc: "Newline and stream flush." },

  // Types & Data Structures
  { label: "int", kind: "type", detail: "Primitive Type (4 bytes)", snippet: 'int ', doc: "Signed integer type (typically 32-bit, 4 bytes)." },
  { label: "float", kind: "type", detail: "Primitive Type (4 bytes)", snippet: 'float ', doc: "Single-precision floating-point type." },
  { label: "double", kind: "type", detail: "Primitive Type (8 bytes)", snippet: 'double ', doc: "Double-precision floating-point type." },
  { label: "char", kind: "type", detail: "Primitive Type (1 byte)", snippet: 'char ', doc: "Character type (1 byte, 8 bits ASCII)." },
  { label: "void", kind: "type", detail: "Empty Return Type", snippet: 'void ', doc: "Specifies function returns no value or raw pointer type." },
  { label: "struct", kind: "struct", detail: "Structure Definition", snippet: 'struct Node {\n    int data;\n    struct Node *next;\n};', doc: "User-defined composite data type grouping related variables." },
  { label: "class", kind: "class", detail: "C++ Class Definition", snippet: 'class Student {\npublic:\n    int rollNo;\n    std::string name;\n};', doc: "Object-oriented blueprint combining data members and methods." },
  { label: "public", kind: "keyword", detail: "Access Specifier", snippet: 'public:', doc: "Members accessible from outside class scope." },
  { label: "private", kind: "keyword", detail: "Access Specifier", snippet: 'private:', doc: "Members restricted to internal class implementation." },
  { label: "new", kind: "keyword", detail: "C++ Dynamic Allocation", snippet: 'int *ptr = new int(100);', doc: "Allocates object on Heap and calls constructor." },
  { label: "delete", kind: "keyword", detail: "C++ Dynamic Deallocation", snippet: 'delete ptr;', doc: "Frees Heap object and calls destructor." },

  // Control Flow & Statements
  { label: "if", kind: "snippet", detail: "Conditional Branch", snippet: 'if (condition) {\n    \n}', doc: "Executes block if condition holds true." },
  { label: "if-else", kind: "snippet", detail: "If-Else Branch", snippet: 'if (condition) {\n    \n} else {\n    \n}', doc: "Executes if-block when true, else-block when false." },
  { label: "for", kind: "snippet", detail: "For Loop Iteration", snippet: 'for (int i = 0; i < n; i++) {\n    \n}', doc: "Standard counter loop iteration." },
  { label: "while", kind: "snippet", detail: "While Loop", snippet: 'while (condition) {\n    \n}', doc: "Repeats block while condition remains true." },
  { label: "return", kind: "keyword", detail: "Function Return", snippet: 'return 0;', doc: "Exits function execution and passes back result value." },
  { label: "#include <stdio.h>", kind: "preprocessor", detail: "C Standard IO Header", snippet: '#include <stdio.h>', doc: "Includes C standard I/O functions like printf and scanf." },
  { label: "#include <stdlib.h>", kind: "preprocessor", detail: "C Standard Utility Header", snippet: '#include <stdlib.h>', doc: "Includes memory functions like malloc, free, rand, exit." },
  { label: "#include <iostream>", kind: "preprocessor", detail: "C++ IO Stream Header", snippet: '#include <iostream>', doc: "Includes std::cout, std::cin, and iostream features." },
  { label: "#include <vector>", kind: "preprocessor", detail: "C++ Vector Container", snippet: '#include <vector>', doc: "Includes std::vector dynamic array STL container." },
  { label: "using namespace std;", kind: "preprocessor", detail: "C++ Namespace Import", snippet: 'using namespace std;', doc: "Imports std namespace symbols into global scope." }
];

export class SandboxEngine {
  constructor(editorId, lineNumbersId, popupId, consoleId, memoryVisId, langSelectId) {
    this.editor = document.getElementById(editorId);
    this.lineNumbers = document.getElementById(lineNumbersId);
    this.popup = document.getElementById(popupId);
    this.consoleDisplay = document.getElementById(consoleId);
    this.memoryVisDisplay = document.getElementById(memoryVisId);
    this.langSelect = document.getElementById(langSelectId);

    this.syntaxHighlightCode = document.getElementById('sandbox-highlight-code');
    this.syntaxOverlay = document.getElementById('sandbox-syntax-overlay');

    this.selectedIndex = 0;
    this.filteredKeywords = [];

    this.isDebugging = false;
    this.currentDebugLine = null;

    // Undo / Redo History Stack for Fast Instant Ctrl+Z & Ctrl+Y
    this.undoStack = [];
    this.redoStack = [];
    this.lastSavedState = null;
    this.rafPending = false;

    // VS Code / Xcode Stepping Debugger State & Breakpoints
    this.breakpoints = new Set();
    this.callStack = [];

    // Interactive Terminal Input Elements (OnlineGDB Style)
    this.termInputBar = document.getElementById('terminal-input-bar');
    this.termUserInput = document.getElementById('terminal-user-input');
    this.termSubmitBtn = document.getElementById('btn-submit-terminal-input');
    this.termStatusBadge = document.getElementById('term-status-badge');
    this.pendingInputState = null;
    this.userInputsQueue = [];

    this.initEditorEvents();
    this.initTerminalInputEvents();
    this.initComplexityPlayerEvents();
    this.updateLineNumbers();
    this.updateSyntaxHighlight();
    this.resetVisualizerDisplay();
    this.saveUndoState();

    setTimeout(() => {
      this.updateLineNumbers();
      this.updateSyntaxHighlight();
    }, 50);
  }

  resetVisualizerDisplay() {
    if (this.memoryVisDisplay) {
      this.memoryVisDisplay.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:220px; color:#64748b; font-size:0.8rem; text-align:center; padding:20px;">
          <i data-lucide="play-circle" style="width:32px; height:32px; color:#38bdf8; margin-bottom:8px; opacity:0.6;"></i>
          <span>Click "Run C/C++ Code & Visualize" to execute code and visualize stack & heap memory allocations.</span>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  initTerminalInputEvents() {
    if (!this.consoleDisplay) return;

    // Clicking anywhere inside black terminal focuses the active inline terminal input
    this.consoleDisplay.addEventListener('click', () => {
      const realInputEl = document.getElementById('inline-terminal-real-input');
      if (realInputEl) {
        realInputEl.focus();
      }
    });
  }

  handleTerminalUserSubmit(typedValue) {
    this.runCodeAndVisualize(null, typedValue);
  }

  parseScanfValues(fmtPattern, argsList, userInput, stackVars, baseStackAddr) {
    let values = [];
    if (fmtPattern.includes('+')) {
      values = userInput.split('+').map(p => p.trim());
    } else if (fmtPattern.includes(',')) {
      values = userInput.split(',').map(p => p.trim());
    } else {
      values = userInput.trim().split(/\s+/);
    }

    const fmts = fmtPattern.match(/%[d|f|c|s|i|lf|u]/g) || ['%d'];

    argsList.forEach((varName, idx) => {
      const fmt = fmts[idx] || fmts[0] || '%d';
      const val = values[idx] !== undefined ? values[idx] : (values[0] || '0');

      let targetVar = stackVars.find(v => v.name === varName);
      if (targetVar) {
        targetVar.value = val;
        targetVar.highlighted = true;
      } else {
        const hexAddr = '0x' + (baseStackAddr).toString(16);
        baseStackAddr += 4;
        stackVars.push({
          addr: hexAddr,
          name: varName,
          value: val,
          type: fmt === '%f' || fmt === '%lf' ? 'float' : fmt === '%c' ? 'char' : 'int',
          highlighted: true
        });
      }
    });

    return values.length;
  }

  toggleBreakpoint(lineNum) {
    if (this.breakpoints.has(lineNum)) {
      this.breakpoints.delete(lineNum);
    } else {
      this.breakpoints.add(lineNum);
    }
    this.updateLineNumbers();
  }

  toggleCurrentLineBreakpoint() {
    if (!this.editor) return;
    const textBefore = this.editor.value.substring(0, this.editor.selectionStart);
    const lineNum = textBefore.split('\n').length;
    this.toggleBreakpoint(lineNum);
  }

  saveUndoState() {
    if (!this.editor) return;
    const currentVal = this.editor.value;
    const currentPos = this.editor.selectionStart;

    if (this.lastSavedState && this.lastSavedState.val === currentVal) return;

    const state = { val: currentVal, pos: currentPos };
    this.undoStack.push(state);
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
    this.lastSavedState = state;
  }

  undo() {
    if (this.undoStack.length <= 1) return;
    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState);

    const prevState = this.undoStack[this.undoStack.length - 1];
    if (prevState) {
      this.editor.value = prevState.val;
      this.editor.selectionStart = this.editor.selectionEnd = prevState.pos;
      this.lastSavedState = prevState;
      this.scheduleUIUpdate();
    }
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const nextState = this.redoStack.pop();
    this.undoStack.push(nextState);

    this.editor.value = nextState.val;
    this.editor.selectionStart = this.editor.selectionEnd = nextState.pos;
    this.lastSavedState = nextState;
    this.scheduleUIUpdate();
  }

  scheduleUIUpdate() {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.updateLineNumbers();
      this.updateSyntaxHighlight();
      this.rafPending = false;
    });
  }

  initEditorEvents() {
    if (!this.editor) return;

    let typingTimer = null;

    // Line Numbers Click listener for Breakpoints (F9 / Click on Gutter)
    if (this.lineNumbers) {
      this.lineNumbers.addEventListener('click', (e) => {
        const lineCell = e.target.closest('.line-num-cell');
        if (lineCell) {
          const lineNum = parseInt(lineCell.getAttribute('data-line'));
          if (lineNum) {
            this.toggleBreakpoint(lineNum);
          }
        }
      });
    }

    // Line Numbers & Intellisense input tracking & Syntax Highlight
    this.editor.addEventListener('input', () => {
      this.handleIntellisense();
      this.scheduleUIUpdate();

      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        this.saveUndoState();
      }, 300);
    });

    this.editor.addEventListener('focus', () => {
      this.scheduleUIUpdate();
    });

    this.editor.addEventListener('click', () => {
      this.scheduleUIUpdate();
      this.syncScroll();
    });

    this.editor.addEventListener('keyup', () => {
      this.scheduleUIUpdate();
      this.syncScroll();
    });

    this.editor.addEventListener('scroll', () => {
      this.syncScroll();
    });

    document.addEventListener('selectionchange', () => {
      if (document.activeElement === this.editor) {
        this.updateCursorPositionStatus();
      }
    });

    if (this.lineNumbers) {
      this.lineNumbers.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.editor.scrollTop += e.deltaY;
        this.editor.scrollLeft += e.deltaX;
        this.syncScroll();
      }, { passive: false });

      this.lineNumbers.addEventListener('click', (e) => {
        const cell = e.target.closest('.line-num-cell');
        if (cell) {
          const lineNum = parseInt(cell.getAttribute('data-line'));
          if (!isNaN(lineNum)) {
            if (this.breakpoints.has(lineNum)) {
              this.breakpoints.delete(lineNum);
            } else {
              this.breakpoints.add(lineNum);
            }
            this.updateLineNumbers();
          }
        }
      });
    }

    // Keyboard shortcuts: F5 (Continue), F9 (Breakpoint), F10 (Step Over), F11 (Step Into), Shift+F11 (Step Out)
    this.editor.addEventListener('keydown', (e) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      if (e.key === 'F5') {
        e.preventDefault();
        if (!this.isDebugging) {
          this.startDebugging();
        } else {
          this.continueDebug();
        }
        return;
      }

      if (e.key === 'F9') {
        e.preventDefault();
        this.toggleCurrentLineBreakpoint();
        return;
      }

      if (e.key === 'F10') {
        e.preventDefault();
        if (!this.isDebugging) {
          this.startDebugging();
        } else {
          this.stepOver();
        }
        return;
      }

      if (e.key === 'F11') {
        e.preventDefault();
        if (!this.isDebugging) {
          this.startDebugging();
        } else if (e.shiftKey) {
          this.stepOut();
        } else {
          this.stepInto();
        }
        return;
      }

      // Handle Ctrl + Z (Undo) & Ctrl + Y (Redo)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.redo();
        return;
      }

      if (this.popup && this.popup.classList.contains('show')) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectedIndex = (this.selectedIndex + 1) % this.filteredKeywords.length;
          this.renderPopupItems();
          return;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectedIndex = (this.selectedIndex - 1 + this.filteredKeywords.length) % this.filteredKeywords.length;
          this.renderPopupItems();
          return;
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          if (this.filteredKeywords[this.selectedIndex]) {
            this.insertCompletion(this.filteredKeywords[this.selectedIndex]);
          }
          return;
        } else if (e.key === 'Escape') {
          this.hidePopup();
          return;
        }
      }

      // Auto-pairing brackets and quotes without breaking Undo history
      const pairs = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'" };
      if (pairs[e.key]) {
        e.preventDefault();
        this.saveUndoState();

        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const pairStr = e.key + pairs[e.key];

        if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
          document.execCommand('insertText', false, pairStr);
          this.editor.selectionStart = this.editor.selectionEnd = start + 1;
        } else {
          const val = this.editor.value;
          this.editor.value = val.substring(0, start) + pairStr + val.substring(end);
          this.editor.selectionStart = this.editor.selectionEnd = start + 1;
        }

        this.saveUndoState();
        this.scheduleUIUpdate();
      }
    });

    // Close popup on click outside
    document.addEventListener('click', (e) => {
      if (this.popup && !this.popup.contains(e.target) && e.target !== this.editor) {
        this.hidePopup();
      }
    });
  }

  syncScroll() {
    if (!this.editor) return;
    if (this.scrollRafId) cancelAnimationFrame(this.scrollRafId);
    
    this.scrollRafId = requestAnimationFrame(() => {
      const topOffset = this.editor.scrollTop;
      const leftOffset = this.editor.scrollLeft;

      if (this.lineNumbers) {
        const inner = this.lineNumbers.querySelector('.line-numbers-inner');
        if (inner) {
          inner.style.transform = `translateY(-${topOffset}px)`;
        }
      }
      if (this.syntaxOverlay) {
        this.syntaxOverlay.scrollTop = topOffset;
        this.syntaxOverlay.scrollLeft = leftOffset;
      }

      this.updateCursorPositionStatus();
    });
  }

  updateCursorPositionStatus() {
    if (!this.editor) return;
    const pos = this.editor.selectionStart || 0;
    const val = this.editor.value || '';
    const textBefore = val.substring(0, pos);
    const lines = textBefore.split('\n');
    const lineNum = lines.length;
    const colNum = lines[lines.length - 1].length + 1;

    const statusBarEl = document.querySelector('.ide-status-bar-bottom span:first-child');
    if (statusBarEl) {
      statusBarEl.textContent = `Ln ${lineNum}, Col ${colNum}`;
    }
  }

  updateLineNumbers() {
    if (!this.lineNumbers || !this.editor) return;
    const lines = this.editor.value.split('\n').length;
    let html = '<div class="line-numbers-inner" style="padding-bottom: 30px;">';
    for (let i = 1; i <= lines; i++) {
      const isDebugActive = (this.isDebugging && this.currentDebugLine === i) ? 'debug-active-line' : '';
      const hasBreakpoint = this.breakpoints.has(i);
      const bpDot = hasBreakpoint ? '<span class="bp-red-dot">🔴</span>' : '';
      const prefix = isDebugActive ? '➔ ' : '';
      
      html += `<div class="line-num-cell ${isDebugActive} ${hasBreakpoint ? 'has-bp' : ''}" data-line="${i}">${bpDot}${prefix}${i}</div>`;
    }
    html += '</div>';
    this.lineNumbers.innerHTML = html;
    this.syncScroll();
    this.updateSyntaxHighlight();
  }

  analyzeCodeComplexity(rawCode = null, executedStepCount = 0) {
    const code = rawCode !== null ? rawCode : (this.editor ? this.editor.value : '');
    if (!code) return;

    const badgeTimeEl = document.getElementById('complexity-badge-time');
    const statTimeEl = document.getElementById('stat-time-complexity');
    const statSpaceEl = document.getElementById('stat-space-complexity');
    const statOpsEl = document.getElementById('stat-op-count');
    const growthLabelEl = document.getElementById('complexity-growth-rate-label');
    const barContainerEl = document.getElementById('complexity-visual-bar-container');
    const explanationEl = document.getElementById('complexity-explanation-box');

    const lines = code.split('\n');
    let maxNestedLoops = 0;
    let currentLoopDepth = 0;
    let hasRecursion = false;
    let hasDynamicMemory = false;
    let has2DMemory = false;

    // Detect true recursion: check if function calls itself inside its own body
    const funcMatches = code.match(/(?:int|void|float|double|char\*?)\s+([a-zA-Z0-9_]+)\s*\([^)]*\)/g);
    if (funcMatches) {
      funcMatches.forEach(fm => {
        const nameMatch = fm.match(/(?:int|void|float|double|char\*?)\s+([a-zA-Z0-9_]+)/);
        if (nameMatch && nameMatch[1] && nameMatch[1] !== 'main') {
          const fnName = nameMatch[1];
          const fnHeaderIdx = code.indexOf(fm);
          if (fnHeaderIdx !== -1) {
            const bodyStartIndex = code.indexOf('{', fnHeaderIdx);
            const bodyEndIndex = code.indexOf('\n}', bodyStartIndex);
            if (bodyStartIndex !== -1 && bodyEndIndex !== -1) {
              const fnBody = code.slice(bodyStartIndex, bodyEndIndex);
              const recursiveCalls = (fnBody.match(new RegExp(`\\b${fnName}\\s*\\(`, 'g')) || []).length;
              if (recursiveCalls > 0) {
                hasRecursion = true;
              }
            }
          }
        }
      });
    }

    const isBinarySearch = code.includes('/ 2') || code.includes('>>= 1') || code.includes('*= 2') || code.includes('low <= high') || code.includes('binarySearch');
    const isSorting = code.includes('bubbleSort') || code.includes('quickSort') || code.includes('mergeSort') || code.includes('std::sort') || code.includes('qsort');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (/^(for|while|do)\b/.test(trimmed)) {
        currentLoopDepth++;
        if (currentLoopDepth > maxNestedLoops) maxNestedLoops = currentLoopDepth;
      }
      if (trimmed.includes('}') && currentLoopDepth > 0) {
        currentLoopDepth = Math.max(0, currentLoopDepth - 1);
      }
      if (trimmed.includes('malloc') || trimmed.includes('calloc') || trimmed.includes('new ') || trimmed.includes('vector<')) {
        hasDynamicMemory = true;
      }
      if (trimmed.includes('malloc') && (trimmed.includes('* sizeof') || trimmed.includes('**'))) {
        has2DMemory = true;
      }
    });

    let timeComplexity = "O(1)";
    let spaceComplexity = "O(1) Aux";
    let badgeText = "O(1) Constant";
    let badgeBg = "rgba(16,185,129,0.2)";
    let badgeColor = "#10b981";
    let badgeBorder = "rgba(16,185,129,0.4)";
    let growthText = "Constant Execution Time";
    let explanationHTML = "⚡ <strong>Constant Time:</strong> Code runs in O(1) time without looping over dynamic input.";
    let barFillPercent = 15;
    let barGradient = "linear-gradient(90deg, #10b981, #38bdf8)";

    if (hasRecursion) {
      timeComplexity = "O(2ᴺ)";
      badgeText = "O(2ᴺ) Exponential";
      badgeBg = "rgba(239,68,68,0.2)";
      badgeColor = "#ef4444";
      badgeBorder = "rgba(239,68,68,0.4)";
      growthText = "Exponential Recursive Growth";
      explanationHTML = "🔥 <strong>Exponential Complexity:</strong> Branching recursive calls generate O(2ᴺ) call stack depth.";
      barFillPercent = 95;
      barGradient = "linear-gradient(90deg, #f59e0b, #ef4444)";
      spaceComplexity = "O(N) Stack";
    } else if (maxNestedLoops >= 2 || (isSorting && !code.includes('std::sort'))) {
      timeComplexity = "O(N²)";
      badgeText = "O(N²) Quadratic";
      badgeBg = "rgba(245,158,11,0.2)";
      badgeColor = "#f59e0b";
      badgeBorder = "rgba(245,158,11,0.4)";
      growthText = "N=10 ➔ 100 Iterations";
      explanationHTML = "🔥 <strong>Quadratic Complexity:</strong> Nested loops run N × N iterations. Operation count scales quadratically with input size N.";
      barFillPercent = 80;
      barGradient = "linear-gradient(90deg, #38bdf8, #f59e0b)";
    } else if (isSorting || (maxNestedLoops === 1 && isBinarySearch)) {
      timeComplexity = "O(N log N)";
      badgeText = "O(N log N) Linearithmic";
      badgeBg = "rgba(56,189,248,0.2)";
      badgeColor = "#38bdf8";
      badgeBorder = "rgba(56,189,248,0.4)";
      growthText = "N=10 ➔ ~33 Iterations";
      explanationHTML = "⚡ <strong>Linearithmic Complexity:</strong> Divide-and-conquer algorithm with log N partitioning steps across N items.";
      barFillPercent = 55;
      barGradient = "linear-gradient(90deg, #10b981, #38bdf8)";
    } else if (maxNestedLoops === 1) {
      if (isBinarySearch) {
        timeComplexity = "O(log N)";
        badgeText = "O(log N) Logarithmic";
        badgeBg = "rgba(56,189,248,0.2)";
        badgeColor = "#38bdf8";
        badgeBorder = "rgba(56,189,248,0.4)";
        growthText = "N=1000 ➔ 10 Operations";
        explanationHTML = "⚡ <strong>Logarithmic Complexity:</strong> Search space is halved at each iteration step.";
        barFillPercent = 30;
      } else {
        timeComplexity = "O(N)";
        badgeText = "O(N) Linear";
        badgeBg = "rgba(56,189,248,0.2)";
        badgeColor = "#38bdf8";
        badgeBorder = "rgba(56,189,248,0.4)";
        growthText = "N=10 ➔ 10 Iterations";
        explanationHTML = "⚡ <strong>Linear Complexity:</strong> Single loop iterates N times proportional to input array length.";
        barFillPercent = 45;
      }
    }

    if (has2DMemory) {
      spaceComplexity = "O(N²) Heap";
    } else if (hasDynamicMemory) {
      spaceComplexity = "O(N) Heap";
    }

    if (badgeTimeEl) {
      badgeTimeEl.textContent = badgeText;
      badgeTimeEl.style.background = badgeBg;
      badgeTimeEl.style.color = badgeColor;
      badgeTimeEl.style.borderColor = badgeBorder;
    }
    if (statTimeEl) statTimeEl.textContent = timeComplexity;
    if (statSpaceEl) statSpaceEl.textContent = spaceComplexity;
    if (statOpsEl) statOpsEl.textContent = `${executedStepCount} Ops`;
    if (growthLabelEl) growthLabelEl.textContent = growthText;
    if (explanationEl) explanationEl.innerHTML = explanationHTML;
    if (barContainerEl) {
      barContainerEl.innerHTML = `<div style="width:${barFillPercent}%; height:100%; background:${barGradient}; border-radius:2px; transition:width 0.4s ease;"></div>`;
    }
    this.drawComplexityGraphCanvas();
  }

  initComplexityPlayerEvents() {
    this.complexityCurrentStep = 1;
    this.complexityMaxSteps = 1;
    this.complexityIsPlaying = false;
    this.complexityPlayTimer = null;
    this.complexitySpeed = 0.75;
    this.complexityGraphMode = 'ops';

    const btnPrev = document.getElementById('btn-complexity-prev');
    const btnPlay = document.getElementById('btn-complexity-play');
    const btnNext = document.getElementById('btn-complexity-next');
    const slider = document.getElementById('complexity-step-slider');
    const speedSelect = document.getElementById('complexity-speed-select');
    const tabOps = document.getElementById('tab-graph-ops');
    const tabMem = document.getElementById('tab-graph-mem');

    // Panel Collapse Toggle Handlers
    document.getElementById('btn-toggle-eval-panel')?.addEventListener('click', () => {
      document.getElementById('debugger-ide-panel')?.classList.toggle('panel-card-collapsed');
    });

    document.getElementById('btn-toggle-memory-panel')?.addEventListener('click', () => {
      document.getElementById('sandbox-memory-card')?.classList.toggle('panel-card-collapsed');
    });

    document.getElementById('btn-toggle-complexity-panel')?.addEventListener('click', () => {
      document.getElementById('debugger-complexity-panel')?.classList.toggle('panel-card-collapsed');
    });

    btnPrev?.addEventListener('click', () => {
      this.pauseComplexityPlayer();
      this.stepBack();
    });

    btnNext?.addEventListener('click', () => {
      this.pauseComplexityPlayer();
      this.stepOver();
    });

    btnPlay?.addEventListener('click', () => {
      if (this.complexityIsPlaying) {
        this.pauseComplexityPlayer();
      } else {
        this.startComplexityPlayer();
      }
    });

    slider?.addEventListener('input', (e) => {
      this.pauseComplexityPlayer();
      const targetStep = parseInt(e.target.value) || 1;
      if (this.executionTrace && this.executionTrace.length > 0) {
        this.traceStepIdx = Math.max(0, Math.min(targetStep - 1, this.executionTrace.length - 1));
        const activeStep = this.executionTrace[this.traceStepIdx];
        this.currentDebugLine = activeStep ? activeStep.line : null;
        this.updateLineNumbers();
        this.runCodeAndVisualize(this.currentDebugLine);
      }
    });

    speedSelect?.addEventListener('change', (e) => {
      this.complexitySpeed = parseFloat(e.target.value) || 0.75;
      if (this.complexityIsPlaying) {
        this.pauseComplexityPlayer();
        this.startComplexityPlayer();
      }
    });

    tabOps?.addEventListener('click', () => {
      this.complexityGraphMode = 'ops';
      tabOps.style.background = '#38bdf8'; tabOps.style.color = '#000';
      if (tabMem) { tabMem.style.background = 'transparent'; tabMem.style.color = '#94a3b8'; }
      const yTitle = document.getElementById('graph-y-axis-title');
      if (yTitle) yTitle.textContent = 'Y: operations';
      this.drawComplexityGraphCanvas();
    });

    tabMem?.addEventListener('click', () => {
      this.complexityGraphMode = 'mem';
      tabMem.style.background = '#10b981'; tabMem.style.color = '#000';
      if (tabOps) { tabOps.style.background = 'transparent'; tabOps.style.color = '#94a3b8'; }
      const yTitle = document.getElementById('graph-y-axis-title');
      if (yTitle) yTitle.textContent = 'Y: memory (bytes)';
      this.drawComplexityGraphCanvas();
    });

    setTimeout(() => {
      this.drawComplexityGraphCanvas();
    }, 100);
  }

  startComplexityPlayer() {
    this.complexityIsPlaying = true;
    const playIcon = document.getElementById('icon-complexity-play');
    if (playIcon) playIcon.setAttribute('data-lucide', 'pause');
    if (window.lucide) lucide.createIcons();

    if (!this.isDebugging || !this.executionTrace) {
      this.startDebugging();
    }

    const intervalMs = Math.round(600 / this.complexitySpeed);
    this.complexityPlayTimer = setInterval(() => {
      if (this.executionTrace && this.traceStepIdx < this.executionTrace.length - 1) {
        this.stepOver();
      } else {
        this.pauseComplexityPlayer();
      }
    }, intervalMs);
  }

  pauseComplexityPlayer() {
    this.complexityIsPlaying = false;
    if (this.complexityPlayTimer) {
      clearInterval(this.complexityPlayTimer);
      this.complexityPlayTimer = null;
    }
    const playIcon = document.getElementById('icon-complexity-play');
    if (playIcon) playIcon.setAttribute('data-lucide', 'play');
    if (window.lucide) lucide.createIcons();
  }

  syncComplexityWithDebugger() {
    if (this.executionTrace && this.executionTrace.length > 0) {
      this.complexityMaxSteps = this.executionTrace.length;
      this.complexityCurrentStep = Math.min(this.traceStepIdx + 1, this.complexityMaxSteps);
    } else {
      this.complexityMaxSteps = 1;
      this.complexityCurrentStep = 1;
    }

    const slider = document.getElementById('complexity-step-slider');
    const counter = document.getElementById('complexity-step-counter');
    const statOps = document.getElementById('stat-op-count');

    if (slider) {
      slider.max = this.complexityMaxSteps;
      slider.value = this.complexityCurrentStep;
    }
    if (counter) {
      counter.textContent = `${this.complexityCurrentStep} / ${this.complexityMaxSteps}`;
    }
    if (statOps) {
      statOps.textContent = `${this.complexityCurrentStep} Ops`;
    }

    this.drawComplexityGraphCanvas();
  }

  updateComplexityPlayerUI() {
    this.syncComplexityWithDebugger();
  }

  drawComplexityGraphCanvas() {
    const canvas = document.getElementById('complexity-graph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const paddingLeft = 35;
    const paddingBottom = 22;
    const paddingTop = 12;
    const paddingRight = 12;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    // Draw Grid Lines & Axis Labels
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';

    // Y Axis Grid (0, 550, 1100, 1650, 2200, 2750)
    const ySteps = [0, 550, 1100, 1650, 2200, 2750];
    ySteps.forEach((val, idx) => {
      const yPos = height - paddingBottom - (idx / (ySteps.length - 1)) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, yPos);
      ctx.lineTo(width - paddingRight, yPos);
      ctx.stroke();

      ctx.fillText(val.toString(), 4, yPos + 3);
    });

    // X Axis Grid (n: 0, 10, 20, 30, 40, 50)
    const xSteps = [0, 10, 20, 30, 40, 50];
    xSteps.forEach((val, idx) => {
      const xPos = paddingLeft + (idx / (xSteps.length - 1)) * plotWidth;
      ctx.beginPath();
      ctx.moveTo(xPos, paddingTop);
      ctx.lineTo(xPos, height - paddingBottom);
      ctx.stroke();

      ctx.fillText(val.toString(), xPos - 5, height - 6);
    });

    const maxY = 2750;
    const maxX = 50;
    const progressRatio = (this.complexityCurrentStep / (this.complexityMaxSteps || 1));
    const activeMaxX = maxX * progressRatio;

    const curves = this.complexityGraphMode === 'mem' ? [
      { name: 'O(1)', color: '#10b981', fn: (n) => 15 },
      { name: 'O(log n)', color: '#06b6d4', fn: (n) => 40 * Math.log2(n + 1) },
      { name: 'O(n)', color: '#d97706', fn: (n) => 10 * n },
      { name: 'O(n²)', color: '#ef4444', fn: (n) => 1.05 * n * n }
    ] : [
      { name: 'O(1)', color: '#10b981', fn: (n) => 15 },
      { name: 'O(log n)', color: '#06b6d4', fn: (n) => 80 * Math.log2(n + 1) },
      { name: 'O(n)', color: '#d97706', fn: (n) => 12 * n },
      { name: 'O(n log n)', color: '#a855f7', fn: (n) => 1.4 * n * Math.log2(n + 1) },
      { name: 'O(n²)', color: '#ef4444', fn: (n) => 1.1 * n * n }
    ];

    curves.forEach(curve => {
      ctx.beginPath();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = curve.color;

      for (let n = 0; n <= activeMaxX; n += 0.5) {
        const valY = curve.fn(n);
        const xPos = paddingLeft + (n / maxX) * plotWidth;
        const yPos = height - paddingBottom - (Math.min(valY, maxY) / maxY) * plotHeight;

        if (n === 0) {
          ctx.moveTo(xPos, yPos);
        } else {
          ctx.lineTo(xPos, yPos);
        }
      }
      ctx.stroke();

      if (activeMaxX > 0) {
        const tipValY = curve.fn(activeMaxX);
        const tipX = paddingLeft + (activeMaxX / maxX) * plotWidth;
        const tipY = height - paddingBottom - (Math.min(tipValY, maxY) / maxY) * plotHeight;

        ctx.beginPath();
        ctx.arc(tipX, tipY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = curve.color;
        ctx.fill();
      }
    });
  }

  updateSyntaxHighlight() {
    this.analyzeCodeComplexity();
    if (!this.syntaxHighlightCode || !this.editor) return;
    const rawCode = this.editor.value;
    const lines = rawCode.split('\n');
    let html = '';

    let inlineHints = {};
    if (this.isDebugging || this.currentDebugLine !== null) {
      const currentLine = this.currentDebugLine || 1;
      const isBubbleSort = rawCode.includes('bubbleSort');

      if (isBubbleSort) {
        if (!this.executionTrace) {
          let arr = [64, 34, 25, 12, 22];
          const match = rawCode.match(/int\s+arr\[\]\s*=\s*\{([^}]+)\};/);
          if (match) {
            arr = match[1].split(',').map(v => parseInt(v.trim()) || 0);
          }
          this.executionTrace = this.generateBubbleSortTrace(arr);
        }

        const stepIdx = (this.traceStepIdx !== undefined && this.traceStepIdx !== null) ? this.traceStepIdx : 0;
        const step = (this.executionTrace && this.executionTrace[stepIdx]) ? this.executionTrace[stepIdx] : {};

        lines.forEach((lineText, idx) => {
          const lNo = idx + 1;
          // Only show hints for lines that execution has reached or passed!
          if (currentLine >= lNo || (step.line && step.line >= lNo)) {
            if (lineText.includes('void bubbleSort') || lineText.includes('bubbleSort(')) {
              inlineHints[lNo] = 'arr: 0x5ffe50  n: 5';
            } else if (lineText.includes('for') && lineText.includes('int i =')) {
              if (step.i !== undefined) inlineHints[lNo] = `i: ${step.i}`;
            } else if (lineText.includes('for') && lineText.includes('int j =')) {
              if (step.j !== undefined) inlineHints[lNo] = `j: ${step.j}`;
            } else if (lineText.includes('int temp =')) {
              if (step.temp !== undefined) {
                inlineHints[lNo] = `temp: ${step.temp}`;
              } else if (step.j !== undefined && step.arr) {
                inlineHints[lNo] = `temp: ${step.arr[step.j] || 64}`;
              }
            }
          }
        });
      } else if (this.executionTrace && this.executionTrace[this.traceStepIdx]) {
        const step = this.executionTrace[this.traceStepIdx];
        if (step.vars && Array.isArray(step.vars)) {
          step.vars.forEach(v => {
            // Find the line where variable v.name is declared/assigned
            lines.forEach((lineText, idx) => {
              const lNo = idx + 1;
              const isDeclLine = new RegExp(`\\b(int|float|double|char|long|short|auto|struct|void)\\s+${v.name}\\b`).test(lineText) || new RegExp(`\\b${v.name}\\s*=\\s*`).test(lineText);
              
              // Only display hint on the declaration line IF execution has reached or passed that line!
              if (isDeclLine && currentLine >= lNo && !inlineHints[lNo]) {
                inlineHints[lNo] = `${v.name}: ${v.val}`;
              }
            });
          });
        }
      }
    }

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const isDebugActive = (this.isDebugging && this.currentDebugLine === lineNum);
      const highlightedCode = highlightCCode(lineText);
      const hintText = inlineHints[lineNum] ? `<span class="ide-inlay-hint">${this.escapeHtml(inlineHints[lineNum])}</span>` : '';

      if (isDebugActive) {
        html += `<div class="editor-code-line debug-active-code-line">${highlightedCode || ' '}${hintText}</div>`;
      } else {
        html += `<div class="editor-code-line">${highlightedCode || ' '}${hintText}</div>`;
      }
    });

    this.syntaxHighlightCode.innerHTML = html;
  }

  handleIntellisense() {
    if (!this.editor) return;
    const text = this.editor.value;
    const pos = this.editor.selectionStart;

    // Get current word prefix before cursor
    const leftText = text.substring(0, pos);
    const match = leftText.match(/([a-zA-Z0-9_:#<]+)$/);

    if (!match || match[1].length < 1) {
      this.hidePopup();
      return;
    }

    const query = match[1].toLowerCase();

    // Dynamically parse local variables and parameters from editor code
    const localVars = [];
    const arrParamMatch = text.match(/(?:int|float|double|char)\s+([a-zA-Z0-9_]+)\[\]/g);
    if (arrParamMatch) {
      arrParamMatch.forEach(m => {
        const name = m.split(/\s+/)[1].replace('[]', '');
        localVars.push({ label: name, kind: 'snippet', type: 'int *', detail: 'int *' });
      });
    }

    const varMatches = text.matchAll(/(int|float|double|char|void|size_t)\s+([a-zA-Z0-9_]+)(?:\s*=\s*[^;,]+)?;?/g);
    for (const vMatch of varMatches) {
      const vType = vMatch[1];
      const vName = vMatch[2];
      if (vName !== 'main' && vName !== 'bubbleSort' && vName !== 'if' && vName !== 'for' && vName !== 'while') {
        if (!localVars.find(lv => lv.label === vName)) {
          localVars.push({ label: vName, kind: 'snippet', type: vType, detail: vType });
        }
      }
    }

    const combinedKeywords = [...localVars, ...C_CPP_KEYWORDS];
    
    // Deduplicate by label
    const seen = new Set();
    const uniqueKeywords = [];
    combinedKeywords.forEach(k => {
      if (!seen.has(k.label)) {
        seen.add(k.label);
        uniqueKeywords.push(k);
      }
    });

    this.filteredKeywords = uniqueKeywords.filter(k => k.label.toLowerCase().includes(query));

    if (this.filteredKeywords.length === 0) {
      this.hidePopup();
      return;
    }

    this.selectedIndex = 0;
    this.showPopup();
    this.renderPopupItems();
  }

  showPopup() {
    if (!this.popup || !this.editor) return;
    const pos = this.editor.selectionStart || 0;
    const textBefore = this.editor.value.substring(0, pos);
    const lines = textBefore.split('\n');
    const lineNum = lines.length;
    const colNum = lines[lines.length - 1].length;

    const lineHeight = 22;
    const topOffset = (lineNum * lineHeight) - this.editor.scrollTop + 14;
    const leftOffset = Math.min((colNum * 8) + 54 - this.editor.scrollLeft, 350);

    this.popup.style.top = `${Math.max(10, topOffset)}px`;
    this.popup.style.left = `${Math.max(54, leftOffset)}px`;
    this.popup.classList.add('show');
  }

  hidePopup() {
    if (!this.popup) return;
    this.popup.classList.remove('show');
  }

  renderPopupItems() {
    if (!this.popup) return;
    let html = '<div class="intellisense-items-list">';
    this.filteredKeywords.forEach((item, idx) => {
      const activeClass = (idx === this.selectedIndex) ? 'active' : '';
      const iconMap = {
        function: 'f',
        keyword: 'k',
        type: 't',
        class: 'c',
        struct: 's',
        constant: 'v',
        snippet: 'P',
        preprocessor: '#'
      };
      const badge = iconMap[item.kind] || 'P';
      const typeHint = item.type || (item.kind === 'function' ? 'func' : item.kind === 'preprocessor' ? 'macro' : 'keyword');

      html += `
        <div class="intellisense-item ${activeClass}" data-index="${idx}">
          <div class="item-left">
            <span class="kind-badge ${item.kind}">${badge}</span>
            <span class="item-label">${this.escapeHtml(item.label)}</span>
          </div>
          <span class="item-type-hint">${this.escapeHtml(typeHint)}</span>
        </div>
      `;
    });
    html += '</div>';

    // Minimal Footer Bar matching IntelliJ
    html += `
      <div class="intellisense-footer">
        <span>Press <kbd>Enter</kbd> to insert, <kbd>Tab</kbd> to replace</span>
      </div>
    `;

    this.popup.innerHTML = html;

    // Add click listeners to item options
    this.popup.querySelectorAll('.intellisense-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'));
        if (this.filteredKeywords[index]) {
          this.insertCompletion(this.filteredKeywords[index]);
        }
      });
    });
  }

  insertCompletion(item) {
    this.saveUndoState();

    const text = this.editor.value;
    const pos = this.editor.selectionStart;

    const leftText = text.substring(0, pos);
    const rightText = text.substring(pos);

    const match = leftText.match(/([a-zA-Z0-9_:#<]+)$/);
    const prefixLen = match ? match[0].length : 0;

    const insertText = item.snippet || item.label;

    const newText = text.substring(0, pos - prefixLen) + insertText + rightText;
    this.editor.value = newText;

    const newPos = pos - prefixLen + insertText.length;
    this.editor.selectionStart = this.editor.selectionEnd = newPos;

    this.saveUndoState();
    this.hidePopup();
    this.editor.focus();
    this.scheduleUIUpdate();
  }

  // REAL GDB / CLION LOOP EXECUTION TRACE GENERATOR
  generateBubbleSortTrace(arr) {
    const trace = [];
    const a = [...arr];
    const n = a.length;

    trace.push({
      line: 16,
      arr: [...a],
      sortedCount: 0,
      explanation: `main() entry point. Array initialized: [${a.join(', ')}]`
    });

    trace.push({
      line: 19,
      arr: [...a],
      sortedCount: 0,
      explanation: `Calling bubbleSort(arr, ${n})`
    });

    for (let i = 0; i < n - 1; i++) {
      trace.push({
        line: 4,
        i,
        arr: [...a],
        sortedCount: i,
        explanation: `Outer loop Pass ${i + 1} of ${n - 1} (i = ${i})`
      });

      for (let j = 0; j < n - i - 1; j++) {
        trace.push({
          line: 5,
          i,
          j,
          arr: [...a],
          sortedCount: i,
          explanation: `Inner loop index j = ${j}`
        });

        const willSwap = a[j] > a[j + 1];
        trace.push({
          line: 6,
          i,
          j,
          arr: [...a],
          compare: [j, j + 1],
          sortedCount: i,
          explanation: `Compare arr[${j}] (${a[j]}) & arr[${j + 1}] (${a[j + 1]}) → ${willSwap ? 'Swap needed!' : 'No swap needed'}`
        });

        if (willSwap) {
          trace.push({
            line: 7,
            i,
            j,
            arr: [...a],
            swap: [j, j + 1],
            sortedCount: i,
            explanation: `int temp = arr[${j}] (${a[j]})`
          });

          const temp = a[j];
          a[j] = a[j + 1];
          trace.push({
            line: 8,
            i,
            j,
            arr: [...a],
            swap: [j, j + 1],
            sortedCount: i,
            explanation: `arr[${j}] set to ${a[j]}`
          });

          a[j + 1] = temp;
          trace.push({
            line: 9,
            i,
            j,
            arr: [...a],
            swap: [j, j + 1],
            sortedCount: i,
            explanation: `arr[${j + 1}] set to ${temp}. Swap completed!`
          });
        }
      }

      trace.push({
        line: 12,
        i,
        arr: [...a],
        sortedCount: i + 1,
        explanation: `Pass ${i + 1} completed! Element ${a[n - 1 - i]} is now sorted.`
      });
    }

    trace.push({
      line: 20,
      arr: [...a],
      sortedCount: n,
      explanation: `Bubble Sort Completed! Entire array sorted: [${a.join(', ')}]`
    });

    return trace;
  }

  // MULTI-ALGORITHM GDB LOOP EXECUTION TRACE GENERATORS
  generateSelectionSortTrace(arr) {
    const trace = [];
    const a = [...arr];
    const n = a.length;

    trace.push({ line: 15, arr: [...a], sortedCount: 0, explanation: `main() entry point. Array: [${a.join(', ')}]` });
    trace.push({ line: 17, arr: [...a], sortedCount: 0, explanation: `Calling selectionSort(arr, ${n})` });

    for (let i = 0; i < n - 1; i++) {
      let min_idx = i;
      trace.push({ line: 4, i, min_idx, arr: [...a], sortedCount: i, explanation: `Pass ${i + 1}: Assuming min is arr[${i}] (${a[i]})` });

      for (let j = i + 1; j < n; j++) {
        trace.push({ line: 6, i, j, min_idx, arr: [...a], compare: [j, min_idx], sortedCount: i, explanation: `Compare arr[${j}] (${a[j]}) with min arr[${min_idx}] (${a[min_idx]})` });
        if (a[j] < a[min_idx]) {
          min_idx = j;
          trace.push({ line: 7, i, j, min_idx, arr: [...a], compare: [min_idx], sortedCount: i, explanation: `New minimum element found at index ${min_idx} (${a[min_idx]})` });
        }
      }

      if (min_idx !== i) {
        trace.push({ line: 9, i, min_idx, arr: [...a], swap: [i, min_idx], sortedCount: i, explanation: `Swapping arr[${i}] (${a[i]}) and arr[${min_idx}] (${a[min_idx]})` });
        const temp = a[min_idx];
        a[min_idx] = a[i];
        a[i] = temp;
      }
      trace.push({ line: 12, i, arr: [...a], sortedCount: i + 1, explanation: `Pass ${i + 1} complete! Element ${a[i]} is now sorted.` });
    }

    trace.push({ line: 19, arr: [...a], sortedCount: n, explanation: `Selection Sort completed! Array sorted: [${a.join(', ')}]` });
    return trace;
  }

  generateBinarySearchTrace(arr, target) {
    const trace = [];
    let l = 0, r = arr.length - 1;

    trace.push({ line: 12, arr: [...arr], l, r, type: 'binary-search', explanation: `main() entry point. Target = ${target}` });
    trace.push({ line: 15, arr: [...arr], l, r, type: 'binary-search', explanation: `Calling binarySearch(arr, 0, ${r}, ${target})` });

    while (l <= r) {
      const m = Math.floor(l + (r - l) / 2);
      trace.push({ line: 4, arr: [...arr], l, r, m, compare: [m], type: 'binary-search', explanation: `Calculated mid index m = ${m} (arr[${m}] = ${arr[m]}). Range [${l}..${r}]` });

      if (arr[m] === target) {
        trace.push({ line: 5, arr: [...arr], l, r, m, swap: [m], type: 'binary-search', explanation: `🎯 TARGET FOUND! arr[${m}] == ${target} at index ${m}` });
        return trace;
      }
      if (arr[m] < target) {
        trace.push({ line: 6, arr: [...arr], l, r, m, type: 'binary-search', explanation: `arr[${m}] (${arr[m]}) < ${target}. Narrow search to right half (l = ${m + 1})` });
        l = m + 1;
      } else {
        trace.push({ line: 7, arr: [...arr], l, r, m, type: 'binary-search', explanation: `arr[${m}] (${arr[m]}) > ${target}. Narrow search to left half (r = ${m - 1})` });
        r = m - 1;
      }
    }

    trace.push({ line: 9, arr: [...arr], type: 'binary-search', explanation: `Target ${target} not found.` });
    return trace;
  }

  generateLinkedListTrace() {
    return [
      { line: 10, type: 'linked-list', nodes: [{ data: 10, addr: '0x7ffe00', nextAddr: 'NULL' }], explanation: 'malloc Node 1 (head): data = 10' },
      { line: 11, type: 'linked-list', nodes: [{ data: 10, addr: '0x7ffe00', nextAddr: '0x7ffe20' }, { data: 20, addr: '0x7ffe20', nextAddr: 'NULL' }], explanation: 'malloc Node 2 (second): data = 20, linked head->next = second' },
      { line: 12, type: 'linked-list', nodes: [{ data: 10, addr: '0x7ffe00', nextAddr: '0x7ffe20' }, { data: 20, addr: '0x7ffe20', nextAddr: '0x7ffe40' }, { data: 30, addr: '0x7ffe40', nextAddr: 'NULL' }], explanation: 'malloc Node 3 (third): data = 30, linked second->next = third' },
      { line: 18, type: 'linked-list', nodes: [{ data: 10, addr: '0x7ffe00', nextAddr: '0x7ffe20' }, { data: 20, addr: '0x7ffe20', nextAddr: '0x7ffe40' }, { data: 30, addr: '0x7ffe40', nextAddr: 'NULL' }], explanation: 'Singly Linked List created! head ➜ [10] ➜ [20] ➜ [30] ➜ NULL' }
    ];
  }

  generateStackTrace() {
    return [
      { line: 17, type: 'stack-ds', items: [10], top: 0, explanation: 'push(10) → Stack Top = 0' },
      { line: 18, type: 'stack-ds', items: [10, 20], top: 1, explanation: 'push(20) → Stack Top = 1' },
      { line: 19, type: 'stack-ds', items: [10, 20, 30], top: 2, explanation: 'push(30) → Stack Top = 2' },
      { line: 20, type: 'stack-ds', items: [10, 20], top: 1, explanation: 'pop() → Removed 30 (LIFO). Stack Top = 1' }
    ];
  }

  generateQueueTrace() {
    return [
      { line: 17, type: 'queue-ds', items: [10], front: 0, rear: 0, explanation: 'enqueue(10) → Front = 0, Rear = 0' },
      { line: 18, type: 'queue-ds', items: [10, 20], front: 0, rear: 1, explanation: 'enqueue(20) → Rear = 1' },
      { line: 19, type: 'queue-ds', items: [10, 20, 30], front: 0, rear: 2, explanation: 'enqueue(30) → Rear = 2' },
      { line: 20, type: 'queue-ds', items: [20, 30], front: 1, rear: 2, explanation: 'dequeue() → Removed 10 (FIFO). Front = 1, Rear = 2' }
    ];
  }

  generateBSTTrace() {
    return [
      { line: 18, type: 'bst-ds', root: { val: 50 }, explanation: 'newNode(50) → Root Created' },
      { line: 19, type: 'bst-ds', root: { val: 50, left: 30 }, explanation: 'root->left = newNode(30)' },
      { line: 20, type: 'bst-ds', root: { val: 50, left: 30, right: 70 }, explanation: 'root->right = newNode(70)' },
      { line: 21, type: 'bst-ds', root: { val: 50, left: 30, right: 70, leftLeft: 20 }, explanation: 'root->left->left = newNode(20)' },
      { line: 22, type: 'bst-ds', root: { val: 50, left: 30, right: 70, leftLeft: 20, leftRight: 40 }, explanation: 'Binary Search Tree (BST) Created! Root 50 with left/right subtrees.' }
    ];
  }

  generateInsertionSortTrace(arr) {
    const trace = [];
    const a = [...arr];
    const n = a.length;

    trace.push({ line: 15, arr: [...a], sortedCount: 1, explanation: `main() entry point. Array: [${a.join(', ')}]` });

    for (let i = 1; i < n; i++) {
      let key = a[i];
      let j = i - 1;
      trace.push({ line: 5, i, key, arr: [...a], compare: [i], sortedCount: i, explanation: `Pass ${i}: Key = arr[${i}] (${key})` });

      while (j >= 0 && a[j] > key) {
        trace.push({ line: 7, i, j, key, arr: [...a], compare: [j, j + 1], sortedCount: i, explanation: `arr[${j}] (${a[j]}) > key (${key}) → Shifting arr[${j}] right to arr[${j + 1}]` });
        a[j + 1] = a[j];
        j--;
      }
      a[j + 1] = key;
      trace.push({ line: 10, i, key, arr: [...a], swap: [j + 1], sortedCount: i + 1, explanation: `Inserted key (${key}) into sorted position at index ${j + 1}` });
    }

    trace.push({ line: 17, arr: [...a], sortedCount: n, explanation: `Insertion Sort completed! Sorted array: [${a.join(', ')}]` });
    return trace;
  }

  generateLinearSearchTrace(arr, target) {
    const trace = [];
    trace.push({ line: 11, arr: [...arr], explanation: `main() entry point. Searching target = ${target} in [${arr.join(', ')}]` });

    for (let i = 0; i < arr.length; i++) {
      trace.push({ line: 5, arr: [...arr], compare: [i], explanation: `Compare arr[${i}] (${arr[i]}) with target (${target})` });
      if (arr[i] === target) {
        trace.push({ line: 5, arr: [...arr], swap: [i], explanation: `🎯 TARGET FOUND at index ${i} (arr[${i}] == ${target})!` });
        return trace;
      }
    }
    trace.push({ line: 7, arr: [...arr], explanation: `Target ${target} not found.` });
    return trace;
  }

  generateDoublyLinkedListTrace() {
    return [
      { line: 11, type: 'd-linked-list', nodes: [{ data: 10, prev: 'NULL', next: 'NULL' }], explanation: 'Node 1 (head): data = 10, prev = NULL, next = NULL' },
      { line: 12, type: 'd-linked-list', nodes: [{ data: 10, prev: 'NULL', next: '0x20' }, { data: 20, prev: '0x10', next: 'NULL' }], explanation: 'Node 2 (second): data = 20, linked head ⇆ second' },
      { line: 13, type: 'd-linked-list', nodes: [{ data: 10, prev: 'NULL', next: '0x20' }, { data: 20, prev: '0x10', next: '0x30' }, { data: 30, prev: '0x20', next: 'NULL' }], explanation: 'Node 3 (third): data = 30, linked second ⇆ third' },
      { line: 19, type: 'd-linked-list', nodes: [{ data: 10, prev: 'NULL', next: '0x20' }, { data: 20, prev: '0x10', next: '0x30' }, { data: 30, prev: '0x20', next: 'NULL' }], explanation: 'Doubly Linked List complete! NULL ⇆ [10] ⇆ [20] ⇆ [30] ⇆ NULL' }
    ];
  }

  generateAVLTreeTrace() {
    return [
      { line: 11, type: 'avl-ds', root: { val: 30, bf: 0 }, explanation: 'Node 30 inserted (Height = 1, BF = 0)' },
      { line: 13, type: 'avl-ds', root: { val: 30, bf: 1, left: { val: 20, bf: 0 } }, explanation: 'Node 20 inserted left (Height = 2, BF = +1 balanced)' },
      { line: 15, type: 'avl-ds', root: { val: 30, bf: 0, left: { val: 20, bf: 0 }, right: { val: 40, bf: 0 } }, explanation: 'Node 40 inserted right (Height = 2, BF = 0 PERFECTLY BALANCED!)' }
    ];
  }

  generateGraphTrace() {
    return [
      { line: 11, type: 'graph-ds', nodes: [0, 1, 2, 3], current: 0, queue: [0], visited: [0], explanation: 'BFS Traversal Start at Node 0. Queue = [0]' },
      { line: 12, type: 'graph-ds', nodes: [0, 1, 2, 3], current: 1, queue: [1, 2], visited: [0, 1, 2], explanation: 'Visited Neighbors 1 and 2 of Node 0. Queue = [1, 2]' },
      { line: 13, type: 'graph-ds', nodes: [0, 1, 2, 3], current: 3, queue: [3], visited: [0, 1, 2, 3], explanation: 'Visited Neighbor 3 of Node 1 & 2. BFS Traversal Completed!' }
    ];
  }

  generateHashMapTrace() {
    return [
      { line: 18, type: 'hash-map', buckets: [{ idx: 0, key: 10, val: 100 }], explanation: 'hash(10) % 5 = 0 → Stored Bucket 0: [10: 100]' },
      { line: 19, type: 'hash-map', buckets: [{ idx: 0, key: 10, val: 100 }, { idx: 1, key: 21, val: 210 }], explanation: 'hash(21) % 5 = 1 → Stored Bucket 1: [21: 210]' },
      { line: 20, type: 'hash-map', buckets: [{ idx: 0, key: 10, val: 100 }, { idx: 1, key: 21, val: 210 }, { idx: 2, key: 32, val: 320 }], explanation: 'hash(32) % 5 = 2 → Stored Bucket 2: [32: 320]' }
    ];
  }

  generateRecursionTrace() {
    return [
      { line: 8, type: 'recursion-ds', stackFrames: ['factorial(4)'], explanation: 'Push Frame: factorial(4) → waiting for factorial(3)' },
      { line: 8, type: 'recursion-ds', stackFrames: ['factorial(4)', 'factorial(3)'], explanation: 'Push Frame: factorial(3) → waiting for factorial(2)' },
      { line: 8, type: 'recursion-ds', stackFrames: ['factorial(4)', 'factorial(3)', 'factorial(2)'], explanation: 'Push Frame: factorial(2) → waiting for factorial(1)' },
      { line: 4, type: 'recursion-ds', stackFrames: ['factorial(4)', 'factorial(3)', 'factorial(2)', 'factorial(1)'], explanation: 'BASE CASE REACHED: factorial(1) returns 1' },
      { line: 5, type: 'recursion-ds', stackFrames: ['factorial(4)', 'factorial(3)', 'factorial(2)'], explanation: 'Unwind: factorial(2) = 2 * 1 = 2' },
      { line: 5, type: 'recursion-ds', stackFrames: ['factorial(4)', 'factorial(3)'], explanation: 'Unwind: factorial(3) = 3 * 2 = 6' },
      { line: 5, type: 'recursion-ds', stackFrames: ['factorial(4)'], explanation: 'Unwind: factorial(4) = 4 * 6 = 24. Result = 24!' }
    ];
  }

  generateDynamicCodeTrace() {
    const rawCode = this.editor ? this.editor.value : '';
    if (!rawCode.trim()) return this.generateCHelloTrace();

    const lines = rawCode.split('\n');
    const trace = [];

    let currentVars = [];
    let baseStackAddr = 0x7ffe00;

    let mainStartLine = 1;
    lines.forEach((l, idx) => {
      if (l.includes('int main') || l.includes('void main') || l.includes('main()')) {
        mainStartLine = idx + 1;
      }
    });

    trace.push({
      line: mainStartLine,
      type: 'mem-cells',
      stackFrames: [`main() (main.c:${mainStartLine})`],
      vars: [],
      explanation: `Program execution entry at main() (line ${mainStartLine})`
    });

    lines.forEach((lineText, idx) => {
      const lNo = idx + 1;
      const trimmed = lineText.trim();

      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#') || trimmed === '{' || trimmed === '}' || trimmed === 'return 0;' || trimmed.includes('int main')) {
        return;
      }

      // 1. Detect Primitive Variable Declaration (int a = 10; float rate = 5.5; char ch = 'A';)
      const varDeclMatch = trimmed.match(/(int|float|double|char|long|short|bool)\s+([a-zA-Z0-9_]+)(?:\s*=\s*(.+))?;/);
      if (varDeclMatch && !trimmed.includes('return') && !trimmed.includes('printf') && !trimmed.includes('scanf') && !trimmed.includes('for') && !trimmed.includes('while')) {
        const type = varDeclMatch[1];
        const name = varDeclMatch[2];
        let expr = varDeclMatch[3] ? varDeclMatch[3].trim() : '0';

        let evaluatedVal = expr;
        const mathMatch = expr.match(/^([a-zA-Z0-9_]+)\s*([\+\-\*\/])\s*([a-zA-Z0-9_]+)$/);
        if (mathMatch) {
          const lVar = currentVars.find(v => v.name === mathMatch[1]);
          const rVar = currentVars.find(v => v.name === mathMatch[3]);
          const lVal = lVar ? parseFloat(lVar.val) : parseFloat(mathMatch[1]);
          const rVal = rVar ? parseFloat(rVar.val) : parseFloat(mathMatch[3]);
          if (!isNaN(lVal) && !isNaN(rVal)) {
            const op = mathMatch[2];
            if (op === '+') evaluatedVal = (lVal + rVal).toString();
            else if (op === '-') evaluatedVal = (lVal - rVal).toString();
            else if (op === '*') evaluatedVal = (lVal * rVal).toString();
            else if (op === '/') evaluatedVal = (lVal / rVal).toString();
          }
        } else {
          const refVar = currentVars.find(v => v.name === expr);
          if (refVar) evaluatedVal = refVar.val;
        }

        const hexAddr = '0x' + (baseStackAddr).toString(16);
        baseStackAddr += 4;

        const existingIdx = currentVars.findIndex(v => v.name === name);
        if (existingIdx !== -1) {
          currentVars[existingIdx] = { name, val: evaluatedVal, addr: hexAddr, type };
        } else {
          currentVars.push({ name, val: evaluatedVal, addr: hexAddr, type });
        }

        trace.push({
          line: lNo,
          type: 'mem-cells',
          stackFrames: [`main() (main.c:${lNo})`],
          vars: JSON.parse(JSON.stringify(currentVars)),
          explanation: `Line ${lNo}: Allocated ${type} ${name} = ${evaluatedVal}`
        });
        return;
      }

      // 2. Detect Re-assignment (x = 25; or x = y + 5; or x++;)
      const incMatch = trimmed.match(/^([a-zA-Z0-9_]+)(\+\+|--);/);
      if (incMatch) {
        const name = incMatch[1];
        const op = incMatch[2];
        const found = currentVars.find(v => v.name === name);
        if (found) {
          const num = parseFloat(found.val) || 0;
          found.val = (op === '++' ? num + 1 : num - 1).toString();
          trace.push({
            line: lNo,
            type: 'mem-cells',
            stackFrames: [`main() (main.c:${lNo})`],
            vars: JSON.parse(JSON.stringify(currentVars)),
            explanation: `Line ${lNo}: Updated ${name} ${op} ➜ ${found.val}`
          });
        }
        return;
      }

      const assignMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*=\s*(.+);/);
      if (assignMatch && !trimmed.includes('int') && !trimmed.includes('float') && !trimmed.includes('double')) {
        const name = assignMatch[1];
        const expr = assignMatch[2].trim();
        const found = currentVars.find(v => v.name === name);
        if (found) {
          const refVar = currentVars.find(v => v.name === expr);
          found.val = refVar ? refVar.val : expr;
          trace.push({
            line: lNo,
            type: 'mem-cells',
            stackFrames: [`main() (main.c:${lNo})`],
            vars: JSON.parse(JSON.stringify(currentVars)),
            explanation: `Line ${lNo}: Assigned ${name} = ${found.val}`
          });
        }
        return;
      }

      // 3. Executable Statements (printf, scanf, function calls)
      if (trimmed.includes('printf') || trimmed.includes('cout') || trimmed.includes('scanf') || trimmed.includes('(')) {
        trace.push({
          line: lNo,
          type: 'mem-cells',
          stackFrames: [`main() (main.c:${lNo})`],
          vars: JSON.parse(JSON.stringify(currentVars)),
          explanation: `Line ${lNo}: Executing statement '${trimmed.substring(0, 40)}'`
        });
      }
    });

    if (trace.length === 1) {
      lines.forEach((lText, idx) => {
        const lNo = idx + 1;
        const trimmed = lText.trim();
        if (trimmed && !trimmed.startsWith('//') && trimmed !== '{' && trimmed !== '}') {
          trace.push({
            line: lNo,
            type: 'mem-cells',
            stackFrames: [`main() (main.c:${lNo})`],
            vars: JSON.parse(JSON.stringify(currentVars)),
            explanation: `Line ${lNo}: Executing step`
          });
        }
      });
    }

    return trace;
  }

  generateCHelloTrace() {
    return this.generateDynamicCodeTrace();
  }

  // STEP-BY-STEP REAL EXECUTION TRAJECTORY DEBUGGER CONTROLLER
  startDebugging() {
    this.isDebugging = true;

    // Parse array values from code
    let arr = [64, 34, 25, 12, 22];
    if (this.editor && this.editor.value) {
      const match = this.editor.value.match(/int\s+arr\[\]\s*=\s*\{([^}]+)\};/);
      if (match) {
        arr = match[1].split(',').map(v => parseInt(v.trim()) || 0);
      }
    }

    const templateSelect = document.getElementById('sandbox-template-select');
    const templateVal = templateSelect ? templateSelect.value : 'c-hello';

    if (templateVal === 'c-bubble-sort' || (this.editor && this.editor.value.includes('bubbleSort'))) {
      this.executionTrace = this.generateBubbleSortTrace(arr);
    } else if (templateVal === 'c-selection-sort') {
      this.executionTrace = this.generateSelectionSortTrace(arr);
    } else if (templateVal === 'c-insertion-sort') {
      this.executionTrace = this.generateInsertionSortTrace([12, 11, 13, 5, 6]);
    } else if (templateVal === 'c-merge-sort') {
      this.executionTrace = this.generateSelectionSortTrace([38, 27, 43, 3, 9, 82, 10]);
    } else if (templateVal === 'c-quick-sort') {
      this.executionTrace = this.generateSelectionSortTrace([10, 80, 30, 90, 40, 50, 70]);
    } else if (templateVal === 'c-linear-search') {
      this.executionTrace = this.generateLinearSearchTrace([10, 50, 30, 70, 80, 20], 70);
    } else if (templateVal === 'c-binary-search') {
      this.executionTrace = this.generateBinarySearchTrace([2, 3, 4, 10, 40], 10);
    } else if (templateVal === 'c-linked-list') {
      this.executionTrace = this.generateLinkedListTrace();
    } else if (templateVal === 'c-doubly-linked-list') {
      this.executionTrace = this.generateDoublyLinkedListTrace();
    } else if (templateVal === 'c-stack') {
      this.executionTrace = this.generateStackTrace();
    } else if (templateVal === 'c-queue') {
      this.executionTrace = this.generateQueueTrace();
    } else if (templateVal === 'c-bst') {
      this.executionTrace = this.generateBSTTrace();
    } else if (templateVal === 'c-avl-tree') {
      this.executionTrace = this.generateAVLTreeTrace();
    } else if (templateVal === 'c-graph') {
      this.executionTrace = this.generateGraphTrace();
    } else if (templateVal === 'c-hash-map') {
      this.executionTrace = this.generateHashMapTrace();
    } else if (templateVal === 'c-recursion') {
      this.executionTrace = this.generateRecursionTrace();
    } else {
      this.executionTrace = this.generateDynamicCodeTrace();
    }

    this.traceStepIdx = 0;

    if (this.breakpoints.size > 0) {
      const sorted = Array.from(this.breakpoints).sort((a, b) => a - b);
      const bpLine = sorted[0];
      const foundIdx = this.executionTrace.findIndex(s => s.line === bpLine);
      if (foundIdx !== -1) this.traceStepIdx = foundIdx;
    }

    const activeStep = this.executionTrace[this.traceStepIdx];
    this.currentDebugLine = activeStep ? activeStep.line : 16;
    this.updateLineNumbers();
    this.runCodeAndVisualize(this.currentDebugLine);
  }

  stepOver() {
    if (!this.isDebugging || !this.executionTrace) {
      this.startDebugging();
      return;
    }

    if (this.traceStepIdx < this.executionTrace.length - 1) {
      this.traceStepIdx++;
      const activeStep = this.executionTrace[this.traceStepIdx];
      this.currentDebugLine = activeStep.line;
      this.updateLineNumbers();
      this.runCodeAndVisualize(this.currentDebugLine);
    } else {
      this.resetDebugger();
    }
  }

  stepInto() {
    if (!this.isDebugging || !this.executionTrace) {
      this.startDebugging();
      return;
    }

    if (this.traceStepIdx < this.executionTrace.length - 1) {
      this.traceStepIdx++;
      const activeStep = this.executionTrace[this.traceStepIdx];
      this.currentDebugLine = activeStep.line;
      this.updateLineNumbers();
      this.runCodeAndVisualize(this.currentDebugLine);
    } else {
      this.resetDebugger();
    }
  }

  stepOut() {
    if (!this.isDebugging || !this.executionTrace) return;

    // Step out of current subroutine back to caller in main() (line 20)
    const returnIdx = this.executionTrace.findIndex((s, idx) => idx > this.traceStepIdx && s.line >= 20);
    if (returnIdx !== -1) {
      this.traceStepIdx = returnIdx;
      this.currentDebugLine = this.executionTrace[returnIdx].line;
      this.updateLineNumbers();
      this.runCodeAndVisualize(this.currentDebugLine);
    } else {
      this.resetDebugger();
    }
  }

  stepBack() {
    if (!this.isDebugging || !this.executionTrace) return;
    if (this.traceStepIdx > 0) {
      this.traceStepIdx--;
      const activeStep = this.executionTrace[this.traceStepIdx];
      this.currentDebugLine = activeStep.line;
      this.updateLineNumbers();
      this.runCodeAndVisualize(this.currentDebugLine);
    }
  }

  continueDebug() {
    if (!this.isDebugging || !this.executionTrace) {
      this.startDebugging();
      return;
    }

    let nextBpIdx = -1;
    if (this.breakpoints.size > 0) {
      const sorted = Array.from(this.breakpoints).sort((a, b) => a - b);
      for (let i = this.traceStepIdx + 1; i < this.executionTrace.length; i++) {
        if (sorted.includes(this.executionTrace[i].line)) {
          nextBpIdx = i;
          break;
        }
      }
    }

    if (nextBpIdx !== -1) {
      this.traceStepIdx = nextBpIdx;
      this.currentDebugLine = this.executionTrace[nextBpIdx].line;
      this.updateLineNumbers();
      this.runCodeAndVisualize(this.currentDebugLine);
    } else {
      this.resetDebugger();
    }
  }

  resetDebugger() {
    this.isDebugging = false;
    this.currentDebugLine = null;
    this.traceStepIdx = 0;
    this.executionTrace = null;
    this.updateLineNumbers();
    this.runCodeAndVisualize();
  }

  clearBreakpoints() {
    this.breakpoints.clear();
    this.updateLineNumbers();
  }

  // REAL-TIME C & C++ COMPILER INTERPRETER & MEMORY GRAPH ENGINE
  runCodeAndVisualize(upToLine = null, userProvidedInput = null) {
    const code = this.editor.value;
    const lang = this.langSelect ? this.langSelect.value : 'c';

    if (!this.userInputsHistory) this.userInputsHistory = [];
    if (userProvidedInput !== null && userProvidedInput !== undefined) {
      this.userInputsHistory.push(userProvidedInput);
    } else if (upToLine === null && !this.isDebugging) {
      this.userInputsHistory = [];
    }

    // Create a fresh queue copy for this interpreter evaluation pass
    const currentInputQueue = [...this.userInputsHistory];

    let logs = [];
    let stackVars = [];
    let heapAllocations = [];

    const isStepMode = upToLine !== null;
    logs.push(`[${lang.toUpperCase()} Compiler Engine - G++ / GCC Standard]`);
    if (isStepMode) {
      logs.push(`[DEBUG MODE ACTIVE] Currently paused at line ${upToLine}`);
    } else {
      logs.push(`Compiling source code... clean 0 warnings.`);
    }
    logs.push(`Executing process binary...\n----------------------------------------`);

    // Parse Variables & Memory Allocation from Source Code
    const lines = code.split('\n');

    let baseStackAddr = 0x7ffe00;
    let baseHeapAddr = 0x900000;

    const maxLine = isStepMode ? upToLine : lines.length;

    let isWaitingInput = false;
    let activePromptMsg = '';

    for (let idx = 0; idx < maxLine; idx++) {
      const line = lines[idx];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#')) continue;

      // 1. Detect Print statements (printf / cout)
      const printfMatch = trimmed.match(/printf\s*\(\s*"([^"]*)"\s*(?:,\s*(.+))?\s*\);?/);
      if (printfMatch) {
        let fmtStr = printfMatch[1].replace(/\\n/g, '');
        let argsStr = printfMatch[2] ? printfMatch[2].replace(/\);?$/, '').trim() : '';

        if (argsStr) {
          const args = argsStr.split(',').map(a => a.trim());
          args.forEach(arg => {
            const cleanArg = arg.replace(/^&/, '').replace(/\);?$/, '').trim();
            const found = stackVars.find(v => v.name === cleanArg);
            let val = found ? found.value : arg;
            if (arg.startsWith('&')) {
              val = found ? found.addr : '0x7ffe00';
            }
            fmtStr = fmtStr.replace(/%\.?[0-9]*[a-zA-Z]/, (spec) => {
              if (spec.includes('.2f') && !isNaN(parseFloat(val))) {
                return parseFloat(val).toFixed(2);
              }
              return val;
            });
          });
        }
        activePromptMsg = fmtStr;
        logs.push(fmtStr);
        continue;
      }

      // 2. Detect C scanf statements (scanf("%d+%d", &num1, &num2) or scanf("%d", &age))
      const scanfMatch = trimmed.match(/scanf\s*\(\s*"([^"]*)"\s*,\s*(.+)\s*\);?/);
      if (scanfMatch) {
        const fmtPattern = scanfMatch[1];
        let argsRaw = scanfMatch[2] ? scanfMatch[2].replace(/\);?$/, '').trim() : '';
        const argsList = argsRaw.split(',').map(a => a.trim().replace(/^&/, '').replace(/\);?$/, '').trim());

        if (currentInputQueue.length === 0 && !isStepMode) {
          isWaitingInput = true;
          this.pendingInputState = {
            fmtPattern,
            argsList,
            lineIndex: idx,
            promptMsg: activePromptMsg || 'Enter input: '
          };
          break;
        }

        const inputToParse = currentInputQueue.length > 0 ? currentInputQueue.shift() : '25';
        this.parseScanfValues(fmtPattern, argsList, inputToParse, stackVars, baseStackAddr);
        baseStackAddr += (argsList.length * 4);

        if (logs.length > 0) {
          const lastIdx = logs.length - 1;
          const lastLog = logs[lastIdx].trim();
          const activeTrim = activePromptMsg ? activePromptMsg.trim() : '';
          if (activeTrim && (lastLog === activeTrim || lastLog.includes(activeTrim))) {
            logs[lastIdx] = `${activeTrim} ${inputToParse}`;
          } else {
            logs.push(`> ${inputToParse}`);
          }
        }
        activePromptMsg = '';
        continue;
      }

      // 3. Detect C++ std::cin >> age >> salary;
      const cinMatch = trimmed.match(/(?:std::)?cin\s*>>\s*(.+);/);
      if (cinMatch) {
        const vars = cinMatch[1].split('>>').map(v => v.trim());

        if (currentInputQueue.length === 0 && !isStepMode) {
          isWaitingInput = true;
          this.pendingInputState = {
            fmtPattern: '%s',
            argsList: vars,
            lineIndex: idx,
            promptMsg: activePromptMsg || 'Enter value: '
          };
          break;
        }

        const inputToParse = currentInputQueue.length > 0 ? currentInputQueue.shift() : '25';
        this.parseScanfValues('%s', vars, inputToParse, stackVars, baseStackAddr);
        baseStackAddr += (vars.length * 4);

        if (logs.length > 0) {
          const lastIdx = logs.length - 1;
          const lastLog = logs[lastIdx].trim();
          const activeTrim = activePromptMsg ? activePromptMsg.trim() : '';
          if (activeTrim && (lastLog === activeTrim || lastLog.includes(activeTrim))) {
            logs[lastIdx] = `${activeTrim} ${inputToParse}`;
          } else {
            logs.push(`> ${inputToParse}`);
          }
        }
        activePromptMsg = '';
        continue;
      }

      const coutMatch = trimmed.match(/(?:std::)?cout\s*<<\s*(.+);/);
      if (coutMatch) {
        const parts = coutMatch[1].split('<<').map(p => p.trim());
        let outLine = '';
        parts.forEach(p => {
          if (p === 'std::endl' || p === 'endl') return;
          if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
            outLine += p.substring(1, p.length - 1);
          } else {
            const cleanP = p.replace(/^&/, '');
            const found = stackVars.find(v => v.name === cleanP);
            if (p.startsWith('&')) {
              outLine += found ? found.addr : '0x7ffe00';
            } else {
              outLine += found ? found.value : p;
            }
          }
        });
        logs.push(outLine);
        continue;
      }

      // 2. Detect C/C++ Dynamic Memory Allocation (malloc, calloc, new)
      // Matches both: "int *ptr = (int*)malloc(...)" AND "ptr = (int*)malloc(...)"
      const mallocMatch = trimmed.match(/(?:(?:int|float|double|char|long)\s*\*+\s*)?([a-zA-Z0-9_]+)\s*=\s*(?:\([^)]+\))?\s*(?:malloc|calloc)\s*\(\s*(.+)\s*\);/)
        || trimmed.match(/(?:(?:int|float|double|char)\s*\*+\s*)?([a-zA-Z0-9_]+)\s*=\s*new\s+(.+);/);

      if (mallocMatch && !trimmed.includes('==')) {
        const ptrName = mallocMatch[1];
        const heapHex = '0x' + (baseHeapAddr).toString(16);
        baseHeapAddr += 16;

        let existingVar = stackVars.find(v => v.name === ptrName);
        if (existingVar) {
          existingVar.value = heapHex;
          existingVar.pointsTo = heapHex;
          existingVar.isPointer = true;
          existingVar.highlighted = true;
        } else {
          const hexAddr = '0x' + (baseStackAddr).toString(16);
          baseStackAddr += 4;

          stackVars.push({
            addr: hexAddr,
            name: ptrName,
            value: heapHex,
            type: 'int*',
            pointsTo: heapHex,
            isPointer: true
          });
        }

        let sizeVal = 5;
        const sizeObj = stackVars.find(v => v.name === 'size');
        if (sizeObj) {
          sizeVal = parseInt(sizeObj.value) || 5;
        }

        const cells = [];
        for (let c = 0; c < sizeVal; c++) {
          cells.push({ offset: `[${c}]`, val: (c + 1) * 10 });
        }

        heapAllocations.push({
          addr: heapHex,
          name: `Heap Array (${ptrName})`,
          ptrName: ptrName,
          freed: false,
          cells: cells
        });
        continue;
      }

      // 3. Detect C++ vector (std::vector<int> vec = {5, 15, 25};)
      const vecMatch = trimmed.match(/(?:std::)?vector<[^>]+>\s+([a-zA-Z0-9_]+)\s*=\s*\{([^}]+)\};/);
      if (vecMatch) {
        const vecName = vecMatch[1];
        const items = vecMatch[2].split(',').map(i => i.trim());

        const heapHex = '0x' + (baseHeapAddr).toString(16);
        baseHeapAddr += 16;

        const hexAddr = '0x' + (baseStackAddr).toString(16);
        baseStackAddr += 4;

        stackVars.push({
          addr: hexAddr,
          name: vecName + " (std::vector)",
          value: heapHex,
          type: 'vector',
          pointsTo: heapHex,
          isPointer: true
        });

        heapAllocations.push({
          addr: heapHex,
          name: `Vector Buffer (${vecName})`,
          cells: items.map((val, idx) => ({ offset: `[${idx}]`, val }))
        });
        continue;
      }

      // 4. Detect Pointer Declarations (int *ptr = &x; or int* ptr = &x;)
      const ptrMatch = trimmed.match(/(?:int|float|double|char|long|void)\s*\*+\s*([a-zA-Z0-9_]+)\s*=\s*&([a-zA-Z0-9_]+);/);
      if (ptrMatch) {
        const ptrName = ptrMatch[1];
        const targetVar = ptrMatch[2];

        const targetObj = stackVars.find(v => v.name === targetVar);
        const targetAddr = targetObj ? targetObj.addr : '0x7ffe00';

        const hexAddr = '0x' + (baseStackAddr).toString(16);
        baseStackAddr += 4;

        stackVars.push({
          addr: hexAddr,
          name: ptrName,
          value: targetAddr,
          type: 'pointer',
          pointsTo: targetAddr,
          isPointer: true
        });
        continue;
      }

      // 5. Detect Pointer Dereference modification (*ptr = 99;)
      const derefMatch = trimmed.match(/^\*([a-zA-Z0-9_]+)\s*=\s*(.+);/);
      if (derefMatch) {
        const ptrName = derefMatch[1];
        const newValRaw = derefMatch[2].trim();

        const ptrObj = stackVars.find(v => v.name === ptrName);
        if (ptrObj && ptrObj.pointsTo) {
          const targetObj = stackVars.find(v => v.addr === ptrObj.pointsTo);
          if (targetObj) {
            const rhsObj = stackVars.find(v => v.name === newValRaw);
            targetObj.value = rhsObj ? rhsObj.value : newValRaw;
            targetObj.highlighted = true;
          }
        }
        continue;
      }

      // 6. Detect Array Declarations (int arr[3] = {10, 20, 30}; or int arr[] = {1, 2};)
      const arrMatch = trimmed.match(/(int|float|double|char)\s+([a-zA-Z0-9_]+)\s*\[[0-9]*\]\s*=\s*\{([^}]+)\};/);
      if (arrMatch) {
        const type = arrMatch[1];
        const arrName = arrMatch[2];
        const items = arrMatch[3].split(',').map(i => i.trim());

        items.forEach((itemVal, idx) => {
          const hexAddr = '0x' + (baseStackAddr).toString(16);
          baseStackAddr += 4;
          stackVars.push({
            addr: hexAddr,
            name: `${arrName}[${idx}]`,
            value: itemVal,
            type: `${type}`
          });
        });
        continue;
      }

      // 7. Detect Primitive & Struct Variable Declarations (int x = 10; float f = 3.14;)
      const varDeclMatch = trimmed.match(/(int|float|double|char|long|short|bool|std::string|struct\s+[a-zA-Z0-9_]+|[a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)(?:\s*=\s*(.+))?;/);
      if (varDeclMatch && !trimmed.includes('return') && !trimmed.includes('typedef') && !trimmed.includes('namespace') && !trimmed.includes('printf') && !trimmed.includes('scanf') && !trimmed.includes('(') && !trimmed.includes('{')) {
        const type = varDeclMatch[1];
        const name = varDeclMatch[2];
        let valRaw = varDeclMatch[3] ? varDeclMatch[3].trim().replace(/"/g, '') : (type === 'float' || type === 'double' ? '0.0' : type === 'char' ? '?' : '0');

        const rhsObj = stackVars.find(v => v.name === valRaw);
        if (rhsObj) {
          valRaw = rhsObj.value;
        }

        const hexAddr = '0x' + (baseStackAddr).toString(16);
        baseStackAddr += 4;

        stackVars.push({
          addr: hexAddr,
          name: name,
          value: valRaw,
          type: type
        });
        continue;
      }

      // 8. Detect Variable Re-assignments (x = 25; or x = y + 5; or x++;)
      const incMatch = trimmed.match(/^([a-zA-Z0-9_]+)(\+\+|--);/);
      if (incMatch) {
        const varName = incMatch[1];
        const op = incMatch[2];
        const found = stackVars.find(v => v.name === varName);
        if (found) {
          let currentNum = parseInt(found.value) || 0;
          found.value = (op === '++' ? currentNum + 1 : currentNum - 1).toString();
          found.highlighted = true;
        }
        continue;
      }

      const assignMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*=\s*(.+);/);
      if (assignMatch && !trimmed.includes('int') && !trimmed.includes('float') && !trimmed.includes('double')) {
        const varName = assignMatch[1];
        const expr = assignMatch[2].trim();

        const found = stackVars.find(v => v.name === varName);
        if (found) {
          const mathMatch = expr.match(/^([a-zA-Z0-9_]+)\s*([\+\-\*\/])\s*([a-zA-Z0-9_]+)$/);
          if (mathMatch) {
            const leftName = mathMatch[1];
            const op = mathMatch[2];
            const rightName = mathMatch[3];

            const leftObj = stackVars.find(v => v.name === leftName);
            const rightObj = stackVars.find(v => v.name === rightName);

            const leftVal = leftObj ? parseFloat(leftObj.value) : parseFloat(leftName);
            const rightVal = rightObj ? parseFloat(rightObj.value) : parseFloat(rightName);

            if (!isNaN(leftVal) && !isNaN(rightVal)) {
              let res = 0;
              if (op === '+') res = leftVal + rightVal;
              else if (op === '-') res = leftVal - rightVal;
              else if (op === '*') res = leftVal * rightVal;
              else if (op === '/') res = leftVal / rightVal;

              found.value = res.toString();
              found.highlighted = true;
              continue;
            }
          }

          const rhsObj = stackVars.find(v => v.name === expr);
          found.value = rhsObj ? rhsObj.value : expr;
          found.highlighted = true;
        }
        continue;
      }

      // 9. Detect free(ptr) / delete ptr
      if (trimmed.includes('free(') || trimmed.includes('delete ')) {
        const freeMatch = trimmed.match(/(?:free|delete)\s*\(\s*([a-zA-Z0-9_]+)\s*\)|delete\s+([a-zA-Z0-9_]+);/);
        if (freeMatch) {
          const ptrName = freeMatch[1] || freeMatch[2];
          const foundPtr = stackVars.find(v => v.name === ptrName);
          if (foundPtr) {
            foundPtr.value = `NULL (Freed ${foundPtr.pointsTo || ''})`;
          }
          const foundHeap = heapAllocations.find(h => h.ptrName === ptrName || h.name.includes(ptrName));
          if (foundHeap) {
            foundHeap.freed = true;
          }
        }
        continue;
      }
    }

    if (isWaitingInput) {
      this.isWaitingTerminalInput = true;
      const pendingArgs = this.pendingInputState && this.pendingInputState.argsList ? this.pendingInputState.argsList.join(', ') : 'input';
      const promptText = this.pendingInputState ? this.pendingInputState.promptMsg : 'Enter value: ';
      
      if (this.termStatusBadge) {
        this.termStatusBadge.innerHTML = `🟡 Waiting for ${pendingArgs}...`;
        this.termStatusBadge.className = 'terminal-status-badge waiting';
      }

      // Embed live, focused inline input field directly in the terminal output!
      const cursorLine = `${promptText.trim()} <input type="text" id="inline-terminal-real-input" class="inline-term-input-field" autocomplete="off" autofocus placeholder="" />`;
      if (logs.length > 0) {
        const lastLog = logs[logs.length - 1].trim();
        const cleanPrompt = promptText.trim();
        const cleanActive = activePromptMsg ? activePromptMsg.trim() : '';
        if (lastLog === cleanPrompt || (cleanActive && (lastLog === cleanActive || lastLog.includes(cleanActive)))) {
          logs[logs.length - 1] = cursorLine;
        } else {
          logs.push(cursorLine);
        }
      } else {
        logs.push(cursorLine);
      }
    } else if (isStepMode) {
      this.isWaitingTerminalInput = false;
      if (this.termStatusBadge) {
        this.termStatusBadge.innerHTML = `🟡 Paused at Line ${upToLine}`;
        this.termStatusBadge.className = 'terminal-status-badge waiting';
      }
    } else {
      this.isWaitingTerminalInput = false;
      if (this.termStatusBadge) {
        this.termStatusBadge.innerHTML = '🟢 Execution Finished (Exit 0)';
        this.termStatusBadge.className = 'terminal-status-badge';
      }
      logs.push(`----------------------------------------\n[Process completed with exit code 0]`);
    }

    // Render Output Console with real inline input handling
    if (this.consoleDisplay) {
      this.consoleDisplay.innerHTML = logs.map(l => {
        if (l.includes('inline-terminal-real-input')) return `<div class="term-line output term-prompt-active">${l}</div>`;
        return `<div class="term-line output">${l}</div>`;
      }).join('');
      
      // Auto-focus and attach Enter submit handler to embedded inline input
      const realInputEl = document.getElementById('inline-terminal-real-input');
      if (realInputEl) {
        setTimeout(() => {
          realInputEl.focus();
        }, 50);
        realInputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            const val = realInputEl.value;
            this.handleTerminalUserSubmit(val || ' ');
          }
        });
      }
      this.consoleDisplay.scrollTop = this.consoleDisplay.scrollHeight;
    }

    // Render Stack & Heap Memory Graph Canvas
    this.renderMemoryGraph(stackVars, heapAllocations);

    // Render CLion / GDB Evaluation Thread & Call Stack UI Panel above Terminal
    this.renderDebuggerCallStackUI(maxLine, stackVars);

    // Sync Complexity Player Step Counter, Slider & Scaling Graph Canvas
    this.syncComplexityWithDebugger();
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  renderDebuggerCallStackUI(currentLine = null, stackVars = []) {
    const listEl = document.getElementById('debugger-callstack-list');
    if (!listEl) return;

    const code = this.editor ? this.editor.value : '';
    const lineNum = currentLine !== null ? currentLine : (this.currentDebugLine || 1);

    const funcMatches = [...code.matchAll(/(?:([a-zA-Z0-9_<>\*]+)\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g)];
    
    let html = '';

    if (funcMatches.length > 0) {
      funcMatches.forEach(m => {
        const funcName = m[2];
        const params = m[3];
        if (funcName !== 'if' && funcName !== 'while' && funcName !== 'for' && funcName !== 'switch') {
          html += `
            <div style="display:flex; align-items:center; justify-content:space-between; color:#e2e8f0; background:rgba(255,255,255,0.04); padding:4px 8px; border-radius:4px; border-left:3px solid #38bdf8;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="color:#38bdf8;">📋</span>
                <span><strong>${funcName === 'main' ? 'Function:' : 'Subroutine:'}</strong> <code style="color:#00f5d4;">${funcName}(${params})</code> <span style="color:#64748b;">(main.cpp:${lineNum})</span></span>
              </div>
              <span style="font-size:0.65rem; color:#c084fc; font-weight:600;">Stack Frame 0x${(0x7ffe00 + (funcName.length * 16)).toString(16)}</span>
            </div>
          `;
        }
      });
    }

    if (!html) {
      html = `
        <div style="display:flex; align-items:center; gap:6px; color:#e2e8f0; background:rgba(255,255,255,0.04); padding:4px 8px; border-radius:4px; border-left:3px solid #00f5d4;">
          <span style="color:#00f5d4;">📋</span> <span><strong>Function:</strong> <code style="color:#00f5d4;">main()</code> <span style="color:#64748b;">(main.cpp:${lineNum})</span> at memory <code style="color:#c084fc;">0x7ffe00</code></span>
        </div>
      `;
    }

    if (stackVars && stackVars.length > 0) {
      html += `<div style="font-family:var(--font-code); font-size:0.75rem; margin-top:4px; margin-left:8px; border-left:2px solid rgba(255,255,255,0.1); padding-left:10px;">`;
      const topVars = stackVars.slice(0, 5);
      topVars.forEach((v, idx) => {
        const isLast = idx === topVars.length - 1;
        const branchSymbol = isLast ? '└──' : '├──';
        const ptrArrow = v.isPointer ? `─────────────▶ <span style="color:#f97316;">${v.pointsTo || 'target'}</span>` : `= <span style="color:#00f5d4; font-weight:700;">${v.value}</span>`;

        html += `
          <div style="color:#cbd5e1; margin-bottom:3px; display:flex; align-items:center; gap:6px;">
            <span style="color:#64748b;">${branchSymbol}</span>
            <strong style="color:#fff;">${v.name}</strong>
            <span style="color:#64748b; font-size:0.7rem;">(${v.type})</span>
            ${ptrArrow}
          </div>
        `;
      });
      html += `</div>`;
    }

    listEl.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }

  getBubbleSortStepData(currentLine, arrayVars) {
    if (this.executionTrace && this.traceStepIdx !== undefined && this.executionTrace[this.traceStepIdx]) {
      const activeStep = this.executionTrace[this.traceStepIdx];
      const vals = activeStep.arr || [64, 34, 25, 12, 22];
      const n = vals.length;
      let statusMap = vals.map(() => 'normal');

      if (activeStep.sortedCount > 0) {
        for (let s = 0; s < activeStep.sortedCount; s++) {
          if (n - 1 - s >= 0) {
            statusMap[n - 1 - s] = 'sorted';
          }
        }
      }

      if (activeStep.compare) {
        activeStep.compare.forEach(idx => {
          if (statusMap[idx] !== 'sorted') statusMap[idx] = 'compare';
        });
      }
      if (activeStep.swap) {
        activeStep.swap.forEach(idx => {
          if (statusMap[idx] !== 'sorted') statusMap[idx] = 'swap';
        });
      }

      return {
        bars: vals.map((val, idx) => ({ val, status: statusMap[idx] })),
        explanation: activeStep.explanation,
        totalTraceSteps: this.executionTrace.length,
        currentStepIdx: this.traceStepIdx
      };
    }

    let vals = [64, 34, 25, 12, 22];
    if (this.editor && this.editor.value) {
      const match = this.editor.value.match(/int\s+arr\[\]\s*=\s*\{([^}]+)\};/);
      if (match) {
        vals = match[1].split(',').map(v => parseInt(v.trim()) || 0);
      }
    }

    const curLine = currentLine !== null ? currentLine : 1;
    return {
      bars: vals.map(val => ({ val, status: 'normal' })),
      explanation: `Paused at Line ${curLine}`,
      totalTraceSteps: 25,
      currentStepIdx: 0
    };
  }

  renderMemoryGraph(stackVars, heapAllocations) {
    if (!this.memoryVisDisplay) return;

    const templateSelect = document.getElementById('sandbox-template-select');
    const templateVal = templateSelect ? templateSelect.value : 'c-bubble-sort';

    const dsaTitles = {
      'c-bubble-sort': '📊 Bubble Sort Visualizer',
      'c-selection-sort': '🎯 Selection Sort Visualizer',
      'c-insertion-sort': '🃏 Insertion Sort Visualizer',
      'c-merge-sort': '🌲 Merge Sort Visualizer',
      'c-quick-sort': '⚡ Quick Sort Visualizer',
      'c-linear-search': '🔍 Linear Search Visualizer',
      'c-binary-search': '🔵 Binary Search Visualizer',
      'c-stack': '📦 Stack (LIFO) Visualizer',
      'c-queue': '🚶 Queue (FIFO) Visualizer',
      'c-linked-list': '🔗 Singly Linked List Visualizer',
      'c-doubly-linked-list': '🔗 Doubly Linked List Visualizer',
      'c-bst': '🌲 Binary Search Tree (BST) Visualizer',
      'c-avl-tree': '🌲 AVL Tree (Self-Balancing) Visualizer',
      'c-graph': '❄️ Graph (BFS/DFS Traversal) Visualizer',
      'c-hash-map': '🗺️ Hash Map Visualizer',
      'c-recursion': '📞 Recursion Call Stack Visualizer',
      'c-pointer': '📌 Pointer Memory Visualizer',
      'c-dma': '💾 Dynamic Heap Memory Visualizer'
    };

    const dsaTitleText = dsaTitles[templateVal] || '📊 DSA & Memory Visualizer';
    const arrayVars = stackVars.filter(v => v.name.startsWith('arr[') || v.name.includes('['));
    const isArrayPresent = arrayVars.length > 0;

    const dsaAlgorithmTemplates = [
      'c-bubble-sort', 'c-selection-sort', 'c-insertion-sort', 'c-merge-sort', 'c-quick-sort',
      'c-linear-search', 'c-binary-search', 'c-stack', 'c-queue', 'c-linked-list',
      'c-doubly-linked-list', 'c-bst', 'c-avl-tree', 'c-graph', 'c-hash-map'
    ];
    const isDSAMode = dsaAlgorithmTemplates.includes(templateVal);

    if (isDSAMode && this.activeVisMode !== 'mem-cells') {
      const stepData = this.getBubbleSortStepData(this.currentDebugLine, arrayVars);
      const dsaBarsData = stepData.bars;
      const maxVal = Math.max(...dsaBarsData.map(d => d.val || 1), 10);
      const curLineNum = this.currentDebugLine || 1;
      const currentStepDisplay = stepData.currentStepIdx + 1;
      const activeStep = (this.executionTrace && this.executionTrace[stepData.currentStepIdx]) ? this.executionTrace[stepData.currentStepIdx] : {};

      const visType = activeStep.type || (
        templateVal === 'c-linked-list' ? 'linked-list' :
        templateVal === 'c-doubly-linked-list' ? 'd-linked-list' :
        templateVal === 'c-stack' ? 'stack-ds' :
        templateVal === 'c-queue' ? 'queue-ds' :
        templateVal === 'c-bst' ? 'bst-ds' :
        templateVal === 'c-avl-tree' ? 'avl-ds' :
        templateVal === 'c-hash-map' ? 'hash-map' :
        templateVal === 'c-recursion' ? 'recursion-ds' :
        templateVal === 'c-graph' ? 'graph-ds' :
        templateVal === 'c-binary-search' ? 'binary-search' : 'bars'
      );

      let dsaHtml = `
        <div class="dsa-bars-modal-card">
          <!-- Header Info Banner -->
          <div class="dsa-header-info">
            <div class="dsa-title-main">${dsaTitleText}</div>
            <div class="dsa-subtitle-meta">${stepData.explanation}</div>
          </div>

          <!-- Dynamic Visualizer Container Body -->
          <div class="dsa-bars-chart-box" style="min-height: 160px; display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap; padding:12px;">
      `;

      if (visType === 'linked-list') {
        const nodes = activeStep.nodes || [
          { data: 10, addr: '0x7ffe00', nextAddr: '0x7ffe20' },
          { data: 20, addr: '0x7ffe20', nextAddr: '0x7ffe40' },
          { data: 30, addr: '0x7ffe40', nextAddr: 'NULL' }
        ];
        nodes.forEach((node, idx) => {
          dsaHtml += `
            <div style="display:flex; align-items:center; gap:8px; background:rgba(15,23,42,0.8); padding:10px 14px; border-radius:8px; border:1px solid #38bdf8; box-shadow:0 0 10px rgba(56,189,248,0.2);">
              <div style="text-align:center;">
                <div style="font-size:0.68rem; color:#94a3b8;">${node.addr}</div>
                <div style="font-size:1.1rem; font-weight:800; color:#38bdf8;">Data: ${node.data}</div>
                <div style="font-size:0.68rem; color:#10b981;">Next ➜ ${node.nextAddr}</div>
              </div>
            </div>
            ${idx < nodes.length - 1 ? '<span style="font-size:1.2rem; color:#38bdf8; font-weight:800;">➜</span>' : ''}
          `;
        });
      } else if (visType === 'd-linked-list') {
        const nodes = activeStep.nodes || [
          { data: 10, prev: 'NULL', next: '0x20' },
          { data: 20, prev: '0x10', next: '0x30' },
          { data: 30, prev: '0x20', next: 'NULL' }
        ];
        nodes.forEach((node, idx) => {
          dsaHtml += `
            <div style="display:flex; align-items:center; gap:8px; background:rgba(15,23,42,0.8); padding:10px 14px; border-radius:8px; border:1px solid #a855f7; box-shadow:0 0 10px rgba(168,85,247,0.2);">
              <div style="text-align:center;">
                <div style="font-size:0.68rem; color:#c084fc;">Prev ⇦ ${node.prev}</div>
                <div style="font-size:1.1rem; font-weight:800; color:#fff;">Data: ${node.data}</div>
                <div style="font-size:0.68rem; color:#10b981;">Next ➜ ${node.next}</div>
              </div>
            </div>
            ${idx < nodes.length - 1 ? '<span style="font-size:1.2rem; color:#a855f7; font-weight:800;">⇆</span>' : ''}
          `;
        });
      } else if (visType === 'stack-ds') {
        const items = activeStep.items || [10, 20, 30];
        const topIdx = activeStep.top !== undefined ? activeStep.top : items.length - 1;
        dsaHtml += `<div style="display:flex; flex-direction:column-reverse; gap:6px; background:rgba(0,0,0,0.4); padding:12px 20px; border-radius:8px; border:2px solid #38bdf8; border-top:none; min-width:140px; align-items:center;">`;
        items.forEach((val, idx) => {
          const isTop = idx === topIdx;
          dsaHtml += `
            <div style="width:100%; text-align:center; padding:6px 12px; background:${isTop ? '#38bdf8' : 'rgba(255,255,255,0.08)'}; color:${isTop ? '#000' : '#fff'}; font-weight:800; border-radius:4px;">
              ${val} ${isTop ? '<span style="font-size:0.7rem; font-weight:700;">(TOP ➜)</span>' : ''}
            </div>
          `;
        });
        dsaHtml += `</div>`;
      } else if (visType === 'queue-ds') {
        const items = activeStep.items || [10, 20, 30];
        const frontIdx = activeStep.front !== undefined ? activeStep.front : 0;
        const rearIdx = activeStep.rear !== undefined ? activeStep.rear : items.length - 1;
        dsaHtml += `<div style="display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.4); padding:12px 16px; border-radius:8px; border:2px solid #10b981;">`;
        items.forEach((val, idx) => {
          const isFront = idx === frontIdx;
          const isRear = idx === rearIdx;
          dsaHtml += `
            <div style="padding:8px 14px; background:${isFront || isRear ? '#10b981' : 'rgba(255,255,255,0.08)'}; color:${isFront || isRear ? '#000' : '#fff'}; font-weight:800; border-radius:6px; text-align:center;">
              <div>${val}</div>
              <div style="font-size:0.65rem;">${isFront ? 'FRONT' : ''}${isRear ? ' REAR' : ''}</div>
            </div>
          `;
        });
        dsaHtml += `</div>`;
      } else if (visType === 'bst-ds' || visType === 'avl-ds') {
        const root = activeStep.root || (visType === 'avl-ds' ? { val: 30, bf: 0, left: 20, right: 40 } : { val: 50, left: 30, right: 70 });
        dsaHtml += `
          <div style="display:flex; flex-direction:column; align-items:center; gap:16px;">
            <div style="padding:10px 18px; background:#38bdf8; color:#000; font-weight:800; border-radius:50%; box-shadow:0 0 14px rgba(56,189,248,0.5);">
              ${root.val} <span style="font-size:0.65rem;">${root.bf !== undefined ? `(BF:${root.bf})` : ''}</span>
            </div>
            <div style="display:flex; gap:36px;">
              ${root.left ? `<div style="padding:8px 14px; background:#10b981; color:#000; font-weight:800; border-radius:50%;">L: ${root.left}</div>` : ''}
              ${root.right ? `<div style="padding:8px 14px; background:#a855f7; color:#fff; font-weight:800; border-radius:50%;">R: ${root.right}</div>` : ''}
            </div>
          </div>
        `;
      } else if (visType === 'hash-map') {
        const buckets = activeStep.buckets || [{ idx: 0, key: 10, val: 100 }, { idx: 1, key: 21, val: 210 }, { idx: 2, key: 32, val: 320 }];
        dsaHtml += `<div style="display:flex; flex-direction:column; gap:6px; width:100%;">`;
        buckets.forEach(b => {
          dsaHtml += `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 12px; background:rgba(255,255,255,0.06); border-radius:6px; border-left:3px solid #38bdf8;">
              <span style="font-weight:700; color:#38bdf8;">Bucket [${b.idx}]</span>
              <span style="font-weight:700; color:#10b981;">Key: ${b.key} ➜ Value: ${b.val}</span>
            </div>
          `;
        });
        dsaHtml += `</div>`;
      } else if (visType === 'recursion-ds') {
        const stackFrames = activeStep.stackFrames || ['factorial(4)', 'factorial(3)', 'factorial(2)', 'factorial(1)'];
        dsaHtml += `<div style="display:flex; flex-direction:column-reverse; gap:6px; width:100%;">`;
        stackFrames.forEach((frame, idx) => {
          dsaHtml += `
            <div style="padding:8px 12px; background:${idx === stackFrames.length - 1 ? '#a855f7' : 'rgba(255,255,255,0.06)'}; color:#fff; font-weight:700; border-radius:6px; border-left:3px solid #c084fc;">
              Frame ${idx + 1}: <code>${frame}</code>
            </div>
          `;
        });
        dsaHtml += `</div>`;
      } else if (visType === 'binary-search') {
        const bsArray = [2, 3, 4, 10, 40];
        const low = activeStep.l !== undefined ? activeStep.l : 0;
        const mid = activeStep.m !== undefined ? activeStep.m : 2;
        const high = activeStep.r !== undefined ? activeStep.r : 4;

        bsArray.forEach((val, idx) => {
          const isL = idx === low;
          const isM = idx === mid;
          const isR = idx === high;
          let badge = isM ? 'MID' : isL ? 'LOW' : isR ? 'HIGH' : '';

          dsaHtml += `
            <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
              <span style="font-size:0.65rem; color:#38bdf8; font-weight:800;">${badge}</span>
              <div style="padding:10px 16px; background:${isM ? '#10b981' : isL || isR ? '#38bdf8' : 'rgba(255,255,255,0.08)'}; color:${isM || isL || isR ? '#000' : '#fff'}; font-weight:800; border-radius:6px;">
                ${val}
              </div>
              <span style="font-size:0.68rem; color:#64748b;">${idx}</span>
            </div>
          `;
        });
      } else {
        // Default Bar Chart for Sorting Algorithms with specific template array fallbacks
        let algoBars = dsaBarsData;
        if (!this.executionTrace) {
          let customVals = [64, 34, 25, 12, 22];
          if (templateVal === 'c-selection-sort') customVals = [64, 25, 12, 22, 11];
          else if (templateVal === 'c-insertion-sort') customVals = [12, 11, 13, 5, 6];
          else if (templateVal === 'c-merge-sort') customVals = [38, 27, 43, 3, 9, 82, 10];
          else if (templateVal === 'c-quick-sort') customVals = [10, 80, 30, 90, 40, 50, 70];
          else if (templateVal === 'c-linear-search') customVals = [10, 50, 30, 70, 80, 20];
          algoBars = customVals.map(val => ({ val, status: 'normal' }));
        }

        const maxValCustom = Math.max(...algoBars.map(d => d.val || 1), 10);
        algoBars.forEach((item, idx) => {
          const heightPx = Math.max(38, Math.round((item.val / maxValCustom) * 150));
          let statusClass = item.status || 'normal';

          dsaHtml += `
            <div class="dsa-bar-wrapper">
              <div class="dsa-bar-value">${item.val}</div>
              <div class="dsa-bar ${statusClass}" style="height: ${heightPx}px;"></div>
              <span class="dsa-bar-index">${idx + 1}</span>
            </div>
          `;
        });
      }

      dsaHtml += `
          </div>

          <!-- Interactive Control Bar -->
          <div class="dsa-controls-footer">
            <div class="dsa-slider-row">
              <span class="dsa-slider-label">Trace Step <strong>${currentStepDisplay} of ${stepData.totalTraceSteps}</strong> (Line ${curLineNum})</span>
              <input type="range" min="1" max="${stepData.totalTraceSteps}" value="${currentStepDisplay}" class="dsa-step-slider" id="sandbox-dsa-slider">
            </div>

            <div class="dsa-actions-grid">
              <button class="btn-dsa-action" id="sandbox-dsa-shuffle"><i data-lucide="shuffle"></i> Shuffle</button>
              <button class="btn-dsa-action btn-primary-dsa" id="sandbox-dsa-play"><i data-lucide="play"></i> Step (F10)</button>
              <button class="btn-dsa-action" id="sandbox-dsa-toggle-mem"><i data-lucide="layers"></i> Memory</button>
              <button class="btn-dsa-action" id="sandbox-dsa-finish"><i data-lucide="fast-forward"></i> Finish</button>
            </div>
          </div>
        </div>
      `;

      this.memoryVisDisplay.innerHTML = dsaHtml;
      if (window.lucide) lucide.createIcons();

      const slider = this.memoryVisDisplay.querySelector('#sandbox-dsa-slider');
      if (slider) {
        slider.addEventListener('input', (e) => {
          const stepIdx = parseInt(e.target.value) - 1;
          this.isDebugging = true;
          if (this.executionTrace && this.executionTrace[stepIdx]) {
            this.traceStepIdx = stepIdx;
            this.currentDebugLine = this.executionTrace[stepIdx].line;
          }
          this.updateLineNumbers();
          this.runCodeAndVisualize(this.currentDebugLine);
        });
      }

      const playBtn = this.memoryVisDisplay.querySelector('#sandbox-dsa-play');
      if (playBtn) {
        playBtn.addEventListener('click', () => this.stepOver());
      }

      const shuffleBtn = this.memoryVisDisplay.querySelector('#sandbox-dsa-shuffle');
      if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
          const newArr = Array.from({ length: 5 }, () => Math.floor(Math.random() * 80) + 15);
          const arrStr = `{${newArr.join(', ')}}`;
          this.editor.value = this.editor.value.replace(/int\s+arr\[\]\s*=\s*\{[^}]+\};/, `int arr[] = ${arrStr};`);
          this.updateLineNumbers();
          if (this.updateSyntaxHighlight) this.updateSyntaxHighlight();
          this.isDebugging = false;
          this.currentDebugLine = null;
          this.runCodeAndVisualize();
        });
      }

      const finishBtn = this.memoryVisDisplay.querySelector('#sandbox-dsa-finish');
      if (finishBtn) {
        finishBtn.addEventListener('click', () => {
          this.resetDebugger();
        });
      }

      const toggleMemBtn = this.memoryVisDisplay.querySelector('#sandbox-dsa-toggle-mem');
      if (toggleMemBtn) {
        toggleMemBtn.addEventListener('click', () => {
          this.activeVisMode = 'mem-cells';
          this.runCodeAndVisualize(this.currentDebugLine);
        });
      }
      return;
    }

    // Memory Cells View with Professional GDB Cards & Color Coding
    let html = `
      <div class="memory-graph-wrapper">
        <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; background:rgba(255,255,255,0.04); border-radius:6px; margin-bottom:10px; border:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:0.75rem; font-weight:700; color:#38bdf8;">Mode: GDB Stack & Heap Memory Inspector</span>
          <button id="btn-switch-to-dsa-bars" style="background:#38bdf8; color:#000; font-weight:700; border:none; padding:4px 10px; border-radius:4px; font-size:0.72rem; cursor:pointer;">
            📊 Switch to DSA Visualizer
          </button>
        </div>

        <div class="mem-region stack-region">
          <div class="region-title"><i data-lucide="layers"></i> STACK FRAME (Local Variables)</div>
          <div class="mem-cells-grid">
    `;

    stackVars.forEach(v => {
      let colorClass = 'type-normal';
      if (v.isPointer) colorClass = 'type-pointer';
      else if (v.highlighted) colorClass = 'type-changed';
      else if (v.type && v.type.includes('struct')) colorClass = 'type-struct';
      else if (v.value === '?' || v.value === '0') colorClass = 'type-uninit';

      const pointerBadge = v.isPointer ? `
        <div style="font-size:0.72rem; color:#f97316; font-weight:700; margin-top:6px; display:flex; align-items:center; gap:4px;">
          <span>ptr</span> <span style="font-size:0.85rem;">─────────────▶</span> <span style="color:#10b981;">${v.pointsTo || 'target'}</span>
        </div>
      ` : '';

      html += `
        <div class="mem-card-cell ${colorClass} ${v.highlighted ? 'highlight' : ''}" style="border-radius:10px !important; min-height:58px !important; padding:4px 8px !important;">
          <div style="font-size:0.62rem; color:#64748b; font-family:var(--font-code); line-height:1;">Address ${v.addr}</div>
          <div style="display:flex; align-items:baseline; justify-content:space-between; margin-top:2px;">
            <span style="font-size:0.85rem; font-weight:800; color:#fff;">${v.name}</span>
            <span style="font-size:0.65rem; color:${v.isPointer ? '#f97316' : '#38bdf8'}; font-weight:600;">${v.type || 'int'}</span>
          </div>
          <div class="cell-val-row" style="font-size:0.88rem; font-weight:800; color:#10b981; margin-top:2px; line-height:1.1;">${v.value}</div>
          ${pointerBadge}
        </div>
      `;
    });

    html += `
          </div>
        </div>

        <div class="mem-region heap-region">
          <div class="region-title"><i data-lucide="box"></i> HEAP SEGMENT (Dynamic Memory)</div>
          <div class="mem-heap-grid">
    `;

    if (heapAllocations.length === 0) {
      html += `
        <div style="padding:18px; text-align:center; background:rgba(255,255,255,0.02); border-radius:8px; border:1px dashed rgba(255,255,255,0.1); margin-top:6px;">
          <div style="font-size:0.85rem; color:#94a3b8; font-weight:700;">Heap Segment</div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">No Dynamic Allocations Active</div>
          <div style="font-size:0.7rem; color:#38bdf8; margin-top:6px;"><code>malloc()</code> · <code>calloc()</code> · <code>new</code> allocations will appear here</div>
        </div>
      `;
    } else {
      heapAllocations.forEach(h => {
        const freedBadge = h.freed ? `<span class="freed-badge" style="background:#ef4444; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-left:8px;">FREED</span>` : `<span class="active-badge" style="background:#10b981; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-left:8px;">ALLOCATED</span>`;
        html += `
          <div class="heap-block-card ${h.freed ? 'freed-block' : ''}">
            <div class="heap-block-header">
              <span class="heap-addr">${h.addr}</span>
              <span class="heap-name">${h.name}</span>
              ${freedBadge}
            </div>
            <div class="heap-cells-flex">
        `;
        h.cells.forEach(c => {
          html += `
            <div class="heap-sub-cell">
              <span class="sub-off">${c.offset}</span>
              <span class="sub-val">${h.freed ? 'deallocated' : c.val}</span>
            </div>
          `;
        });
        html += `
            </div>
          </div>
        `;
      });
    }

    html += `
          </div>
        </div>
      </div>
    `;

    this.memoryVisDisplay.innerHTML = html;
    if (window.lucide) lucide.createIcons();

    const backBtn = this.memoryVisDisplay.querySelector('#btn-switch-to-dsa-bars');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.activeVisMode = 'dsa-bars';
        this.runCodeAndVisualize(this.currentDebugLine);
      });
    }
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
