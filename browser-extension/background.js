// Healer Browser Extension - Background Service Worker

// Configuration
const HEALER_API_BASE_URL = 'http://localhost:5173'; // Change to your Healer instance URL

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Healer extension installed');

  // Create context menu items
  createContextMenus();

  // Set default settings
  chrome.storage.sync.get(['apiUrl'], (result) => {
    if (!result.apiUrl) {
      chrome.storage.sync.set({ apiUrl: HEALER_API_BASE_URL });
    }
  });
});

// Create context menu items
function createContextMenus() {
  // Save current page
  chrome.contextMenus.create({
    id: 'save-page',
    title: 'Save to Healer',
    contexts: ['page']
  });

  // Save link
  chrome.contextMenus.create({
    id: 'save-link',
    title: 'Save link to Healer',
    contexts: ['link']
  });

  // Save selection with link
  chrome.contextMenus.create({
    id: 'save-selection',
    title: 'Save "%s" to Healer',
    contexts: ['selection']
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'save-page':
      saveBookmark({
        url: tab.url,
        title: tab.title,
        description: ''
      });
      break;

    case 'save-link':
      saveBookmark({
        url: info.linkUrl,
        title: info.linkUrl,
        description: ''
      });
      break;

    case 'save-selection':
      saveBookmark({
        url: tab.url,
        title: tab.title,
        description: info.selectionText
      });
      break;
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'save-bookmark') {
    // Get current tab and save it
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        saveBookmark({
          url: tabs[0].url,
          title: tabs[0].title,
          description: ''
        });
      }
    });
  }
});

// Save bookmark to Healer
async function saveBookmark(bookmarkData) {
  try {
    // Get API URL from storage
    const { apiUrl } = await chrome.storage.sync.get(['apiUrl']);
    const baseUrl = apiUrl || HEALER_API_BASE_URL;

    // Get auth token from storage (user needs to set this in popup)
    const { authToken } = await chrome.storage.sync.get(['authToken']);

    if (!authToken) {
      console.error('No auth token found. Please login in the extension popup.');
      showNotification('Error', 'Please login in the extension popup first');
      return;
    }

    // Send bookmark to Healer API
    const response = await fetch(`${baseUrl}/api/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_session=${authToken}` // Adjust based on your auth method
      },
      credentials: 'include',
      body: JSON.stringify({
        url: bookmarkData.url,
        title: bookmarkData.title,
        description: bookmarkData.description,
        tags: []
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Bookmark saved:', result);
      showNotification('Success', `Saved: ${bookmarkData.title}`);
    } else {
      const error = await response.text();
      console.error('Failed to save bookmark:', error);
      showNotification('Error', 'Failed to save bookmark. Check console for details.');
    }
  } catch (error) {
    console.error('Error saving bookmark:', error);
    showNotification('Error', `Failed to save: ${error.message}`);
  }
}

// Show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: `Healer - ${title}`,
    message: message,
    priority: 1
  });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveBookmark') {
    saveBookmark(request.data)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  if (request.action === 'testConnection') {
    testConnection()
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Test connection to Healer API
async function testConnection() {
  try {
    const { apiUrl } = await chrome.storage.sync.get(['apiUrl']);
    const baseUrl = apiUrl || HEALER_API_BASE_URL;

    const response = await fetch(`${baseUrl}/api/health`);

    if (response.ok) {
      return { success: true, message: 'Connected to Healer' };
    } else {
      return { success: false, message: 'Failed to connect to Healer' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}
