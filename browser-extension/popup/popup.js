// Healer Browser Extension - Popup Script

// DOM Elements
const elements = {
  connectionStatus: document.getElementById('connectionStatus'),
  statusIcon: document.getElementById('statusIcon'),
  statusText: document.getElementById('statusText'),
  loginSection: document.getElementById('loginSection'),
  saveForm: document.getElementById('saveForm'),
  bookmarkForm: document.getElementById('bookmarkForm'),
  urlInput: document.getElementById('url'),
  titleInput: document.getElementById('title'),
  descriptionInput: document.getElementById('description'),
  tagsInput: document.getElementById('tags'),
  saveBtn: document.getElementById('saveBtn'),
  openInHealer: document.getElementById('openInHealer'),
  message: document.getElementById('message'),
  settingsToggle: document.getElementById('settingsToggle'),
  settingsPanel: document.getElementById('settingsPanel'),
  settingsApiUrl: document.getElementById('settingsApiUrl'),
  saveSettings: document.getElementById('saveSettings'),
  testConnection: document.getElementById('testConnection'),
  openHealer: document.getElementById('openHealer'),
  clearData: document.getElementById('clearData')
};

// Initialize popup
async function init() {
  // Load settings
  const settings = await loadSettings();

  // Get current tab info
  const tab = await getCurrentTab();

  if (tab) {
    elements.urlInput.value = tab.url;
    elements.titleInput.value = tab.title;
  }

  // Check connection
  await checkConnection();

  // Setup event listeners
  setupEventListeners();
}

// Get current active tab
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.sync.get(['apiUrl', 'authToken']);
  if (result.apiUrl) {
    elements.settingsApiUrl.value = result.apiUrl;
  }
  return result;
}

// Check connection to Healer
async function checkConnection() {
  elements.connectionStatus.classList.remove('hidden');
  elements.statusText.textContent = 'Checking connection...';

  try {
    const response = await chrome.runtime.sendMessage({ action: 'testConnection' });

    if (response.success) {
      showStatus('connected', 'Connected to Healer');
    } else {
      showStatus('error', 'Not connected to Healer');
      elements.loginSection.classList.remove('hidden');
      elements.saveForm.classList.add('hidden');
    }
  } catch (error) {
    showStatus('error', 'Connection failed');
    elements.loginSection.classList.remove('hidden');
    elements.saveForm.classList.add('hidden');
  }
}

// Show connection status
function showStatus(type, message) {
  elements.connectionStatus.classList.remove('connected', 'error');
  if (type !== 'checking') {
    elements.connectionStatus.classList.add(type);
  }
  elements.statusText.textContent = message;
}

// Setup event listeners
function setupEventListeners() {
  // Bookmark form submit
  elements.bookmarkForm.addEventListener('submit', handleSaveBookmark);

  // Open in Healer
  elements.openInHealer.addEventListener('click', handleOpenInHealer);

  // Settings toggle
  elements.settingsToggle.addEventListener('click', () => {
    elements.settingsPanel.classList.toggle('hidden');
  });

  // Save settings
  elements.saveSettings.addEventListener('click', handleSaveSettings);

  // Test connection
  elements.testConnection.addEventListener('click', checkConnection);

  // Open Healer
  elements.openHealer.addEventListener('click', handleOpenHealer);

  // Clear data
  elements.clearData.addEventListener('click', handleClearData);
}

// Handle save bookmark
async function handleSaveBookmark(e) {
  e.preventDefault();

  const formData = {
    url: elements.urlInput.value,
    title: elements.titleInput.value,
    description: elements.descriptionInput.value,
    tags: elements.tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
  };

  // Disable button and show loading
  elements.saveBtn.disabled = true;
  elements.saveBtn.classList.add('loading');
  elements.saveBtn.textContent = 'Saving';

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'saveBookmark',
      data: formData
    });

    if (response.success) {
      showMessage('success', 'Bookmark saved successfully!');
      // Reset form after 1.5s
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      showMessage('error', `Failed to save: ${response.error}`);
    }
  } catch (error) {
    showMessage('error', `Error: ${error.message}`);
  } finally {
    elements.saveBtn.disabled = false;
    elements.saveBtn.classList.remove('loading');
    elements.saveBtn.textContent = 'Save Bookmark';
  }
}

// Handle open in Healer
async function handleOpenInHealer() {
  const settings = await loadSettings();
  const apiUrl = settings.apiUrl || 'http://localhost:5173';
  chrome.tabs.create({ url: apiUrl });
}

// Handle save settings
async function handleSaveSettings() {
  const apiUrl = elements.settingsApiUrl.value;

  await chrome.storage.sync.set({ apiUrl });

  showMessage('success', 'Settings saved!');

  // Re-check connection
  setTimeout(() => {
    checkConnection();
  }, 500);
}

// Handle clear data
async function handleClearData() {
  if (confirm('Are you sure you want to clear all extension data?')) {
    await chrome.storage.sync.clear();
    showMessage('success', 'Data cleared!');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

// Show message
function showMessage(type, text) {
  elements.message.className = `message ${type}`;
  elements.message.textContent = text;
  elements.message.classList.remove('hidden');

  // Hide after 5s
  setTimeout(() => {
    elements.message.classList.add('hidden');
  }, 5000);
}

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', init);
