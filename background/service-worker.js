// Background service worker for JobDock
chrome.runtime.onInstalled.addListener(() => {
  console.log("JobDock Extension Installed.");
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
