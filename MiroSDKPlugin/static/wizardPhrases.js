var client_id = "3074457360917723621"
const wizardIds = ['3074457360917294320', '3074457360807760467']
var socket = io();

socket.on('connect', ()=> {
    //socket.emit('connectToRoom', {board_id: 'wizard'})
})

function connectToWizardRoom(){
    let room = 'wizard' + document.getElementById('boardId').value
    socket.emit('connectToRoom', {board_id: room}, function(response){
        let connectionText = document.getElementById('connectionText')
        connectionText.innerText=response
    });
}

function changeQueryDiv(queryText){
    let queryElement = document.getElementById('queryText')
    queryElement.innerHTML=''
    queryElement.appendChild(document.createTextNode('Most Recent Query: '+ queryText))
}

socket.on('json', async (data) => {
    let type = data['type']
    let nplist = data['np']
    if(nplist!=null && Object.keys(nplist).length === 0){
        return
    }
    let url = data['url']
    let node, textnode;
    

    switch (type) {
        case 'suggestions':
            changeQueryDiv(data['query'])

            var peoplealsoaskedList = document.getElementById('peoplealsoasked')
            var relatedsearcheslist = document.getElementById('relatedsearches')
            var autocompleteList = document.getElementById('autocomplete')
            peoplealsoaskedList.innerHTML=''
            relatedsearcheslist.innerHTML=''
            autocompleteList.innerHTML = ''
            for (let query of data['commquestions']) {
                node = document.createElement("li");
                textnode = document.createTextNode(query);
                node.appendChild(textnode);
                peoplealsoaskedList.appendChild(node);
            }
            for (let query of data['relsearches']) {
                node = document.createElement("li");
                textnode = document.createTextNode(query);
                node.appendChild(textnode);
                relatedsearcheslist.appendChild(node);
            }
            for (let query of data['autocomplete']){
                node = document.createElement("li");
                textnode = document.createTextNode(query.slice(1, -1));
                node.appendChild(textnode);
                autocompleteList.appendChild(node);
            }
            break;
        case 'snippets':
            changeQueryDiv(data['query'])

            var snippetsList = document.getElementById('snippets')
            snippetsList.innerHTML=''
            for (var i = 0; i < 10; i++) {
                let np = Object.keys(nplist)[i]
                if(nplist[np]==null){return}
                node = document.createElement("LI");
                textnode = document.createTextNode(np);
                node.appendChild(textnode);
                snippetsList.appendChild(node);
            }
            break;
        case 'articles':
            var articlesList = document.getElementById('articles')
            articlesList.innerHTML=''
            for (var i = 0; i < 10; i++) {
                let np = Object.keys(nplist)[i]
                if(nplist[np]==null){return}
                node = document.createElement("LI");
                textnode = document.createTextNode(np);
                node.appendChild(textnode);
                articlesList.appendChild(node);
            }
            break;
        case 'miro':
            var miroList = document.getElementById('miro')
            miroList.innerHTML=''
            for (var i = 0; i < 10; i++) {
                let np = Object.keys(nplist)[i]
                if(nplist[np]==null){return}
                node = document.createElement("LI");
                textnode = document.createTextNode(np);
                node.appendChild(textnode);
                miroList.appendChild(node);
            }
            break;
        default: 
            break;

    }

})