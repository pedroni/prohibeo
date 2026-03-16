import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Prohibeo',
  version: '0.1.0',
  description: "Less noise. More focus. Access what matters. Hide what doesn't. Block on your terms.",
  content_security_policy: {
    extension_pages:
      "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:",
  },
  permissions: ['storage'],
  host_permissions: ['http://*/*', 'https://*/*'],
  action: {
    default_title: 'Prohibeo',
    default_popup: 'index.html',
    default_icon: {
      '16': 'src/assets/icon16.png',
      '32': 'src/assets/icon32.png',
      '48': 'src/assets/icon48.png',
      '128': 'src/assets/icon128.png',
    },
  },
  icons: {
    '16': 'src/assets/icon16.png',
    '32': 'src/assets/icon32.png',
    '48': 'src/assets/icon48.png',
    '128': 'src/assets/icon128.png',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_start',
    },
  ],
})
