import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'CursorFlag',
  version: pkg.version,
  description: 'Display a label next to cursor on specific domains',
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  content_scripts: [{
    js: ['src/content/main.ts'],
    matches: ['<all_urls>'],
  }],
  permissions: [
    'storage',
    'activeTab',
  ],
})
