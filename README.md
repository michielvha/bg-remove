# BG Remove

A simple, client-side background removal tool. No accounts, no subscriptions, no server uploads. Everything runs in your browser.

## Features

- 🚀 **100% Client-Side** - All processing happens in your browser
- 🔒 **Privacy First** - Your images never leave your device
- ⚡ **Fast** - Powered by WebAssembly and WebGL/WebGPU
- 🎨 **Beautiful UI** - Clean, modern interface with dark/light themes
- 📱 **Responsive** - Works on desktop and mobile devices

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. Open the app in your browser
2. Drag and drop an image or click to upload
3. Wait for processing (usually takes a few seconds)
4. Download your image with the background removed

## Tech Stack

- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **@imgly/background-removal** - Client-side background removal library
- **Lucide Icons** - Beautiful icon set

## How It Works

The app uses the `@imgly/background-removal` library, which runs a neural network model directly in your browser using WebAssembly and WebGL/WebGPU. This means:

- No data is sent to any server
- Processing happens entirely on your device
- Works offline after the initial load

## License

MIT

