# Prohibeo

Prohibeo is a Chrome extension for blocking distracting websites and hiding distracting parts of a website.

## What it does

Prohibeo lets you:

- block an entire site
- switch a site between `Always block` and `Scheduled blocking`
- create reusable schedules with weekdays and start/end hours
- attach an existing schedule to multiple blocked sites
- edit a shared schedule once and apply it everywhere it is used
- hide built-in distracting sections for supported sites like YouTube
- add your own CSS selectors to hide specific page sections

Blocking a root domain such as `youtube.com` also matches subdomains like `www.youtube.com` and `m.youtube.com`.

## Supported features

Prohibeo currently supports:

- Chrome extension popup UI for managing rules
- adding multiple websites
- full-site blocking with a Prohibeo blocked screen
- per-site blocking mode:
  - `Always block`
  - `Scheduled blocking`
- reusable schedule settings:
  - unique schedule names
  - weekday selection
  - start hour
  - end hour
  - attaching an existing schedule to another site
  - editing a schedule across every site that uses it
- root-domain matching with subdomain support
  - example: `youtube.com` also applies to `www.youtube.com`
- built-in YouTube controls:
  - Hide Comments
  - Hide Home Page Suggestions
  - Hide Shorts
  - Hide Video Page Suggestions
- YouTube uses section hiding only and is not replaced by the full-page blocked screen
- custom CSS selector hiding for any supported website
- removing websites from the block list
- persistent local storage with `chrome.storage.local`
- unpacked Chrome extension output through `dist/` for both `npm run dev` and `npm run build`

## Current limitations

Prohibeo does not currently include:

- cloud sync between browsers/devices
- import/export of rules
- support for browsers other than Chrome
- preset libraries for many sites beyond YouTube
- account, billing, feedback, or upgrade flows

## How to install it in Chrome

### Recommended development workflow

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the extension dev server:

   ```bash
   npm run dev
   ```

3. Keep that terminal running, then open Chrome and go to `chrome://extensions`

4. Turn on **Developer mode**

5. Click **Load unpacked**

6. Select the `dist/` folder from this project

After that, you should see the Prohibeo extension in Chrome.

For day-to-day extension work, leave `npm run dev` running and reload the unpacked extension when Chrome prompts you or when your changes do not appear automatically.

### Production-style build

Use a full build when you want to verify the release bundle:

```bash
npm run build
```

If you want a readable packaged output with sourcemaps for debugging outside the dev server, use:

```bash
npm run build:debug
```

## How to use Prohibeo

### 1. Open the popup

Click the Prohibeo extension icon in the Chrome toolbar.

The popup is the main place where you manage blocked websites.

### 2. Add a website

In the **Website to block** field, enter a domain or URL, for example:

- `youtube.com`
- `facebook.com`
- `https://x.com`

Then click **Add**.

When you add a website, the default behavior is:

- the website is immediately blocked
- Prohibeo shows a blocked screen when you visit it
- the site is set to **Always block**

For `youtube.com`, the behavior is different:

- Prohibeo does **not** block the full page
- it uses section hiding only
- built-in YouTube distraction toggles start enabled by default

### 3. Edit a website's settings

In the blocked websites list:

- click the **gear icon** to open settings
- click the **X icon** to remove the website

Inside settings, you can control how that site behaves.

## Blocking modes

Each website can use one of two modes:

### Always block

The site is blocked all the time.

When you visit it, Prohibeo replaces the page with a simple blocked screen.

### Scheduled blocking

The site is blocked only during the times you choose.

Schedules can be reused across multiple sites.

You can:

- create a named schedule
- select weekdays
- select start hour
- select end hour
- attach an existing schedule to another blocked site

Outside that schedule, the full-site block is not active.

If you edit a schedule that is used by more than one site, Prohibeo shows a warning before saving because that change affects every site using that schedule.

## Hiding parts of a site

Prohibeo can also hide sections of a website instead of blocking the entire site.

### Built-in options for supported sites

For YouTube, Prohibeo does not use the full-page blocked screen. Instead, you can toggle options such as:

- Hide Comments
- Hide Home Page Suggestions
- Hide Shorts
- Hide Video Page Suggestions

These options remove distracting sections from the page when the rule applies.

### Custom CSS selectors

You can also hide your own page sections by adding CSS selectors.

Examples:

- `#comments`
- `.sidebar`
- `[aria-label="Recommended"]`

To add one:

1. Open a website's settings
2. Find **Custom selectors**
3. Enter a CSS selector
4. Click **Add**

To remove one, click the trash icon next to it.

## Where settings are stored

Prohibeo stores your website rules in `chrome.storage.local`.

That means your settings stay inside your browser profile on your machine.

## Typical workflow

Example with YouTube:

1. Add `youtube.com`
2. Open settings
3. Leave **Always block** off if you want YouTube sections hidden all the time
4. Or change to **Scheduled blocking**
5. Add a schedule or attach one you already use elsewhere
6. Review the enabled YouTube toggles
7. Add custom selectors if you want to hide extra sections

## Development commands

Install packages:

```bash
npm install
```

Run the dev workflow:

```bash
npm run dev
```

This is the default extension workflow. It writes the unpacked extension to `dist/` and is the version you should keep loaded in `chrome://extensions` while developing.

Build for Chrome:

```bash
npm run build
```

Create a debug-friendly build with sourcemaps and unminified output:

```bash
npm run build:debug
```

Lint:

```bash
npm run lint
```

Type-check:

```bash
npm run typecheck
```

## Extension development loop

Use this loop instead of rebuilding from scratch every time:

1. Start `npm run dev`
2. Load `dist/` in `chrome://extensions`
3. Make a code change
4. Reload the extension if Chrome marks it stale
5. Refresh the page you are testing if the change affects a content script

In practice:

- popup and options UI changes are usually visible after the extension reloads
- content script changes usually require refreshing the tab where the script is injected
- old tabs can keep an invalidated content-script context after a reload, so testing in a freshly refreshed tab is the safest path

## Debugging tips

- Inspect popup UI by opening the Prohibeo popup and using that popup's DevTools
- Inspect content scripts from the DevTools of the page where Prohibeo is running
- Use `npm run build:debug` if you want sourcemaps and unminified bundles outside the live dev workflow

### Common development error

If you see this in the console:

```text
Prohibeo failed to load rules. Error: Extension context invalidated.
```

that usually means Chrome reloaded the extension while an older content script was still running in an open tab.

The fix is usually simple:

- reload the unpacked extension in `chrome://extensions` if needed
- refresh the tab you are testing
- retry after the new content script is injected

This is a normal Chrome extension development issue and does not usually mean your stored rules are broken.

## Validation checklist

Before wrapping up extension changes:

1. Confirm `npm run dev` starts cleanly
2. Confirm Chrome can load `dist/` as an unpacked extension
3. Confirm a popup change appears after reload
4. Confirm a content-script change appears after refreshing the test tab
5. Run `npm run build && npm run lint && npm run typecheck`

## Landing page site

This repository now also includes a minimal Astro landing page in `site/`.

Why Astro:

- static-first
- low boilerplate for a marketing site
- MDX blog support
- strong SEO defaults with very little client-side JavaScript

Run the landing page locally:

```bash
npm run site:dev
```

Build the landing page:

```bash
npm run site:build
```

Preview the built landing page:

```bash
npm run site:preview
```

The landing page is designed to be deployed separately from the extension build, with
Cloudflare Pages as the default target.

For production SEO metadata, canonicals, and sitemap generation, set `SITE_URL` to the
final site origin during deployment.

Auto-deploys for the landing page are configured with GitHub Actions in
`.github/workflows/deploy-site.yml`.

The workflow:

- runs on pushes to `main`
- only triggers when site-related files change
- installs dependencies with `npm ci`
- builds `site/` with `SITE_URL=https://prohibeo.com`
- deploys `site/dist` to the Cloudflare Pages project `prohibeo`

The deploy workflow expects these GitHub Actions secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## License

This project is licensed under the `MIT` License. See `LICENSE` for details.
