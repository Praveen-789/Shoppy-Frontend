# Shared UI components

shadcn is configured. Add components from the frontend directory:
npx shadcn add button
npx shadcn add input dialog

The CLI puts editable React components here. Use @/lib/utils for cn().
Tailwind utilities and dark: variants work with our existing data-theme attribute.
Our CSS entry is src/index.css. Tailwind Preflight is intentionally not enabled,
so existing screens retain their styling during the gradual migration.

Existing unlayered page CSS (for example .shop-page button) can override Tailwind
utilities. When adopting a component on a page, narrow those old selectors or
move the affected styles into a CSS layer; check normal, hover, focus and disabled
states in both themes. Do not globally replace the existing palette.