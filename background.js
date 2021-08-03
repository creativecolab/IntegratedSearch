
chrome.runtime.onInstalled.addListener(async () => {
  let currwindow=await chrome.windows.getCurrent()
  let authwindow=await chrome.windows.create({
    type: 'popup',
    state: 'maximized',
    url: 'https://miro.com/oauth/authorize/?response_type=code&client_id=3074457360917723621&redirect_uri=%2Fconfirm-app-install%2F'
  });
  let maxWidth=authwindow.width
  let maxHeight=authwindow.height
  console.log(maxWidth + ' ' + maxHeight)
  let properLeft=authwindow.left
  let properTop=authwindow.top
  let updatedAuthWindow=await chrome.windows.update(authwindow.id, {
    state: 'normal',
    width: maxWidth/2+16,
    height: maxHeight,
    left: properLeft+maxWidth/2-16,
    top: properTop
  })
  let updatedCurrWindow=await chrome.windows.update(currwindow.id, {
    state:'normal',
    width: maxWidth/2,
    height: maxHeight,
    left: properLeft,
    top: properTop
  })
});