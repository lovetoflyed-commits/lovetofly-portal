# Love to Fly Portal

A comprehensive aviation portal built with Next.js 16, featuring flight tools, hangar marketplace, and aviation community features.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build for production
yarn build
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📚 Documentation

All project documentation is organized in the [`documentation/`](./documentation/) folder:

- **Getting Started:** [QUICK_START.md](./documentation/QUICK_START.md), [START_HERE.md](./documentation/START_HERE.md)
- **Setup:** [SETUP_AND_CONNECTIONS.md](./documentation/SETUP_AND_CONNECTIONS.md), [NEON_SETUP.md](./documentation/NEON_SETUP.md)
- **Features:** HangarShare, Email System, Payment Integration guides
- **API Reference:** [API_DOCUMENTATION.md](./documentation/API_DOCUMENTATION.md)

👉 **[View Full Documentation Index](./documentation/README.md)**

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (Neon)
- **Auth:** JWT + bcrypt
- **Payments:** Stripe
- **Email:** Resend

## 🔧 Development

```bash
yarn dev              # Start dev server
yarn build            # Production build
yarn lint             # Run ESLint
yarn migrate:up       # Run database migrations
```

## 📦 Project Structure

```
src/
├── app/              # Next.js pages and API routes
├── components/       # Shared React components
├── context/          # React context providers
├── config/           # Configuration files
├── migrations/       # Database migrations
├── types/            # TypeScript definitions
└── utils/            # Utility functions
```

## 🤖 AI Development

For AI coding agents, see [.github/copilot-instructions.md](.github/copilot-instructions.md)

## 📄 License

MIT

---

Built with ❤️ for the aviation community
