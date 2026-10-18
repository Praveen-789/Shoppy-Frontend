# Shop filters

`Products.tsx` owns the applied search, category, price range and attribute choices.
`ShopFilters.tsx` loads `/api/products/filters?category=...` to display the category's
available choices using the installed shadcn Button, Input and Checkbox components.
New category attributes appear automatically when the backend marks them filterable
and published products contain values. No category-specific frontend conditions are needed.

Checkbox choices apply immediately. Choices within an attribute are alternatives;
different attributes and price bounds must all match. Boolean choices display Yes/No
while the request preserves true/false. Up to ten choices per attribute are allowed.

Price inputs are drafts until Apply price is pressed. Empty bounds mean unrestricted;
zero is valid. The form checks the backend's price limits and range before applying.
The displayed price bounds describe the whole category, not just matching products.

Changing filters or search resets pagination. Load more retains every applied filter.
Changing category clears attribute choices and price bounds, preserving search.
Clear filters preserves category and search. Aborted requests cannot replace newer results.

The sidebar stays below the compact category bar on desktop. On small screens it
becomes a collapsible panel above results. Both themes use the existing CSS variables.

Run `npm run test:filters`, `npm run build` and `npm run lint` to verify changes.
