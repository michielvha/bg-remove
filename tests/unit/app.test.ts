import { beforeEach, describe, expect, it, vi } from 'vitest';
import { removeBackground } from '@imgly/background-removal';
import { App } from '../../src/app';

vi.mock('@imgly/background-removal', () => ({
  removeBackground: vi.fn(),
}));

const mockedRemoveBackground = vi.mocked(removeBackground);

function processedBlob(): Blob {
  return new Blob(['processed'], { type: 'image/png' });
}

function imageFile(name = 'photo.png', type = 'image/png'): File {
  return new File(['binary'], name, { type });
}

function setInputFiles(input: HTMLInputElement, files: File[]): void {
  Object.defineProperty(input, 'files', { value: files, configurable: true });
}

function dispatchDrop(zone: HTMLElement, files: File[]): void {
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { files } });
  zone.dispatchEvent(event);
}

const el = <T extends Element>(selector: string): T => {
  const node = document.querySelector<T>(selector);
  if (!node) {
    throw new Error(`Expected element ${selector} to exist`);
  }
  return node;
};

function lastToastText(): string | null {
  return document.querySelector('.toast')?.textContent ?? null;
}

function mount(): void {
  document.body.innerHTML = '<div id="app"></div>';
  document.documentElement.removeAttribute('data-theme');
  new App();
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  mockedRemoveBackground.mockResolvedValue(processedBlob());
});

describe('initial render (AC1)', () => {
  it('renders the shell with upload visible and preview hidden', () => {
    mount();
    expect(document.body.textContent).toContain('BG Remove');
    expect(document.body.textContent).toContain('Remove backgrounds instantly');
    expect(el('#upload-zone')).toBeTruthy();
    expect(el('#file-input')).toBeTruthy();
    expect(el('#image-preview-container').classList.contains('hidden')).toBe(true);
    expect(el<HTMLButtonElement>('#download-btn').disabled).toBe(true);
  });

  it('renders lucide icons as inline svg (createIcons ran)', () => {
    mount();
    expect(document.querySelectorAll('svg').length).toBeGreaterThan(0);
    // The placeholder <i data-lucide> nodes are replaced by lucide.
    expect(document.querySelector('i[data-lucide]')).toBeNull();
  });
});

describe('theme (AC2-AC4)', () => {
  it('defaults to dark on a fresh load', () => {
    mount();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(el<HTMLInputElement>('#theme-toggle').checked).toBe(true);
  });

  it('toggling to light updates the attribute and persists', () => {
    mount();
    const toggle = el<HTMLInputElement>('#theme-toggle');
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('restores a previously saved theme on reload', () => {
    localStorage.setItem('theme', 'light');
    mount();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(el<HTMLInputElement>('#theme-toggle').checked).toBe(false);
  });
});

describe('upload via file input (AC5)', () => {
  it('processes a valid image end to end', async () => {
    mount();
    const input = el<HTMLInputElement>('#file-input');
    const file = imageFile();
    setInputFiles(input, [file]);
    input.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(el<HTMLButtonElement>('#download-btn').disabled).toBe(false);
    });

    expect(mockedRemoveBackground).toHaveBeenCalledWith(file);
    expect(el('#original-preview').querySelector('img')).not.toBeNull();
    expect(el('#processed-preview').querySelector('img')).not.toBeNull();
    expect(el('#upload-area').classList.contains('hidden')).toBe(true);
    expect(el('#image-preview-container').classList.contains('hidden')).toBe(false);
    expect(lastToastText()).toBe('Background removed successfully!');
  });
});

describe('drag and drop (AC6)', () => {
  it('adds and removes the dragover class', () => {
    mount();
    const zone = el<HTMLElement>('#upload-zone');
    zone.dispatchEvent(new Event('dragover', { cancelable: true }));
    expect(zone.classList.contains('dragover')).toBe(true);
    zone.dispatchEvent(new Event('dragleave'));
    expect(zone.classList.contains('dragover')).toBe(false);
  });

  it('processes a valid dropped image', async () => {
    mount();
    dispatchDrop(el<HTMLElement>('#upload-zone'), [imageFile()]);
    await vi.waitFor(() => {
      expect(el<HTMLButtonElement>('#download-btn').disabled).toBe(false);
    });
    expect(mockedRemoveBackground).toHaveBeenCalledTimes(1);
  });
});

describe('non-image rejection (AC7)', () => {
  it('rejects a non-image drop with an error toast', () => {
    mount();
    dispatchDrop(el<HTMLElement>('#upload-zone'), [imageFile('note.txt', 'text/plain')]);
    expect(lastToastText()).toBe('Please drop an image file');
    expect(mockedRemoveBackground).not.toHaveBeenCalled();
  });

  it('rejects a non-image file-input selection with an error toast', async () => {
    mount();
    const input = el<HTMLInputElement>('#file-input');
    setInputFiles(input, [imageFile('note.txt', 'text/plain')]);
    input.dispatchEvent(new Event('change'));
    await vi.waitFor(() => {
      expect(lastToastText()).toBe('Please select an image file');
    });
    expect(mockedRemoveBackground).not.toHaveBeenCalled();
  });
});

describe('concurrency guard (AC8)', () => {
  it('ignores a second file while one is already processing', async () => {
    mount();
    const input = el<HTMLInputElement>('#file-input');
    setInputFiles(input, [imageFile('first.png')]);
    input.dispatchEvent(new Event('change'));
    // Second submission happens synchronously, while isProcessing is already true.
    setInputFiles(input, [imageFile('second.png')]);
    input.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(el<HTMLButtonElement>('#download-btn').disabled).toBe(false);
    });
    expect(mockedRemoveBackground).toHaveBeenCalledTimes(1);
  });
});

describe('clear (AC9)', () => {
  it('resets the UI back to the initial state', async () => {
    mount();
    const input = el<HTMLInputElement>('#file-input');
    setInputFiles(input, [imageFile()]);
    input.dispatchEvent(new Event('change'));
    await vi.waitFor(() => {
      expect(el<HTMLButtonElement>('#download-btn').disabled).toBe(false);
    });

    el<HTMLButtonElement>('#clear-btn').click();

    expect(el('#image-preview-container').classList.contains('hidden')).toBe(true);
    expect(el('#upload-area').classList.contains('hidden')).toBe(false);
    expect(el<HTMLButtonElement>('#download-btn').disabled).toBe(true);
    expect(el<HTMLInputElement>('#file-input').value).toBe('');
  });
});

describe('download (AC10)', () => {
  it('triggers an anchor download with a png filename', async () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    mount();
    const input = el<HTMLInputElement>('#file-input');
    setInputFiles(input, [imageFile()]);
    input.dispatchEvent(new Event('change'));
    await vi.waitFor(() => {
      expect(el<HTMLButtonElement>('#download-btn').disabled).toBe(false);
    });

    let downloadName = '';
    clickSpy.mockImplementation(function (this: HTMLAnchorElement) {
      downloadName = this.download;
    });
    el<HTMLButtonElement>('#download-btn').click();

    expect(clickSpy).toHaveBeenCalled();
    expect(downloadName).toMatch(/^bg-removed-\d+\.png$/);
    expect(lastToastText()).toBe('Image downloaded!');
    clickSpy.mockRestore();
  });
});

describe('error path (AC11)', () => {
  it('shows an error toast and auto-clears when removal fails', async () => {
    mockedRemoveBackground.mockRejectedValue(new Error('model failed'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mount();
    const input = el<HTMLInputElement>('#file-input');
    setInputFiles(input, [imageFile()]);
    input.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(lastToastText()).toBe('Failed to process image. Please try again.');
    });
    expect(el('#image-preview-container').classList.contains('hidden')).toBe(true);
    expect(el<HTMLButtonElement>('#download-btn').disabled).toBe(true);
  });
});
