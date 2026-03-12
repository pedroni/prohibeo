# AGENTS.md

## Purpose

This repository contains two related apps:

- the **Chrome extension** at the repository root
- the **marketing / landing site** in `site/`

Keep them separate as applications, but share primitives, tokens, and conventions where it reduces drift.

## Repository structure

- `src/` — Chrome extension source
- `site/` — standalone Astro site
- `ui/` — shared React UI primitives used by both the extension and the Astro site

Do **not** move the extension into a subfolder just to mirror the site. The current structure is intentional.

## Shared UI

Shared UI primitives live in `ui/` and are imported through the `@ui/*` alias.

Current shared components:

- `@ui/Button`
- `@ui/TextInput`

Use these shared components instead of re-implementing the same primitive separately in the extension and the site.

### Button rules

`Button` should be **self-contained**.

- Do not style `Button` instances with ad-hoc `className` overrides
- Prefer explicit props like `variant` and `size`
- Current API is intentionally small:
  - `variant`: `primary | secondary`
  - `size`: `xs | md | lg`
- `Button` can render either a native `button` or a link when `href` is provided

If a new visual treatment is needed, extend the component API instead of pushing styling into call sites.

### TextInput rules

`TextInput` should also be **self-contained**.

- Do not pass styling classes to inputs ad hoc
- Prefer component props over caller styling
- Current API:
  - `size`: `md | lg`

If the design needs a new field style, add a variant or prop to `TextInput` instead of styling individual usages.

## Styling system

Both the extension and the site use semantic theme tokens instead of hard-coded light/dark utility combinations.

### Theme tokens

Defined in:

- `src/index.css` for the extension
- `site/src/styles/global.css` for the site

Use semantic utilities like:

- `bg-background`
- `text-foreground`
- `border-foreground/20`
- `text-muted-foreground`
- `bg-primary`
- `text-primary-foreground`

Avoid hard-coding raw light/dark color classes in components when a semantic token already exists.

### Color conventions

The UI should automatically follow the OS color scheme through `prefers-color-scheme`.

Dark mode target palette:

- foreground near `#E6E6E6`
- background near `#131313`

Primary colors invert appropriately between light and dark through the shared tokens.

### Border conventions

For standard component borders, prefer `border-foreground/20`.

That keeps the border treatment explicit and consistent without adding an extra border token abstraction.

### Hover conventions

For subtle hover states on neutral surfaces, prefer `hover:bg-foreground/20` or a semantic equivalent if one is later introduced.

## Site-specific guidance

The site is an Astro app in `site/`, but it can render shared React primitives through `@astrojs/react`.

Guidelines:

- keep page/layout/content authoring in Astro
- use shared React primitives from `ui/` for reusable controls
- keep `site/src/styles/global.css` minimal and focused on theme tokens / Tailwind import
- prefer Tailwind utility classes in Astro templates

The site uses a contained shell layout:

- centered
- around `1024px` max width
- simple bordered structure
- minimal visual treatment

Header navigation links should:

- fill the header cell height
- be separated with `border-foreground/20`
- use subtle `foreground/20` hover fills

## Extension-specific guidance

The extension UI should match the site design language:

- minimal
- squared
- semantic theme tokens
- no special one-off styling if a shared primitive can handle it

The popup and settings UI should prefer shared primitives where possible.

The content script’s blocked-page UI should also honor the shared light/dark palette, even though it is injected HTML/CSS rather than React UI.

## Content and branding

Use **Prohibeo** as the product name.

Do not reintroduce old `Distractio` branding in visible copy, routes, metadata, package names, or starter content.

## Build and validation commands

Extension:

- `npm run build`
- `npm run lint`
- `npm run typecheck`

Site:

- `npm run site:dev`
- `npm run site:build`
- `npm run site:preview`

When changing shared UI, theme tokens, or imports that affect both apps, validate both sides:

```bash
npm run site:build && npm run build && npm run lint && npm run typecheck
```

## Preferred change strategy

When making future changes:

1. Prefer extending shared primitives over styling individual call sites
2. Prefer semantic theme tokens over hard-coded color utilities
3. Keep the extension and site structurally separate
4. Share only what is genuinely reusable
5. Preserve the minimal, square, bordered design language

If a component starts requiring repeated caller-side styling, that is a signal to improve the shared component API.

## List and row conventions

When rendering a repeated list of items (e.g. schedules, selectors, rules), use a top-border separator between rows rather than boxing each item individually.

- Use `border-t border-foreground/20` on each row
- No horizontal padding (`px-*`) on the rows themselves; let the parent section provide horizontal spacing
- Vertical padding (`py-*`) on each row for breathing room

Avoid wrapping each list item in its own full border box.

## Data format and compatibility

Only support the current data format. Do not write migration paths or backwards-compatibility shims for old storage shapes.

When a data structure changes, update the parser to expect the new shape and drop legacy handling. The product targets new users going forward.

## Logic conventions

For any condition that drives a significant behavior (e.g. whether a site is blocked), there should be a single authoritative function that returns a boolean. All call sites use that function — do not re-implement or inline the check elsewhere.
