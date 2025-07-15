// contentScript.js
// Injects input tools logic into editable fields

// Placeholder: listen for focus on input/textarea

document.addEventListener('focusin', (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    // Placeholder: show input tools UI if enabled
  }
});

// Listen for settings updates from background
let currentSettings = {};
browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'SETTINGS_UPDATE') {
    currentSettings = message.settings;
    // For now, just log the update
    console.log('Input Tools settings updated:', currentSettings);
  }
});

// Helper: fetch transliteration suggestions via background script
async function fetchTransliteration(text, langCode) {
  try {
    const response = await browser.runtime.sendMessage({
      type: 'TRANSLITERATE',
      text,
      langCode
    });
    return response && response.suggestions ? response.suggestions : [];
  } catch (e) {
    console.error('Transliteration fetch error:', e);
    return [];
  }
}

// --- Suggestions Dropdown ---
let suggestionBox = null;
let currentInput = null;
let currentSuggestions = [];
let highlightedIndex = -1;

function createSuggestionBox() {
  suggestionBox = document.createElement('div');
  suggestionBox.style.position = 'absolute';
  suggestionBox.style.zIndex = 99999;
  suggestionBox.style.background = '#fff';
  suggestionBox.style.border = '1px solid #ccc';
  suggestionBox.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  suggestionBox.style.fontSize = '16px';
  suggestionBox.style.maxWidth = '320px';
  suggestionBox.style.cursor = 'pointer';
  suggestionBox.style.display = 'none';
  document.body.appendChild(suggestionBox);
}

function isDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyDropdownTheme() {
  if (!suggestionBox) return;
  if (isDarkMode()) {
    suggestionBox.style.background = '#23272f';
    suggestionBox.style.color = '#f1f1f1';
    suggestionBox.style.border = '1px solid #444';
    suggestionBox.style.boxShadow = '0 2px 8px rgba(0,0,0,0.7)';
  } else {
    suggestionBox.style.background = '#fff';
    suggestionBox.style.color = '#222';
    suggestionBox.style.border = '1px solid #ccc';
    suggestionBox.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  }
  // Update children (suggestion items)
  Array.from(suggestionBox.children).forEach((item, i) => {
    if (i === highlightedIndex) {
      item.style.background = isDarkMode() ? '#2d3748' : '#e6f0fa';
      item.style.color = isDarkMode() ? '#fff' : '#222';
    } else {
      item.style.background = isDarkMode() ? '#23272f' : '#fff';
      item.style.color = isDarkMode() ? '#f1f1f1' : '#222';
    }
  });
}

// Update theme on system change
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyDropdownTheme);
}

// Update showSuggestions and updateSuggestionHighlight to use theme
function showSuggestions(input, suggestions) {
  if (!suggestionBox) createSuggestionBox();
  currentInput = input;
  currentSuggestions = suggestions;
  suggestionBox.innerHTML = '';
  highlightedIndex = 0;
  suggestions.forEach((s, i) => {
    const item = document.createElement('div');
    item.textContent = s;
    item.style.padding = '6px 12px';
    item.style.cursor = 'pointer';
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      insertSuggestion(s);
    });
    item.addEventListener('mouseenter', () => {
      highlightedIndex = i;
      updateSuggestionHighlight();
    });
    suggestionBox.appendChild(item);
  });
  // Position below input
  const rect = input.getBoundingClientRect();
  suggestionBox.style.left = `${rect.left + window.scrollX}px`;
  suggestionBox.style.top = `${rect.bottom + window.scrollY}px`;
  suggestionBox.style.width = `${rect.width}px`;
  suggestionBox.style.display = 'block';
  suggestionBox.style.borderRadius = '4px';
  suggestionBox.style.overflow = 'hidden';
  suggestionBox.style.maxHeight = '200px';
  suggestionBox.style.overflowY = 'auto';
  applyDropdownTheme();
}

function updateSuggestionHighlight() {
  if (!suggestionBox) return;
  applyDropdownTheme();
}

function handleKeyDown(e) {
  if (!suggestionBox || suggestionBox.style.display === 'none' || !currentSuggestions.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlightedIndex = (highlightedIndex + 1) % currentSuggestions.length;
    updateSuggestionHighlight();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlightedIndex = (highlightedIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
    updateSuggestionHighlight();
  } else if (e.key === 'Tab' || e.key === 'Enter') {
    e.preventDefault();
    insertSuggestion(currentSuggestions[highlightedIndex]);
  } else if (e.key === 'Escape') {
    hideSuggestions();
  } else if (e.key === ' ' || e.code === 'Space') {
    // Space bar: insert suggestion and a space
    e.preventDefault();
    insertSuggestion(currentSuggestions[highlightedIndex], true);
  }
}

document.addEventListener('keydown', handleKeyDown, true);

function hideSuggestions() {
  if (suggestionBox) suggestionBox.style.display = 'none';
  currentSuggestions = [];
}

function insertSuggestion(suggestion, addSpace = false) {
  if (currentInput) {
    // Replace only the last word
    const value = currentInput.value;
    const lastWordMatch = value.match(/(.*?)(\b\w+)?$/);
    if (lastWordMatch) {
      const before = value.slice(0, lastWordMatch.index) || '';
      const words = value.split(/(\s+)/);
      // Find last word index
      let lastWordIdx = -1;
      for (let i = words.length - 1; i >= 0; i--) {
        if (words[i].trim().length > 0) {
          lastWordIdx = i;
          break;
        }
      }
      if (lastWordIdx !== -1) {
        words[lastWordIdx] = suggestion + (addSpace ? ' ' : '');
        currentInput.value = words.join('');
      } else {
        currentInput.value = suggestion + (addSpace ? ' ' : '');
      }
    } else {
      currentInput.value = suggestion + (addSpace ? ' ' : '');
    }
    hideSuggestions();
    currentInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

let debounceTimer = null;
let lastInputValue = '';

function isCursorAtEnd(input) {
  return input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
}

document.addEventListener('input', (event) => {
  if (!currentSettings.transliterationEnabled) {
    console.log('[InputTools] Transliteration not enabled');
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    console.log('[InputTools] Not a valid input/textarea');
    return;
  }
  if (!isCursorAtEnd(target)) {
    console.log('[InputTools] Cursor not at end');
    hideSuggestions();
    return;
  }
  const lang = currentSettings.language || 'ml';
  const value = target.value;
  const match = value.match(/(\b\w+)$/);
  const lastWord = match ? match[1] : '';
  console.log('[InputTools] Last word:', lastWord);
  if (!lastWord || /[^\p{L}\p{N}]/u.test(lastWord)) {
    console.log('[InputTools] Last word empty or punctuation');
    hideSuggestions();
    return;
  }
  if (lastWord === lastInputValue) {
    console.log('[InputTools] Last word unchanged');
    return;
  }
  lastInputValue = lastWord;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    console.log('[InputTools] Fetching suggestions for:', lastWord, 'in', lang);
    const suggestions = await fetchTransliteration(lastWord, lang);
    console.log('[InputTools] Suggestions:', suggestions);
    if (suggestions && suggestions.length > 0) {
      showSuggestions(target, suggestions);
    } else {
      hideSuggestions();
    }
  }, 200);
});

// Hide suggestions on blur
window.addEventListener('mousedown', (e) => {
  if (suggestionBox && !suggestionBox.contains(e.target)) {
    hideSuggestions();
  }
});

document.addEventListener('blur', (event) => {
  if (event.target === currentInput) {
    setTimeout(hideSuggestions, 100);
  }
}, true); 