/* ----------------------------------------------------
   DEVBASE2 - LOG2BASE2 MEMORY & DSA ANIMATION VISUALIZER
   Renders stack/heap memory cells, pointer arrows, addresses,
   and animated sorting bars based on lesson step data.
   ---------------------------------------------------- */

export class MemoryVisualizer {
  constructor(containerId, explanationBarId, stepNumId, totalStepsId) {
    this.container = document.getElementById(containerId);
    this.explanationBar = document.getElementById(explanationBarId);
    this.stepNumEl = document.getElementById(stepNumId);
    this.totalStepsEl = document.getElementById(totalStepsId);

    this.currentLesson = null;
    this.currentStepIdx = 0;
    this.autoPlayInterval = null;
  }

  loadLesson(lesson) {
    this.currentLesson = lesson;
    this.currentStepIdx = 0;
    this.stopAutoPlay();

    if (!lesson.steps || lesson.steps.length === 0) {
      this.container.innerHTML = `<div class="empty-state">No interactive visual steps for this lesson.</div>`;
      return;
    }

    this.totalStepsEl.textContent = lesson.steps.length;
    this.renderCurrentStep();
  }

  nextStep() {
    if (!this.currentLesson || !this.currentLesson.steps) return;
    if (this.currentStepIdx < this.currentLesson.steps.length - 1) {
      this.currentStepIdx++;
      this.renderCurrentStep();
    } else {
      this.stopAutoPlay();
    }
  }

  prevStep() {
    if (!this.currentLesson || !this.currentLesson.steps) return;
    if (this.currentStepIdx > 0) {
      this.currentStepIdx--;
      this.renderCurrentStep();
    }
  }

  toggleAutoPlay(btnEl) {
    if (this.autoPlayInterval) {
      this.stopAutoPlay(btnEl);
    } else {
      btnEl.innerHTML = `<i data-lucide="pause"></i> Pause`;
      btnEl.classList.add('active');
      this.autoPlayInterval = setInterval(() => {
        if (this.currentStepIdx >= this.currentLesson.steps.length - 1) {
          this.currentStepIdx = 0;
        } else {
          this.currentStepIdx++;
        }
        this.renderCurrentStep();
      }, 2500);
    }
    if (window.lucide) lucide.createIcons();
  }

  stopAutoPlay(btnEl) {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
    if (btnEl) {
      btnEl.innerHTML = `<i data-lucide="play"></i> Auto Simulate`;
      btnEl.classList.remove('active');
      if (window.lucide) lucide.createIcons();
    }
  }

  get currentStepIndex() {
    return this.currentStepIdx;
  }

  set currentStepIndex(val) {
    this.currentStepIdx = val;
  }

  renderCurrentStep(syncVideo = true) {
    if (!this.currentLesson || !this.currentLesson.steps || this.currentLesson.steps.length === 0) return;

    if (this.currentStepIdx < 0) this.currentStepIdx = 0;
    if (this.currentStepIdx >= this.currentLesson.steps.length) {
      this.currentStepIdx = this.currentLesson.steps.length - 1;
    }

    const step = this.currentLesson.steps[this.currentStepIdx];
    if (this.stepNumEl) this.stepNumEl.textContent = this.currentStepIdx + 1;

    if (this.explanationBar) {
      const textSpan = this.explanationBar.querySelector('#step-explanation-text') || this.explanationBar;
      textSpan.textContent = step.explanation;
    }

    if (window.onStepChanged) {
      window.onStepChanged(step.codeLine, step.inlineHints || {});
    }

    // Synchronize step next / step prev clicks to current video playback position!
    if (syncVideo) {
      const mainVideo = document.getElementById('main-video-player');
      if (mainVideo && !isNaN(mainVideo.duration) && mainVideo.duration > 0) {
        const totalSteps = this.currentLesson.steps.length;
        let targetSec = 0;
        if (step.timestamp !== undefined) {
          targetSec = step.timestamp;
        } else if (totalSteps > 1) {
          targetSec = (this.currentStepIdx / totalSteps) * mainVideo.duration;
        }
        mainVideo.currentTime = targetSec;
        mainVideo.play().catch(() => {});
      }
    }

    if (this.currentLesson.visualType === 'dsa-bars') {
      this.renderDSABars(step.dsaData);
    } else {
      this.renderMemoryDiagram(step.memoryState);
    }
  }

  renderMemoryDiagram(memoryState) {
    if (!memoryState) {
      this.container.innerHTML = `<div class="empty-state">No memory state data.</div>`;
      return;
    }

    const { stack = [], heap = [] } = memoryState;

    let html = `<div class="memory-diagram-layout">`;

    // STACK SECTION
    html += `
      <div class="mem-section stack">
        <span class="mem-section-title">STACK MEMORY (Local Frame)</span>
        <div class="mem-cells-container">
    `;

    if (stack.length === 0) {
      html += `<div class="mem-empty-text">Stack Empty</div>`;
    } else {
      stack.forEach(cell => {
        const isHighlighted = cell.highlighted ? 'highlighted' : '';
        const pointsTag = cell.pointsTo ? `<span class="pointer-link-tag"><i data-lucide="corner-down-right"></i> &rarr; ${cell.pointsTo}</span>` : '';
        
        html += `
          <div class="mem-cell-row ${isHighlighted}">
            <span class="mem-cell-addr">${cell.addr}</span>
            <span class="mem-cell-name">${cell.name} ${pointsTag}</span>
            <span class="mem-cell-val">${cell.val}</span>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;

    // HEAP SECTION
    html += `
      <div class="mem-section heap">
        <span class="mem-section-title">HEAP MEMORY (Dynamic malloc)</span>
        <div class="mem-cells-container">
    `;

    if (heap.length === 0) {
      html += `<div class="mem-empty-text" style="color: var(--text-subtle); padding: 20px; text-align: center; font-size: 0.8rem;">No Heap Allocations</div>`;
    } else {
      heap.forEach(cell => {
        const isHighlighted = cell.highlighted ? 'highlighted' : '';
        html += `
          <div class="mem-cell-row ${isHighlighted}">
            <span class="mem-cell-addr" style="color: var(--accent-purple);">${cell.addr}</span>
            <span class="mem-cell-name">${cell.name}</span>
            <span class="mem-cell-val">${cell.val}</span>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;

    html += `</div>`;

    this.container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }

  renderDSABars(dsaData) {
    if (!dsaData) return;

    const step = (this.currentLesson && this.currentLesson.steps) ? this.currentLesson.steps[this.currentStepIdx] : null;
    const maxVal = Math.max(...dsaData.map(d => d.val || 1), 10);
    const totalSteps = (this.currentLesson && this.currentLesson.steps) ? this.currentLesson.steps.length : 13;
    const currentStep = this.currentStepIdx + 1;

    let html = `
      <div class="dsa-bars-modal-card">
        <!-- Header Info Banner -->
        <div class="dsa-header-info">
          <div class="dsa-title-main">${step?.explanation || 'Bubble Sort Visual Step'}</div>
          <div class="dsa-subtitle-meta">Sorting Step ${currentStep} of ${totalSteps}</div>
        </div>

        <!-- DSA Bars Chart Box -->
        <div class="dsa-bars-chart-box">
    `;

    dsaData.forEach((item, idx) => {
      const heightPx = Math.max(38, Math.round((item.val / maxVal) * 150));
      let statusClass = item.status || 'normal';

      html += `
        <div class="dsa-bar-wrapper">
          <div class="dsa-bar-value">${item.val}</div>
          <div class="dsa-bar ${statusClass}" style="height: ${heightPx}px;"></div>
          <span class="dsa-bar-index">${idx + 1}</span>
        </div>
      `;
    });

    html += `
        </div>

        <!-- Interactive Control Bar -->
        <div class="dsa-controls-footer">
          <div class="dsa-slider-row">
            <span class="dsa-slider-label">Sorting step: <strong>${currentStep}</strong></span>
            <input type="range" min="1" max="${totalSteps}" value="${currentStep}" class="dsa-step-slider" id="dsa-step-range">
          </div>

          <div class="dsa-actions-grid">
            <button class="btn-dsa-action" id="btn-dsa-shuffle"><i data-lucide="shuffle"></i> Shuffle</button>
            <button class="btn-dsa-action btn-primary-dsa" id="btn-dsa-play"><i data-lucide="play"></i> Play</button>
            <button class="btn-dsa-action" id="btn-dsa-step"><i data-lucide="skip-forward"></i> Step</button>
            <button class="btn-dsa-action" id="btn-dsa-finish"><i data-lucide="fast-forward"></i> Finish Pass</button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    if (window.lucide) lucide.createIcons();

    // Bind slider & interactive control buttons
    const slider = this.container.querySelector('#dsa-step-range');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value) - 1;
        this.currentStepIdx = val;
        this.renderCurrentStep(false);
      });
    }

    const stepBtn = this.container.querySelector('#btn-dsa-step');
    if (stepBtn) {
      stepBtn.addEventListener('click', () => this.nextStep());
    }

    const playBtn = this.container.querySelector('#btn-dsa-play');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => this.toggleAutoPlay(e.currentTarget));
    }

    const shuffleBtn = this.container.querySelector('#btn-dsa-shuffle');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        this.currentStepIdx = 0;
        this.renderCurrentStep();
      });
    }

    const finishBtn = this.container.querySelector('#btn-dsa-finish');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        this.currentStepIdx = totalSteps - 1;
        this.renderCurrentStep();
      });
    }
  }
}
