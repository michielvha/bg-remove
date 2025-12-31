import './styles/index.css';
import './styles/components.css';
import { removeBackground } from '@imgly/background-removal';
import { createIcons, Image as ImageIcon, Moon, Sun, Download, Upload, X } from 'lucide';
import { showToast } from './utils/toast';
import { loadTheme, saveTheme } from './utils/storage';

type ThemeMode = 'light' | 'dark';

class App {
  private theme: ThemeMode;
  private originalImage: HTMLImageElement | null = null;
  private processedImage: Blob | null = null;
  private isProcessing = false;

  // DOM elements
  private uploadZone!: HTMLElement;
  private fileInput!: HTMLInputElement;
  private themeToggle!: HTMLInputElement;
  private imagePreviewContainer!: HTMLElement;
  private originalPreview!: HTMLElement;
  private processedPreview!: HTMLElement;
  private downloadBtn!: HTMLButtonElement;
  private clearBtn!: HTMLButtonElement;

  constructor() {
    this.theme = loadTheme();
    this.init();
  }

  private init(): void {
    this.setupDOM();
    this.applyTheme(this.theme);
    this.attachEventListeners();
    this.initIcons();
  }

  private initIcons(): void {
    createIcons({
      icons: {
        Image: ImageIcon,
        Moon,
        Sun,
        Download,
        Upload,
        X,
      },
    });
  }

  private setupDOM(): void {
    const app = document.querySelector<HTMLDivElement>('#app');
    if (!app) {
      throw new Error('App container not found');
    }

    app.innerHTML = `
      <div class="header">
        <div class="header-content">
          <div class="logo">
            <div class="logo-icon">
              <i data-lucide="image"></i>
            </div>
            <span>BG Remove</span>
          </div>
          <div class="tagline">Remove backgrounds instantly, 100% client-side</div>
        </div>
        <div class="header-content">
          <label class="theme-toggle-btn">
            <input type="checkbox" id="theme-toggle" ${this.theme === 'dark' ? 'checked' : ''}>
            <div class="theme-toggle-icon">
              <i data-lucide="${this.theme === 'dark' ? 'moon' : 'sun'}"></i>
            </div>
          </label>
        </div>
      </div>

      <div class="main-content">
        <div id="upload-area" class="upload-area">
          <div class="upload-zone" id="upload-zone">
            <input type="file" id="file-input" accept="image/*">
            <div class="upload-icon">
              <i data-lucide="upload"></i>
            </div>
            <div class="upload-text">Drop an image here or click to upload</div>
            <div class="upload-hint">Supports JPG, PNG, WebP, and other common image formats</div>
          </div>
        </div>

        <div id="image-preview-container" class="image-preview-container hidden">
          <div class="preview-pane">
            <div class="preview-header">
              <div class="preview-title">Original</div>
              <button class="btn btn-ghost btn-icon" id="clear-btn" title="Clear">
                <i data-lucide="x"></i>
              </button>
            </div>
            <div class="preview-image-container" id="original-preview">
              <div class="empty-state">
                <div class="empty-state-icon">
                  <i data-lucide="image"></i>
                </div>
              </div>
            </div>
            <div class="preview-actions">
              <div style="width: 2.25rem; height: 2.25rem; flex-shrink: 0;"></div>
            </div>
          </div>

          <div class="preview-pane">
            <div class="preview-header">
              <div class="preview-title">Background Removed</div>
              <div style="width: 2.25rem; height: 2.25rem; flex-shrink: 0;"></div>
            </div>
            <div class="preview-image-container preview-image-transparent" id="processed-preview">
              <div class="empty-state">
                <div class="empty-state-icon">
                  <i data-lucide="image"></i>
                </div>
              </div>
            </div>
            <div class="preview-actions">
              <button class="btn btn-primary" id="download-btn" disabled>
                <i data-lucide="download"></i>
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Store references
    const uploadZone = document.querySelector('#upload-zone');
    const fileInput = document.querySelector<HTMLInputElement>('#file-input');
    const themeToggle = document.querySelector<HTMLInputElement>('#theme-toggle');
    const imagePreviewContainer = document.querySelector('#image-preview-container');
    const originalPreview = document.querySelector('#original-preview');
    const processedPreview = document.querySelector('#processed-preview');
    const downloadBtn = document.querySelector<HTMLButtonElement>('#download-btn');
    const clearBtn = document.querySelector<HTMLButtonElement>('#clear-btn');

    if (!uploadZone || !fileInput || !themeToggle || !imagePreviewContainer || 
        !originalPreview || !processedPreview || !downloadBtn || !clearBtn) {
      throw new Error('Required DOM elements not found');
    }

    this.uploadZone = uploadZone as HTMLElement;
    this.fileInput = fileInput;
    this.themeToggle = themeToggle;
    this.imagePreviewContainer = imagePreviewContainer as HTMLElement;
    this.originalPreview = originalPreview as HTMLElement;
    this.processedPreview = processedPreview as HTMLElement;
    this.downloadBtn = downloadBtn;
    this.clearBtn = clearBtn;
  }

  private attachEventListeners(): void {
    // File input change
    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.handleFile(file);
      }
    });

    // Drag and drop
    this.uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadZone.classList.add('dragover');
    });

    this.uploadZone.addEventListener('dragleave', () => {
      this.uploadZone.classList.remove('dragover');
    });

    this.uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadZone.classList.remove('dragover');
      const file = e.dataTransfer?.files[0];
      if (file && file.type.startsWith('image/')) {
        this.handleFile(file);
      } else {
        showToast('Please drop an image file', 'error');
      }
    });

    // Click to upload
    this.uploadZone.addEventListener('click', () => {
      this.fileInput.click();
    });

    // Theme toggle
    this.themeToggle.addEventListener('change', () => {
      this.theme = this.themeToggle.checked ? 'dark' : 'light';
      this.applyTheme(this.theme);
      saveTheme(this.theme);
    });

    // Download button
    this.downloadBtn.addEventListener('click', () => {
      this.downloadImage();
    });

    // Clear button
    this.clearBtn.addEventListener('click', () => {
      this.clearImage();
    });
  }

  private async handleFile(file: File): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Show loading state
    this.isProcessing = true;
    this.showProcessingState();

    try {
      // Create image from file
      const imageUrl = URL.createObjectURL(file);
      const img = document.createElement('img');
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
      });

      this.originalImage = img;

      // Display original image
      this.displayOriginalImage(imageUrl);

      // Process image
      showToast('Processing image...', 'success');
      const blob = await removeBackground(file);
      this.processedImage = blob;

      // Display processed image
      const processedUrl = URL.createObjectURL(blob);
      this.displayProcessedImage(processedUrl);

      // Show preview container
      document.querySelector('#upload-area')?.classList.add('hidden');
      this.imagePreviewContainer.classList.remove('hidden');

      this.downloadBtn.disabled = false;
      showToast('Background removed successfully!', 'success');
    } catch (error) {
      console.error('Error processing image:', error);
      showToast('Failed to process image. Please try again.', 'error');
      this.clearImage();
    } finally {
      this.isProcessing = false;
      this.hideProcessingState();
    }
  }

  private displayOriginalImage(url: string): void {
    this.originalPreview.innerHTML = `
      <img src="${url}" alt="Original" class="preview-image">
    `;
  }

  private displayProcessedImage(url: string): void {
    this.processedPreview.innerHTML = `
      <img src="${url}" alt="Background Removed" class="preview-image">
    `;
  }

  private showProcessingState(): void {
    this.processedPreview.innerHTML = `
      <div class="processing-overlay">
        <div class="processing-spinner"></div>
        <div class="processing-text">Removing background...</div>
      </div>
    `;
  }

  private hideProcessingState(): void {
    // State is cleared when processed image is displayed
  }

  private downloadImage(): void {
    if (!this.processedImage) {
      return;
    }

    const url = URL.createObjectURL(this.processedImage);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bg-removed-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Image downloaded!', 'success');
  }

  private clearImage(): void {
    // Clean up object URLs
    if (this.originalImage?.src) {
      URL.revokeObjectURL(this.originalImage.src);
    }

    this.originalImage = null;
    this.processedImage = null;
    this.isProcessing = false;

    // Reset UI
    this.imagePreviewContainer.classList.add('hidden');
    document.querySelector('#upload-area')?.classList.remove('hidden');
    this.originalPreview.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i data-lucide="image"></i>
        </div>
      </div>
    `;
    this.processedPreview.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i data-lucide="image"></i>
        </div>
      </div>
    `;
    this.downloadBtn.disabled = true;
    this.fileInput.value = '';

    // Re-initialize icons for empty states
    this.initIcons();
  }

  private applyTheme(theme: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// Initialize app
new App();

