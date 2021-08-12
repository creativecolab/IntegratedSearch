const icon = '<path fill-rule="evenodd" clip-rule="evenodd" d="M10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 11.8487 17.3729 13.551 16.3199 14.9056L20.7071 19.2929C21.0976 19.6834 21.0976 20.3166 20.7071 20.7071C20.3166 21.0976 19.6834 21.0976 19.2929 20.7071L14.9056 16.3199C13.551 17.3729 11.8487 18 10 18ZM16 10C16 13.3137 13.3137 16 10 16C6.68629 16 4 13.3137 4 10C4 6.68629 6.68629 4 10 4C13.3137 4 16 6.68629 16 10Z" fill="#050038"/>'
var i = 0;
var client_id = "3074457360917723621"

var userId;
var USER_IS_WIZARD;
const wizardIds = ['3074457360917294320', '3074457360807760467']

const customWidgetTypes = ['Line', 'LineSuggestion', 'NoteSuggestion', 'Popup', 'Reject', 'Accept']

const popupWidgetTypes = ['Popup', 'Reject', 'Accept']

const modes = {
    ENABLE_SIDEBAR: 'enable_sidebar',
    ENABLE_WIDGETS: 'enable_widgets'
}

var socket = io();
var mode = modes.ENABLE_SIDEBAR

/**
 * Testing fetch API and communication between JS backend and Flask
 * Adding widget to board using Flask server
 * @param {Object[]} widgets 
 */
function sendHttpRequest(widgets) {
    fetch('/test1', {

        // Declare what type of data we're sending
        headers: {
            'Content-Type': 'application/json'
        },

        // Specify the method
        method: 'POST',

        // A JSON payload
        body: JSON.stringify({
            "widgets": widgets
        })
    }).then(function (response) {
        console.log(response.text());
    }).then(function (text) {
        // Should be 'OK' if everything was successful
        miro.showNotification('HTTP Request received!');
        //miro.board.widgets.create(text);
    });
}

/**
 * Shows coordinates from CANVAS_CLICKED event type
 * @param {Object} event 
 */
function showCoordinates(event) {
    miro.showNotification(JSON.stringify(event.data))
}

function openSidebar() {
    if(USER_IS_WIZARD){
        miro.board.ui.openLeftSidebar('/wizardSidebar.html')
    }else{
        miro.board.ui.openLeftSidebar('/sidebar.html')
    }
}

/**
 * Testing metadata capabilities
 * Shows metadata.type of clicked widget
 * @param {Object[]} event 
 */
function showMetadataType(event) {
    let metadata = JSON.stringify(event.data)
    metadata = JSON.parse(metadata)
    type = metadata[0]['metadata'][client_id]['type']
    if (type == 'DotSuggestion') {
        miro.showNotification('This is a suggestion dot!')
    }
}

async function createSuggestionLine(startWidgetID, endWidgetID, text) {
    let line = await miro.board.widgets.create({
        type: 'LINE',
        startWidgetId: startWidgetID,
        endWidgetId: endWidgetID,
        capabilities: {
            editable: false
        },
        metadata: {
            [client_id]: {
                type: 'Line',
                text: text
            }
        },
        clientVisible: mode==modes.ENABLE_WIDGETS,
        style: {
            lineColor: '#000000',
            lineEndStyle: miro.enums.lineArrowheadStyle.NONE,
            lineStartStyle: miro.enums.lineArrowheadStyle.NONE,
            lineStyle: miro.enums.lineStyle.DASHED,
            lineThickness: 3,
            lineType: 0,
        }
    })
    var circleCoord = getLineMidpoint(line[0])
    await createSuggestionCircle(text, circleCoord.x, circleCoord.y, line[0].id, 'line')
}

async function createSuggestionCircle(text, x, y, parentID, type) {
    let suggestionCircle;
    if (type == 'line') {
        suggestionCircle=miro.board.widgets.create({
            type: 'SHAPE',
            x: x,
            y: y,
            capabilities: {
                editable: false
            },
            metadata: {
                [client_id]: {
                    type: 'LineSuggestion',
                    text: text,
                    parentId: parentID
                }
            },
            clientVisible: mode==modes.ENABLE_WIDGETS,
            width: 50,
            height: 50,
            text: '🔎︎',
            style: {
                backgroundColor: '#FFFFFF',
                borderOpacity: 1,
                fontSize: 20,
                shapeType: miro.enums.shapeType.CIRCLE,
            }
        })
    } else {
        suggestionCircle=miro.board.widgets.create({
            type: 'SHAPE',
            x: x,
            y: y,
            capabilities: {
                editable: false
            },
            metadata: {
                [client_id]: {
                    type: 'NoteSuggestion',
                    text: text,
                    parentId: parentID
                }
            },
            clientVisible: mode==modes.ENABLE_WIDGETS,
            width: 50,
            height: 50,
            text: '🔎︎',
            style: {
                backgroundColor: '#FFFFFF',
                borderOpacity: 1,
                fontSize: 20,
                shapeType: miro.enums.shapeType.CIRCLE,
            }
        })
    }
}

/**
 * Get coordinates for popup window such that it doesn't overlap with other suggestion widgets
 * @param {Object} suggestionCircle 
 */
async function getPopupCoordinates(suggestionCircle) {
    let topRightRect = {
        x: suggestionCircle.x + 170,
        y: suggestionCircle.y - 95,
        height: 150,
        width: 300
    }
    let bottomRightRect = {
        x: suggestionCircle.x + 170,
        y: suggestionCircle.y + 95,
        height: 150,
        width: 300
    }
    let topLeftRect = {
        x: suggestionCircle.x - 200,
        y: suggestionCircle.y - 180,
        height: 150,
        width: 300
    }

    return ((await testRectOverlap(topRightRect) ?? await testRectOverlap(bottomRightRect)) ?? await testRectOverlap(topLeftRect)) ?? topRightRect
}

async function testRectOverlap(rect) {
    let widgets = await miro.board.widgets.__getIntersectedObjects(rect)
    widgets = widgets.filter((widget) => Object.keys(widget.metadata).length !== 0)
    if (widgets.length == 0) {
        return rect
    } else {
        return null
    }
}

function createHTMLFromText(texts){
    let html = ''
    texts.forEach((text) => {
        let query = text.trim()
        if(query==''){return}
        let url = createUrlFromText(query)
        html=html.concat('🔎︎  <a style="color: black; text-decoration: none;" href="' + url + '">' + query + '</a><br>')
    })
    return html
}

function createUrlFromText(text) {
    let wordsQuery = text.split(' ')
    let url = 'https://www.google.com/search?q=' + wordsQuery[0]
    wordsQuery = wordsQuery.map(x => '+' + x)
    for (let i = 1; i < wordsQuery.length; i++) {
        url = url + wordsQuery[i]
    }
    return url
}

async function createPopupSearchWindow(x, y, text, parentID) {
    //let url = createUrlFromText(text)
    let HTMLtext = createHTMLFromText(text)
    await miro.board.widgets.create({
        type: 'SHAPE',
        x: x,
        y: y,
        metadata: {
            [client_id]: {
                type: 'Popup',
                parentId: parentID
            }
        },
        capabilities: {
            editable: false
        },
        clientVisible: mode==modes.ENABLE_WIDGETS,
        text: HTMLtext,
        width: 300,
        height: 150,
        style: {
            backgroundColor: '#FFFFFF',
            borderOpacity: 1,
            borderColor: '#000000',
            fontSize: 20,
            textAlign: 'l',
            shapeType: miro.enums.shapeType.ROUNDER,
        }
    })
    // if (suggestionType == 'Line') {
    //     await createAcceptButton(x + 100, y + 60, parentID)
    // }
    await createRejectButton(x + 130, y + 60, parentID)
}

/**
 * DEPRECATED
 * @param {*} x 
 * @param {*} y 
 * @param {*} parentID 
 */
async function createAcceptButton(x, y, parentID) {
    await miro.board.widgets.create({
        type: 'SHAPE',
        x: x,
        y: y,
        capabilities: {
            editable: false
        },
        metadata: {
            [client_id]: {
                type: 'Accept',
                parentId: parentID
            }
        },
        clientVisible: mode==modes.ENABLE_WIDGETS,
        width: 20,
        height: 20,
        text: '<a style="color: white;text-decoration: none;">&#10003</a>',
        style: {
            backgroundColor: '#000000',
            borderOpacity: 100,
            borderColor: '#FFFFFF',
            fontSize: 20,
            shapeType: miro.enums.shapeType.CIRCLE,
        }
    })
}

async function createRejectButton(x, y, parentId) {
    await miro.board.widgets.create({
        type: 'SHAPE',
        x: x,
        y: y,
        capabilities: {
            editable: false
        },
        metadata: {
            [client_id]: {
                type: 'Reject',
                parentId: parentId
            }
        },
        clientVisible: mode==modes.ENABLE_WIDGETS,
        text: '<a style="color: white; text-decoration: none;">&#10007</a>',
        width: 20,
        height: 20,
        style: {
            backgroundColor: '#000000',
            borderOpacity: 100,
            borderColor: '#FFFFFF',
            fontSize: 20,
            shapeType: miro.enums.shapeType.CIRCLE,
        }
    })
}

function getLineMidpoint(line) {
    return {
        x: (line.startPosition.x + line.endPosition.x) / 2,
        y: (line.startPosition.y + line.endPosition.y) / 2
    }
}

async function selectionClicked(event) {
    let widgets = await miro.board.selection.get()
    if (widgets.length == 1) {
        let eventMetadata = JSON.stringify(event.data)
        eventMetadata = JSON.parse(eventMetadata)
        try {
            type = eventMetadata[0]['metadata'][client_id]['type']
        } catch (error) {
            //createSuggestionCircle("test text", widgets[0].bounds.right, widgets[0].bounds.top, widgets[0].id)
            if(!USER_IS_WIZARD){
                removePopups()
            }
            return;
        }
        let x = widgets[0].x
        let y = widgets[0].y
        let coord;
        switch (type) {
            case 'LineSuggestion':
                let lineId = widgets[0].metadata[client_id].parentId
                removePopups()
                coord = await getPopupCoordinates(widgets[0])
                if(USER_IS_WIZARD){
                    socket.emit('test',{
                        type: 'createPopup',
                        x: coord.x,
                        y: coord.y,
                        text: widgets[0].metadata[client_id].text,
                        id: [widgets[0].id, lineId]
                    })
                }else{
                    createPopupSearchWindow(coord.x, coord.y, widgets[0].metadata[client_id].text, [widgets[0].id, lineId])
                }
                
                break;
            case 'NoteSuggestion':
                removePopups()
                coord = await getPopupCoordinates(widgets[0])

                if(USER_IS_WIZARD){
                    socket.emit('test',{
                        type: 'createPopup',
                        x: coord.x,
                        y: coord.y,
                        text: widgets[0].metadata[client_id].text,
                        id: widgets[0].id
                    })
                }else{
                    createPopupSearchWindow(coord.x, coord.y, widgets[0].metadata[client_id].text, widgets[0].id)
                }
                
                break;
            case 'Line':
                let dotSuggestion = await miro.board.widgets.get({
                    metadata: {
                        [client_id]: {
                            type: 'LineSuggestion',
                            text: widgets[0].metadata[client_id].text,
                            parentId: widgets[0].id
                        }
                    }
                })
                removePopups()
                coord = await getPopupCoordinates(dotSuggestion[0])
                if(USER_IS_WIZARD){
                    socket.emit('test',{
                        type: 'createPopup',
                        x: coord.x,
                        y: coord.y,
                        text: dotSuggestion[0].metadata[client_id].text,
                        id: [dotSuggestion[0].id, widgets[0].id]
                    })
                }else{
                    createPopupSearchWindow(
                    coord.x,
                    coord.y,
                    dotSuggestion[0].metadata[client_id].text,
                    [dotSuggestion[0].id, widgets[0].id]);
                }
                break;
            case 'Reject':
                await miro.board.widgets.deleteById(widgets[0].metadata[client_id].parentId)
                await removePopups()
                break;
            default:
                break;
        }
    } else {
        if(!USER_IS_WIZARD){
            removePopups()
        }
    }
}

/**
 * Testing making post requests to backend flask server
 * @param {Object[]} widgets 
 */
function makePOSTRequest(widgets) {
    let jsonwidgets = {
        'widgets': widgets
    }
    fetch("./test1", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonwidgets)
    })
}

/**
 * Testing load event for ALL_WIDGETS_LOADED event type
 * @param {*} event 
 */
function onLoad(event) {
    miro.showNotification('Widgets created!')
}

/**
 * Remove popups windows (pop up with hyperlink text, reject button)
 */
async function removePopups() {
    let selectedWidgets = await miro.board.widgets.get()
    let widgets = selectedWidgets.filter((widget) => Object.keys(widget.metadata).length !== 0)
    widgets = widgets.filter((widget) => (widget.metadata[client_id].type == 'Popup')
        || (widget.metadata[client_id].type == 'Accept')
        || (widget.metadata[client_id].type == 'Reject'))
    await miro.board.widgets.deleteById(widgets)
}

async function acceptLineSuggestion(widgetId) {
    let line = await miro.board.widgets.get({ id: widgetId })
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
    await miro.board.widgets.deleteById(widgetId)
}

/**
 * Detects which widgets moved then deletes query suggestions for moved widgets
 * @param {Object[]} event 
 */
async function widgetMoved(event) {
    await removePopups()
    let widgetIds = event.data.map(widget => widget.id)
    let widgets = await miro.board.widgets.get()
    widgets = widgets.filter(widget => Object.keys(widget.metadata).length !== 0)
    widgets = widgets.filter(widget => widgetIds.includes(widget.metadata[client_id].parentId))
    await miro.board.widgets.deleteById(widgets.map(widget => widget.id))
}

function createWizardBoard() {

    const url = 'https://api.miro.com/v1/boards';
    const options = {
        mode: 'no-cors',
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer f1lkABCcUo_DMsXzUXR7C2fJQBc'
        },
        body: JSON.stringify({ name: 'Mirrored Board', sharingPolicy: { access: 'private', teamAccess: 'edit' } })
    };

    fetch(url, options)
}


async function changeVisibility(event){
    if (USER_IS_WIZARD&&Object.keys(event.data[0].metadata).length!=0
        &&customWidgetTypes.includes(event.data[0].metadata[client_id].type)) {

        widget=await miro.board.widgets.get({id: event.data[0].id})
        showWidgets(widget)
    }
}

async function hideWidgets(widgets){
    
    widgets.forEach((widget) => widget.clientVisible = false)
    await miro.board.widgets.update(widgets)
}

async function showWidgets(widgets){
    
    widgets.forEach((widget) => widget.clientVisible = true)
    await miro.board.widgets.update(widgets)
}

async function addSuggestionFromWizard(widget){
    socket.emit('widget',{type: 'SHAPE'})
}



miro.onReady(async () => {
    
    const isAuthorized = await miro.isAuthorized()

    if (!isAuthorized) {
        await miro.requestAuthorization()
    }

    userId = await miro.currentUser.getId()
    USER_IS_WIZARD=wizardIds.includes(userId)
    let widgets = await miro.board.widgets.get()
    if (mode==modes.ENABLE_SIDEBAR&&!USER_IS_WIZARD) {
        let customWidgets = widgets.filter((widget) => (Object.keys(widget.metadata).length != 0)
            && (customWidgetTypes.includes(widget.metadata[client_id].type)))
        await hideWidgets(customWidgets)
    }
    if (USER_IS_WIZARD||(mode==modes.ENABLE_WIDGETS)) {
        miro.addListener(miro.enums.event.SELECTION_UPDATED, selectionClicked)
        miro.addListener(miro.enums.event.WIDGETS_TRANSFORMATION_UPDATED, widgetMoved)
    }
    await removePopups()

    //miro.addListener(miro.enums.event.WIDGETS_CREATED, changeVisibility)

    //var socket = io();
    socket.on('json', (data)=>{
        if(!USER_IS_WIZARD){
            if(data.type=='addSuggestionCircle'){
                createSuggestionCircle(data.text, data.x, data.y, data.parentId, 'note')
            }else if (data.type=='addSuggestionLine'){
                createSuggestionLine(data.startWidgetId, data.endWidgetId, data.text)
            }else if (data.type='createPopup'){
                createPopupSearchWindow(data.x, data.y, data.text, data.id)
            }
        }
        
    })



    if (mode==modes.ENABLE_WIDGETS&&!USER_IS_WIZARD) {
        miro.initialize({
            extensionPoints: {
                toolbar: {
                    title: 'Suggestion Library',
                    toolbarSvgIcon: icon,
                    librarySvgIcon: icon,
                    onClick: async () => {
                        miro.board.ui.openLibrary('toolbar.html', { title: 'Suggestion Library' })
                    }
                }
            },
        })
    }else{
        miro.initialize({
            extensionPoints: {
                toolbar: {
                    title: 'Suggestion Library',
                    toolbarSvgIcon: icon,
                    librarySvgIcon: icon,
                    onClick: async () => {
                        miro.board.ui.openLibrary('toolbar.html', { title: 'Suggestion Library' })
                    }
                },
                bottomBar: {
                    title: 'Reimagining Search',
                    svgIcon: icon,
                    onClick: async () => {
                        openSidebar()
                    },
                },

            },
        })
    }
    
})

