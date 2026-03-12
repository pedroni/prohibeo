import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Distractio',
  version: '0.1.0',
  description: 'Block websites and hide distracting sections with schedule-based rules.',
  permissions: ['storage'],
  host_permissions: ['<all_urls>'],
  action: {
    default_title: 'Distractio',
    default_popup: 'index.html',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_start',
    },
  ],
})
