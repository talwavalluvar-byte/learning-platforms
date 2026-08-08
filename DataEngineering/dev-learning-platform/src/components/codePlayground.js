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

  loadCode(snippet, language = 'c', highlightedLine = null, inlineHints = {}) {
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
      const arrowMarker = (lineNum === highlightedLine) ? '<span style="color:#eab308; font-weight:800; margin-right:4px;">➔</span>' : ' ';
      
      const syntaxLine = highlightCCode(line);
      const hintText = inlineHints[lineNum] ? `<span class="ide-inlay-hint" style="color:#64748b; font-style:italic; font-size:0.78rem; margin-left:12px; font-family:var(--font-mono);">${this.escapeHtml(inlineHints[lineNum])}</span>` : '';

      formattedHtml += `<div class="code-line-row ${isHighlighted}" style="display:flex; align-items:center; line-height:1.6; padding:1px 4px; border-radius:3px;">
        <span style="color:#64748b; font-size:0.75rem; user-select:none; width:45px; display:inline-block; font-family:var(--font-mono); text-align:right; margin-right:12px;">${arrowMarker}${lineNum.toString().padStart(2, ' ')}</span>
        <span style="flex:1;">${syntaxLine}${hintText}</span>
      </div>`;
    });

    this.codeBlock.innerHTML = formattedHtml;
  }

  highlightLine(lineNum, snippet, inlineHints = {}) {
    if (snippet) {
      this.loadCode(snippet, this.langTag ? this.langTag.textContent.toLowerCase() : 'c', lineNum, inlineHints);
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

