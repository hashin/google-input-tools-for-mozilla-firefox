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