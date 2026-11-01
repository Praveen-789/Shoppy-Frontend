import { useEffect } from 'react'

export const SITE_NAME = 'Shoppy'

// Builds the text shown in the browser tab: "Your cart | Shoppy", or just "Shoppy" when a page
// has nothing specific to say.
export function formatDocumentTitle(pageTitle: string) {
  const trimmed = pageTitle.trim()
  return trimmed ? `${trimmed} | ${SITE_NAME}` : SITE_NAME
}

// index.html can only hold one static <title>, and in a single-page app the browser never loads
// another HTML file, so each page must update the tab title itself. Call this once near the top
// of a page component. The effect runs after the first render and again whenever the title
// changes, for example once a product's name has loaded.
export function useDocumentTitle(pageTitle: string) {
  useEffect(() => {
    document.title = formatDocumentTitle(pageTitle)
  }, [pageTitle])
}
