# Google Input Tools for Firefox

A Firefox extension for transliteration, virtual keyboard, and handwriting input in 90+ languages.

## Features
- Transliteration from English to other scripts
- Virtual keyboard overlay
- (Optional) Handwriting input
- Works in all editable fields

## Getting Started

1. Clone or download this repository.
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`.
3. Click "Load Temporary Add-on" and select the `manifest.json` file from this folder.
4. The extension icon will appear in the toolbar.

## Development
- Edit popup UI in `popup.html`, `popup.js`, `popup.css`
- Background logic in `background.js`
- Content script in `contentScript.js`

## License
MIT 