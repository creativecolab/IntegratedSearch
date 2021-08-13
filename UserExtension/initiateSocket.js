async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

var socket = io()
let currTab= getCurrentTab()
socket.emit('test', {
    type: 'Extension',
    url: currTab.url
})

socket.on('json', (data)=>{
    console.log('Received socket response!')
})