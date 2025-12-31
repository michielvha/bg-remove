// Add slideOut animation to CSS (only once)
let styleAdded = false;
function ensureStyle(): void {
  if (styleAdded) {
    return;
  }
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideOut {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
  styleAdded = true;
}

export function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  ensureStyle();

  // Remove existing toast if any
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

