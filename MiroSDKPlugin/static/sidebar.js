var widgets = []
var client_id = "3074457360917723621"

miro.onReady(async () => {

    let widgets = await miro.board.widgets.get()
    let metadataWidgets = widgets.filter((widget) => Object.keys(widget.metadata).length !== 0)
    let dotWidgets = metadataWidgets.filter((widget) =>
        widget.metadata[client_id].type === 'DotSuggestion'
    )
    createList(dotWidgets.sort(compare))
    let lineWidgets = metadataWidgets.filter((widget) =>
        widget.metadata[client_id].type === 'LineSuggestion'
    )
    createList(lineWidgets.sort(compare))
    //miro.addListener(miro.enums.event.SELECTION_UPDATED, addToList)
})

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
    }else{
        //circleItems[0].style.display = 'none'
        [...circleItems].forEach((item)=> item.style.display = 'none')
    }
}

function changeLineSuggestionVisibility(){
    let lineItems=document.getElementsByClassName('lineItem')
    
    if(lineItems[0].style.display == 'none'){
        
        //miro.showNotification(circleItems[0].getAttribute('display').toString());
        //circleItems[0].style.display = 'block';
        [...lineItems].forEach((item)=> item.style.display = 'block')
    }else{
        //circleItems[0].style.display = 'none'
        [...lineItems].forEach((item)=> item.style.display = 'none')
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


function createlistItemElement(widget) {
    let listItem = document.createElement('li');
    if(widget.metadata[client_id].type==='DotSuggestion'){
        listItem.setAttribute('class', 'circleItem')
        listItem.setAttribute('display', 'block')
    }else if (widget.metadata[client_id].type==='LineSuggestion'){
        listItem.setAttribute('class', 'lineItem')
    }
    return listItem
}

function createIconElement(widgetType) {
    let icon = document.createElement('div')

    icon.setAttribute('class', 'iconDiv')
    if (widgetType === 'DotSuggestion') {
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

    let text = createTextElement(widgetText)
    let buttons = createButtonDiv(widgetType)
    card.appendChild(text)
    card.appendChild(buttons)
    return card
}

function createButtonDiv(widgetType) {
    let search = createSearchElement()
    let reject = createRejectElement()
    let div = document.createElement('div')
    div.setAttribute('class', 'buttons')
    div.appendChild(search)
    if (widgetType === 'LineSuggestion') {
        let accept = createAcceptElement()
        div.appendChild(accept)
    }
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
    search.innerHTML = '&#128269'
    search.addEventListener('click', async function (e) {
        let cardText = this.parentNode.parentNode.firstChild.innerHTML
        let wordsQuery = cardText.split(' ')
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
    reject.innerHTML = '&#10007'
    reject.addEventListener('click', async function (e) {
        let widgetid = this.parentNode.parentNode.parentNode.getAttribute('id')
        await miro.board.widgets.deleteById(widgetid)
        document.getElementById(widgetid).remove()
    })
    return reject

}

function createTextElement(widgetText) {
    let text = document.createElement('p')
    text.setAttribute('class', 'text')
    text.innerHTML = widgetText;
    text.addEventListener('click', async function (e) {
        let widgetid = this.parentNode.parentNode.getAttribute('id')
        miro.board.viewport.zoomToObject(widgetid)
    })
    return text
}

function searchSuggestion() {
    miro.showNotification('search button clicked!')
}

function rejectSuggestion(test) {
    miro.showNotification('reject button clicked!')
}

// Get HTML elements for tip and text container
const tipElement = document.getElementById('tip')
const widgetTextElement = document.getElementById('widget-text')

async function getWidget() {
    // Get selected widgets
    let widgets = await miro.board.selection.get()

    // Get first widget from selected widgets
    let text = widgets[0].text

    // Check that the widget has text field
    if (typeof text === 'string') {
        // Hide tip and show text in sidebar
        tipElement.style.opacity = '0'
        widgetTextElement.value = text
    } else {
        // Show tip and clear text in sidebar
        tipElement.style.opacity = '1'
        widgetTextElement.value = ''
    }
}