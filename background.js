var installedPlugin=false
chrome.runtime.onInstalled.addListener(async () => {
  let currWindow=await chrome.windows.getCurrent()
  let queryTab=await chrome.tabs.create({
    url: 'https://www.google.com'
  } )
  let authWindow=await chrome.windows.create({
    type: 'popup',
    state: 'maximized',
    url: 'https://miro.com/welcome/WldJOVVXQVowM000ZVJQMGVhU0x0SlM3Z0FVRE5HS3c3SzRwNHN5RkFKZ3VMMXRTNDNmaTVHMzJFaVFWSEhZa3wzMDc0NDU3MzYwOTE3Mjk0MzIw'
  });
  let miroTab=await chrome.tabs.query({
    currentWindow: true
  })
  let maxWidth=authWindow.width
  let maxHeight=authWindow.height
  let properLeft=authWindow.left
  let properTop=authWindow.top
  let updatedAuthWindow=await chrome.windows.update(authWindow.id, {
    state: 'normal',
    width: maxWidth/2+16,
    height: maxHeight,
    left: properLeft+maxWidth/2-16,
    top: properTop
  })
  let updatedCurrWindow=await chrome.windows.update(currWindow.id, {
    state:'normal',
    width: maxWidth/2,
    height: maxHeight,
    left: properLeft,
    top: properTop
  })
});



chrome.tabs.onUpdated.addListener(installPlugin)

async function installPlugin(tabId, changeInfo, tab){
  console.log(installedPlugin)
  if(!installedPlugin && changeInfo.url=='https://miro.com/app/dashboard/'){
    installedPlugin=true
    await chrome.tabs.update(tabId, {
      url: 'https://miro.com/oauth/authorize/?response_type=code&client_id=3074457360917723621&redirect_uri=%2Fconfirm-app-install%2F'
    })
  }
}
