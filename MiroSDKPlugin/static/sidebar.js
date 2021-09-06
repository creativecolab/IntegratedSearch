var widgets = []
var client_id = "3074457360917723621"
var circleCardVisible = true
var lineCardVisible = true
var cardType = ['NoteSuggestion', 'LineSuggestion']
var socket = io();
var topic_task;
var board_id;

const wizardIds = ['3074457360917294320', '3074457360807760467']

var USER_IS_WIZARD;

miro.onReady(async () => {

    userId = await miro.currentUser.getId()
    USER_IS_WIZARD = wizardIds.includes(userId)
    if (USER_IS_WIZARD) {
        // let switches = document.getElementById('switchesDiv')
        // switches.remove()
        let list = document.getElementById('noteSuggestionsList');
        let switches = document.getElementById('switchesDiv')

        // let navigateToWizardPage = document.createElement('a')
        // navigateToWizardPage.href = '/wizardSidebar.html'
        // navigateToWizardPage.innerHTML = 'Navigate to wizarding interface.'
        // list.appendChild(navigateToWizardPage)

        switches.appendChild(createNoteSwitch())
        let noteSwitchText = document.createElement('p')
        noteSwitchText.setAttribute('class', 'switchtext')
        noteSwitchText.innerHTML = 'Hide Note Suggestions'
        switches.appendChild(noteSwitchText)
        switches.appendChild(document.createElement('br'))
        switches.appendChild(createLineSwitch())
        let lineSwitchText = document.createElement('p')
        lineSwitchText.setAttribute('class', 'switchtext')
        lineSwitchText.innerHTML = 'Hide Line Suggestions'
        switches.appendChild(lineSwitchText)
    }
    topic_task = await getTaskTopic()

    let board = await miro.board.info.get()
    board_id = board.id

    updateSidebar()

    miro.addListener(miro.enums.event.WIDGETS_CREATED, addToSidebar)
    //miro.addListener(miro.enums.event.WIDGETS_DELETED, removeFromSidebar)

    socket.emit('connectToRoom', { board_id: board_id })

    // socket.on('updateCnt', (json) => {
    //     console.log('test')
    //     let listItem = document.getElementById(json.suggestion_id)
    //     console.log(listItem)
    //     if (listItem == null) return;
    //     if (json.type == 'remove') {
    //         listItem.remove()
    //     } else if (json.type == 'subtract') {
    //         listItem.children[1].style.backgroundColor = '#D3D3D3'
    //     }
    // })

    socket.on('removeSuggestion', (json)=>{
        let suggestionListItem = document.getElementById(json['sugg_DbId'])
        suggestionListItem.remove()
    })

    socket.on('queriedSuggestion', (json)=>{
        console.log(json)
        let suggestionListItem = document.getElementById(json['sugg_DbId'])

        let suggestionCard = suggestionListItem.children[1]
        
        suggestionCard.style.backgroundColor = '#D3D3D3'
    })


})

async function updateSidebar() {

    let response = await fetch('/suggestions?boardId=' + board_id)
    let suggestions = await response.json()
    let NoteSuggestions = [], LineSuggestions = []
    for (const property in suggestions) {
        if (suggestions[property].type == 'Line') {
            LineSuggestions.push({ [property]: suggestions[property] })
        } else if (suggestions[property].type == 'Note') {
            NoteSuggestions.push({ [property]: suggestions[property] })
        }
    }
    let noteList = document.getElementById('noteSuggestionsList')
    let lineList = document.getElementById('lineSuggestionsList')
    noteList.innerHTML = ''
    lineList.innerHTML = ''
    createList(NoteSuggestions.sort(compare))
    createList(LineSuggestions.sort(compare))

    let p = document.getElementById('listDesc')
    if (NoteSuggestions.length + LineSuggestions.length == 0) {
        p.innerHTML = 'No search suggestions yet!'

    } else {
        p.innerHTML = ''
        // p.innerHTML='Click the text in a card to navigate to its corresponding note.'
        // p.style.fontStyle='italic'
    }

}

async function getTaskTopic() {
    let taskWidget = await miro.board.widgets.get({ metadata: { [client_id]: { type: 'Topic' } } })
    if(taskWidget.length==0)return '';
    console.log(taskWidget[0].plainText.substring(12))
    return taskWidget[0].plainText.substring(12)
}

function createNoteSwitch() {
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

function createLineSwitch() {
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

/**
 * 
 * @param {*} event 
 * @returns 
 */
async function addToSidebar(event) {
    updateSidebar()
    // let p = document.getElementsByClassName('textDesc')
    // if (p.length != 0) {
    //     p[0].remove()
    // }
    // if (event.data.length == 1) {
    //     if (Object.keys(event.data[0]) == 0) {
    //         return
    //     } else if (cardType.includes(event.data[0].metadata[client_id].type)) {
    //         let widget = await miro.board.widgets.get({ id: event.data[0].id })
    //         console.log(widget)
    //         addToList(widget[0])
    //     }
    // } else {
    //     if (Object.keys(event.data[1]) == 0) {
    //         return
    //     } else if (cardType.includes(event.data[1].metadata[client_id].type)) {
    //         let widget = await miro.board.widgets.get({ id: event.data[1].id })
    //         console.log(widget)
    //         addToList(widget[0])
    //     }
    // }
}

async function removeFromSidebar(event) {
    console.log(event)
    if (Object.keys(event.data[0]) == 0) {
        return
    } else {
        removeFromList(event.data[0].id)
    }
}

function compare(a, b) {
    if (a[Object.keys(a)[0]].time_created < b[Object.keys(b)[0]].time_created) {
        return -1;
    }
    if (a[Object.keys(a)[0]].time_created < b[Object.keys(b)[0]].time_created) {
        return 1;
    }
    return 0;
}

function changeCircleSuggestionVisibility() {
    let circleItems = document.getElementsByClassName('circleItem')

    if (circleItems[0].style.display == 'none') {

        //miro.showNotification(circleItems[0].getAttribute('display').toString());
        //circleItems[0].style.display = 'block';
        [...circleItems].forEach((item) => item.style.display = 'block')
        circleCardVisible = true
    } else {
        //circleItems[0].style.display = 'none'
        [...circleItems].forEach((item) => item.style.display = 'none')
        circleCardVisible = false
    }
}

function changeLineSuggestionVisibility() {
    let lineItems = document.getElementsByClassName('lineItem')

    if (lineItems[0].style.display == 'none') {

        //miro.showNotification(circleItems[0].getAttribute('display').toString());
        //circleItems[0].style.display = 'block';
        [...lineItems].forEach((item) => item.style.display = 'block')
        lineCardVisible = true
    } else {
        //circleItems[0].style.display = 'none'
        [...lineItems].forEach((item) => item.style.display = 'none')
        lineCardVisible = false
    }
}

/**
 * 
 * @param {Object[]} suggestions array of suggestions in JSON form, with database ID as key and attributes dict as value
 */
function createList(suggestions) {
    suggestions.forEach((suggestion) => addToList(suggestion))
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

/**
 * 
 * @param {Object} suggestion suggestion object, 
 */
function addToList(suggestion) {
    console.log(suggestion)
    let sugg_Id = Object.keys(suggestion)[0]
    var listItem = createlistItemElement(suggestion[sugg_Id])
    var icon = createIconElement(suggestion[sugg_Id].type)
    var card = createCardElement(suggestion[sugg_Id]);

    var list;
    if (suggestion[sugg_Id].type == 'Line') {
        list = document.getElementById('lineSuggestionsList')
    } else if (suggestion[sugg_Id].type == 'Note') {
        list = document.getElementById('noteSuggestionsList')
    } else {
        console.log(suggestion[sugg_Id].type)
    }
    listItem.setAttribute('id', sugg_Id)
    list.appendChild(listItem);
    listItem.appendChild(icon)
    listItem.appendChild(card)
}

function removeFromList(widgetId) {
    let card = document.getElementById(widgetId)
    if (card === null) { return }
    card.remove()
}

/**
 * 
 * @param {*} suggestion Suggestion JSON object
 * @returns 
 */
function createlistItemElement(suggestion) {
    let listItem = document.createElement('li');

    if (suggestion.type === 'Note') {
        listItem.setAttribute('class', 'circleItem')
        if (circleCardVisible) {
            listItem.style.display = 'block'
        } else {
            listItem.style.display = 'none'
        }
    } else if (suggestion.type === 'Line') {
        listItem.setAttribute('class', 'lineItem')
        if (lineCardVisible) {
            listItem.style.display = 'block'
        } else {
            listItem.style.display = 'none'
        }
    }
    return listItem
}

function createIconElement(widgetType) {
    let icon = document.createElement('div')

    icon.setAttribute('class', 'iconDiv')
    if (widgetType === 'Note') {
        let text = document.createElement('p')
        text.setAttribute('class', 'iconDot')
        text.innerHTML = '&#x2022'
        icon.appendChild(text)
    } else if (widgetType === 'Line') {
        let text = document.createElement('p')
        text.setAttribute('class', 'iconLine')
        text.innerHTML = '&#9135'
        icon.appendChild(text)
    }
    return icon
}

/**
 * 
 * @param {Object} suggestion suggestion JSON object
 * @returns 
 */
function createCardElement(suggestion) {
    let card = document.createElement('div')
    card.setAttribute('class', 'card')
    let textDiv = document.createElement('div')
    textDiv.setAttribute('class', 'textDiv')
    let query = document.createElement('div')
    query.setAttribute('class', 'queryRow')
    let queryBtn = createSearchElement()
    let text = createTextElement(suggestion.text)
    query.appendChild(queryBtn)
    query.appendChild(text)
    textDiv.appendChild(query)

    if (suggestion.status == '4') {
        card.style.backgroundColor = '#D3D3D3'
    }
    cardRect = card.getBoundingClientRect()
    let reject = createRejectElement()
    reject.style.right = (cardRect.right) + 'px';
    reject.style.top = (cardRect.top) + 'px';
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
    div.appendChild(reject)
    return div
}

/**DEPRECATED */
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

    /**
     * When clicked, issues search with query text, appended with its parent text 
     * if it satisfies the following conditions:
     * 1) Attached to cluster title
     * 2) Attached to note with less than 50 characters
     * 3) Line Suggestion that is attached to two cluster titles
     * All else is appended with task topic.
     * Also, turns background color of card to dark gray to indicate it has been clicked
     */
    search.addEventListener('click', async function (e) {
        sendWidgetsToWizard()
        let cardText = this.parentNode.childNodes[1].innerHTML
        let sugg_Id = this.parentNode.parentNode.parentNode.parentNode.getAttribute('id')
        let response = await fetch('/suggestions?boardId=' + board_id + '&sugg_id=' + sugg_Id)
        let suggestion = await response.json()
        let widgetText, widgetA, widgetB, widgetAtype, widgetBtype, widgetType, appendTextToQuery;
        console.log(suggestion)
        if (suggestion.type == 'Line') {
            widgetA = await miro.board.widgets.get({ id: suggestion.parentA_Id })
            widgetB = await miro.board.widgets.get({ id: suggestion.parentB_Id })
            widgetAtype = Object.keys(widgetA[0].metadata).length !== 0 ? widgetA[0].metadata[client_id].type : widgetA[0].type
            widgetBtype = Object.keys(widgetB[0].metadata).length !== 0 ? widgetB[0].metadata[client_id].type : widgetB[0].type
            appendTextToQuery = (widgetAtype == 'ClusterTitle' && widgetBtype == 'ClusterTitle')
            widgetText = appendTextToQuery ? widgetA[0].plainText + ' ' + widgetB[0].plainText : null
        } else if (suggestion.type == 'Note') {
            let widget = await miro.board.widgets.get({ id: suggestion.parent_Id })
            widgetType = Object.keys(widget[0].metadata).length !== 0 ? widget[0].metadata[client_id].type : widget[0].type
            appendTextToQuery = widgetType == 'ClusterTitle' || (Object.keys(widget[0].metadata).length == 0 && widget[0].plainText.length < 50)
            widgetText = appendTextToQuery ? widget[0].plainText : null
        }
        let text;
        console.log(widgetText)
        if (widgetText != null) {
            text = cardText + " " + widgetText;
        } else if (topic_task == '') {
            text = cardText;
        } else {
            text = cardText + " " + topic_task
        }
        let wordsQuery = text.split(' ')
        let url = 'https://www.google.com/search?q=' + wordsQuery[0]
        wordsQuery = wordsQuery.map(x => '+' + x)
        for (let i = 1; i < wordsQuery.length; i++) {
            url = url + wordsQuery[i]
        }
        window.open(url, '_blank').focus()
        if ('rgb(211, 211, 211)' != this.parentNode.parentNode.parentNode.style.backgroundColor && !USER_IS_WIZARD) {
            this.parentNode.parentNode.parentNode.style.backgroundColor = '#D3D3D3'
            socket.emit('queriedSuggestion', {
                board_id: board_id,
                sugg_DbId: sugg_Id
            })
        }

    })
    return search
}

function createRejectElement() {
    let reject = document.createElement('button')
    reject.setAttribute('class', 'reject')
    reject.innerHTML = '✖'
    reject.addEventListener('mouseover', function (e) {
        this.style.backgroundColor = '#A9A9A9'
    })
    reject.addEventListener('mouseout', function (e) {
        this.style.backgroundColor = 'transparent'
    })
    reject.addEventListener('click', async function (e) {
        
        let sugg_DbId = this.parentNode.parentNode.getAttribute('id')
        let suggestionCard = document.getElementById(sugg_DbId)
        suggestionCard.remove()
        let response = await fetch('/suggestions?boardId=' + board_id + '&sugg_id=' + sugg_DbId)
        let suggestion = await response.json()

        if(suggestion.type == 'Line'){
            socket.emit('removeSuggestion', {
                type: 'Line',
                board_id: board_id,
                "sugg_DbId": sugg_DbId,
                parentA_Id: suggestion.parentA_Id,
                parentB_Id: suggestion.parentB_Id
            })
        }else if(suggestion.type == 'Note'){
            socket.emit('removeSuggestion', {
                type: 'Note',
                board_id: board_id,
                "sugg_DbId": sugg_DbId,
                parent_Id: suggestion.parent_Id,
                parentType: suggestion.parent_type
            })
        } 
    })
    return reject

}

function createTextElement(suggestionText) {
    let text = document.createElement('p')
    text.setAttribute('class', 'text')
    text.innerHTML = suggestionText;

    //TODO: For when user is allowed to see both on board and sidebar
    // if (USER_IS_WIZARD) {
    //     text.addEventListener('mouseover', function (e) {
    //         this.style.backgroundColor = '#A9A9A9'
    //     })
    //     text.addEventListener('mouseout', function (e) {
    //         this.style.backgroundColor = 'transparent'
    //     })
    //     text.addEventListener('click', async function (e) {
    //         let widgetid = this.parentNode.parentNode.parentNode.parentNode.getAttribute('id')
    //         let widget = await miro.board.widgets.get({ id: widgetid })
    //         miro.board.viewport.zoomToObject(widget[0].metadata[client_id].parentId)
    //     })
    // }


    return text
}

async function removePopups() {
    let selectedWidgets = await miro.board.widgets.get()
    let widgets = selectedWidgets.filter((widget) => Object.keys(widget.metadata).length !== 0)
    widgets = widgets.filter((widget) => (widget.metadata[client_id].type == 'Popup')
        || (widget.metadata[client_id].type == 'Accept')
        || (widget.metadata[client_id].type == 'Reject'))
    await miro.board.widgets.deleteById(widgets)
}

async function sendWidgetsToWizard() {
    let widgets = await miro.board.widgets.get();
    socket.emit('widgets', { boardId: board_id, widgets: widgets })
}
