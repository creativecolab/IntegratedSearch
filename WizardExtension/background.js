chrome.runtime.onInstalled.addListener(async () => {
  chrome.storage.local.set({'pluginInstalled': false });
  let currWindow = await chrome.windows.getCurrent()
  let queryTab = await chrome.tabs.create({
    url: 'https://0d1c-47-156-139-9.ngrok.io/wizardPhrases.html'
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
});