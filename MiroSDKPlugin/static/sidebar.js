var widgets = []
var client_id = "3074457360917723621"
var circleCardVisible=true
var lineCardVisible=true
var cardType=['NoteSuggestion','LineSuggestion']
var socket = io();
var task_topic;

const wizardIds = ['3074457360917294320', '3074457360807760467']

var USER_IS_WIZARD;

miro.onReady(async () => {
    task_topic = await getTaskTopic()
    userId = await miro.currentUser.getId()
    USER_IS_WIZARD=wizardIds.includes(userId)
    var bar = document.getElementById('sidebar');
    var list = document.getElementById('list');
    if(USER_IS_WIZARD){
        let navigateToWizardPage=document.createElement('a')
        navigateToWizardPage.href='/wizardSidebar.html'
        navigateToWizardPage.innerHTML='Navigate to wizarding interface.'
        list.appendChild(navigateToWizardPage)

        let switches=document.getElementById('switchesDiv')
        switches.appendChild(createNoteSwitch())
        let noteSwitchText = document.createElement('p')
        noteSwitchText.setAttribute('class', 'switchtext')
        noteSwitchText.innerHTML='Hide Note Suggestions'
        switches.appendChild(noteSwitchText)
        switches.appendChild(document.createElement('br'))
        switches.appendChild(createLineSwitch())
        let lineSwitchText = document.createElement('p')
        lineSwitchText.setAttribute('class', 'switchtext')
        lineSwitchText.innerHTML='Hide Line Suggestions'
        switches.appendChild(lineSwitchText)

    }
    miro.addListener(miro.enums.event.WIDGETS_CREATED, addToSidebar)
    miro.addListener(miro.enums.event.WIDGETS_DELETED, removeFromSidebar)
    let widgets = await miro.board.widgets.get()
    let metadataWidgets = widgets.filter((widget) => Object.keys(widget.metadata).length !== 0)
    let dotWidgets = metadataWidgets.filter((widget) =>
        widget.metadata[client_id].type === 'NoteSuggestion'
    )
    createList(dotWidgets.sort(compare))
    let lineWidgets = metadataWidgets.filter((widget) =>
        widget.metadata[client_id].type === 'LineSuggestion'
    )
    createList(lineWidgets.sort(compare))
    let p=document.createElement('p')
    if (lineWidgets.length+dotWidgets.length==0){
        p.innerHTML='No search suggestions yet!'
    }else{
        // p.innerHTML='Click the text in a card to navigate to its corresponding note.'
        // p.style.fontStyle='italic'
    }
    p.setAttribute('class','textDesc')
    bar.appendChild(p)
})

async function getTaskTopic(){
    let taskWidget = await miro.board.widgets.get({metadata: {[client_id]: {type: 'Topic'}}})
    console.log(taskWidget[0].plainText.substring(12))
    return taskWidget[0].plainText.substring(12)
}

function createNoteSwitch(){
    let noteSwitch = document.createElement('label')
    noteSwitch.setAttribute('class', 'switch')
    let checkLabel = document.createElement('input')
    checkLabel.setAttribute('type', 'checkbox')
    checkLabel.addEventListener('click', changeCircleSuggestionVisibility)
    let span = document.createElement('span')
    span.setAttribute('class', 'slider round')
    noteSwitch.appendChild(checkLabel)
    noteSwitch.appendChild(span)
    return noteSwitch
}

function createLineSwitch(){
    let lineSwitch = document.createElement('label')
    lineSwitch.setAttribute('class', 'switch')
    let checkLabel = document.createElement('input')
    checkLabel.setAttribute('type', 'checkbox')
    checkLabel.addEventListener('click', changeLineSuggestionVisibility)
    let span = document.createElement('span')
    span.setAttribute('class', 'slider round')
    lineSwitch.appendChild(checkLabel)
    lineSwitch.appendChild(span)
    return lineSwitch
}

async function addToSidebar(event){
    console.log(event)
    if(Object.keys(event.data[0])==0){
        return
    }else if (cardType.includes(event.data[0].metadata[client_id].type)) {
        let widget=await miro.board.widgets.get({id: event.data[0].id})
        addToList(widget[0])
    }
}

async function removeFromSidebar(event){
    console.log(event)
    if(Object.keys(event.data[0])==0){
        return
    }else {
        removeFromList(event.data[0].id)
    }
}

function compare( a, b ) {
    if ( a.id < b.id ){
      return -1;
    }
    if ( a.id > b.id ){
      return 1;
    }
    return 0;
}

function changeCircleSuggestionVisibility(){
    let circleItems=document.getElementsByClassName('circleItem')
    
    if(circleItems[0].style.display == 'none'){
        
        //miro.showNotification(circleItems[0].getAttribute('display').toString());
        //circleItems[0].style.display = 'block';
        [...circleItems].forEach((item)=> item.style.display = 'block')
        circleCardVisible=true
    }else{
        //circleItems[0].style.display = 'none'
        [...circleItems].forEach((item)=> item.style.display = 'none')
        circleCardVisible=false
    }
}

function changeLineSuggestionVisibility(){
    let lineItems=document.getElementsByClassName('lineItem')
    
    if(lineItems[0].style.display == 'none'){
        
        //miro.showNotification(circleItems[0].getAttribute('display').toString());
        //circleItems[0].style.display = 'block';
        [...lineItems].forEach((item)=> item.style.display = 'block')
        lineCardVisible=true
    }else{
        //circleItems[0].style.display = 'none'
        [...lineItems].forEach((item)=> item.style.display = 'none')
        lineCardVisible=false
    }
}

function createList(widgets) {
    widgets.forEach((widget) => addToList(widget))
}

function printEventData(event) {
    widgetTextElement.value = JSON.stringify(event.data)
}

function addMouseoverEvent() {
    widgetTextElement.addEventListener("mouseover", async function (event) {
        widgets = await miro.board.widgets.create({
            type: 'STICKER',
            text: 'Hello from mouseover!'
        })
    }, false);
}

function addMouseoutEvent() {
    widgetTextElement.addEventListener("mouseout", async function (event) {
        await miro.board.widgets.deleteById(widgets[widgets.length - 1].id)

    }, false);
}


function addToList(widget) {
    var listItem = createlistItemElement(widget)
    var icon = createIconElement(widget.metadata[client_id].type)
    var card = createCardElement(widget.metadata[client_id].text, widget.metadata[client_id].type)
    var list = document.getElementById('list');
    listItem.setAttribute('id', widget.id)
    list.appendChild(listItem);
    listItem.appendChild(icon)
    listItem.appendChild(card)
}

function removeFromList(widgetId){
    let card=document.getElementById(widgetId)
    if(card===null){return}
    card.remove()
}

function createlistItemElement(widget) {
    let listItem = document.createElement('li');
   
    if(widget.metadata[client_id].type==='NoteSuggestion'){
        listItem.setAttribute('class', 'circleItem')
        if(circleCardVisible){
            listItem.style.display='block'
        }else{
            listItem.style.display='none'
        }
    }else if (widget.metadata[client_id].type==='LineSuggestion'){
        listItem.setAttribute('class', 'lineItem')
        if(lineCardVisible){
            listItem.style.display='block'
        }else{
            listItem.style.display='none'
        }
    }
    return listItem
}

function createIconElement(widgetType) {
    let icon = document.createElement('div')

    icon.setAttribute('class', 'iconDiv')
    if (widgetType === 'NoteSuggestion') {
        let text = document.createElement('p')
        text.setAttribute('class', 'iconDot')
        text.innerHTML = '&#x2022'
        icon.appendChild(text)
    } else if (widgetType === 'LineSuggestion') {
        let text = document.createElement('p')
        text.setAttribute('class', 'iconLine')
        text.innerHTML = '&#9135'
        icon.appendChild(text)
    }
    return icon
}

function createCardElement(widgetText, widgetType) {
    let card = document.createElement('div')
    card.setAttribute('class', 'card')
    let textDiv = document.createElement('div')
    textDiv.setAttribute('class','textDiv')
    widgetText.forEach((widget)=>{
        let query = document.createElement('div')
        query.setAttribute('class', 'queryRow')
        let queryBtn = createSearchElement()
        let text = createTextElement(widget)
        query.appendChild(queryBtn)
        query.appendChild(text)
        textDiv.appendChild(query)
    })
    cardRect=card.getBoundingClientRect()
    let reject = createRejectElement()
    reject.style.right=(cardRect.right)+'px';
    reject.style.top=(cardRect.top)+'px';
    card.appendChild(reject)
    card.appendChild(textDiv)
    return card
}

function createButtonDiv(widgetType) {
    let search = createSearchElement()
    let reject = createRejectElement()
    let div = document.createElement('div')
    div.setAttribute('class', 'buttons')
    div.appendChild(search)
    // if (widgetType === 'LineSuggestion') {
    //     let accept = createAcceptElement()
    //     div.appendChild(accept)
    // }
    div.appendChild(reject)
    return div
}

function createAcceptElement() {
    let accept = document.createElement('button')
    accept.setAttribute('class', 'accept')
    accept.innerHTML = '&#10003'
    accept.addEventListener('click', async function (e) {
        let widgetid = this.parentNode.parentNode.parentNode.getAttribute('id')
        let line = await miro.board.widgets.get({ id: widgetid })
        miro.board.widgets.create({
            type: 'LINE',
            startWidgetId: line[0].startWidgetId,
            endWidgetId: line[0].endWidgetId,
            capabilities: {
                editable: false
            },
            clientVisible: true,
            style: {
                lineColor: '#000000',
                lineEndStyle: miro.enums.lineArrowheadStyle.NONE,
                lineStartStyle: miro.enums.lineArrowheadStyle.NONE,
                lineStyle: miro.enums.lineStyle.SOLID,
                lineThickness: 1,
                lineType: miro.enums.lineType.ARROW,
            }
        })
        await miro.board.widgets.deleteById(widgetid)
        document.getElementById(widgetid).remove()
    })

    return accept
}

function createSearchElement() {
    let search = document.createElement('button')
    search.setAttribute('class', 'search')
    search.innerHTML = '🔎︎'
    search.addEventListener('click', async function (e) {
        let cardText = this.parentNode.childNodes[1].innerHTML
        let text = cardText + " " + task_topic
        let wordsQuery = text.split(' ')
        let url = 'https://www.google.com/search?q=' + wordsQuery[0]
        wordsQuery = wordsQuery.map(x => '+' + x)
        for (let i = 1; i < wordsQuery.length; i++) {
            url = url + wordsQuery[i]
        }
        window.open(url, '_blank').focus()
    })
    return search
}

function createRejectElement() {
    let reject = document.createElement('button')
    reject.setAttribute('class', 'reject')
    reject.innerHTML = '✖'
    reject.addEventListener('mouseover', function(e){
        this.style.backgroundColor='#D3D3D3'
    })
    reject.addEventListener('mouseout', function(e){
        this.style.backgroundColor='#FFFFFF'
    })
    reject.addEventListener('click', async function (e) {
        let widgetid = this.parentNode.parentNode.getAttribute('id')
        let widget = await miro.board.widgets.get({id: widgetid})
        if(widget[0].metadata[client_id].type=='LineSuggestion'){
            await miro.board.widgets.deleteById(widget[0].metadata[client_id].parentId)
        }
        await miro.board.widgets.deleteById(widgetid)
        document.getElementById(widgetid).remove()
    })
    return reject

}

function createTextElement(widgetText) {
    let text = document.createElement('p')
    text.setAttribute('class', 'text')
    text.innerHTML = widgetText;

    if(USER_IS_WIZARD){
        text.addEventListener('mouseover', function(e){
            this.style.backgroundColor='#D3D3D3'
        })
        text.addEventListener('mouseout', function(e){
            this.style.backgroundColor='#FFFFFF'
        })
        text.addEventListener('click', async function (e) {
            let widgetid = this.parentNode.parentNode.parentNode.parentNode.getAttribute('id')
            let widget=await miro.board.widgets.get({id: widgetid})
            miro.board.viewport.zoomToObject(widget[0].metadata[client_id].parentId)
        })
    }


    return text
}


function searchSuggestion() {
    miro.showNotification('search button clicked!')
}

function rejectSuggestion(test) {
    miro.showNotification('reject button clicked!')
}

