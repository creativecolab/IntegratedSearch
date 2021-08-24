const icon = '<path fill-rule="evenodd" clip-rule="evenodd" d="M10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 11.8487 17.3729 13.551 16.3199 14.9056L20.7071 19.2929C21.0976 19.6834 21.0976 20.3166 20.7071 20.7071C20.3166 21.0976 19.6834 21.0976 19.2929 20.7071L14.9056 16.3199C13.551 17.3729 11.8487 18 10 18ZM16 10C16 13.3137 13.3137 16 10 16C6.68629 16 4 13.3137 4 10C4 6.68629 6.68629 4 10 4C13.3137 4 16 6.68629 16 10Z" fill="#050038"/>'
var i = 0;
var client_id = "3074457360917723621"
var board_id;

var userId;
var USER_IS_WIZARD;
const wizardIds = ['3074457360917294320', '3074457360807760467']

const customWidgetTypes = ['Line', 'LineSuggestion', 'NoteSuggestion', 'Popup', 'Reject', 'Accept']

const popupWidgetTypes = ['Popup', 'Reject', 'Accept']

const modes = {
    ENABLE_SIDEBAR: 'enable_sidebar',
    ENABLE_WIDGETS: 'enable_widgets',
    ENABLE_BOTH: 'enable_both'
}

var socket = io();
var mode = modes.ENABLE_BOTH
let topic_task;


/**
 * Testing fetch API and communication between JS backend and Flask
 * Adding widget to board using Flask server
 * @param {Object[]} widgets 
 */
function sendHttpRequest(widgets) {
    fetch('/studyDesign', {

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
    if (USER_IS_WIZARD) {
        miro.board.ui.openLeftSidebar('/wizardSidebar.html')
    } else {
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

async function createSuggestionLine(startWidgetID, endWidgetID, text, parentText) {
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
                text: text,
                parentText: parentText
            }
        },
        clientVisible: mode == modes.ENABLE_WIDGETS,
        style: {
            lineColor: '#000000',
            lineEndStyle: miro.enums.lineArrowheadStyle.NONE,
            lineStartStyle: miro.enums.lineArrowheadStyle.NONE,
            lineStyle: miro.enums.lineStyle.DASHED,
            lineType: 0,
        }
    })
    var circleCoord = await getLineMidpoint(line[0])
    await createSuggestionCircle(text, circleCoord.x, circleCoord.y, line[0].id, parentText, 'line')
}

async function createSuggestionCircle(text, x, y, parentID, parentText, type) {
    //console.log(x + ' ' + y)
    console.log(parentText)
    let suggestionCircle;
    if (type == 'line') {
        suggestionCircle = miro.board.widgets.create({
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
                    parentId: parentID,
                    parentText: parentText
                }
            },
            clientVisible: mode == modes.ENABLE_WIDGETS,
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
        suggestionCircle = miro.board.widgets.create({
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
                    parentId: parentID,
                    parentText: parentText
                }
            },
            clientVisible: mode == modes.ENABLE_WIDGETS,
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

function createHTMLFromText(texts, parentText) {

    let html = ''
    texts.forEach(async (text) => {
        let query = text.trim()
        if (query == '') { return }
        let url = createUrlFromText(query, parentText)
        html = html.concat('🔎︎  <a style="color: black; text-decoration: none;" href="' + url + '" target="_blank">' + query + '</a><br>')
        //console.log(html)
    })
    //console.log(html)
    return html
}

async function getTaskTopic() {
    let taskWidget = await miro.board.widgets.get({ metadata: { [client_id]: { type: 'Topic' } } })
    if (taskWidget.length == 0) {
        return ''
    }
    return taskWidget[0].plainText.substring(12)
}

function createUrlFromText(cardText, parentText) {
    let text;
    if (parentText != null) {
        text = cardText + " " + parentText;
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
    return url
}

async function createPopupSearchWindow(x, y, text, parentID, parentText) {
    //let url = createUrlFromText(text)
    if (topic_task == null) {
        topic_task = await getTaskTopic()
    }
    let HTMLtext = createHTMLFromText(text, parentText)
    console.log(HTMLtext)
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
        clientVisible: mode == modes.ENABLE_WIDGETS,
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
        clientVisible: mode == modes.ENABLE_WIDGETS,
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
        clientVisible: mode == modes.ENABLE_WIDGETS,
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

async function getLineMidpoint(line) {
    let x, y;
    //console.log(line)
    if (line.startPosition.x == 0 && line.endPosition.x == 0) {
        let startWidget = await miro.board.widgets.get({ id: line.startWidgetId })
        let endWidget = await miro.board.widgets.get({ id: line.endWidgetId })
        //console.log(startWidget)
        //console.log(endWidget)
        x = parseInt((startWidget[0].x + endWidget[0].x) / 2)
        y = parseInt((startWidget[0].y + endWidget[0].y) / 2)
    } else {
        x = parseInt((line.startPosition.x + line.endPosition.x) / 2)
        y = parseInt((line.startPosition.y + line.endPosition.y) / 2)
    }
    //console.log(x + ' ' + y)
    return {
        x: x,
        y: y
    }
}

async function selectionClicked(event) {
    //console.log(event.data)
    let widgets = await miro.board.selection.get()
    if (widgets.length == 1) {
        let eventMetadata = event.data
        try {
            type = eventMetadata[0]['metadata'][client_id]['type']
        } catch (error) {
            if (!USER_IS_WIZARD) {
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
                coord = {
                    x: x + 170,
                    y: y - 95
                }
                if (USER_IS_WIZARD) {
                    socket.emit('json', {
                        type: 'createPopup',
                        x: coord.x,
                        y: coord.y,
                        text: widgets[0].metadata[client_id].text,
                        parentText: widgets[0].metadata[client_id].parentText,
                        id: [widgets[0].id, lineId],
                        board_id: board_id
                    })
                } else {
                    createPopupSearchWindow(coord.x, coord.y, widgets[0].metadata[client_id].text, [widgets[0].id, lineId], widgets[0].metadata[client_id].parentText)
                }

                break;
            case 'NoteSuggestion':
                removePopups()
                coord = {
                    x: x + 170,
                    y: y - 95
                }
                //console.log(widgets[0].metadata[client_id].parentText)
                if (USER_IS_WIZARD) {
                    socket.emit('json', {
                        type: 'createPopup',
                        x: coord.x,
                        y: coord.y,
                        text: widgets[0].metadata[client_id].text,
                        parentText: widgets[0].metadata[client_id].parentText,
                        id: widgets[0].id,
                        board_id: board_id
                    })
                } else {
                    createPopupSearchWindow(coord.x, coord.y, widgets[0].metadata[client_id].text, widgets[0].id, widgets[0].metadata[client_id].parentText)
                }

                break;
            case 'Line':
                let dotSuggestion = await miro.board.widgets.get({
                    metadata: {
                        [client_id]: {
                            type: 'LineSuggestion',
                            text: widgets[0].metadata[client_id].text,
                            parentId: widgets[0].id,
                            parentText: widgets[0].metadata[client_id].parentText,
                        }
                    }
                })
                removePopups()
                coord = {
                    x: dotSuggestion[0].x + 170,
                    y: dotSuggestion[0].y - 95
                }
                if (USER_IS_WIZARD) {
                    socket.emit('json', {
                        type: 'createPopup',
                        x: coord.x,
                        y: coord.y,
                        text: dotSuggestion[0].metadata[client_id].text,
                        parentText: dotSuggestion[0].metadata[client_id].parentText,
                        id: [dotSuggestion[0].id, widgets[0].id],
                        board_id: board_id
                    })
                } else {
                    createPopupSearchWindow(
                        coord.x,
                        coord.y,
                        dotSuggestion[0].metadata[client_id].text,
                        [dotSuggestion[0].id, widgets[0].id],
                        dotSuggestion[0].metadata[client_id].parentText);
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
        if (!USER_IS_WIZARD) {
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
    //console.log(widgetIds)
    let widgets = await miro.board.widgets.get()
    let customWidgets = widgets.filter(widget => Object.keys(widget.metadata).length !== 0)
    let widgetsToCheck = customWidgets.filter(widget => widget.metadata[client_id].type == 'Line'
        || widget.metadata[client_id].type == 'NoteSuggestion')
    //console.log(widgetsToCheck)
    //console.log(customWidgets)
    widgetsToCheck.forEach(async (widget) => {
        if (widgetIds.includes(widget.metadata[client_id].parentId)) {
            let parentId = widget.metadata[client_id].parentId
            let text = widget.metadata[client_id].text
            let type = widget.metadata[client_id].type
            await miro.board.widgets.deleteById(widget.id)
            let parentWidget = widgets.filter(widget => widget.id == parentId)
            await createSuggestionCircle(text, parentWidget[0].bounds.right, parentWidget[0].bounds.top, parentId, type)
        }
        else if (widget.type == 'LINE') {
            if (widgetIds.includes(widget.startWidgetId) || widgetIds.includes(widget.endWidgetId)) {
                //console.log(widget)
                let lineid = widget.id
                let suggestion = customWidgets.filter(widget => widget.metadata[client_id].parentId == lineid)
                let text = suggestion[0].metadata[client_id].text
                let type = suggestion[0].metadata[client_id].type
                await miro.board.widgets.deleteById(suggestion[0].id)
                let lineWidget = widgets.filter(widget => widget.id == lineid)
                let circleCoord = await getLineMidpoint(lineWidget[0])
                await createSuggestionCircle(text, circleCoord.x, circleCoord.y, lineid, type)
            }
        }
    })
    //await miro.board.widgets.deleteById(suggestionWidgets.map(widget => widget.id))
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


async function changeVisibility(event) {
    if (USER_IS_WIZARD && Object.keys(event.data[0].metadata).length != 0
        && customWidgetTypes.includes(event.data[0].metadata[client_id].type)) {

        widget = await miro.board.widgets.get({ id: event.data[0].id })
        showWidgets(widget)
    }
}

async function hideWidgets(widgets) {

    widgets.forEach((widget) => widget.clientVisible = false)
    await miro.board.widgets.update(widgets)
}

async function showWidgets(widgets) {

    widgets.forEach((widget) => widget.clientVisible = true)
    await miro.board.widgets.update(widgets)
}

async function addSuggestionFromWizard(widget) {
    socket.emit('widget', { type: 'SHAPE' })
}

async function sendWidgetTextToWizard() {
    let widgets = await miro.board.widgets.get();

    // let widgetTypes = ['SHAPE', 'STICKER', 'TEXT']
    // let customWidgetTypes = ['Topic', 'Cluster', 'ClusterTitle']
    // let widgetsFiltered = widgets.filter(widget => widgetTypes.includes(widget.type))
    // widgetsFiltered = widgetsFiltered.filter(widget => Object.keys(widget.metadata).length == 0 ||
    //     customWidgetTypes.includes(widget.metadata[client_id].type))
    // let widgetTexts = widgetsFiltered.map(widget => widget.plainText)
    socket.emit('widgets', { boardId: board_id, widgets: widgets })
    setTimeout(sendWidgetTextToWizard, 60000);
}

async function getStudyDesign(){
    return await fetch('/studyDesign?boardId=' + board_id).then(
        response => response.json()
    ).then(function (data) {
        console.log('HTTP Request received!');
        if(data.studyType=='On Board'){
            mode = modes.ENABLE_WIDGETS
        }else if (data.studyType=='Sidebar'){
            mode = modes.ENABLE_SIDEBAR
        }
    });
}

miro.onReady(async () => {



    const isAuthorized = await miro.isAuthorized()

    if (!isAuthorized) {
        await miro.requestAuthorization()
    }

    let board = await miro.board.info.get()
    board_id = board.id
    await getStudyDesign()

    socket.emit('connectToRoom', { board_id: board_id })

    userId = await miro.currentUser.getId()
    USER_IS_WIZARD = wizardIds.includes(userId)
    let widgets = await miro.board.widgets.get()
    if (mode == modes.ENABLE_SIDEBAR && !USER_IS_WIZARD) {
        let customWidgets = widgets.filter((widget) => (Object.keys(widget.metadata).length != 0)
            && (customWidgetTypes.includes(widget.metadata[client_id].type)))
        await hideWidgets(customWidgets)
    }
    if ((USER_IS_WIZARD && mode == modes.ENABLE_SIDEBAR) || (!USER_IS_WIZARD && mode == modes.ENABLE_WIDGETS)) {
        miro.addListener(miro.enums.event.SELECTION_UPDATED, selectionClicked)
    }
    if (mode == modes.ENABLE_WIDGETS) {
        miro.addListener(miro.enums.event.WIDGETS_TRANSFORMATION_UPDATED, widgetMoved)
    }
    await removePopups()

    if (!USER_IS_WIZARD) {
        await sendWidgetTextToWizard()
    }
    //miro.addListener(miro.enums.event.WIDGETS_CREATED, changeVisibility)

    // let board= await miro.board.info.get()
    // socket.on('connection', socket => {
    //     socket.join(board.id);
    // });
    socket.on('json', async (data) => {
        if (!USER_IS_WIZARD && mode != null) {
            // if (mode == modes.ENABLE_SIDEBAR) {
            //     miro.showNotification('There are new query suggestions! Click the "Suggestion List" button through the bottom left menu to see your suggested queries!')
            //}
            if (data.type == 'addSuggestionCircle') {
                if (data.appendTextToQuery) {
                    await createSuggestionCircle(data.text, data.x, data.y, data.parentId, data.parentText, 'note')
                } else {
                    await createSuggestionCircle(data.text, data.x, data.y, data.parentId, null, 'note')
                }
            } else if (data.type == 'addSuggestionLine') {
                if (data.appendTextToQuery) {
                    await createSuggestionLine(data.startWidgetId, data.endWidgetId, data.text, data.parentAText + ' ' + data.parentBText)
                } else {
                    await createSuggestionLine(data.startWidgetId, data.endWidgetId, data.text, null)
                }

            } else if (data.type = 'createPopup') {
                await createPopupSearchWindow(data.x, data.y, data.text, data.id, data.parentText)
            }
        }

    })



    if (mode == modes.ENABLE_WIDGETS && !USER_IS_WIZARD) {
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
    } else {
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
                    title: 'Suggestions List',
                    svgIcon: icon,
                    onClick: async () => {
                        openSidebar()
                    },
                },

            },
        })
    }

})