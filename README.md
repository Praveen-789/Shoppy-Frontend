# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Authentication state

`src/main.tsx` wraps the app in `AuthProvider`. The provider checks the cookie-based
session on startup and shares user (including role), checkingSession, busy,
message, login, register, and logout through React Context.

Components use `useAuth()` from `src/auth/useAuth.ts` instead of passing authentication
props through the component tree. The hook must be used inside AuthProvider.
Login keeps its form fields and validation messages local. App chooses between the
login, shop, cart, and vendor dashboard through React Router routes.
Products and VendorDashboard read the user and logout action from the context.

The provider uses the existing functions in `src/api.ts`. Initial session checks
are aborted on cleanup, including React Strict Mode remounts. Failed logout keeps
the signed-in user visible and shows an error so the user can retry.
Tokens remain in HTTP-only cookies; user state is in memory and restored through
`/api/auth/me` after refreshing. Backend authorization remains authoritative.
The cart uses Zustand; see STATE-MANAGEMENT.md for details.

## Cart and frontend routing

The cart uses Zustand in `src/stores/cartStore.ts`. It includes account-specific
MongoDB persistence through authenticated APIs, quantities, stock limits, remove/clear actions, and price/stock
refreshing on the cart page. Authentication continues to use React Context.
React Router provides `/login`, `/shop`, `/cart`, and vendor-only `/vendor` routes.
A shared ShopHeader includes navigation and the live cart count. Checkout is pending.

Read `STATE-MANAGEMENT.md` for the action-to-render flow and routing explanation.
Run `npm run test:cart` for cart behavior and rendered route access checks.
Deployment needs an index.html fallback for frontend routes; /api stays on the backend.



## Tailwind and shadcn setup
Tailwind v4 is enabled through @tailwindcss/vite. components.json configures
shadcn for React/TypeScript, with @ mapped to src in Vite and TypeScript.
src/lib/utils.ts exports cn for conditional class names and utility merging.

src/index.css maps shadcn tokens to the existing light/dark palette.
The dark variant follows data-theme="dark"; the existing toggle still controls it.
Preflight is omitted during gradual adoption to preserve existing page defaults.
See src/components/ui/README.md before adding components.

Add a component from this directory with: npx shadcn add button
Setup does not yet add UI components, toast calls, or a sticky cart bar.
