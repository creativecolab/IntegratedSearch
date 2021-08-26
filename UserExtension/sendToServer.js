var socket = io('https://0d1c-47-156-139-9.ngrok.io')
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (/^https?\:\/\/www\.google\.com\/search\?q\=[^\&]+/.test(request.url)){
            socket.emit('query', request)
        }else{
            socket.emit('url', request)
        }
        return true
    }
)