// popup.js
// Handles popup UI logic for language selection and toggles

const LANGUAGES = [
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'as', name: 'Assamese' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bo', name: 'Tibetan' },
  { code: 'brx', name: 'Bodo' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'chr', name: 'Cherokee' },
  { code: 'dv', name: 'Divehi' },
  { code: 'el', name: 'Greek' },
  { code: 'en', name: 'English' },
  { code: 'fa', name: 'Persian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hne', name: 'Chhattisgarhi' },
  { code: 'hr', name: 'Croatian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'hy', name: 'Armenian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'jv', name: 'Javanese' },
  { code: 'ka', name: 'Georgian' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ko', name: 'Korean' },
  { code: 'ks', name: 'Kashmiri' },
  { code: 'ku', name: 'Kurdish' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'la', name: 'Latin' },
  { code: 'lb', name: 'Luxembourgish' },
  { code: 'lo', name: 'Lao' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'mai', name: 'Maithili' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'mni', name: 'Manipuri' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ms', name: 'Malay' },
  { code: 'mt', name: 'Maltese' },
  { code: 'my', name: 'Burmese' },
  { code: 'ne', name: 'Nepali' },
  { code: 'nl', name: 'Dutch' },
  { code: 'no', name: 'Norwegian' },
  { code: 'or', name: 'Oriya' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sa', name: 'Sanskrit' },
  { code: 'sat', name: 'Santali' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'sq', name: 'Albanian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'sv', name: 'Swedish' },
  { code: 'sw', name: 'Swahili' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'ti', name: 'Tigrinya' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'zh', name: 'Chinese' },
  // Add more if needed
];

const RECENT_LANG_KEY = 'recentLanguages';
const SETTINGS_KEY = 'inputToolsSettings';

function saveSettings(settings) {
  return browser.storage.local.set({ [SETTINGS_KEY]: settings });
}

function loadSettings() {
  return browser.storage.local.get(SETTINGS_KEY).then(result => result[SETTINGS_KEY] || {});
}

function saveRecentLanguages(recent) {
  return browser.storage.local.set({ [RECENT_LANG_KEY]: recent });
}

function loadRecentLanguages() {
  return browser.storage.local.get(RECENT_LANG_KEY).then(result => result[RECENT_LANG_KEY] || []);
}

function renderLanguageOptions(langList, selectElem) {
  selectElem.innerHTML = '';
  langList.forEach(l => {
    const option = document.createElement('option');
    option.value = l.code;
    option.textContent = l.name;
    selectElem.appendChild(option);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const languageSelect = document.getElementById('languageSelect');
  const languageSearch = document.getElementById('languageSearch');
  const translitToggle = document.getElementById('transliterationToggle');
  const keyboardToggle = document.getElementById('keyboardToggle');

  // Load settings and recent languages
  const [settings, recentLanguages] = await Promise.all([
    loadSettings(),
    loadRecentLanguages()
  ]);

  // Populate language dropdown (recent first)
  let langList = [...LANGUAGES];
  if (recentLanguages.length > 0) {
    const recent = langList.filter(l => recentLanguages.includes(l.code));
    const rest = langList.filter(l => !recentLanguages.includes(l.code));
    langList = [...recent, ...rest];
  }
  renderLanguageOptions(langList, languageSelect);

  // Search/filter functionality
  languageSearch.addEventListener('input', (e) => {
    const search = e.target.value.trim().toLowerCase();
    let filtered = langList.filter(l => l.name.toLowerCase().includes(search) || l.code.toLowerCase().includes(search));
    renderLanguageOptions(filtered, languageSelect);
    // Restore selection if possible
    if (settings.language) languageSelect.value = settings.language;
  });

  // Set current settings
  if (settings.language) languageSelect.value = settings.language;
  translitToggle.checked = !!settings.transliterationEnabled;
  keyboardToggle.checked = !!settings.keyboardEnabled;

  // Save on change
  languageSelect.addEventListener('change', async (e) => {
    const newLang = e.target.value;
    const updatedSettings = { ...settings, language: newLang };
    await saveSettings(updatedSettings);
    // Update recent languages
    let recent = recentLanguages.filter(code => code !== newLang);
    recent.unshift(newLang);
    if (recent.length > 5) recent = recent.slice(0, 5);
    await saveRecentLanguages(recent);
    // Send settings to background
    browser.runtime.sendMessage({ type: 'SETTINGS_UPDATE', settings: updatedSettings });
  });

  translitToggle.addEventListener('change', async (e) => {
    const updatedSettings = { ...settings, transliterationEnabled: e.target.checked };
    await saveSettings(updatedSettings);
    browser.runtime.sendMessage({ type: 'SETTINGS_UPDATE', settings: updatedSettings });
  });

  keyboardToggle.addEventListener('change', async (e) => {
    const updatedSettings = { ...settings, keyboardEnabled: e.target.checked };
    await saveSettings(updatedSettings);
    browser.runtime.sendMessage({ type: 'SETTINGS_UPDATE', settings: updatedSettings });
  });

  // Show correct shortcut for platform
  const shortcutText = document.getElementById('shortcutText');
  if (shortcutText) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    shortcutText.innerHTML = `Toggle transliteration: <span style="font-family: monospace;">${isMac ? '⌘+Shift+M' : 'Ctrl+Shift+M'}</span>`;
  }
}); 