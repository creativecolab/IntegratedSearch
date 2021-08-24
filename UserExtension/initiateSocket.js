var socket = io('https://0d1c-47-156-139-9.ngrok.io')
let currTab = window.location.href
let query = currTab.match(/^https?\:\/\/www\.google\.com\/search\?q\=[^\&]+\&/)
if(query==null){
    sendURLtoServer(currTab)
}else{
    let apicallquery = query[0] + 'num=100'
    sendQuerytoServer(apicallquery)
}

function sendQuerytoServer(url) {

    socket.emit('query', {
        url: url
    })
}

function sendURLtoServer(url) {
    console.log('Sent to server!')
    socket.emit('url', {
        url: url
    })
}

function testConnection() {
    socket.on('connect', function (data) {
        console.log('connected to socket');
    });
}