# Healer 🔮⚕️

> **Intelligent bookmark manager powered by AI**

Healer is an AI-enhanced fork of [Grimoire](https://github.com/goniszewski/grimoire), designed to heal your information overload with intelligent features.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ What is Healer?

Healer helps you **organize, rediscover, and understand** your bookmarks using AI-powered insights:

- 🔖 **Smart Organization** - Categories, tags, and fuzzy search
- 🤖 **AI-Powered** - Auto-generate summaries and tags
- 🌐 **Metadata Extraction** - Automatic content and thumbnail fetching
- 📝 **Personal Notes** - Add your thoughts to any bookmark
- 🔍 **Powerful Search** - Find anything instantly with fuzzy matching
- 🌙 **Dark Mode** - Easy on the eyes, day or night
- 👥 **Multi-User** - Each user has their own private bookmarks
- 🔌 **API Integration** - Add bookmarks from external sources

---

## 🚀 Quick Start

### Docker Compose (Recommended)

1. Create a `docker-compose.yml`:

```yml
services:
  healer:
    image: healer:latest
    container_name: healer
    restart: unless-stopped
    environment:
      - PORT=5173
      - PUBLIC_HTTPS_ONLY=false
      - PUBLIC_SIGNUP_DISABLED=false
      # AI Service (optional)
      # - HEALER_AI_BASE_URL=http://localhost:8000
      # - HEALER_AI_API_KEY=your-secret-key
    volumes:
      - healer_data:/app/data/
    ports:
      - '5173:5173'

volumes:
  healer_data:
```

2. Run: `docker compose up -d`
3. Open: `http://localhost:5173`

---

## 🤖 AI Features

Healer uses a **separate AI service** (FastAPI) for intelligent features:

- **Auto-generate tags** from bookmark content
- **Summarize** webpages automatically
- **Suggest** related bookmarks (coming soon)

### AI Service Configuration

Configure via environment variables:

```bash
# AI Service URL (defaults to mock mode if not set)
HEALER_AI_BASE_URL=http://localhost:8000

# API Key for authentication (if required)
HEALER_AI_API_KEY=your-secret-key-here

# Use mock responses for testing (default: auto-detect)
HEALER_AI_USE_MOCK=false

# Enable debug logging
HEALER_AI_DEBUG=true
```

**Note:** When `HEALER_AI_BASE_URL` is not configured, Healer uses mock AI responses for development/testing.

---

## 📦 Installation Options

<details>
  <summary><strong>Development Setup (Node/Bun)</strong></summary>

### Prerequisites
- [Bun](https://bun.sh) or [Node.js](https://nodejs.org)
- [PNPM](https://pnpm.io) (if using Node)

### Steps

```bash
# Clone the repository
git clone https://github.com/ITHealer/book_m_ai
cd book_m_ai

# Copy environment template
cp .env.example .env

# Install dependencies
bun install  # or: pnpm install

# Run development server
bun run dev  # or: pnpm dev
```

Access at `http://localhost:5173`

</details>

<details>
  <summary><strong>Build Docker Image</strong></summary>

```bash
# Build the image
chmod +x build.sh && ./build.sh

# Or manually:
docker build -t healer:latest .
```

</details>

---

## 🎯 Features in Detail

### Core Features
- ✅ Add and organize bookmarks with categories
- ✅ Multi-user support with private bookmark collections
- ✅ Fuzzy search across titles, descriptions, and tags
- ✅ Tag management and filtering
- ✅ Automatic metadata fetching (title, description, images)
- ✅ Personal notes for each bookmark
- ✅ Importance ratings and flags
- ✅ Dark/light theme switching
- ✅ Import bookmarks from browsers (Netscape format)
- ✅ RESTful API for integrations

### AI Features
- ✅ Auto-generate tags from content
- ✅ Summarize webpage content
- 🔜 Smart bookmark recommendations
- 🔜 Duplicate detection
- 🔜 Content categorization

### Coming Soon
- 📤 Export bookmarks (JSON, HTML, CSV)
- 🌍 Public bookmark sharing
- ✨ Flows - session-based bookmark collections
- 🔗 Link preview cards
- 📱 Mobile app companion

---

## 🛠 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PUBLIC_ORIGIN` | Your domain/URL | `http://localhost:5173` |
| `PUBLIC_HTTPS_ONLY` | Force HTTPS | `false` |
| `PORT` | Server port | `5173` |
| `PUBLIC_SIGNUP_DISABLED` | Disable public registration | `false` |
| `HEALER_AI_BASE_URL` | AI service endpoint | `http://localhost:8000` |
| `HEALER_AI_API_KEY` | AI service API key | - |
| `HEALER_AI_USE_MOCK` | Use mock AI responses | auto-detect |

---

## 📖 API Documentation

Healer provides a REST API for programmatic access:

- **Swagger UI**: `http://localhost:5173/api`
- **OpenAPI Spec**: `/api/api-schema.json`

### Example: Add a Bookmark

```bash
curl -X POST http://localhost:5173/api/bookmarks \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "title": "Example Site",
    "categoryId": 1
  }'
```

---

## 🙏 Credits & Attribution

**Healer** is a fork of [Grimoire](https://github.com/goniszewski/grimoire) by [Robert Goniszewski](https://github.com/goniszewski), licensed under MIT.

We've added:
- AI-powered features with separate service architecture
- Simplified configuration
- Enhanced user experience

Original Grimoire contributors and maintainers deserve massive credit for building a solid foundation.

### Built With Amazing Open Source

- [SvelteKit](https://kit.svelte.dev) - Web framework
- [TailwindCSS](https://tailwindcss.com) + [DaisyUI](https://daisyui.com) - UI styling
- [Drizzle ORM](https://orm.drizzle.team) - Database
- [Lucia](https://lucia-auth.com) - Authentication
- [Fuse.js](https://fusejs.io) - Fuzzy search
- [@extractus/article-extractor](https://github.com/extractus/article-extractor) - Content extraction
- [Bun](https://bun.sh) - JavaScript runtime

...and many more! See [package.json](package.json) for full list.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**Original Project**: [Grimoire](https://github.com/goniszewski/grimoire) by Robert Goniszewski (MIT License)

---

## 🤝 Contributing

We welcome contributions! Whether it's:
- 🐛 Bug reports
- 💡 Feature requests
- 🔧 Pull requests
- 📖 Documentation improvements

Please check out our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## 🔗 Links

- **GitHub**: [ITHealer/book_m_ai](https://github.com/ITHealer/book_m_ai)
- **Original Project**: [goniszewski/grimoire](https://github.com/goniszewski/grimoire)
- **Issues**: [Report a bug](https://github.com/ITHealer/book_m_ai/issues)

---

<p align="center">
  Made with ❤️ by the Healer community<br>
  Forked from Grimoire • MIT License
</p>
