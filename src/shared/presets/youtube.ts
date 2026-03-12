import type { PresetOptionDefinition, YouTubePresetKey } from '../types'

export const YOUTUBE_PRESET_OPTIONS: PresetOptionDefinition<YouTubePresetKey>[] = [
  {
    key: 'hideComments',
    label: 'Hide Comments',
    description: 'Hide the comments section below videos.',
    selectors: [
      '#comments',
      'ytd-comments',
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-comments-section"]',
    ],
  },
  {
    key: 'hideHomeSuggestions',
    label: 'Hide Home Page Suggestions',
    description: 'Hide the suggested video feed on the YouTube homepage.',
    selectors: [
      'ytd-page-manager[page-subtype="home"] ytd-rich-grid-renderer',
      'ytd-browse[page-subtype="home"] ytd-rich-grid-renderer',
      'ytd-two-column-browse-results-renderer[page-subtype="home"] #primary',
    ],
  },
  {
    key: 'hideShorts',
    label: 'Hide Shorts',
    description: 'Hide YouTube Shorts shelves, menu entries, and cards.',
    selectors: [
      'ytd-reel-shelf-renderer',
      'ytd-rich-item-renderer:has(a[href^="/shorts/"])',
      'ytd-video-renderer:has(a[href^="/shorts/"])',
      'ytd-guide-entry-renderer:has(a[href^="/shorts/"])',
      'ytd-mini-guide-entry-renderer:has(a[href^="/shorts/"])',
    ],
  },
  {
    key: 'hideVideoSuggestions',
    label: 'Hide Video Page Suggestions',
    description: 'Hide suggested videos on watch pages.',
    selectors: ['#related', 'ytd-watch-next-secondary-results-renderer'],
  },
]
