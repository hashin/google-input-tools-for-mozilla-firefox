// background.js
// Service worker for Google Input Tools for Firefox extension

// Placeholder for background logic 
// Listen for settings updates from popup and relay to all tabs
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SETTINGS_UPDATE') {
    // Send to all tabs
    browser.tabs.query({}).then(tabs => {
      for (const tab of tabs) {
        if (tab.id) {
          browser.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATE',
            settings: message.settings
          });
        }
      }
    });
  }
}); 

// Listen for transliteration requests from content scripts
browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === 'TRANSLITERATE') {
    const { text, langCode } = message;
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${langCode}-t-i0-und&num=5`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data[0] === 'SUCCESS') {
        return Promise.resolve({ suggestions: data[1][0][1] });
      }
    } catch (e) {
      console.error('Transliteration API error:', e);
    }
    return Promise.resolve({ suggestions: [] });
  }
}); 

// Handle keyboard shortcut to toggle transliteration
browser.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-transliteration') {
    const SETTINGS_KEY = 'inputToolsSettings';
    const result = await browser.storage.local.get(SETTINGS_KEY);
    const settings = result[SETTINGS_KEY] || {};
    const newValue = !settings.transliterationEnabled;
    const updatedSettings = { ...settings, transliterationEnabled: newValue };
    await browser.storage.local.set({ [SETTINGS_KEY]: updatedSettings });
    // Broadcast to all tabs
    browser.tabs.query({}).then(tabs => {
      for (const tab of tabs) {
        if (tab.id) {
          browser.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATE',
            settings: updatedSettings
          });
        }
      }
    });
    // Optionally, show a notification
    browser.notifications && browser.notifications.create({
      "type": "basic",
      "iconUrl": browser.runtime.getURL("icons/icon32.png"),
      "title": "Input Tools",
      "message": `Transliteration ${newValue ? 'enabled' : 'disabled'}`
    });
  }
}); 