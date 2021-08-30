chrome.action.onClicked.addListener(async (tab) => {
  await splitScreen()
})

chrome.runtime.onInstalled.addListener(async () => {
  await splitScreen()
});

async function splitScreen() {
  chrome.storage.sync.set({ 'pluginInstalled': false });
  chrome.storage.sync.set({ 'onMiroBoard': '' });
  chrome.storage.sync.set({ 'MiroBoardId': '' });
  let currWindow = await chrome.windows.getCurrent()
  let queryTab = await chrome.tabs.create({
    url: 'https://www.google.com'
  })
  let authWindow = await chrome.windows.create({
    type: 'popup',
    state: 'maximized',
    url: 'https://miro.com/welcome/WldJOVVXQVowM000ZVJQMGVhU0x0SlM3Z0FVRE5HS3c3SzRwNHN5RkFKZ3VMMXRTNDNmaTVHMzJFaVFWSEhZa3wzMDc0NDU3MzYwOTE3Mjk0MzIw'
  });
  let maxWidth = authWindow.width
  let maxHeight = authWindow.height
  let properLeft = authWindow.left
  let properTop = authWindow.top
  await chrome.windows.update(authWindow.id, {
    state: 'normal',
    width: parseInt(maxWidth / 2 + 16),
    height: maxHeight,
    left: parseInt(properLeft + maxWidth / 2 - 16),
    top: properTop
  })
  await chrome.windows.update(currWindow.id, {
    state: 'normal',
    width: parseInt(maxWidth / 2),
    height: maxHeight,
    left: properLeft,
    top: properTop
  })
}

chrome.tabs.onUpdated.addListener(checkTab)
chrome.tabs.onRemoved.addListener(checkRemoved)

async function checkTab(tabId, changeInfo, tab) {

  if (changeInfo.url == null || changeInfo.url == 'chrome://newtab') return;

  chrome.storage.sync.get(['onMiroBoard'], async function (result) {
    console.log(result.onMiroBoard)
    if (result.onMiroBoard == tabId) {
      if (! /^https?\:\/\/miro\.com\/app\/board\/.+\=\//.test(changeInfo.url)) {
        chrome.storage.sync.set({ 'onMiroBoard': '' });
        chrome.storage.sync.set({ 'MiroBoardId': '' });
      }
    } else if (result.onMiroBoard != '') {
      //sendURLtoServer(tabId)
      chrome.storage.sync.get(['MiroBoardId'], async function (result) {
        sendMessage(tabId, changeInfo.url, result.MiroBoardId)
      })
      return
    }
  })
  console.log(changeInfo.url)

  if (changeInfo.url == 'https://miro.com/app/dashboard/') {
    chrome.storage.sync.set({ 'reachedMiroBoard': false });
    chrome.storage.sync.get(['pluginInstalled'], async function (result) {
      if (!result.pluginInstalled) {
        await installPlugin(tabId, changeInfo, tab)
      }
    })

  } else if (/^https?\:\/\/miro\.com\/app\/board\/.+\=\//.test(changeInfo.url)) {

    chrome.storage.sync.set({ 'onMiroBoard': tabId });
    chrome.storage.sync.set({ 'MiroBoardId': changeInfo.url.substring(27, 39) });
    chrome.storage.sync.get(['reachedMiroBoard'], async function (result) {
      console.log(result.reachedMiroBoard)
      if (!result.reachedMiroBoard) {
        chrome.storage.sync.set({ 'reachedMiroBoard': true });
        chrome.tabs.sendMessage(tabId, {
          reload: true
        })
      }
    })
  }
}

async function checkRemoved(tabId, removeInfo) {
  chrome.storage.sync.get(['onMiroBoard'], async function (result) {
    if (result['onMiroBoard'] == tabId) {
      chrome.storage.sync.set({ 'onMiroBoard': '' });
      chrome.storage.sync.set({ 'MiroBoardId': '' });
    }
  })
}


async function installPlugin(tabId, changeInfo, tab) {
  chrome.storage.sync.set({ 'pluginInstalled': true })
  await chrome.tabs.update(tabId, {
    url: 'https://miro.com/oauth/authorize/?response_type=code&client_id=3074457360917723621&redirect_uri=%2Fconfirm-app-install%2F'
  })
}


async function sendURLtoServer(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['socket.io.min.js']
  });

  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['initiateSocket.js']
  });
}

function sendMessage(tabId, url, boardId) {
  chrome.tabs.sendMessage(tabId, {
    url: url,
    boardId: boardId,

  }, (response) => {
    if (chrome.runtime.lastError.message == 'Could not establish connection. Receiving end does not exist.') {
      console.log(chrome.runtime.lastError)
      setTimeout(sendMessage, 1000, tabId, url, boardId);
    } else {
      console.log(chrome.runtime.lastError)
    }
  });
}