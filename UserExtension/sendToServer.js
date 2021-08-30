var socket = io('https://90d2-47-156-139-9.ngrok.io')

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if ('reload' in request) {
            location.reload()
            return;
        }
        if (/^https?\:\/\/www\.google\.com\/search\?q\=[^\&]+/.test(request.url)) {
            console.log(request.url.match(/^https?\:\/\/www\.google\.com\/search\?q\=[^\&]+/))
            if (request.url.match(/^https?\:\/\/www\.google\.com\/search\?q\=[^\&]+/)[0] == request.url) {
                
                socket.emit('getIssuedSuggestion', request)
            }
            socket.emit('query', request)
        } else {
            socket.emit('url', request)
        }
        return true
    }
)
