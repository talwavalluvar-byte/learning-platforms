/* ----------------------------------------------------
   DEVBASE2 - MAIN APPLICATION CONTROLLER
   Integrates Router, VideoPlayer, MemoryVisualizer, 
   CodePlayground, Quizzes, LocalStorage, and GDrive.
   ---------------------------------------------------- */

import { COURSES } from './data/courses.js';
import { VideoPlayerManager } from './components/videoPlayer.js';
import { MemoryVisualizer } from './components/memoryVisualizer.js';
import { CodePlayground } from './components/codePlayground.js';
import { QuizModule } from './components/quizModule.js';
import { SandboxEngine } from './components/sandboxEngine.js';

class DevBaseAppState {
  constructor() {
    const savedCourses = localStorage.getItem('devbase_custom_courses');
    if (savedCourses) {
      try {
        this.courses = JSON.parse(savedCourses);
      } catch (e) {
        this.courses = COURSES;
      }
    } else {
      this.courses = COURSES;
    }

    this.currentCourse = this.courses[0] || COURSES[0];
    this.currentLesson = (this.currentCourse && this.currentCourse.modules && this.currentCourse.modules[0]) ? this.currentCourse.modules[0].lessons[0] : null;

    this.completedLessons = JSON.parse(localStorage.getItem('devbase_completed_lessons') || '[]');
    this.offlineVideosMap = JSON.parse(localStorage.getItem('devbase_offline_videos') || '{}');
    this.savedNotesMap = JSON.parse(localStorage.getItem('devbase_saved_notes') || '{}');
    this.quizScores = JSON.parse(localStorage.getItem('devbase_quiz_scores') || '{"correct": 0, "total": 0}');
    this.streak = parseInt(localStorage.getItem('devbase_streak') || '3');

    this.activeBlobs = {};
  }

  saveCourses() {
    localStorage.setItem('devbase_custom_courses', JSON.stringify(this.courses));
  }

  addCourse(title, category = 'c-prog') {
    const id = 'course-' + Date.now();
    const newCourse = {
      id: id,
      title: title,
      category: category,
      tagLabel: title,
      tagClass: 'c-prog',
      description: `Custom ${title} course playlist`,
      level: 'All Levels',
      lessonsCount: 0,
      duration: '0 mins',
      icon: 'cpu',
      modules: []
    };
    this.courses.push(newCourse);
    this.saveCourses();
    return newCourse;
  }

  deleteCourse(courseId) {
    this.courses = this.courses.filter(c => c.id !== courseId);
    this.saveCourses();
  }

  renameCourse(courseId, newTitle) {
    const course = this.courses.find(c => c.id === courseId);
    if (course && newTitle.trim()) {
      course.title = newTitle.trim();
      course.tagLabel = newTitle.trim();
      this.saveCourses();
    }
  }

  renameModule(courseId, moduleId, newTitle) {
    const course = this.courses.find(c => c.id === courseId);
    if (course) {
      const mod = course.modules.find(m => m.id === moduleId);
      if (mod && newTitle.trim()) {
        mod.title = newTitle.trim();
        this.saveCourses();
      }
    }
  }

  addModule(courseId, title) {
    const course = this.courses.find(c => c.id === courseId);
    if (!course) return null;
    const modId = 'mod-' + Date.now();
    const newMod = {
      id: modId,
      title: title,
      lessons: []
    };
    course.modules.push(newMod);
    this.saveCourses();
    return newMod;
  }

  deleteModule(courseId, moduleId) {
    const course = this.courses.find(c => c.id === courseId);
    if (course) {
      course.modules = course.modules.filter(m => m.id !== moduleId);
      this.saveCourses();
    }
  }

  addLesson(courseId, moduleId, title, videoUrl = '', codeSnippet = '') {
    const course = this.courses.find(c => c.id === courseId);
    if (!course) return null;
    const mod = course.modules.find(m => m.id === moduleId);
    if (!mod) return null;

    const lessonId = 'lesson-' + Date.now();
    const newLesson = {
      id: lessonId,
      title: title,
      duration: '10 mins',
      videoUrl: videoUrl,
      summary: `Lesson video for ${title}`,
      codeSnippet: codeSnippet || `#include <stdio.h>\n\nint main() {\n    // ${title}\n    printf("Hello World\\n");\n    return 0;\n}`,
      language: 'c',
      steps: [
        {
          stepNum: 1,
          explanation: `Execution starts for ${title}.`,
          codeLine: 4,
          memoryState: {
            stack: [{ addr: "0x7ffe00", name: "main()", val: "Active", type: "function" }],
            heap: []
          }
        }
      ]
    };
    mod.lessons.push(newLesson);
    this.saveCourses();
    return newLesson;
  }

  deleteLesson(courseId, moduleId, lessonId) {
    const course = this.courses.find(c => c.id === courseId);
    if (course) {
      const mod = course.modules.find(m => m.id === moduleId);
      if (mod) {
        mod.lessons = mod.lessons.filter(l => l.id !== lessonId);
        this.saveCourses();
      }
    }
  }

  moveLesson(courseId, moduleId, lessonId, direction) {
    const course = this.courses.find(c => c.id === courseId);
    if (!course) return;
    const mod = course.modules.find(m => m.id === moduleId);
    if (!mod) return;

    const idx = mod.lessons.findIndex(l => l.id === lessonId);
    if (idx === -1) return;

    const targetIdx = idx + direction;
    if (targetIdx >= 0 && targetIdx < mod.lessons.length) {
      const temp = mod.lessons[idx];
      mod.lessons[idx] = mod.lessons[targetIdx];
      mod.lessons[targetIdx] = temp;
      this.saveCourses();
    }
  }

  isLessonCompleted(lessonId) {
    return this.completedLessons.includes(lessonId);
  }

  toggleLessonComplete(lessonId) {
    if (this.isLessonCompleted(lessonId)) {
      this.completedLessons = this.completedLessons.filter(id => id !== lessonId);
    } else {
      this.completedLessons.push(lessonId);
    }
    localStorage.setItem('devbase_completed_lessons', JSON.stringify(this.completedLessons));
  }

  saveOfflineVideoBinding(lessonId, videoData) {
    this.offlineVideosMap[lessonId] = videoData;
    if (videoData.type === 'blob') {
      this.activeBlobs[lessonId] = videoData.url;
    }
    localStorage.setItem('devbase_offline_videos', JSON.stringify(this.offlineVideosMap));
  }

  deleteOfflineVideoBinding(lessonId) {
    delete this.offlineVideosMap[lessonId];
    localStorage.setItem('devbase_offline_videos', JSON.stringify(this.offlineVideosMap));
  }

  clearAllOfflineVideos() {
    this.offlineVideosMap = {};
    localStorage.removeItem('devbase_offline_videos');
  }

  getOfflineVideoBinding(lessonId) {
    return this.offlineVideosMap[lessonId] || null;
  }

  saveNotes(lessonId, text) {
    this.savedNotesMap[lessonId] = text;
    localStorage.setItem('devbase_saved_notes', JSON.stringify(this.savedNotesMap));
  }

  getNotes(lessonId) {
    return this.savedNotesMap[lessonId] || "";
  }

  recordQuizScore(isCorrect) {
    this.quizScores.total += 1;
    if (isCorrect) this.quizScores.correct += 1;
    localStorage.setItem('devbase_quiz_scores', JSON.stringify(this.quizScores));
  }
}

class DevBaseApp {
  constructor() {
    this.state = new DevBaseAppState();

    this.videoPlayer = new VideoPlayerManager(this.state, (currentTime, duration) => {
      this.onVideoTimeUpdate(currentTime, duration);
    });

    this.visualizer = new MemoryVisualizer(
      'visualizer-canvas-container',
      'visualizer-explanation-bar',
      'current-step-num',
      'total-steps-num'
    );

    this.codePlayground = new CodePlayground(
      'code-snippet-block',
      'code-output-display',
      'code-lang-tag'
    );

    this.quizModule = new QuizModule('lesson-quiz-box', (isCorrect) => {
      this.state.recordQuizScore(isCorrect);
      this.updateDashboardStats();
    });

    this.sandboxEngine = new SandboxEngine(
      'sandbox-editor-textarea',
      'sandbox-line-numbers',
      'sandbox-intellisense-popup',
      'sandbox-console-output',
      'sandbox-memory-vis',
      'sandbox-lang-select'
    );

    this.initGlobalEvents();
    this.setupAuthSystem();
    this.initHeroDebuggerAnimation();
    this.renderCatalog();
    this.renderDashboard();
    
    this.loadLesson(this.state.currentCourse, this.state.currentLesson);
    this.switchView('catalog');
  }

  initHeroDebuggerAnimation() {
    let animStep = 1;
    const stepLabel = document.getElementById('hero-anim-step-label');
    const line1 = document.getElementById('anim-line-1');
    const line2 = document.getElementById('anim-line-2');
    const line3 = document.getElementById('anim-line-3');
    const line4 = document.getElementById('anim-line-4');
    const line5 = document.getElementById('anim-line-5');
    
    const cardStack = document.getElementById('anim-card-stack');
    const stackVarABox = document.getElementById('stack-var-a-box');
    const stackVarPtrBox = document.getElementById('stack-var-ptr-box');
    const stackVarPtrVal = document.getElementById('stack-var-ptr-val');

    const cardHeap = document.getElementById('anim-card-heap');
    const valHeap = document.getElementById('anim-val-heap');
    const heapBadge = document.getElementById('anim-heap-badge');

    if (!line1 || !cardStack) return;

    const runAnimStep = () => {
      const isLight = document.body.classList.contains('light-theme') || document.body.getAttribute('data-theme') === 'light';
      const defaultTextColor = isLight ? '#475569' : '#94a3b8';
      const activeTextColor = isLight ? '#0f172a' : '#ffffff';

      // reset all lines
      [line1, line2, line3, line4, line5].forEach(l => {
        if (l) { l.style.background = 'transparent'; l.style.color = defaultTextColor; }
      });

      if (animStep === 1) {
        if (stepLabel) stepLabel.textContent = 'Step 1: int a = 10; (Stack Variable)';
        if (line1) { line1.style.background = isLight ? 'rgba(2,132,199,0.18)' : 'rgba(56,189,248,0.25)'; line1.style.color = activeTextColor; }
        if (cardStack) { cardStack.style.borderColor = isLight ? '#0284c7' : '#38bdf8'; cardStack.style.boxShadow = isLight ? '0 4px 14px rgba(2,132,199,0.2)' : '0 0 14px rgba(56,189,248,0.4)'; }
        if (stackVarABox) { stackVarABox.style.background = isLight ? 'rgba(2,132,199,0.15)' : 'rgba(56,189,248,0.3)'; stackVarABox.style.opacity = '1'; }
        if (stackVarPtrBox) { stackVarPtrBox.style.opacity = '0.3'; }
        if (cardHeap) { cardHeap.style.opacity = '0.3'; cardHeap.style.boxShadow = 'none'; }
        if (valHeap) { valHeap.textContent = '?'; valHeap.style.color = isLight ? '#0284c7' : '#38bdf8'; }
        if (heapBadge) { heapBadge.textContent = 'MALLOC'; heapBadge.style.background = '#059669'; heapBadge.style.color = '#fff'; }
        if (stackVarPtrVal) { stackVarPtrVal.textContent = '0x902040'; stackVarPtrVal.style.color = '#d97706'; }
      } else if (animStep === 2) {
        if (stepLabel) stepLabel.textContent = 'Step 2: malloc(sizeof(int)); (Heap Allocated)';
        if (line2) { line2.style.background = isLight ? 'rgba(124,58,237,0.18)' : 'rgba(192,132,252,0.25)'; line2.style.color = activeTextColor; }
        if (stackVarPtrBox) { stackVarPtrBox.style.opacity = '1'; stackVarPtrBox.style.background = isLight ? 'rgba(124,58,237,0.15)' : 'rgba(192,132,252,0.3)'; }
        if (cardHeap) {
          cardHeap.style.opacity = '1';
          cardHeap.style.background = isLight ? 'rgba(124,58,237,0.12)' : 'rgba(168,85,247,0.15)';
          cardHeap.style.borderColor = isLight ? '#7c3aed' : '#c084fc';
          cardHeap.style.boxShadow = isLight ? '0 4px 14px rgba(124,58,237,0.2)' : '0 0 16px rgba(168,85,247,0.4)';
        }
        if (valHeap) { valHeap.textContent = '?'; valHeap.style.color = isLight ? '#0284c7' : '#38bdf8'; }
      } else if (animStep === 3) {
        if (stepLabel) stepLabel.textContent = 'Step 3: *ptr = a + 15; (Write 25 to Heap)';
        if (line3) { line3.style.background = isLight ? 'rgba(5,150,105,0.18)' : 'rgba(16,185,129,0.25)'; line3.style.color = activeTextColor; }
        if (cardHeap) {
          cardHeap.style.background = isLight ? 'rgba(5,150,105,0.15)' : 'rgba(16,185,129,0.18)';
          cardHeap.style.borderColor = isLight ? '#059669' : '#10b981';
          cardHeap.style.boxShadow = isLight ? '0 4px 16px rgba(5,150,105,0.25)' : '0 0 22px rgba(16,185,129,0.6)';
        }
        if (valHeap) { valHeap.textContent = '25'; valHeap.style.color = isLight ? '#059669' : '#00f5d4'; }
      } else if (animStep === 4) {
        if (stepLabel) stepLabel.textContent = 'Step 4: free(ptr); (Heap Memory Freed)';
        if (line4) { line4.style.background = isLight ? 'rgba(220,38,38,0.18)' : 'rgba(239,68,68,0.25)'; line4.style.color = activeTextColor; }
        if (cardHeap) {
          cardHeap.style.background = isLight ? 'rgba(220,38,38,0.12)' : 'rgba(239,68,68,0.15)';
          cardHeap.style.borderColor = isLight ? '#dc2626' : '#ef4444';
          cardHeap.style.boxShadow = 'none';
        }
        if (valHeap) { valHeap.textContent = 'freed'; valHeap.style.color = isLight ? '#dc2626' : '#ef4444'; }
        if (heapBadge) { heapBadge.textContent = 'FREED'; heapBadge.style.background = isLight ? '#dc2626' : '#ef4444'; heapBadge.style.color = '#fff'; }
      } else if (animStep === 5) {
        if (stepLabel) stepLabel.textContent = 'Step 5: ptr = NULL; (Dangling Pointer Reset)';
        if (line5) { line5.style.background = isLight ? 'rgba(217,119,6,0.18)' : 'rgba(234,179,8,0.25)'; line5.style.color = activeTextColor; }
        if (stackVarPtrBox) { stackVarPtrBox.style.background = isLight ? 'rgba(217,119,6,0.15)' : 'rgba(234,179,8,0.25)'; }
        if (stackVarPtrVal) { stackVarPtrVal.textContent = '0x000000 (NULL)'; stackVarPtrVal.style.color = isLight ? '#d97706' : '#eab308'; }
      }
    };

    runAnimStep();
    if (this.heroAnimInterval) clearInterval(this.heroAnimInterval);
    this.heroAnimInterval = setInterval(() => {
      animStep++;
      if (animStep > 5) animStep = 1;
      runAnimStep();
    }, 2000);
  }

  setupAuthSystem() {
    this.authSession = JSON.parse(localStorage.getItem('log2code_session') || '{"isLoggedIn":false,"user":null}');
    this.activeAuthRole = 'student';

    const updateAuthUI = () => {
      const authBox = document.getElementById('user-auth-box');
      if (!authBox) return;

      if (this.authSession && this.authSession.isLoggedIn && this.authSession.user) {
        const u = this.authSession.user;
        const badgeBg = u.role === 'admin' ? 'rgba(88, 28, 135, 0.45)' : 'rgba(30, 58, 138, 0.45)';
        const badgeBorder = u.role === 'admin' ? '1px solid rgba(168,85,247,0.35)' : '1px solid rgba(56,189,248,0.35)';
        const badgeText = u.role === 'admin' ? '#c084fc' : '#38bdf8';
        const roleLabel = u.role === 'admin' ? '🛡️ Admin' : '👨‍🎓 Student';

        authBox.innerHTML = `
          <div style="display:inline-flex; align-items:center; gap:6px;">
            <span class="user-profile-badge" style="height:28px; line-height:26px; padding:0 10px; font-size:0.74rem; font-weight:700; background:${badgeBg}; border:${badgeBorder}; color:${badgeText}; border-radius:2px; display:inline-flex; align-items:center; gap:6px; box-sizing:border-box; vertical-align:middle;">
              ${roleLabel} (${u.name})
            </span>
            <button id="btn-user-logout" title="Sign Out" style="height:28px; line-height:26px; padding:0 10px; font-size:0.74rem; font-weight:700; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:#ef4444; border-radius:2px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box; vertical-align:middle;">
              Logout
            </button>
          </div>
        `;
      } else {
        authBox.innerHTML = `
          <button class="btn btn-sm btn-outline" id="btn-open-login" style="height:28px; padding:0 10px; font-size:0.74rem; border-radius:2px; border:1px solid #38bdf8; color:#38bdf8; background:rgba(56,189,248,0.1); display:inline-flex; align-items:center; gap:6px; font-weight:700; cursor:pointer; box-sizing:border-box;">
            <i data-lucide="log-in"></i> Login
          </button>
        `;
      }
      if (window.lucide) lucide.createIcons();
    };

    updateAuthUI();

    // Global Click Delegation for Auth Buttons
    document.addEventListener('click', (e) => {
      const openBtn = e.target.closest('#btn-open-login');
      if (openBtn) {
        const authModal = document.getElementById('auth-modal');
        if (authModal) authModal.style.display = 'flex';
        return;
      }

      const closeBtn = e.target.closest('#btn-close-auth-modal');
      if (closeBtn) {
        const authModal = document.getElementById('auth-modal');
        if (authModal) authModal.style.display = 'none';
        return;
      }

      const logoutBtn = e.target.closest('#btn-user-logout');
      if (logoutBtn) {
        this.authSession = { isLoggedIn: false, user: null };
        localStorage.removeItem('log2code_session');
        updateAuthUI();
        this.switchView('catalog');
        return;
      }
    });

    const tabStudent = document.getElementById('tab-login-student');
    const tabAdmin = document.getElementById('tab-login-admin');
    const userInput = document.getElementById('auth-input-username');
    const passInput = document.getElementById('auth-input-password');
    const errorMsg = document.getElementById('auth-error-msg');
    const authForm = document.getElementById('form-auth-login');

    if (tabStudent && tabAdmin) {
      tabStudent.addEventListener('click', () => {
        this.activeAuthRole = 'student';
        tabStudent.style.background = '#38bdf8'; tabStudent.style.color = '#000';
        tabAdmin.style.background = 'transparent'; tabAdmin.style.color = '#94a3b8';
        if (userInput) userInput.value = '';
        if (passInput) passInput.value = '';
        if (errorMsg) errorMsg.style.display = 'none';
      });

      tabAdmin.addEventListener('click', () => {
        this.activeAuthRole = 'admin';
        tabAdmin.style.background = '#a855f7'; tabAdmin.style.color = '#fff';
        tabStudent.style.background = 'transparent'; tabStudent.style.color = '#94a3b8';
        if (userInput) userInput.value = '';
        if (passInput) passInput.value = '';
        if (errorMsg) errorMsg.style.display = 'none';
      });
    }

    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = userInput ? userInput.value.trim().toLowerCase() : '';
        const password = passInput ? passInput.value.trim() : '';

        if (errorMsg) errorMsg.style.display = 'none';

        const registeredStudents = JSON.parse(localStorage.getItem('log2code_registered_students') || '[{"name":"Student Learner","username":"student","password":"student123"}]');
        const matchedStudent = registeredStudents.find(s => (s.username.toLowerCase() === username || s.username.toLowerCase() + '@log2code.com' === username) && s.password === password);

        const authModal = document.getElementById('auth-modal');

        if ((username === 'admin@log2code.com' || username === 'admin') && password === 'admin123') {
          this.authSession = {
            isLoggedIn: true,
            user: { name: 'System Admin', role: 'admin', email: 'admin@log2code.com' }
          };
          localStorage.setItem('log2code_session', JSON.stringify(this.authSession));
          updateAuthUI();
          if (authModal) authModal.style.display = 'none';
          this.switchView('admin');
        } else if (matchedStudent) {
          this.authSession = {
            isLoggedIn: true,
            user: { name: matchedStudent.name, role: 'student', email: matchedStudent.username }
          };
          localStorage.setItem('log2code_session', JSON.stringify(this.authSession));
          updateAuthUI();
          if (authModal) authModal.style.display = 'none';
          this.switchView('catalog');
        } else {
          if (errorMsg) {
            errorMsg.textContent = "❌ Invalid username or password! Please check credentials set by Admin.";
            errorMsg.style.display = 'block';
          }
        }
      });
    }

    // Intercept switchView for View Gating:
    // Courses Catalog is public; all remaining views (Lesson Visualizer, Code Sandbox, Dashboard, Admin) require login!
    const originalSwitchView = this.switchView.bind(this);
    this.switchView = (viewId) => {
      if (viewId !== 'catalog' && viewId !== 'sandbox') {
        if (!this.authSession.isLoggedIn || !this.authSession.user) {
          const authModal = document.getElementById('auth-modal');
          if (authModal) authModal.style.display = 'flex';
          if (tabStudent) tabStudent.click();
          if (errorMsg) {
            errorMsg.textContent = "🔑 Login Required! Please sign in as Student or Admin to access this feature.";
            errorMsg.style.display = 'block';
          }
          return;
        }

        if (viewId === 'admin' && this.authSession.user.role !== 'admin') {
          const authModal = document.getElementById('auth-modal');
          if (authModal) authModal.style.display = 'flex';
          if (tabAdmin) tabAdmin.click();
          if (errorMsg) {
            errorMsg.textContent = "🛡️ Admin Login Required! Sign in with Admin credentials to access Admin Control.";
            errorMsg.style.display = 'block';
          }
          return;
        }
      }
      originalSwitchView(viewId);
    };
  }

  initGlobalEvents() {
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.getAttribute('data-view');
        this.switchView(view);
      });
    });

    this.initThemeController();
    this.initSyntaxThemeSelector();

    const toggleFocusMode = () => {
      document.body.classList.toggle('sandbox-focus-mode');
      const isFocused = document.body.classList.contains('sandbox-focus-mode');
      const focusLabel = document.getElementById('focus-mode-btn-label');
      if (focusLabel) {
        focusLabel.textContent = isFocused ? 'Normal View' : 'Full View IDE';
      }
    };

    document.getElementById('btn-toggle-focus-mode')?.addEventListener('click', toggleFocusMode);
    document.getElementById('btn-show-navbar')?.addEventListener('click', toggleFocusMode);

    document.getElementById('btn-hero-start')?.addEventListener('click', () => {
      this.switchView('player');
    });

    document.getElementById('btn-hero-upload')?.addEventListener('click', () => {
      this.openVideoModal();
    });

    document.getElementById('btn-quick-upload-video')?.addEventListener('click', () => {
      this.openVideoModal();
    });

    document.getElementById('btn-attach-custom-video')?.addEventListener('click', () => {
      this.openVideoModal();
    });

    document.getElementById('btn-switch-player-mode')?.addEventListener('click', () => {
      if (this.videoPlayer) {
        this.videoPlayer.togglePlayerMode();
      }
    });

    document.getElementById('btn-open-gdrive-input')?.addEventListener('click', () => {
      this.openVideoModal();
    });

    document.getElementById('btn-back-to-catalog')?.addEventListener('click', () => {
      this.switchView('catalog');
    });

    document.getElementById('btn-step-next')?.addEventListener('click', () => {
      this.visualizer.nextStep();
    });

    document.getElementById('btn-step-prev')?.addEventListener('click', () => {
      this.visualizer.prevStep();
    });
    document.getElementById('btn-step-auto')?.addEventListener('click', (e) => {
      this.visualizer.toggleAutoPlay(e.currentTarget);
    });

    window.onStepChanged = (lineNum, inlineHints) => {
      this.codePlayground.highlightLine(lineNum, this.state.currentLesson.codeSnippet, inlineHints);
    };

    document.getElementById('btn-prev-lesson')?.addEventListener('click', () => {
      this.navigateLesson(-1);
    });
    document.getElementById('btn-next-lesson')?.addEventListener('click', () => {
      this.navigateLesson(1);
    });

    document.querySelectorAll('.bottom-bar-tabs .b-tab').forEach(bTab => {
      bTab.addEventListener('click', (e) => {
        const targetPanel = e.currentTarget.getAttribute('data-bpanel');
        document.querySelectorAll('.bottom-bar-tabs .b-tab').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');

        if (targetPanel === 'puzzles') {
          document.querySelector('.panel-tabs .tab-btn[data-tab="quiz"]')?.click();
        } else if (targetPanel === 'visualizer') {
          const visEl = document.querySelector('.visualizer-wrapper');
          if (visEl) visEl.scrollIntoView({ behavior: 'smooth' });
        } else if (targetPanel === 'video') {
          const vidEl = document.querySelector('.video-wrapper');
          if (vidEl) vidEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    document.querySelectorAll('.panel-tabs .tab-btn').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');
        document.querySelectorAll('.panel-tabs .tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel-tab-content .tab-pane').forEach(p => p.classList.remove('active'));
        
        e.currentTarget.classList.add('active');
        document.getElementById(`tab-${targetTab}`)?.classList.add('active');
      });
    });

    document.getElementById('btn-sync-video-code')?.addEventListener('click', () => {
      this.syncCodeFromVideo();
    });

    window.syncVideoCodeHandler = (showAlert = false, customCode = null) => this.syncCodeFromVideo(showAlert, customCode);

    document.getElementById('btn-copy-code')?.addEventListener('click', () => {
      if (this.state.currentLesson && this.state.currentLesson.codeSnippet) {
        navigator.clipboard.writeText(this.state.currentLesson.codeSnippet);
        alert("Code copied to clipboard!");
      }
    });

    document.getElementById('btn-toggle-complete')?.addEventListener('click', () => {
      if (this.state.currentLesson) {
        this.state.toggleLessonComplete(this.state.currentLesson.id);
        this.updateLessonCompletionUI();
        this.renderCurriculumSidebar();
        this.updateDashboardStats();
      }
    });

    const notesTextarea = document.getElementById('lesson-notes-textarea');
    if (notesTextarea) {
      notesTextarea.addEventListener('input', (e) => {
        if (this.state.currentLesson) {
          this.state.saveNotes(this.state.currentLesson.id, e.target.value);
        }
      });
    }

    this.initModalEvents();
    this.initSandboxEvents();

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const filter = e.target.getAttribute('data-filter');
        this.renderCatalog(filter);
      });
    });
  }

  initThemeController() {
    const savedTheme = localStorage.getItem('log2code_theme') || 'dark';

    const applyTheme = (theme) => {
      if (theme === 'light') {
        document.body.setAttribute('data-theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.add('light-theme');
      } else {
        document.body.setAttribute('data-theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.remove('light-theme');
      }

      const themeBtn = document.getElementById('btn-toggle-theme');
      if (themeBtn) {
        const icon = theme === 'light' ? 'sun' : 'moon';
        themeBtn.innerHTML = `<i data-lucide="${icon}"></i>`;
        if (window.lucide) lucide.createIcons();
      }
    };

    applyTheme(savedTheme);

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#btn-toggle-theme');
      if (btn) {
        const isCurrentlyLight = document.body.classList.contains('light-theme') || document.body.getAttribute('data-theme') === 'light';
        const newTheme = isCurrentlyLight ? 'dark' : 'light';
        localStorage.setItem('log2code_theme', newTheme);
        applyTheme(newTheme);
      }
    });
  }

  initSyntaxThemeSelector() {
    const savedTheme = localStorage.getItem('devbase2_syntax_theme') || 'theme-antigravity';
    document.body.setAttribute('data-syntax-theme', savedTheme);

    const dropdowns = document.querySelectorAll('.syntax-theme-dropdown');
    dropdowns.forEach(dropdown => {
      dropdown.value = savedTheme;
      dropdown.addEventListener('change', (e) => {
        const theme = e.target.value;
        document.body.setAttribute('data-syntax-theme', theme);
        localStorage.setItem('devbase2_syntax_theme', theme);
        dropdowns.forEach(d => d.value = theme);
        
        if (this.sandboxEngine) this.sandboxEngine.updateSyntaxHighlight();
        if (this.state && this.state.currentLesson && this.codePlayground) {
          this.codePlayground.loadCode(this.state.currentLesson.codeSnippet, this.state.currentLesson.language || 'c', 1);
        }
      });
    });
  }

  syncCodeFromVideo(showAlert = true, customCode = null) {
    const videoCode = customCode || (this.state.currentLesson ? this.state.currentLesson.codeSnippet : `#include <stdio.h>\n\nint main() {\n    printf("Hello World");\n    return 0;\n}`);
    
    if (this.state.currentLesson) {
      this.state.currentLesson.codeSnippet = videoCode;
    }
    
    if (this.codePlayground) {
      this.codePlayground.loadCode(videoCode, 'c', 1);
    }
    
    if (this.sandboxEngine && this.sandboxEngine.editor) {
      this.sandboxEngine.editor.value = videoCode;
      this.sandboxEngine.updateLineNumbers();
      this.sandboxEngine.updateSyntaxHighlight();
    }

    // Switch to Code tab automatically
    document.querySelectorAll('.panel-tabs .tab-btn').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel-tab-content .tab-pane').forEach(p => p.classList.remove('active'));
    const codeTabBtn = document.querySelector('.panel-tabs .tab-btn[data-tab="code"]');
    if (codeTabBtn) codeTabBtn.classList.add('active');
    document.getElementById('tab-code')?.classList.add('active');

    if (showAlert) {
      alert(`✨ Source code extracted & synced from video!\n\n${videoCode.substring(0, 150)}...`);
    }
  }

  navigateLesson(direction) {
    if (!this.state.currentCourse || !this.state.currentLesson) return;
    const allLessons = this.state.currentCourse.modules.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === this.state.currentLesson.id);
    if (currentIndex === -1) return;

    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < allLessons.length) {
      this.loadLesson(this.state.currentCourse, allLessons[newIndex]);
    }
  }

  switchView(viewId) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[data-view="${viewId}"]`)?.classList.add('active');

    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`view-${viewId}`)?.classList.add('active');

    if (viewId === 'sandbox') {
      document.body.classList.add('sandbox-focus-mode');
    } else {
      document.body.classList.remove('sandbox-focus-mode');
    }

    if (viewId === 'dashboard') {
      this.renderDashboard();
    } else if (viewId === 'player') {
      this.renderCurriculumSidebar();
    } else if (viewId === 'admin') {
      this.renderAdminView();
    }
  }

  renderAdminView() {
    const treeContainer = document.getElementById('admin-hierarchy-tree');
    if (!treeContainer || !this.state.courses) return;

    let treeHtml = '';
    this.state.courses.forEach(course => {
      treeHtml += `
        <div class="admin-course-group" style="margin-bottom:14px; background:rgba(15,23,42,0.6); padding:8px; border-radius:var(--radius-sm); border:1px solid rgba(56,189,248,0.25);">
          <div style="font-weight:700; font-size:0.85rem; color:#38bdf8; display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            ${this.editingCourseId === course.id ? `
              <div style="display:flex; align-items:center; gap:6px; flex:1;" onclick="event.stopPropagation()">
                <i data-lucide="book" style="color:#00f5d4;"></i>
                <input type="text" id="inline-course-input-${course.id}" value="${course.title}" style="font-size:0.8rem; font-weight:700; background:#0f172a; color:#00f5d4; border:1px solid #00f5d4; border-radius:4px; padding:2px 6px; flex:1; outline:none;" />
                <button class="admin-btn-save-course" data-course-id="${course.id}" style="width:20px; height:20px; border-radius:4px; background:#00f5d4; color:#000; border:none; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0;" title="Save"><i data-lucide="check" style="width:12px; height:12px;"></i></button>
                <button class="admin-btn-cancel-course" style="width:20px; height:20px; border-radius:4px; background:rgba(239,68,68,0.2); color:#ef4444; border:1px solid #ef4444; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0;" title="Cancel"><i data-lucide="x" style="width:12px; height:12px;"></i></button>
              </div>
            ` : `
              <span><i data-lucide="book"></i> ${course.title}</span>
              <div style="display:flex; gap:4px; align-items:center;">
                <button class="admin-btn-add-subcat-direct" data-course-id="${course.id}" title="Add Sub-Category under ${course.title}" style="height:20px; padding:0 6px; border-radius:4px; background:rgba(168,85,247,0.18); color:#c084fc; border:1px solid rgba(168,85,247,0.4); box-shadow:0 0 6px rgba(168,85,247,0.2); cursor:pointer; display:inline-flex; align-items:center; gap:2px; font-size:0.68rem; font-weight:600;"><i data-lucide="plus" style="width:10px; height:10px;"></i> Sub-Cat</button>
                <button class="admin-btn-rename-course" data-course-id="${course.id}" title="Rename Main Branch" style="width:20px; height:20px; border-radius:4px; background:rgba(0,245,212,0.15); color:#00f5d4; border:1px solid rgba(0,245,212,0.4); box-shadow:0 0 6px rgba(0,245,212,0.25); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0;"><i data-lucide="edit-2" style="width:10px; height:10px;"></i></button>
                <button class="admin-btn-del-course" data-course-id="${course.id}" title="Delete Main Branch" style="width:20px; height:20px; border-radius:4px; background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.4); box-shadow:0 0 6px rgba(239,68,68,0.25); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0;"><i data-lucide="trash-2" style="width:10px; height:10px;"></i></button>
              </div>
            `}
          </div>
      `;

      course.modules.forEach(mod => {
        treeHtml += `
          <div class="admin-module-group" style="padding-left:8px; margin-bottom:8px; border-left:2px solid rgba(168,85,247,0.4);">
            <div style="font-weight:600; font-size:0.8rem; color:#e2e8f0; display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              ${this.editingModuleId === mod.id ? `
                <div style="display:flex; align-items:center; gap:6px; flex:1;" onclick="event.stopPropagation()">
                  <span style="font-size:0.8rem;">📁</span>
                  <input type="text" id="inline-mod-input-${mod.id}" value="${mod.title}" style="font-size:0.75rem; font-weight:600; background:#0f172a; color:#c084fc; border:1px solid #c084fc; border-radius:4px; padding:2px 6px; flex:1; outline:none;" />
                  <button class="admin-btn-save-mod" data-course-id="${course.id}" data-mod-id="${mod.id}" style="width:18px; height:18px; border-radius:4px; background:#c084fc; color:#000; border:none; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0;" title="Save"><i data-lucide="check" style="width:10px; height:10px;"></i></button>
                  <button class="admin-btn-cancel-mod" style="width:18px; height:18px; border-radius:4px; background:rgba(239,68,68,0.2); color:#ef4444; border:1px solid #ef4444; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0;" title="Cancel"><i data-lucide="x" style="width:10px; height:10px;"></i></button>
                </div>
              ` : `
                <span>📁 ${mod.title}</span>
                <div style="display:flex; align-items:center; gap:4px;">
                  <span style="font-size:0.7rem; color:#94a3b8;">${mod.lessons.length}</span>
                  <button class="admin-btn-add-lesson-direct" data-course-id="${course.id}" data-mod-id="${mod.id}" title="Add Lesson under ${mod.title}" style="height:18px; padding:0 5px; border-radius:4px; background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); box-shadow:0 0 6px rgba(56,189,248,0.2); cursor:pointer; display:inline-flex; align-items:center; gap:2px; font-size:0.65rem; font-weight:600;"><i data-lucide="plus" style="width:9px; height:9px;"></i> Lesson</button>
                  <button class="admin-btn-rename-mod" data-course-id="${course.id}" data-mod-id="${mod.id}" title="Rename Sub-Category" style="width:18px; height:18px; border-radius:4px; background:rgba(168,85,247,0.15); color:#c084fc; border:1px solid rgba(168,85,247,0.4); box-shadow:0 0 6px rgba(168,85,247,0.2); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0;"><i data-lucide="edit-2" style="width:9px; height:9px;"></i></button>
                  <button class="admin-btn-del-mod" data-course-id="${course.id}" data-mod-id="${mod.id}" title="Delete Sub-Category" style="width:18px; height:18px; border-radius:4px; background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.4); box-shadow:0 0 6px rgba(239,68,68,0.2); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0;"><i data-lucide="trash-2" style="width:9px; height:9px;"></i></button>
                </div>
              `}
            </div>
            <div class="admin-lesson-list" style="display:flex; flex-direction:column; gap:4px; padding-left:8px;">
        `;

        mod.lessons.forEach((l, lIdx) => {
          const attached = this.state.getOfflineVideoBinding(l.id);
          const activeClass = (this.selectedAdminLesson && this.selectedAdminLesson.id === l.id) ? 'background:rgba(168,85,247,0.25); border-color:#c084fc; box-shadow:0 0 8px rgba(168,85,247,0.3);' : 'background:rgba(15,23,42,0.4); border-color:rgba(255,255,255,0.08);';
          treeHtml += `
            <div class="admin-tree-lesson-item" data-lesson-id="${l.id}" data-course-id="${course.id}" data-mod-id="${mod.id}" style="padding:4px 8px; border:1px solid; border-radius:var(--radius-sm); font-size:0.75rem; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:6px; transition:all 0.15s ease; ${activeClass}">
              <span title="${l.title}" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0; color:#e2e8f0;">📄 ${l.title}</span>
              <div style="display:flex; align-items:center; gap:3px; flex-shrink:0;">
                <button class="admin-btn-move-up" data-course-id="${course.id}" data-mod-id="${mod.id}" data-lesson-id="${l.id}" title="Move Up" style="width:18px; height:18px; border-radius:3px; background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.35); box-shadow:0 0 5px rgba(56,189,248,0.2); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0;"><i data-lucide="chevron-up" style="width:10px; height:10px;"></i></button>
                <button class="admin-btn-move-down" data-course-id="${course.id}" data-mod-id="${mod.id}" data-lesson-id="${l.id}" title="Move Down" style="width:18px; height:18px; border-radius:3px; background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.35); box-shadow:0 0 5px rgba(56,189,248,0.2); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0;"><i data-lucide="chevron-down" style="width:10px; height:10px;"></i></button>
                <button class="admin-btn-del-lesson" data-course-id="${course.id}" data-mod-id="${mod.id}" data-lesson-id="${l.id}" title="Delete Lesson" style="width:18px; height:18px; border-radius:3px; background:rgba(239,68,68,0.12); color:#ef4444; border:1px solid rgba(239,68,68,0.35); box-shadow:0 0 5px rgba(239,68,68,0.2); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0;"><i data-lucide="x" style="width:10px; height:10px;"></i></button>
              </div>
            </div>
          `;
        });

        treeHtml += `
            </div>
          </div>
        `;
      });

      treeHtml += `</div>`;
    });

    treeContainer.innerHTML = treeHtml;
    if (window.lucide) lucide.createIcons();

    // Focus active inline input if editing
    if (this.editingCourseId) {
      const input = document.getElementById(`inline-course-input-${this.editingCourseId}`);
      if (input) {
        input.focus();
        input.select();
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            this.state.renameCourse(this.editingCourseId, input.value);
            this.editingCourseId = null;
            this.renderCatalog();
            this.renderCurriculumSidebar();
            this.renderAdminView();
          } else if (e.key === 'Escape') {
            this.editingCourseId = null;
            this.renderAdminView();
          }
        });
      }
    }

    if (this.editingModuleId) {
      const input = document.getElementById(`inline-mod-input-${this.editingModuleId}`);
      if (input) {
        input.focus();
        input.select();
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const courseId = input.getAttribute('data-course-id') || (this.state.courses[0] && this.state.courses[0].id);
            this.state.renameModule(courseId, this.editingModuleId, input.value);
            this.editingModuleId = null;
            this.renderCurriculumSidebar();
            this.renderAdminView();
          } else if (e.key === 'Escape') {
            this.editingModuleId = null;
            this.renderAdminView();
          }
        });
      }
    }

    // Direct in-tree + Sub-Cat and + Lesson button handlers
    treeContainer.querySelectorAll('.admin-btn-add-subcat-direct').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cId = btn.getAttribute('data-course-id');
        this.activeTargetCourseId = cId;
        const targetCourse = this.state.courses.find(c => c.id === cId);
        if (!targetCourse) return;

        const mCount = targetCourse.modules ? targetCourse.modules.length + 1 : 1;
        const newMod = this.state.addModule(cId, `New Sub-Category ${mCount}`);
        const newLesson = this.state.addLesson(cId, newMod.id, `01. Lesson Overview`);
        this.activeTargetModuleId = newMod.id;
        
        this.selectedAdminLesson = newLesson;
        this.renderCurriculumSidebar();
        this.renderAdminView();

        const titleInput = document.getElementById('admin-input-title');
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      });
    });

    treeContainer.querySelectorAll('.admin-btn-add-lesson-direct').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cId = btn.getAttribute('data-course-id');
        const mId = btn.getAttribute('data-mod-id');
        this.activeTargetCourseId = cId;
        this.activeTargetModuleId = mId;

        const targetCourse = this.state.courses.find(c => c.id === cId);
        if (!targetCourse) return;
        const targetMod = targetCourse.modules.find(m => m.id === mId);
        if (!targetMod) return;

        const lCount = targetMod.lessons ? targetMod.lessons.length + 1 : 1;
        const newLesson = this.state.addLesson(cId, mId, `New Playlist Lesson ${lCount}`);
        
        this.selectedAdminLesson = newLesson;
        this.populateAdminEditorForm(newLesson);
        this.renderCurriculumSidebar();
        this.renderAdminView();

        const titleInput = document.getElementById('admin-input-title');
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      });
    });

    // Save & Cancel inline buttons
    treeContainer.querySelectorAll('.admin-btn-save-course').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cId = btn.getAttribute('data-course-id');
        const input = document.getElementById(`inline-course-input-${cId}`);
        if (input && input.value.trim()) {
          this.state.renameCourse(cId, input.value.trim());
        }
        this.editingCourseId = null;
        this.renderCatalog();
        this.renderCurriculumSidebar();
        this.renderAdminView();
      });
    });

    treeContainer.querySelectorAll('.admin-btn-cancel-course').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editingCourseId = null;
        this.renderAdminView();
      });
    });

    treeContainer.querySelectorAll('.admin-btn-save-mod').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cId = btn.getAttribute('data-course-id');
        const mId = btn.getAttribute('data-mod-id');
        const input = document.getElementById(`inline-mod-input-${mId}`);
        if (input && input.value.trim()) {
          this.state.renameModule(cId, mId, input.value.trim());
        }
        this.editingModuleId = null;
        this.renderCurriculumSidebar();
        this.renderAdminView();
      });
    });

    treeContainer.querySelectorAll('.admin-btn-cancel-mod').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editingModuleId = null;
        this.renderAdminView();
      });
    });

    // Attach tree click handlers for selecting lesson
    treeContainer.querySelectorAll('.admin-tree-lesson-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('button')) return; // Ignore button clicks
        const lId = item.getAttribute('data-lesson-id');
        const cId = item.getAttribute('data-course-id');
        const mId = item.getAttribute('data-mod-id');

        this.activeTargetCourseId = cId;
        this.activeTargetModuleId = mId;

        const allLessons = this.state.courses.flatMap(c => c.modules.flatMap(m => m.lessons));
        const lesson = allLessons.find(l => l.id === lId);
        if (lesson) {
          this.selectedAdminLesson = lesson;
          this.populateAdminEditorForm(lesson);
          this.renderAdminView();
        }
      });
    });

    // Enable Rename Mode on Click
    treeContainer.querySelectorAll('.admin-btn-rename-course').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editingCourseId = btn.getAttribute('data-course-id');
        this.renderAdminView();
      });
    });

    treeContainer.querySelectorAll('.admin-btn-rename-mod').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editingModuleId = btn.getAttribute('data-mod-id');
        this.renderAdminView();
      });
    });

    // Move Up / Down handlers
    treeContainer.querySelectorAll('.admin-btn-move-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cId = btn.getAttribute('data-course-id');
        const mId = btn.getAttribute('data-mod-id');
        const lId = btn.getAttribute('data-lesson-id');
        this.state.moveLesson(cId, mId, lId, -1);
        this.renderCurriculumSidebar();
        this.renderAdminView();
      });
    });

    treeContainer.querySelectorAll('.admin-btn-move-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cId = btn.getAttribute('data-course-id');
        const mId = btn.getAttribute('data-mod-id');
        const lId = btn.getAttribute('data-lesson-id');
        this.state.moveLesson(cId, mId, lId, 1);
        this.renderCurriculumSidebar();
        this.renderAdminView();
      });
    });

    // Delete handlers (Instant In-Pane Deletion without Popups)
    treeContainer.querySelectorAll('.admin-btn-del-lesson').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cId = btn.getAttribute('data-course-id');
        const mId = btn.getAttribute('data-mod-id');
        const lId = btn.getAttribute('data-lesson-id');
        this.state.deleteLesson(cId, mId, lId);
        if (this.selectedAdminLesson && this.selectedAdminLesson.id === lId) {
          this.selectedAdminLesson = null;
        }
        this.renderCurriculumSidebar();
        this.renderAdminView();
      });
    });

    treeContainer.querySelectorAll('.admin-btn-del-mod').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cId = btn.getAttribute('data-course-id');
        const mId = btn.getAttribute('data-mod-id');
        this.state.deleteModule(cId, mId);
        this.renderCurriculumSidebar();
        this.renderAdminView();
      });
    });

    treeContainer.querySelectorAll('.admin-btn-del-course').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cId = btn.getAttribute('data-course-id');
        this.state.deleteCourse(cId);
        this.renderCurriculumSidebar();
        this.renderAdminView();
      });
    });

    // Toolbar Action Buttons (Add Branch, Add Sub-Cat, Add Lesson) - IN-PANE INSTANT CREATION
    const addCourseBtn = document.getElementById('admin-btn-add-course');
    const addModBtn = document.getElementById('admin-btn-add-module');
    const addLessonBtn = document.getElementById('admin-btn-add-lesson');

    if (addCourseBtn && !this.addCourseBound) {
      this.addCourseBound = true;
      addCourseBtn.addEventListener('click', () => {
        const cCount = this.state.courses ? this.state.courses.length + 1 : 1;
        const newC = this.state.addCourse(`New Branch Course ${cCount}`);
        const newMod = this.state.addModule(newC.id, `Module 1: Introduction`);
        const newLesson = this.state.addLesson(newC.id, newMod.id, `01. Getting Started`);
        
        this.selectedAdminLesson = newLesson;
        this.renderCatalog();
        this.renderCurriculumSidebar();
        this.renderAdminView();
        
        const titleInput = document.getElementById('admin-input-title');
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      });
    }

    if (addModBtn && !this.addModBound) {
      this.addModBound = true;
      addModBtn.addEventListener('click', () => {
        let targetCourse = (this.state.courses && this.state.courses.length > 0) ? this.state.courses[0] : this.state.addCourse('C Programming Mastery');
        const mCount = targetCourse.modules ? targetCourse.modules.length + 1 : 1;
        const newMod = this.state.addModule(targetCourse.id, `New Sub-Category ${mCount}`);
        const newLesson = this.state.addLesson(targetCourse.id, newMod.id, `01. Lesson Overview`);
        
        this.selectedAdminLesson = newLesson;
        this.renderCurriculumSidebar();
        this.renderAdminView();

        const titleInput = document.getElementById('admin-input-title');
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      });
    }

    if (addLessonBtn && !this.addLessonBound) {
      this.addLessonBound = true;
      addLessonBtn.addEventListener('click', () => {
        let targetCourse = (this.state.courses && this.state.courses.length > 0) ? this.state.courses[0] : this.state.addCourse('C Programming Mastery');
        let targetMod = (targetCourse.modules && targetCourse.modules.length > 0) ? targetCourse.modules[0] : this.state.addModule(targetCourse.id, 'Introduction');
        const lCount = targetMod.lessons ? targetMod.lessons.length + 1 : 1;
        
        const newLesson = this.state.addLesson(targetCourse.id, targetMod.id, `New Playlist Lesson ${lCount}`);
        this.selectedAdminLesson = newLesson;
        this.populateAdminEditorForm(newLesson);
        this.renderCurriculumSidebar();
        this.renderAdminView();

        // Focus on Title Input field in the right editor so the user can immediately edit the name!
        const titleInput = document.getElementById('admin-input-title');
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      });
    }

    // Form submission handler (In-Pane Instant Update)
    const form = document.getElementById('admin-lesson-form');
    if (form && !this.adminFormBound) {
      this.adminFormBound = true;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!this.selectedAdminLesson) return;

        const titleVal = document.getElementById('admin-input-title')?.value.trim();
        const videoVal = document.getElementById('admin-input-video-url')?.value.trim();
        const durVal = document.getElementById('admin-input-duration')?.value.trim();
        const codeVal = document.getElementById('admin-input-code')?.value;

        if (titleVal) this.selectedAdminLesson.title = titleVal;
        if (durVal) this.selectedAdminLesson.duration = durVal;
        if (codeVal) this.selectedAdminLesson.codeSnippet = codeVal;

        if (videoVal) {
          this.selectedAdminLesson.videoUrl = videoVal;
          this.state.saveOfflineVideoBinding(this.selectedAdminLesson.id, {
            type: 'gdrive',
            fileName: `GDrive (${this.selectedAdminLesson.title})`,
            url: videoVal,
            timestamp: new Date().toLocaleDateString()
          });
        }

        this.state.saveCourses();
        this.renderCurriculumSidebar();
        this.renderAdminView();
      });

      document.getElementById('admin-btn-preview-lesson')?.addEventListener('click', () => {
        if (this.selectedAdminLesson && this.state.currentCourse) {
          this.loadLesson(this.state.currentCourse, this.selectedAdminLesson);
          this.switchView('player');
        }
      });

      document.getElementById('admin-btn-clear-all')?.addEventListener('click', () => {
        this.state.clearAllOfflineVideos();
        this.renderCurriculumSidebar();
        this.renderAdminView();
      });
    }

    this.renderStudentCredentialsManager();
  }

  renderStudentCredentialsManager() {
    const container = document.getElementById('admin-students-list-box');
    if (!container) return;

    const students = JSON.parse(localStorage.getItem('log2code_registered_students') || '[{"name":"Student Learner","username":"student","password":"student123"}]');

    let html = `
      <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left; color:#e2e8f0;">
        <thead>
          <tr style="border-bottom:2px solid rgba(255,255,255,0.1); color:#38bdf8;">
            <th style="padding:10px;">Student Name</th>
            <th style="padding:10px;">Username / Email</th>
            <th style="padding:10px;">Password</th>
            <th style="padding:10px; text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    students.forEach((s, idx) => {
      html += `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
          <td style="padding:10px; font-weight:700; color:#fff;">${s.name}</td>
          <td style="padding:10px;"><code>${s.username}</code></td>
          <td style="padding:10px;"><code style="color:#10b981;">${s.password}</code></td>
          <td style="padding:10px; text-align:right;">
            <button class="btn-xs btn-outline btn-edit-student" data-index="${idx}" style="border-color:#38bdf8; color:#38bdf8; padding:3px 8px; margin-right:6px; font-size:0.7rem; border-radius:4px; cursor:pointer;">
              <i data-lucide="edit-2"></i> Edit
            </button>
            <button class="btn-xs btn-outline btn-delete-student" data-index="${idx}" style="border-color:#ef4444; color:#ef4444; padding:3px 8px; font-size:0.7rem; border-radius:4px; cursor:pointer;">
              <i data-lucide="trash-2"></i> Delete
            </button>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();

    // Bind Edit & Delete student credentials
    container.querySelectorAll('.btn-edit-student').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-index'));
        const s = students[idx];
        const newPass = prompt(`Key in new password for student "${s.username}":`, s.password);
        if (newPass !== null && newPass.trim() !== '') {
          students[idx].password = newPass.trim();
          localStorage.setItem('log2code_registered_students', JSON.stringify(students));
          this.renderStudentCredentialsManager();
        }
      });
    });

    container.querySelectorAll('.btn-delete-student').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-index'));
        students.splice(idx, 1);
        localStorage.setItem('log2code_registered_students', JSON.stringify(students));
        this.renderStudentCredentialsManager();
      });
    });

    const addStudentBtn = document.getElementById('btn-admin-add-student');
    if (addStudentBtn && !this.addStudentBound) {
      this.addStudentBound = true;
      addStudentBtn.addEventListener('click', () => {
        const name = prompt("Enter Student Full Name:", "New Student");
        if (!name) return;
        const username = prompt("Enter Username or Email for Student:", `student${students.length + 1}`);
        if (!username) return;
        const password = prompt("Set Password for Student:", "student123");
        if (!password) return;

        students.push({ name: name.trim(), username: username.trim().toLowerCase(), password: password.trim() });
        localStorage.setItem('log2code_registered_students', JSON.stringify(students));
        this.renderStudentCredentialsManager();
      });
    }
  }

  populateAdminEditorForm(lesson) {
    const titleInput = document.getElementById('admin-input-title');
    const videoInput = document.getElementById('admin-input-video-url');
    const durInput = document.getElementById('admin-input-duration');
    const codeInput = document.getElementById('admin-input-code');

    const attached = this.state.getOfflineVideoBinding(lesson.id);

    if (titleInput) titleInput.value = lesson.title;
    if (videoInput) videoInput.value = (attached ? attached.url : (lesson.videoUrl || ''));
    if (durInput) durInput.value = lesson.duration || '';
    if (codeInput) codeInput.value = lesson.codeSnippet || '';
  }

  renderCatalog(filterCategory = 'all') {
    const container = document.getElementById('course-grid-container');
    if (!container) return;

    let filtered = this.state.courses;
    if (filterCategory !== 'all') {
      filtered = this.state.courses.filter(c => c.category === filterCategory);
    }

    let html = '';
    filtered.forEach(course => {
      const completedCount = course.modules.flatMap(m => m.lessons).filter(l => this.state.isLessonCompleted(l.id)).length;
      const totalLessons = course.modules.flatMap(m => m.lessons).length;
      const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      html += `
        <div class="course-card" data-course-id="${course.id}">
          <div class="course-card-top">
            <div class="card-tags">
              <span class="tag ${course.tagClass}">${course.tagLabel}</span>
              <span class="tag" style="background:rgba(255,255,255,0.06); color:var(--text-muted);">${course.level}</span>
            </div>
            <h3>${course.title}</h3>
            <p>${course.description}</p>
          </div>

          <div>
            <div class="course-meta">
              <span class="meta-item"><i data-lucide="book-open"></i> ${totalLessons} Lessons</span>
              <span class="meta-item"><i data-lucide="clock"></i> ${course.duration}</span>
            </div>

            <div class="card-progress-bar">
              <div class="card-progress-fill" style="width: ${progressPct}%;"></div>
            </div>

            <div class="course-card-footer">
              <span style="font-size:0.8rem; color:var(--text-subtle);">${progressPct}% Complete</span>
              <button class="btn btn-primary btn-sm btn-open-course">
                <i data-lucide="play"></i> ${progressPct > 0 ? 'Continue' : 'Start'}
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();

    container.querySelectorAll('.course-card').forEach(card => {
      card.querySelector('.btn-open-course').addEventListener('click', () => {
        const courseId = card.getAttribute('data-course-id');
        const targetCourse = this.state.courses.find(c => c.id === courseId);
        if (targetCourse) {
          const firstLesson = targetCourse.modules[0].lessons[0];
          this.loadLesson(targetCourse, firstLesson);
          this.switchView('player');
        }
      });
    });
  }

  syncCodeFromVideo(showAlert = false, customCode = null) {
    if (!this.state.currentLesson) return;

    const targetCode = customCode || this.state.currentLesson.codeSnippet;

    if (targetCode) {
      this.state.currentLesson.codeSnippet = targetCode;
      this.codePlayground.loadCode(targetCode, this.state.currentLesson.language || 'c', 1);
      
      const editor = document.getElementById('sandbox-code-editor');
      if (editor) {
        editor.value = targetCode;
        if (this.sandboxEngine) {
          this.sandboxEngine.updateLineNumbers();
        }
      }
    }

    if (showAlert) {
      alert("✨ Live Video Code Synced to Code Playground & Sandbox!");
    }
  }

  loadLesson(course, lesson) {
    this.state.currentCourse = course;
    this.state.currentLesson = lesson;

    this.renderCurriculumSidebar();

    const courseTitleEl = document.getElementById('player-course-title');
    const lessonTitleEl = document.getElementById('player-lesson-title');
    if (courseTitleEl) courseTitleEl.textContent = course.title;
    if (lessonTitleEl) lessonTitleEl.textContent = lesson.title;

    try { this.videoPlayer.loadLessonVideo(lesson); } catch (e) { console.error(e); }
    try { this.visualizer.loadLesson(lesson); } catch (e) { console.error(e); }

    try { this.codePlayground.loadCode(lesson.codeSnippet, lesson.language || 'c', 1); } catch (e) { console.error(e); }
    try { this.quizModule.renderQuiz(lesson.quiz || []); } catch (e) { console.error(e); }

    const notesTextarea = document.getElementById('lesson-notes-textarea');
    if (notesTextarea) {
      notesTextarea.value = this.state.getNotes(lesson.id);
    }

    this.updateLessonCompletionUI();
  }

  renderCurriculumSidebar() {
    const container = document.getElementById('curriculum-list-container');
    if (!container || !this.state.currentCourse) return;

    let html = '';
    this.state.currentCourse.modules.forEach(mod => {
      const containsActiveLesson = mod.lessons.some(l => this.state.currentLesson && this.state.currentLesson.id === l.id);
      const isExpanded = containsActiveLesson || (!this.state.currentLesson && mod === this.state.currentCourse.modules[0]);
      const expandedClass = isExpanded ? 'expanded' : '';

      const completedInMod = mod.lessons.filter(l => this.state.isLessonCompleted(l.id)).length;

      html += `
        <div class="module-group ${expandedClass}">
          <div class="module-group-header">
            <div class="module-header-left">
              <i data-lucide="chevron-down" class="chevron-icon"></i>
              <span>${mod.title}</span>
            </div>
            <span class="mod-badge" style="font-size:0.75rem; color:var(--text-subtle);">${completedInMod}/${mod.lessons.length}</span>
          </div>
          <div class="module-lessons-list">
      `;

      mod.lessons.forEach(l => {
        const isCompleted = this.state.isLessonCompleted(l.id);
        const isActive = this.state.currentLesson && this.state.currentLesson.id === l.id;
        const iconClass = isCompleted ? 'completed' : '';
        const activeClass = isActive ? 'active' : '';

        const attachedVideo = this.state.getOfflineVideoBinding(l.id);
        const currentStepIdx = (isActive && this.visualizer) ? this.visualizer.currentStepIndex : 0;

        html += `
          <div class="lesson-item ${activeClass} ${iconClass}" data-lesson-id="${l.id}">
            <div class="lesson-item-header">
              <div class="lesson-title-text">
                <i data-lucide="${isCompleted ? 'check-circle-2' : isActive ? 'play-circle' : 'circle'}" class="lesson-status-icon"></i>
                <span title="${l.title}">${l.title}</span>
              </div>
              <div class="lesson-meta-right">
                <span style="font-size:0.72rem; color:var(--text-subtle);">${l.duration}</span>
              </div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();

    // Accordion expand/collapse click handler
    container.querySelectorAll('.module-group-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const group = e.currentTarget.closest('.module-group');
        group.classList.toggle('expanded');
      });
    });

    // Lesson selection handler
    container.querySelectorAll('.lesson-item-header').forEach(header => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const lessonItem = e.currentTarget.closest('.lesson-item');
        const lessonId = lessonItem.getAttribute('data-lesson-id');
        for (const mod of this.state.currentCourse.modules) {
          const target = mod.lessons.find(l => l.id === lessonId);
          if (target) {
            this.loadLesson(this.state.currentCourse, target);
            break;
          }
        }
      });
    });

    // Sub-step drill-down jump click handler
    container.querySelectorAll('.sub-step-item').forEach(stepItem => {
      stepItem.addEventListener('click', (e) => {
        e.stopPropagation();
        const stepIdx = parseInt(stepItem.getAttribute('data-step-idx'));
        if (!isNaN(stepIdx) && this.visualizer) {
          this.visualizer.currentStepIndex = stepIdx;
          this.visualizer.renderCurrentStep();
          this.renderCurriculumSidebar();
        }
      });
    });
  }

  updateLessonCompletionUI() {
    if (!this.state.currentLesson) return;
    const isComp = this.state.isLessonCompleted(this.state.currentLesson.id);
    const textEl = document.getElementById('complete-btn-text');
    const btn = document.getElementById('btn-toggle-complete');

    if (isComp) {
      textEl.textContent = "Completed";
      btn.className = "btn btn-sm btn-success";
    } else {
      textEl.textContent = "Mark as Complete";
      btn.className = "btn btn-sm btn-outline";
    }
  }

  onVideoTimeUpdate(currentTime, duration) {
    if (duration > 0 && this.state.currentLesson && this.state.currentLesson.steps) {
      const stepCount = this.state.currentLesson.steps.length;
      const stepIdx = Math.min(stepCount - 1, Math.floor((currentTime / duration) * stepCount));
      if (this.visualizer && stepIdx !== this.visualizer.currentStepIdx) {
        this.visualizer.currentStepIdx = stepIdx;
        this.visualizer.renderCurrentStep(false);
      }
    }
  }

  // MODAL VIDEO / GDRIVE ATTACH HANDLERS
  initModalEvents() {
    const modal = document.getElementById('modal-video-upload');
    const closeBtn = document.getElementById('btn-close-video-modal');
    const chooseBtn = document.getElementById('btn-modal-choose-file');
    const fileInput = document.getElementById('modal-file-input');
    const sampleBtn = document.getElementById('btn-use-sample-video');

    const gdriveInput = document.getElementById('gdrive-url-input');
    const saveGdriveBtn = document.getElementById('btn-save-gdrive-url');

    const clearAllBtn = document.getElementById('btn-clear-all-gdrive');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm("🗑️ Are you sure you want to clear all saved Google Drive and offline video links? You can then add your video links one by one.")) {
          this.state.clearAllOfflineVideos();
          this.renderCurriculumSidebar();
          this.renderDashboard();
          alert("✅ All Google Drive video links cleared! You can now add your video links one by one.");
        }
      });
    }

    if (saveGdriveBtn && gdriveInput) {
      saveGdriveBtn.addEventListener('click', () => {
        const url = gdriveInput.value.trim();
        if (url) {
          const lessonSelect = document.getElementById('modal-lesson-select');
          const targetLessonId = lessonSelect ? lessonSelect.value : (this.state.currentLesson ? this.state.currentLesson.id : null);
          
          if (targetLessonId) {
            const allLessons = this.state.courses.flatMap(c => c.modules.flatMap(m => m.lessons));
            const targetLesson = allLessons.find(l => l.id === targetLessonId);
            
            this.state.saveOfflineVideoBinding(targetLessonId, {
              type: 'gdrive',
              fileName: `GDrive File (${url.substring(0, 20)}...)`,
              url: url,
              timestamp: new Date().toLocaleDateString()
            });

            if (targetLesson && this.state.currentCourse) {
              this.loadLesson(this.state.currentCourse, targetLesson);
            }
          }

          gdriveInput.value = '';
          modal.classList.remove('show');
          this.renderCurriculumSidebar();
          this.renderDashboard();
        } else {
          alert('Please enter a valid Google Drive URL.');
        }
      });
    }

    if (chooseBtn && fileInput) {
      chooseBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const lessonSelect = document.getElementById('modal-lesson-select');
          const targetLessonId = lessonSelect ? lessonSelect.value : (this.state.currentLesson ? this.state.currentLesson.id : null);
          
          if (targetLessonId) {
            const blobUrl = URL.createObjectURL(file);
            this.state.saveOfflineVideoBinding(targetLessonId, {
              type: 'blob',
              fileName: file.name,
              url: blobUrl,
              timestamp: new Date().toLocaleDateString()
            });

            const allLessons = this.state.courses.flatMap(c => c.modules.flatMap(m => m.lessons));
            const targetLesson = allLessons.find(l => l.id === targetLessonId);
            if (targetLesson && this.state.currentCourse) {
              this.loadLesson(this.state.currentCourse, targetLesson);
            }
          }

          modal.classList.remove('show');
          this.renderCurriculumSidebar();
          this.renderDashboard();
        }
      });
    }

    if (sampleBtn) {
      sampleBtn.addEventListener('click', () => {
        if (this.state.currentLesson) {
          this.videoPlayer.setHTML5VideoSource("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
          this.videoPlayer.video.play();
          modal.classList.remove('show');
        }
      });
    }

    // ADMIN ACCESS MODAL HANDLERS
    this.initAdminModalEvents();
  }

  initAdminModalEvents() {
    const adminModal = document.getElementById('modal-admin-editor');
    const openAdminBtn = document.getElementById('btn-open-admin-editor');
    const closeAdminBtn = document.getElementById('btn-close-admin-modal');
    const cancelAdminBtn = document.getElementById('btn-cancel-admin');
    const saveAdminBtn = document.getElementById('btn-save-admin-lesson');

    const adminSelect = document.getElementById('admin-lesson-select');
    const titleInput = document.getElementById('admin-lesson-title-input');
    const videoInput = document.getElementById('admin-video-url-input');
    const codeArea = document.getElementById('admin-code-textarea');

    if (openAdminBtn) {
      openAdminBtn.addEventListener('click', () => {
        this.openAdminModal();
      });
    }

    if (closeAdminBtn) closeAdminBtn.addEventListener('click', () => adminModal.classList.remove('show'));
    if (cancelAdminBtn) cancelAdminBtn.addEventListener('click', () => adminModal.classList.remove('show'));

    if (adminSelect) {
      adminSelect.addEventListener('change', () => {
        const lId = adminSelect.value;
        const allLessons = this.state.courses.flatMap(c => c.modules.flatMap(m => m.lessons));
        const lesson = allLessons.find(l => l.id === lId);
        if (lesson) {
          if (titleInput) titleInput.value = lesson.title;
          if (videoInput) videoInput.value = lesson.videoUrl || '';
          if (codeArea) codeArea.value = lesson.codeSnippet || '';
        }
      });
    }

    if (saveAdminBtn) {
      saveAdminBtn.addEventListener('click', () => {
        const lId = adminSelect ? adminSelect.value : null;
        if (!lId) return;

        const allLessons = this.state.courses.flatMap(c => c.modules.flatMap(m => m.lessons));
        const lesson = allLessons.find(l => l.id === lId);
        if (lesson) {
          if (titleInput && titleInput.value.trim()) lesson.title = titleInput.value.trim();
          if (videoInput && videoInput.value.trim()) {
            lesson.videoUrl = videoInput.value.trim();
            this.state.saveOfflineVideoBinding(lesson.id, {
              type: 'gdrive',
              fileName: `Admin Attached (${lesson.title})`,
              url: videoInput.value.trim(),
              timestamp: new Date().toLocaleDateString()
            });
          }
          if (codeArea && codeArea.value) lesson.codeSnippet = codeArea.value;

          alert(`✅ Admin changes saved for "${lesson.title}"!`);
          adminModal.classList.remove('show');

          if (this.state.currentCourse) {
            this.loadLesson(this.state.currentCourse, lesson);
          }
        }
      });
    }
  }

  openAdminModal() {
    const adminModal = document.getElementById('modal-admin-editor');
    const adminSelect = document.getElementById('admin-lesson-select');
    const titleInput = document.getElementById('admin-lesson-title-input');
    const videoInput = document.getElementById('admin-video-url-input');
    const codeArea = document.getElementById('admin-code-textarea');

    if (!adminModal || !adminSelect) return;

    let optionsHtml = '';
    this.state.courses.forEach(c => {
      c.modules.forEach(m => {
        optionsHtml += `<optgroup label="${m.title}">`;
        m.lessons.forEach(l => {
          const selected = (this.state.currentLesson && this.state.currentLesson.id === l.id) ? 'selected' : '';
          optionsHtml += `<option value="${l.id}" ${selected}>${l.title}</option>`;
        });
        optionsHtml += `</optgroup>`;
      });
    });

    adminSelect.innerHTML = optionsHtml;

    if (this.state.currentLesson) {
      adminSelect.value = this.state.currentLesson.id;
      if (titleInput) titleInput.value = this.state.currentLesson.title;
      if (videoInput) videoInput.value = this.state.currentLesson.videoUrl || '';
      if (codeArea) codeArea.value = this.state.currentLesson.codeSnippet || '';
    }

    adminModal.classList.add('show');
  }

  openVideoModal() {
    const modal = document.getElementById('modal-video-upload');
    const selectEl = document.getElementById('modal-lesson-select');
    
    if (selectEl) {
      let optionsHtml = '';
      this.state.courses.forEach(c => {
        c.modules.forEach(m => {
          optionsHtml += `<optgroup label="${m.title}">`;
          m.lessons.forEach(l => {
            const selected = (this.state.currentLesson && this.state.currentLesson.id === l.id) ? 'selected' : '';
            optionsHtml += `<option value="${l.id}" ${selected}>${l.title}</option>`;
          });
          optionsHtml += `</optgroup>`;
        });
      });
      selectEl.innerHTML = optionsHtml;

      if (this.state.currentLesson) {
        selectEl.value = this.state.currentLesson.id;
      }
    }

    if (modal) modal.classList.add('show');
  }

  initSandboxEvents() {
    const editor = document.getElementById('sandbox-editor-textarea');
    const templateSelect = document.getElementById('sandbox-template-select');
    const langSelect = document.getElementById('sandbox-lang-select');
    const runBtn = document.getElementById('btn-execute-sandbox');

    const templates = {
      'c-pointer': `#include <stdio.h>

int main() {
    int x = 10;
    int y = 20;
    int *ptr = &x;

    printf("Value of x = %d\\n", x);
    printf("Address of x = %p\\n", (void*)&x);
    printf("Pointer ptr stores address = %p\\n", (void*)ptr);

    // Dereferencing: Modify value of x via ptr
    *ptr = 99;
    printf("New value of x after *ptr = 99: %d\\n", x);

    return 0;
}`,
      'c-dma': `#include <stdio.h>
#include <stdlib.h>

int main() {
    // Dynamic Heap Memory Allocation (11th Std Syllabus)
    int *arr = (int*) malloc(3 * sizeof(int));

    arr[0] = 10;
    arr[1] = 20;
    arr[2] = 30;

    printf("Heap Element arr[0] = %d\\n", arr[0]);
    printf("Heap Element arr[1] = %d\\n", arr[1]);

    // Free heap block to prevent memory leak
    free(arr);
    printf("Memory successfully freed from Heap.\\n");

    return 0;
}`,
      'cpp-class': `#include <iostream>
using namespace std;

class Student {
public:
    int rollNo = 101;
    float marks = 95.5;

    void display() {
        cout << "Roll No: " << rollNo << ", Marks: " << marks << endl;
    }
};

int main() {
    Student s1;
    s1.display();

    Student *ptr = &s1;
    cout << "Pointer to Student Object at Address: " << ptr << endl;

    return 0;
}`,
      'cpp-vector': `#include <iostream>
#include <vector>
using namespace std;

int main() {
    // C++ STL Dynamic Vector Memory
    vector<int> numbers = {5, 15, 25};

    cout << "Vector Size = " << numbers.size() << endl;
    cout << "First Element = " << numbers[0] << endl;

    return 0;
}`,
      'c-array': `#include <stdio.h>

int main() {
    int arr[5] = {45, 12, 89, 34, 67};
    int n = 5;

    printf("Unsorted Array: ");
    for(int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");

    return 0;
}`,
      'c-bubble-sort': `#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22};
    int n = 5;
    bubbleSort(arr, n);
    return 0;
}`,
      'c-selection-sort': `#include <stdio.h>

void selectionSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int min_idx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[min_idx])
                min_idx = j;
        }
        int temp = arr[min_idx];
        arr[min_idx] = arr[i];
        arr[i] = temp;
    }
}

int main() {
    int arr[] = {64, 25, 12, 22, 11};
    selectionSort(arr, 5);
    return 0;
}`,
      'c-quick-sort': `#include <stdio.h>

void swap(int* a, int* b) {
    int t = *a; *a = *b; *b = t;
}

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j <= high - 1; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(&arr[i], &arr[j]);
        }
    }
    swap(&arr[i + 1], &arr[high]);
    return (i + 1);
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    int arr[] = {10, 80, 30, 90, 40, 50, 70};
    quickSort(arr, 0, 6);
    return 0;
}`,
      'c-binary-search': `#include <stdio.h>

int binarySearch(int arr[], int l, int r, int x) {
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (arr[m] == x) return m;
        if (arr[m] < x) l = m + 1;
        else r = m - 1;
    }
    return -1;
}

int main() {
    int arr[] = {2, 3, 4, 10, 40};
    int target = 10;
    int result = binarySearch(arr, 0, 4, target);
    return 0;
}`,
      'c-linked-list': `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node* next;
};

int main() {
    struct Node* head = (struct Node*)malloc(sizeof(struct Node));
    struct Node* second = (struct Node*)malloc(sizeof(struct Node));
    struct Node* third = (struct Node*)malloc(sizeof(struct Node));

    head->data = 10; head->next = second;
    second->data = 20; second->next = third;
    third->data = 30; third->next = NULL;

    return 0;
}`,
      'c-stack': `#include <stdio.h>
#define MAX 5

int stack[MAX];
int top = -1;

void push(int val) {
    if (top < MAX - 1) stack[++top] = val;
}

int pop() {
    if (top >= 0) return stack[top--];
    return -1;
}

int main() {
    push(10);
    push(20);
    push(30);
    pop();
    return 0;
}`,
      'c-queue': `#include <stdio.h>
#define MAX 5

int queue[MAX];
int front = 0, rear = -1;

void enqueue(int val) {
    if (rear < MAX - 1) queue[++rear] = val;
}

int dequeue() {
    if (front <= rear) return queue[front++];
    return -1;
}

int main() {
    enqueue(10);
    enqueue(20);
    enqueue(30);
    dequeue();
    return 0;
}`,
      'c-bst': `#include <stdio.h>
#include <stdlib.h>

struct BSTNode {
    int val;
    struct BSTNode *left, *right;
};

struct BSTNode* newNode(int item) {
    struct BSTNode* temp = (struct BSTNode*)malloc(sizeof(struct BSTNode));
    temp->val = item;
    temp->left = temp->right = NULL;
    return temp;
}

int main() {
    struct BSTNode* root = newNode(50);
    root->left = newNode(30);
    root->right = newNode(70);
    root->left->left = newNode(20);
    root->left->right = newNode(40);
    return 0;
}`,
      'c-insertion-sort': `#include <stdio.h>

void insertionSort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
    }
}

int main() {
    int arr[] = {12, 11, 13, 5, 6};
    insertionSort(arr, 5);
    return 0;
}`,
      'c-merge-sort': `#include <stdio.h>

void merge(int arr[], int l, int m, int r) {
    int n1 = m - l + 1;
    int n2 = r - m;
    int L[5], R[5];
    for (int i = 0; i < n1; i++) L[i] = arr[l + i];
    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) arr[k++] = L[i++];
        else arr[k++] = R[j++];
    }
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
}

void mergeSort(int arr[], int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}

int main() {
    int arr[] = {38, 27, 43, 3, 9, 82, 10};
    mergeSort(arr, 0, 6);
    return 0;
}`,
      'c-linear-search': `#include <stdio.h>

int linearSearch(int arr[], int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}

int main() {
    int arr[] = {10, 50, 30, 70, 80, 20};
    int target = 70;
    int idx = linearSearch(arr, 6, target);
    return 0;
}`,
      'c-doubly-linked-list': `#include <stdio.h>
#include <stdlib.h>

struct DNode {
    int data;
    struct DNode* prev;
    struct DNode* next;
};

int main() {
    struct DNode* head = (struct DNode*)malloc(sizeof(struct DNode));
    struct DNode* second = (struct DNode*)malloc(sizeof(struct DNode));
    struct DNode* third = (struct DNode*)malloc(sizeof(struct DNode));

    head->data = 10; head->prev = NULL; head->next = second;
    second->data = 20; second->prev = head; second->next = third;
    third->data = 30; third->prev = second; third->next = NULL;

    return 0;
}`,
      'c-avl-tree': `#include <stdio.h>
#include <stdlib.h>

struct AVLNode {
    int key;
    struct AVLNode *left, *right;
    int height;
};

int main() {
    struct AVLNode* root = (struct AVLNode*)malloc(sizeof(struct AVLNode));
    root->key = 30; root->height = 2;
    root->left = (struct AVLNode*)malloc(sizeof(struct AVLNode));
    root->left->key = 20; root->left->height = 1;
    root->right = (struct AVLNode*)malloc(sizeof(struct AVLNode));
    root->right->key = 40; root->right->height = 1;
    return 0;
}`,
      'c-graph': `#include <stdio.h>

int adjMatrix[4][4] = {
    {0, 1, 1, 0},
    {1, 0, 0, 1},
    {1, 0, 0, 1},
    {0, 1, 1, 0}
};

int main() {
    printf("Graph Traversal BFS / DFS Active\n");
    return 0;
}`,
      'c-hash-map': `#include <stdio.h>
#include <string.h>

struct HashEntry {
    int key;
    int value;
};

struct HashEntry hashMap[5];

void insert(int key, int value) {
    int hashIdx = key % 5;
    hashMap[hashIdx].key = key;
    hashMap[hashIdx].value = value;
}

int main() {
    insert(10, 100);
    insert(21, 210);
    insert(32, 320);
    return 0;
}`,
      'c-recursion': `#include <stdio.h>

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    int result = factorial(4);
    return 0;
}`,
      'c-hello': `#include <stdio.h>

int main() {
    printf("Hello World from GCC Compiler!\\n");
    
    int a = 10;
    int b = 20;
    int sum = a + b;
    
    printf("Sum: %d + %d = %d\\n", a, b, sum);
    return 0;
}`,
      'java-hello': `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World from JDK 21 Compiler!");
        
        int x = 42;
        String name = "Java Developer";
        System.out.println(name + " has value: " + x);
    }
}`,
      'java-array': `import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        int[] numbers = {10, 20, 30, 40, 50};
        
        ArrayList<String> list = new ArrayList<>();
        list.add("Stack Frame");
        list.add("Heap Reference");
        list.add("JVM Garbage Collector");
        
        System.out.println("Array length: " + numbers.length);
        System.out.println("ArrayList items: " + list);
    }
}`,
      'python-basics': `# Python 3.12 Interactive Sandbox
def greet(name):
    return f"Welcome, {name}!"

msg = greet("Python Programmer")
print(msg)

score = 95
if score >= 90:
    print("Grade: A+ (High Distinction)")
else:
    print("Grade: B")
`,
      'python-list': `# Python Lists & Dictionaries
numbers = [10, 25, 45, 60, 80]
person = {"name": "Alice", "role": "Senior Engineer", "lang": "Python"}

for num in numbers:
    print(f"Processing item: {num}")

print("User Details:", person["name"], "-", person["role"])
`
    };

    if (editor && templates['c-hello']) {
      editor.value = templates['c-hello'];
      if (templateSelect) templateSelect.value = 'c-hello';
      this.sandboxEngine.updateLineNumbers();
      if (this.sandboxEngine.updateSyntaxHighlight) {
        this.sandboxEngine.updateSyntaxHighlight();
      }
    }

    if (templateSelect) {
      templateSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (templates[val]) {
          editor.value = templates[val];

          const dsaModes = [
            'c-bubble-sort', 'c-selection-sort', 'c-insertion-sort', 'c-merge-sort', 'c-quick-sort',
            'c-linear-search', 'c-binary-search', 'c-stack', 'c-queue', 'c-linked-list',
            'c-doubly-linked-list', 'c-bst', 'c-avl-tree', 'c-graph', 'c-hash-map',
            'c-pointer', 'c-recursion', 'c-dma'
          ];
          if (dsaModes.includes(val)) {
            this.sandboxEngine.activeVisMode = 'dsa-bars';
          } else {
            this.sandboxEngine.activeVisMode = 'mem-cells';
          }

          if (val.startsWith('cpp') && langSelect) {
            langSelect.value = 'cpp';
          } else if (val.startsWith('java') && langSelect) {
            langSelect.value = 'java';
          } else if (val.startsWith('python') && langSelect) {
            langSelect.value = 'python';
          } else if (langSelect) {
            langSelect.value = 'c';
          }

          this.sandboxEngine.updateLineNumbers();
          if (this.sandboxEngine.updateSyntaxHighlight) {
            this.sandboxEngine.updateSyntaxHighlight();
          }
          if (this.sandboxEngine.resetVisualizerDisplay) {
            this.sandboxEngine.resetVisualizerDisplay();
          }
        }
      });
    }

    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        const selectedLang = e.target.value;
        if (selectedLang === 'java') {
          if (templateSelect) templateSelect.value = 'java-hello';
          editor.value = templates['java-hello'];
        } else if (selectedLang === 'python') {
          if (templateSelect) templateSelect.value = 'python-basics';
          editor.value = templates['python-basics'];
        } else if (selectedLang === 'cpp') {
          if (templateSelect) templateSelect.value = 'cpp-class';
          editor.value = templates['cpp-class'];
        } else if (selectedLang === 'c') {
          if (templateSelect && (templateSelect.value.startsWith('java') || templateSelect.value.startsWith('python') || templateSelect.value.startsWith('cpp'))) {
            templateSelect.value = 'c-hello';
            editor.value = templates['c-hello'];
          }
        }

        this.sandboxEngine.updateLineNumbers();
        if (this.sandboxEngine.updateSyntaxHighlight) {
          this.sandboxEngine.updateSyntaxHighlight();
        }
        if (this.sandboxEngine.resetVisualizerDisplay) {
          this.sandboxEngine.resetVisualizerDisplay();
        }
      });
    }

    if (runBtn) {
      runBtn.addEventListener('click', () => {
        this.sandboxEngine.resetDebugger();
        this.sandboxEngine.runCodeAndVisualize();
      });
    }

    document.getElementById('btn-start-debug')?.addEventListener('click', () => {
      this.sandboxEngine.startDebugging();
    });

    document.getElementById('btn-reset-debug')?.addEventListener('click', () => {
      this.sandboxEngine.startDebugging();
    });

    document.getElementById('btn-stop-debug')?.addEventListener('click', () => {
      this.sandboxEngine.resetDebugger();
    });

    document.getElementById('btn-continue-debug')?.addEventListener('click', () => {
      this.sandboxEngine.continueDebug();
    });

    document.getElementById('btn-step-over')?.addEventListener('click', () => {
      this.sandboxEngine.stepOver();
    });

    document.getElementById('btn-step-into')?.addEventListener('click', () => {
      this.sandboxEngine.stepInto();
    });

    document.getElementById('btn-step-out')?.addEventListener('click', () => {
      this.sandboxEngine.stepOut();
    });

    document.getElementById('btn-step-back')?.addEventListener('click', () => {
      this.sandboxEngine.stepBack();
    });

    document.getElementById('btn-toggle-breakpoint')?.addEventListener('click', () => {
      this.sandboxEngine.toggleCurrentLineBreakpoint();
    });

    document.getElementById('btn-clear-breakpoints')?.addEventListener('click', () => {
      this.sandboxEngine.clearBreakpoints();
    });

    document.getElementById('btn-run-code-sandbox')?.addEventListener('click', () => {
      this.switchView('sandbox');
      if (this.state.currentLesson && this.state.currentLesson.codeSnippet) {
        editor.value = this.state.currentLesson.codeSnippet;
        this.sandboxEngine.updateLineNumbers();
        this.sandboxEngine.runCodeAndVisualize();
      }
    });
  }

  renderDashboard() {
    this.updateDashboardStats();

    const tableBody = document.getElementById('offline-videos-table-body');
    if (tableBody) {
      const keys = Object.keys(this.state.offlineVideosMap);
      if (keys.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-subtle);">No Google Drive or custom local videos linked yet. Attach a video link to any lesson!</td></tr>`;
      } else {
        let html = '';
        keys.forEach(lessonId => {
          const item = this.state.offlineVideosMap[lessonId];
          const badgeColor = item.type === 'gdrive' ? 'var(--accent-purple)' : 'var(--accent-cyan)';
          const label = item.type === 'gdrive' ? 'Google Drive' : 'Local File';
          const nameDisplay = item.fileName || item.url || 'Attached Video';

          html += `
            <tr>
              <td><strong>${lessonId}</strong></td>
              <td><code>${nameDisplay}</code></td>
              <td><span style="background:${badgeColor}; color:#000; font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:4px;">${label}</span></td>
              <td>
                <button class="btn-xs btn-outline btn-delete-attached-video" data-lesson-id="${lessonId}" style="border-color:rgba(239,68,68,0.5); color:#ef4444;" title="Remove this video link">
                  <i data-lucide="trash-2"></i> Remove
                </button>
              </td>
            </tr>
          `;
        });
        tableBody.innerHTML = html;
        if (window.lucide) lucide.createIcons();

        tableBody.querySelectorAll('.btn-delete-attached-video').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const lId = e.currentTarget.getAttribute('data-lesson-id');
            if (lId) {
              this.state.deleteOfflineVideoBinding(lId);
              this.renderCurriculumSidebar();
              this.renderDashboard();
            }
          });
        });
      }
    }
  }

  updateDashboardStats() {
    const compEl = document.getElementById('stat-completed-lessons');
    const videosEl = document.getElementById('stat-offline-videos');
    const streakEl = document.getElementById('stat-streak-count');
    const scoreEl = document.getElementById('stat-quiz-score');

    if (compEl) compEl.textContent = this.state.completedLessons.length;
    if (videosEl) videosEl.textContent = Object.keys(this.state.offlineVideosMap).length;
    if (streakEl) streakEl.textContent = `${this.state.streak} Days`;

    if (scoreEl) {
      const { correct, total } = this.state.quizScores;
      const pct = total > 0 ? Math.round((correct / total) * 100) : 100;
      scoreEl.textContent = `${pct}%`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new DevBaseApp();
  if (window.lucide) lucide.createIcons();
});
