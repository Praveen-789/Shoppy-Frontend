# Category-aware vendor products

The `/vendor` page uses the existing shadcn setup and theme variables. Its editor
uses shadcn Card, Button, Input, Textarea, NativeSelect, Badge and Checkbox
components. Tailwind Preflight stays disabled for the older pages. The legacy
shop button selector excludes `data-slot` components, and a scoped base-layer
reset removes native browser button backgrounds before shadcn utilities apply.

## Follow a category selection

1. `VendorProductEditor.tsx` loads `GET /api/categories` using `categoryApi.ts`.
   It aborts pending requests on unmount and offers retry on failure. Saving is
   blocked until definitions load. An empty list is explained in the form.
2. The category dropdown shows names and submits slugs. Changing category clears
   specification inputs and validation messages, so clothing fields cannot leak
   into a mobile product.
3. `ProductAttributeFields.tsx` renders fields from the selected definition:
   text/number inputs, option dropdowns, Yes/No dropdowns, checkbox groups for
   text arrays with choices, and comma-separated inputs for text arrays without
   predefined choices.
4. `productAttributes.ts` converts form values into the API payload. Numeric
   inputs stay strings while editing; blank optional numbers are omitted rather
   than converted to zero. A selected No becomes boolean false, not a string or
   a missing value. Required arrays and allowed choices are validated with inline
   errors; the first invalid specification receives focus. The backend remains
   responsible for enforcing the same rules.
5. `vendorApi.ts` sends typed attributes along with the existing product fields.
   Draft saves require the category's required values, matching the backend.

## Editing and compatibility

Existing products populate their saved attributes, including sizes and false
booleans. A product whose category string does not match a current slug gets an
"existing category" dropdown option. It can be saved with that category intact;
attributes are omitted from this legacy payload so the backend preserves them.
Switching it to a defined category requires completing the new specifications.
There is no automatic conversion from `Clothing` to `clothing`.

The photo gallery supports up to five JPEG/PNG/WebP images, 5 MB each. The editor
saves details as a draft before uploading selected files sequentially and publishes
only after they all succeed. Successful uploads leave the queue immediately;
failures retain the remaining files. The saved product ID and per-file retry keys
prevent duplicate uploads on retry. Saved photos can be removed or made the cover
immediately; pending photos can be discarded before saving. Local object URLs are
revoked on upload, discard or editor unmount. See `../shoppy-node/IMAGES.md`.

## Verification

- `npm run test:vendor`: input conversion, validation, category separation,
  payloads, API errors and request cancellation signals (mocked fetch).
- `npm run build` and `npm run lint`.
- `npm run test:images`: gallery compatibility, file limits, partial failures,
  idempotency keys, API requests and accessible thumbnail markup.
- Browser checks: clothing required sizes/save/reopen, changing to mobiles,
  numeric values, TV resolution and No choice, legacy category saves, and
  desktop/mobile light and dark layouts.

The shopper's category-specific filters and specification display are a separate
next step; this change upgrades the vendor product workflow.
