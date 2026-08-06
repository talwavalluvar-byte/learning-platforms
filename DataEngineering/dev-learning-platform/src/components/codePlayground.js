/* ----------------------------------------------------
   DEVBASE2 - CODE VIEWER & PLAYGROUND COMPONENT
   Handles code snippet highlighting, active line sync,
   copying code, and running mini code sandbox execution.
   ---------------------------------------------------- */

import { highlightCCode } from '../utils/syntaxHighlighter.js';

export class CodePlayground {
  constructor(codeBlockId, outputDisplayId, langTagId) {
    this.codeBlock = document.getElementById(codeBlockId);
    this.outputDisplay = document.getElementById(outputDisplayId);
    this.langTag = document.getElementById(langTagId);
  }

  loadCode(snippet, language = 'c', highlightedLine = null) {
    if (this.langTag) {
      this.langTag.textContent = language.toUpperCase();
    }

    if (!snippet) {
      this.codeBlock.textContent = "/* No code snippet provided */";
      return;
    }

    const lines = snippet.split('\n');
    let formattedHtml = '';

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const isHighlighted = (lineNum === highlightedLine) ? 'code-line-highlight' : '';
      
      const syntaxLine = highlightCCode(line);
      formattedHtml += `<span class="${isHighlighted}"><span style="color:#64748b; font-size:0.75rem; user-select:none; margin-right:12px;">${lineNum.toString().padStart(2, ' ')}</span>${syntaxLine}</span>\n`;
    });

    this.codeBlock.innerHTML = formattedHtml;
  }

  highlightLine(lineNum, snippet) {
    if (snippet) {
      this.loadCode(snippet, this.langTag ? this.langTag.textContent.toLowerCase() : 'c', lineNum);
    }
  }

  setOutput(text) {
    if (this.outputDisplay) {
      this.outputDisplay.textContent = text;
    }
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
