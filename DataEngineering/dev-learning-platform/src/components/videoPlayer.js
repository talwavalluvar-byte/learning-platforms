/* ----------------------------------------------------
   DEVBASE2 - CUSTOM VIDEO PLAYER & GOOGLE DRIVE / OFFLINE MANAGER
   Handles Google Drive Share Links, Folder Links, Local Files, 
   Playback speed control, and video-visualizer sync.
   ---------------------------------------------------- */

export class VideoPlayerManager {
  constructor(appState, onTimeUpdateCallback) {
    this.appState = appState;
    this.onTimeUpdateCallback = onTimeUpdateCallback;

    // DOM Elements
    this.videoContainer = document.getElementById('video-container');
    this.video = document.getElementById('main-video-player');
    this.gdriveFrame = document.getElementById('gdrive-iframe-player');
    this.dropzone = document.getElementById('video-dropzone');
    this.fileInput = document.getElementById('video-file-input');
    this.customControls = document.getElementById('custom-video-controls');

    // Controls
    this.playBtn = document.getElementById('ctrl-play');
    this.rewindBtn = document.getElementById('ctrl-rewind');
    this.forwardBtn = document.getElementById('ctrl-forward');
    this.progressContainer = document.getElementById('video-progress-container');
    this.progressFill = document.getElementById('video-progress-fill');
    this.currentTimeEl = document.getElementById('time-current');
    this.durationTimeEl = document.getElementById('time-duration');

    this.speedBtn = document.getElementById('ctrl-speed-btn');
    this.speedMenu = document.getElementById('speed-menu');
    this.pipBtn = document.getElementById('ctrl-pip');
    this.fullscreenBtn = document.getElementById('ctrl-fullscreen');

    this.initEvents();
  }

  initEvents() {
    if (!this.video) return;

    // Play/Pause toggle
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.video.addEventListener('click', () => this.togglePlay());

    // Skip controls
    this.rewindBtn.addEventListener('click', () => this.seekBy(-10));
    this.forwardBtn.addEventListener('click', () => this.seekBy(10));

    // Progress bar click / seek
    this.progressContainer.addEventListener('click', (e) => {
      const rect = this.progressContainer.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      if (this.video.duration) {
        this.video.currentTime = pos * this.video.duration;
      }
    });

    // Time update listener
    this.video.addEventListener('timeupdate', () => {
      this.updateProgressUI();
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.video.currentTime, this.video.duration);
      }
    });

    // Loaded metadata duration
    this.video.addEventListener('loadedmetadata', () => {
      this.durationTimeEl.textContent = this.formatTime(this.video.duration);
    });

    // Speed Selector Toggle
    this.speedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.speedMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => this.speedMenu.classList.remove('show'));

    this.speedMenu.querySelectorAll('span').forEach(item => {
      item.addEventListener('click', (e) => {
        const speed = parseFloat(e.target.getAttribute('data-speed'));
        this.video.playbackRate = speed;
        this.speedBtn.textContent = `${speed}x`;
        this.speedMenu.querySelectorAll('span').forEach(s => s.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // PiP & Fullscreen
    this.pipBtn.addEventListener('click', async () => {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await this.video.requestPictureInPicture();
        }
      } catch (err) {
        console.warn('PiP failed:', err);
      }
    });

    this.fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        this.videoContainer.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    // DRAG AND DROP LOCAL OFFLINE / GDRIVE FILE
    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.classList.add('dragover');
    });
    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.classList.remove('dragover');
    });
    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.loadLocalVideoFile(e.dataTransfer.files[0]);
      }
    });

    const browseBtn = document.getElementById('btn-select-video-file');
    if (browseBtn) {
      browseBtn.addEventListener('click', () => this.fileInput.click());
    }
    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.loadLocalVideoFile(e.target.files[0]);
      }
    });
  }

  togglePlay() {
    if (this.video.paused) {
      this.video.play();
      this.playBtn.innerHTML = '<i data-lucide="pause"></i>';
    } else {
      this.video.pause();
      this.playBtn.innerHTML = '<i data-lucide="play"></i>';
    }
    if (window.lucide) lucide.createIcons();
  }

  seekBy(seconds) {
    this.video.currentTime = Math.max(0, Math.min(this.video.duration, this.video.currentTime + seconds));
  }

  updateProgressUI() {
    if (!this.video.duration) return;
    const pct = (this.video.currentTime / this.video.duration) * 100;
    this.progressFill.style.width = `${pct}%`;
    this.currentTimeEl.textContent = this.formatTime(this.video.currentTime);
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Parse Google Drive Video File or Folder URL
  parseGoogleDriveUrl(url) {
    if (!url) return null;

    // Check if Folder URL: https://drive.google.com/drive/folders/FOLDER_ID
    const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch && folderMatch[1]) {
      const folderId = folderMatch[1];
      return {
        type: 'folder',
        folderId: folderId,
        embedUrl: `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`
      };
    }

    // Check if Single Video File URL: /file/d/FILE_ID/view or id=FILE_ID
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (fileMatch && fileMatch[1]) {
      const fileId = fileMatch[1];
      return {
        type: 'file',
        fileId: fileId,
        directStreamUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        previewEmbedUrl: `https://drive.google.com/file/d/${fileId}/preview`
      };
    }
    return null;
  }

  loadLessonVideo(lesson) {
    const savedSource = this.appState.getOfflineVideoBinding(lesson.id);

    if (savedSource) {
      if (savedSource.type === 'blob') {
        this.setHTML5VideoSource(savedSource.url);
        return;
      } else if (savedSource.type === 'gdrive') {
        this.setGDriveVideoSource(savedSource.url);
        return;
      }
    }

    if (lesson.videoUrl) {
      const gdriveObj = this.parseGoogleDriveUrl(lesson.videoUrl);
      if (gdriveObj) {
        this.setGDriveVideoSource(lesson.videoUrl);
      } else {
        this.setHTML5VideoSource(lesson.videoUrl);
      }
    } else {
      this.showDropzone();
    }
  }

  setHTML5VideoSource(src) {
    if (this.gdriveFrame) this.gdriveFrame.style.display = 'none';
    this.video.style.display = 'block';
    this.dropzone.style.display = 'none';
    if (this.customControls) this.customControls.style.display = 'flex';
    this.video.src = src;
  }

  setGDriveVideoSource(url) {
    this.currentGDriveUrl = url;
    const parsed = this.parseGoogleDriveUrl(url);

    if (this.isDirectStreamMode && parsed && parsed.fileId) {
      const streamUrl = `https://drive.google.com/uc?export=download&id=${parsed.fileId}`;
      this.setHTML5VideoSource(streamUrl);
      return;
    }

    if (this.gdriveFrame) {
      this.video.style.display = 'none';
      if (this.customControls) this.customControls.style.display = 'none';
      
      if (parsed && parsed.type === 'folder') {
        this.gdriveFrame.src = parsed.embedUrl;
        this.gdriveFrame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
      } else if (parsed && parsed.type === 'file') {
        this.gdriveFrame.src = parsed.previewEmbedUrl;
        this.gdriveFrame.removeAttribute('sandbox'); // Allow standard Google video controls inside file preview
      } else {
        this.gdriveFrame.src = url;
      }

      this.gdriveFrame.style.display = 'block';
      this.dropzone.style.display = 'none';
    } else {
      const streamUrl = (parsed && parsed.type === 'file') ? parsed.directStreamUrl : url;
      this.setHTML5VideoSource(streamUrl);
    }
  }

  togglePlayerMode() {
    if (!this.currentGDriveUrl) return;
    this.isDirectStreamMode = !this.isDirectStreamMode;
    if (this.isDirectStreamMode) {
      const parsed = this.parseGoogleDriveUrl(this.currentGDriveUrl);
      const fileId = parsed ? parsed.fileId : null;
      const streamUrl = fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : this.currentGDriveUrl;
      this.setHTML5VideoSource(streamUrl);
    } else {
      this.setGDriveVideoSource(this.currentGDriveUrl);
    }
  }

  showDropzone() {
    this.video.style.display = 'none';
    if (this.gdriveFrame) this.gdriveFrame.style.display = 'none';
    if (this.customControls) this.customControls.style.display = 'none';
    this.dropzone.style.display = 'flex';
  }

  loadLocalVideoFile(file) {
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    this.setHTML5VideoSource(blobUrl);
    
    const currentLesson = this.appState.currentLesson;
    if (currentLesson) {
      this.appState.saveOfflineVideoBinding(currentLesson.id, {
        type: 'blob',
        fileName: file.name,
        url: blobUrl,
        timestamp: new Date().toLocaleDateString()
      });
    }
    
    this.video.play();
    this.playBtn.innerHTML = '<i data-lucide="pause"></i>';
    if (window.lucide) lucide.createIcons();
  }

  loadGoogleDriveLink(url) {
    if (!url) return;
    this.setGDriveVideoSource(url);

    const currentLesson = this.appState.currentLesson;
    if (currentLesson) {
      const parsed = this.parseGoogleDriveUrl(url);
      let name = 'Google Drive Content';
      if (parsed && parsed.type === 'folder') {
        name = `GDrive Folder (${parsed.folderId.substring(0, 8)}...)`;
      } else if (parsed && parsed.type === 'file') {
        name = `GDrive File (${parsed.fileId.substring(0, 8)}...)`;
      }

      this.appState.saveOfflineVideoBinding(currentLesson.id, {
        type: 'gdrive',
        fileName: name,
        url: url,
        timestamp: new Date().toLocaleDateString()
      });
    }
  }
}
