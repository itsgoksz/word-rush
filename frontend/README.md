# WordRush Frontend

This directory contains the client-side single-page application and mobile wrapper for **WordRush**, built with React 19, TypeScript, Vite, Tailwind CSS v4, and Capacitor 8.

For full game documentation, architecture details, Supabase database schemas, and screenshots, see the **[Main Project README](../README.md)**.

## 🛠️ Quick Commands

```bash
# Install dependencies
npm install

# Start local dev server (default port: 5173)
npm run dev

# Type-check and produce production bundle
npm run build

# Sync built bundle with native mobile Capacitor runtimes
npm run sync

# Open iOS Xcode project
npx cap open ios

# Open Android Studio project
npx cap open android

# Run ESLint checks
npm run lint
```

## ⚙️ Environment Variables

Create `.env` based on `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
