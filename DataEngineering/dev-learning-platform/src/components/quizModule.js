/* ----------------------------------------------------
   DEVBASE2 - INTERACTIVE QUIZ ENGINE
   Renders visual multiple-choice questions per lesson,
   provides immediate feedback & explanations.
   ---------------------------------------------------- */

export class QuizModule {
  constructor(containerId, onQuizCompleted) {
    this.container = document.getElementById(containerId);
    this.onQuizCompleted = onQuizCompleted;
  }

  renderQuiz(quizzes) {
    if (!quizzes || quizzes.length === 0) {
      this.container.innerHTML = `
        <div style="text-align: center; color: var(--text-subtle); padding: 40px;">
          <i data-lucide="check-circle" style="width:36px; height:36px; color: var(--accent-emerald); margin-bottom:8px;"></i>
          <p>No quiz questions for this lesson yet. Enjoy the video!</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = ``;
    quizzes.forEach((q, qIdx) => {
      html += `
        <div class="quiz-card" data-quiz-id="${q.id}">
          <div class="quiz-question">Q${qIdx + 1}: ${q.question}</div>
          <div class="quiz-options">
      `;

      q.options.forEach((opt, optIdx) => {
        html += `
          <button class="quiz-option-btn" data-opt-idx="${optIdx}">
            ${String.fromCharCode(65 + optIdx)}. ${opt}
          </button>
        `;
      });

      html += `
          </div>
          <div class="quiz-explanation" style="display: none;">
            <strong><i data-lucide="sparkles"></i> Explanation:</strong> ${q.explanation}
          </div>
        </div>
      `;
    });

    this.container.innerHTML = html;
    if (window.lucide) lucide.createIcons();

    this.container.querySelectorAll('.quiz-card').forEach((card, qIdx) => {
      const q = quizzes[qIdx];
      const optionBtns = card.querySelectorAll('.quiz-option-btn');
      const expBox = card.querySelector('.quiz-explanation');

      optionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const selectedIdx = parseInt(e.target.getAttribute('data-opt-idx'));
          
          optionBtns.forEach(b => b.disabled = true);

          if (selectedIdx === q.answer) {
            btn.classList.add('correct');
            if (this.onQuizCompleted) this.onQuizCompleted(true);
          } else {
            btn.classList.add('incorrect');
            optionBtns[q.answer].classList.add('correct');
            if (this.onQuizCompleted) this.onQuizCompleted(false);
          }

          expBox.style.display = 'block';
        });
      });
    });
  }
}
