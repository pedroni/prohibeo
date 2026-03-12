# Distractio

Distractio is a Chrome extension for blocking distracting websites and hiding distracting parts of a website.

## What it does

Distractio lets you:

- block an entire site
- switch a site between `Always block` and `Scheduled blocking`
- choose weekdays and start/end hours for scheduled blocking
- hide built-in distracting sections for supported sites like YouTube
- add your own CSS selectors to hide specific page sections

Blocking a root domain such as `youtube.com` also matches subdomains like `www.youtube.com` and `m.youtube.com`.

## Supported features

Distractio currently supports:

- Chrome extension popup UI for managing rules
- adding multiple websites
- full-site blocking with a Distractio blocked screen
- per-site blocking mode:
  - `Always block`
  - `Scheduled blocking`
- per-site strict-mode schedule settings:
  - weekday selection
  - start hour
  - end hour
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
- unpacked Chrome extension build output via `npm run build`

## Current limitations

Distractio does not currently include:

- cloud sync between browsers/devices
- import/export of rules
- support for browsers other than Chrome
- preset libraries for many sites beyond YouTube
- account, billing, feedback, or upgrade flows

## How to install it in Chrome

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build the extension:

   ```bash
   npm run build
   ```

3. Open Chrome and go to `chrome://extensions`

4. Turn on **Developer mode**

5. Click **Load unpacked**

6. Select the `dist/` folder from this project

After that, you should see the Distractio extension in Chrome.

## How to use Distractio

### 1. Open the popup

Click the Distractio extension icon in the Chrome toolbar.

The popup is the main place where you manage blocked websites.

### 2. Add a website

In the **Website to block** field, enter a domain or URL, for example:

- `youtube.com`
- `facebook.com`
- `https://x.com`

Then click **Add**.

When you add a website, the default behavior is:

- the website is immediately blocked
- Distractio shows a blocked screen when you visit it
- the site is set to **Always block**

For `youtube.com`, the behavior is different:

- Distractio does **not** block the full page
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

When you visit it, Distractio replaces the page with a simple blocked screen.

### Scheduled blocking

The site is blocked only during the times you choose.

You can select:

- weekdays
- start hour
- end hour

Outside that schedule, the full-site block is not active.

## Hiding parts of a site

Distractio can also hide sections of a website instead of blocking the entire site.

### Built-in options for supported sites

For YouTube, Distractio does not use the full-page blocked screen. Instead, you can toggle options such as:

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

Distractio stores your website rules in `chrome.storage.local`.

That means your settings stay inside your browser profile on your machine.

## Typical workflow

Example with YouTube:

1. Add `youtube.com`
2. Open settings
3. Leave **Always active** on if you want YouTube sections hidden all the time
4. Or change to **Scheduled activation**
5. Pick weekdays and hours
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

Build for Chrome:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Type-check:

```bash
npm run typecheck
```
