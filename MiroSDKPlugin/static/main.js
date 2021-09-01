const icon = '<path fill-rule="evenodd" clip-rule="evenodd" d="M10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 11.8487 17.3729 13.551 16.3199 14.9056L20.7071 19.2929C21.0976 19.6834 21.0976 20.3166 20.7071 20.7071C20.3166 21.0976 19.6834 21.0976 19.2929 20.7071L14.9056 16.3199C13.551 17.3729 11.8487 18 10 18ZM16 10C16 13.3137 13.3137 16 10 16C6.68629 16 4 13.3137 4 10C4 6.68629 6.68629 4 10 4C13.3137 4 16 6.68629 16 10Z" fill="#050038"/>'
const cluster = '<path fill-rule="evenodd" clip-rule="evenodd" d="M14,4c1.105,0,2-0.895,2-2c0-1.105-0.895-2-2-2s-2,0.895-2,2c0,0.562,0.233,1.068,0.606,1.431l-1.578,2.761  C10.706,6.074,10.363,6,10,6C9.2,6,8.477,6.318,7.939,6.829L3.848,3.761C3.945,3.526,4,3.27,4,3c0-1.105-0.895-2-2-2S0,1.895,0,3  c0,1.105,0.895,2,2,2c0.472,0,0.9-0.17,1.242-0.443l4.102,3.077C7.131,8.045,7,8.505,7,9c0,0.313,0.062,0.61,0.151,0.894  L2.86,12.201C2.598,12.076,2.309,12,2,12c-1.105,0-2,0.895-2,2c0,1.105,0.895,2,2,2s2-0.895,2-2c0-0.406-0.123-0.783-0.331-1.099  l3.933-2.115C8.149,11.519,9.015,12,10,12c0.498,0,0.961-0.133,1.375-0.348l0.977,1.217C12.131,13.191,12,13.58,12,14  c0,1.105,0.895,2,2,2s2-0.895,2-2c0-1.105-0.895-2-2-2c-0.321,0-0.62,0.083-0.889,0.217l-0.934-1.164C12.684,10.516,13,9.797,13,9  c0-0.934-0.436-1.758-1.105-2.308l1.583-2.77C13.645,3.968,13.818,4,14,4z"/>'
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
var mode = modes.ENABLE_WIDGETS
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
    //add socket connection to log sidebar open to database
    if (USER_IS_WIZARD) {
        miro.board.ui.openLeftSidebar('/wizardSidebar.html')
    } else {
        miro.board.ui.openLeftSidebar('/sidebar.html')
        socket.emit('sidebarOpened', { board_id: board_id })
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

/**
 * Create cross-cluster suggestion for two notes
 * @param {*} startWidgetID start widget of line for Miro  
 * @param {*} endWidgetID end widget of line for Miro 
 * @param {bool} parentsAreClusterTitles If both start and end widgets of the line are cluster titles
 * @returns 
 */
async function createSuggestionLine(startWidgetID, endWidgetID, parentsAreClusterTitles) {
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
                parentsAreClusterTitles: parentsAreClusterTitles
            }
        },
        clientVisible: mode != modes.ENABLE_SIDEBAR,
        style: {
            lineColor: '#000000',
            lineEndStyle: miro.enums.lineArrowheadStyle.NONE,
            lineStartStyle: miro.enums.lineArrowheadStyle.NONE,
            lineStyle: miro.enums.lineStyle.DASHED,
            lineType: 0,
        }
    })
    var circleCoord = await getLineMidpoint(line[0])
    let circle = await createSuggestionCircle(circleCoord.x, circleCoord.y, line[0].id, 'LINE')
    fetch('/suggestionCircle', {

        // Declare what type of data we're sending
        headers: {
            'Content-Type': 'application/json'
        },

        // Specify the method
        method: 'POST',

        // A JSON payload
        body: JSON.stringify({
            "board_id": board_id,
            "widget_id": startWidgetID + '_' + endWidgetID,
            "suggCirc_Id": circle.id
        })
    });
    return [line[0], circle]
}


/**
 * Creates suggestion attached to widget
 * @param {String[]} text 
 * @param {*} x 
 * @param {*} y 
 * @param {*} parentID 
 * @param {*} parentType
 */
async function createSuggestionCircle(x, y, parentID, parentType) {
    //console.log(x + ' ' + y)
    let suggestionCircle = await miro.board.widgets.create({
        type: 'SHAPE',
        x: x,
        y: y,
        capabilities: {
            editable: false
        },
        metadata: {
            [client_id]: {
                type: parentType == 'LINE' ? 'LineSuggestion' : 'NoteSuggestion',
                parentId: parentID,
                parentType: parentType
            }
        },
        clientVisible: mode != modes.ENABLE_SIDEBAR,
        width: 50,
        height: 50,
        text: '🔎︎',
        style: {
            backgroundColor: '#008000',
            borderOpacity: 1,
            fontSize: 20,
            shapeType: miro.enums.shapeType.CIRCLE,
        }
    })
    if (parentType != 'LINE') {
        fetch('/suggestionCircle', {

            // Declare what type of data we're sending
            headers: {
                'Content-Type': 'application/json'
            },

            // Specify the method
            method: 'POST',

            // A JSON payload
            body: JSON.stringify({
                "board_id": board_id,
                "widget_id": parentID,
                "suggCirc_Id": suggestionCircle[0].id
            })
        });
    }
    return suggestionCircle[0]
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

/**
 * Takes in text and parentText (if any), then creates HTML query suggestion
 * @param {string} text
 * @param {*} parentText 
 * @returns 
 */
function createHTMLFromText(text, parentText) {

    let html = ''
    let query = text.trim()
    if (query == '') { return }
    let url = createUrlFromText(query, parentText)
    html = html.concat('🔎︎  <a style="color: black; text-decoration: none;" href="' + url + '" target="_blank">' + query + '</a><br>')
    return html
}

async function getTaskTopic() {
    let taskWidget = await miro.board.widgets.get({ metadata: { [client_id]: { type: 'Topic' } } })
    if (taskWidget.length == 0) {
        return ''
    }
    return taskWidget[0].plainText.substring(12)
}

/**
 * 
 * @param {*} cardText 
 * @param {*} parentText 
 * @returns 
 */
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

/**
 * Creates Pop up query window for each query suggestion after clicking on suggestion circle
 * If no suggestions left, delete suggestion circle
 * @param {String[]} parentID Contains parent widget IDs, with first ID being suggestion circle and second being line if it is cross-cluster
 * @returns an Object containing the parentIDs in db form and an Array of shown suggestion IDs to be recorded in database
 */
async function createPopupSearchWindow(parentID) {

    //let url = createUrlFromText(text)
    let suggestionCircle = await miro.board.widgets.get({ id: parentID })
    let parentText, suggestionLine, parentA, parentB;
    if (suggestionCircle[0].metadata[client_id].type == 'LineSuggestion') {
        suggestionLine = await miro.board.widgets.get({ id: suggestionCircle[0].metadata[client_id].parentId })
        parentA = await miro.board.widgets.get({ id: suggestionLine[0].startWidgetId })
        parentB = await miro.board.widgets.get({ id: suggestionLine[0].endWidgetId })
        if (suggestionLine[0].metadata[client_id].parentsAreClusterTitles == true) {
            parentText = parentA[0].plainText + ' ' + parentB[0].plainText
        } else {
            parentText = null
        }
    } else if (suggestionCircle[0].metadata[client_id].type == 'NoteSuggestion') {
        if (suggestionCircle[0].metadata[client_id].parentType == 'ClusterTitle') {
            let title = await miro.board.widgets.get({ id: suggestionCircle[0].metadata[client_id].parentId })
            parentText = title[0].plainText
        } else if (['TEXT', 'SHAPE', 'STICKER'].includes(suggestionCircle[0].metadata[client_id].parentType)) {
            let note = await miro.board.widgets.get({ id: suggestionCircle[0].metadata[client_id].parentId })
            if (note[0].plainText.length < 50) {
                parentText = note[0].plainText
            } else {
                parentText = null
            }
        } else {
            parentText = null
        }
    } else {
        parentText = null
    }
    console.log(parentText)
    if (topic_task == null) {
        topic_task = await getTaskTopic()
    }

    let suggestionCircleX = suggestionCircle[0].x;
    let suggestionCircleY = suggestionCircle[0].y;
    let response = await fetch('/suggestions?boardId=' + board_id);
    const querySuggestions = await response.json()

    let index = 0
    let suggestionIds=[];
    if (suggestionCircle[0].metadata[client_id].type == 'LineSuggestion') {
        for (const property in querySuggestions) {
            if ((querySuggestions[property].parentA_Id == parentA[0].id && querySuggestions[property].parentB_Id == parentB[0].id)
                || (querySuggestions[property].parentA_Id == parentB[0].id && querySuggestions[property].parentB_Id == parentA[0].id)) {
                fetch('/suggestions', {

                    // Declare what type of data we're sending
                    headers: {
                        'Content-Type': 'application/json'
                    },

                    // Specify the method
                    method: 'POST',

                    // A JSON payload
                    body: JSON.stringify({
                        "board_id": board_id,
                        "status": 2,
                        "suggCirc_Id": parentID,
                        "sugg_DbId": property
                    })
                });
                suggestionIds.push(property)
                createSuggestionRow(suggestionCircleX, suggestionCircleY, parentID, querySuggestions[property].text, parentText, index, querySuggestions[property].status, property)
                index++;
            }
        }
        return {
            parent_id: suggestionLine[0].startWidgetId+ '_' + suggestionLine[0].endWidgetId,
            suggestionIds: suggestionIds
        }
    } else if (suggestionCircle[0].metadata[client_id].type == 'NoteSuggestion') {
        for (const property in querySuggestions) {
            //console.log(querySuggestions[property])
            if (querySuggestions[property].parent_Id == suggestionCircle[0].metadata[client_id].parentId) {
                fetch('/suggestions', {

                    // Declare what type of data we're sending
                    headers: {
                        'Content-Type': 'application/json'
                    },

                    // Specify the method
                    method: 'POST',

                    // A JSON payload
                    body: JSON.stringify({
                        "board_id": board_id,
                        "status": 2,
                        "suggCirc_Id": parentID,
                        "sugg_DbId": property
                    })
                });
                suggestionIds.push(property)
                createSuggestionRow(suggestionCircleX, suggestionCircleY, parentID, querySuggestions[property].text, parentText, index, querySuggestions[property].status, property)
                index++;
            }
        }
        
        return {
            parent_id: suggestionCircle[0].metadata[client_id].parentId,
            suggestionIds: suggestionIds
        }
    }
}


/**
 * Creates rows for each suggestion, containing query link and delete button
 * @param {*} suggestionX x coordinate of suggestion circle
 * @param {*} suggestionY y coordinate of suggestion circle
 * @param {*} parentID id of suggestion circle
 * @param {*} text query suggestion text
 * @param {*} parentText text to append to query suggestion
 * @param {*} index list item number
 * @param {Integer} status the status of the suggestion
 * @param {string} sugg_DbId database key for the suggestion entry
 * TODO: Shorten arguments to include suggestionWidget
 */
async function createSuggestionRow(suggestionX, suggestionY, parentID, text, parentText, index, status, sugg_DbId) {

    let HTMLtext = createHTMLFromText(text, parentText)
    let x = suggestionX + 210
    let y = suggestionY + (75 * index)

    let sugg = await miro.board.widgets.create({
        type: 'SHAPE',
        x: x,
        y: y,
        metadata: {
            [client_id]: {
                type: 'Popup',
                parentId: parentID,
                sugg_DbId: sugg_DbId,
                index: index
            }
        },
        capabilities: {
            editable: false
        },
        clientVisible: mode != modes.ENABLE_SIDEBAR,
        text: HTMLtext,
        width: 350,
        height: 50,
        style: {
            backgroundColor: status == 4 ? '#D3D3D3' : '#FFFFFF',
            borderOpacity: 1,
            borderColor: '#000000',
            fontSize: 20,
            textAlign: 'l',
            shapeType: miro.enums.shapeType.ROUNDER,
        }
    })
    createRejectButton(x + 160, y, sugg[0].id, index, sugg_DbId)

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
        clientVisible: mode != modes.ENABLE_SIDEBAR,
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

/**
 * Create reject button to reject query suggestion
 * @param {*} x x coordinate
 * @param {*} y y coordinate
 * @param {*} parentId id for  suggestion text popup
 * @param {*} index the suggestion number the button corresponds to
 * @param {string} sugg_DbId database key for the suggestion entry
 */
async function createRejectButton(x, y, parentId, index, sugg_DbId) {
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
                parentId: parentId,
                sugg_DbId: sugg_DbId,
                index: index
            }
        },
        clientVisible: mode != modes.ENABLE_SIDEBAR,
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

/**
 * When suggestion is clicked, have popup query windows appear.
 * @param {*} event 
 * @returns 
 */
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
        let coord, popup;

        switch (type) {
            case 'LineSuggestion':
                await suggestionClicked(widgets[0].id)
                sendWidgetsToWizard()
                removePopups()
                let lineId = widgets[0].metadata[client_id].parentId
                coord = {
                    x: x + 170,
                    y: y - 95
                }
                popup = await createPopupSearchWindow(widgets[0].id)
                
                fetch('/suggestionCircleClicked', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        board_id: board_id,
                        parent_id: popup.parent_id,
                        suggestionIds: popup.suggestionIds,
                    })
                })

                break;
            case 'NoteSuggestion':
                await suggestionClicked(widgets[0].id)
                sendWidgetsToWizard()
                removePopups()
                coord = {
                    x: x + 170,
                    y: y - 95
                }
                popup = await createPopupSearchWindow(widgets[0].id)
                fetch('/suggestionCircleClicked', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        board_id: board_id,
                        parent_id: popup.parent_id,
                        suggestionIds: popup.suggestionIds,
                    })
                })


                break;
            case 'Reject':
                let suggNum = widgets[0].metadata[client_id].suggNum
                let sugg_DbId = widgets[0].metadata[client_id].sugg_DbId
                let response = await fetch('/suggestions?boardId=' + board_id + '&sugg_id=' + sugg_DbId)
                let suggestion = await response.json()
                if (suggestion.type == 'Line') {
                    socket.emit('removeSuggestion', {
                        type: 'Line',
                        board_id: board_id,
                        sugg_DbId: sugg_DbId,
                        parentA_Id: suggestion.parentA_Id,
                        parentB_Id: suggestion.parentB_Id
                    })
                } else if (suggestion.type == 'Note') {
                    socket.emit('removeSuggestion', {
                        type: 'Note',
                        board_id: board_id,
                        sugg_DbId: sugg_DbId,
                        parent_Id: suggestion.parent_Id,
                        parentType: suggestion.parent_type
                    })
                }
                let suggestionRow = await miro.board.widgets.get({ id: widgets[0].metadata[client_id].parentId })
                await removePopups()
                createPopupSearchWindow(suggestionRow[0].metadata[client_id].parentId)

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

async function suggestionClicked(widgetId) {
    await miro.board.widgets.update({
        id: widgetId, style: {
            backgroundColor: '#AAFF00',
            borderOpacity: 1,
            fontSize: 20,
            shapeType: miro.enums.shapeType.CIRCLE,
        }, text: '🔎︎'
    })

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

//DEPRECATED
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
    let customWidgets = widgets.filter(widget => Object.keys(widget.metadata).length !== 0)
    let widgetsToCheck = customWidgets.filter(widget => widget.metadata[client_id].type == 'Line'
        || widget.metadata[client_id].type == 'NoteSuggestion')
    widgetsToCheck.forEach(async (widget) => {
        if (widgetIds.includes(widget.metadata[client_id].parentId)) {
            let note = widgets.filter(element => element.id == widget.metadata[client_id].parentId)
            await miro.board.widgets.update({
                id: widget.id,
                x: note[0].bounds.right,
                y: note[0].bounds.top,
                text: '🔎︎'
            })
            // let parentId = widget.metadata[client_id].parentId
            // let text = widget.metadata[client_id].text
            // let type = widget.metadata[client_id].type
            // await miro.board.widgets.deleteById(widget.id)
            // let parentWidget = widgets.filter(widget => widget.id == parentId)
            // await createSuggestionCircle(text, parentWidget[0].bounds.right, parentWidget[0].bounds.top, parentId, type)
        }
        else if (widget.type == 'LINE') {
            if (widgetIds.includes(widget.startWidgetId) || widgetIds.includes(widget.endWidgetId)) {
                //console.log(widget)
                let lineid = widget.id
                let suggestion = customWidgets.filter(widget => widget.metadata[client_id].parentId == lineid)
                let lineWidget = widgets.filter(widget => widget.id == lineid)
                //TODO: optimize getLineMidpoint to use less SDK calls for this function
                let circleCoord = await getLineMidpoint(lineWidget[0])
                await miro.board.widgets.update({
                    id: suggestion[0].id,
                    x: circleCoord.x,
                    y: circleCoord.y,
                    text: '🔎︎'
                })
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

/**
 * Send all widgets on board and in viewport to database 
 */
async function sendWidgetsToWizard() {
    let widgets = await miro.board.widgets.get();
    socket.emit('widgets', { boardId: board_id, widgets: widgets })
    // let viewport = await miro.board.viewport.get()
    // let viewportwidgets = await miro.board.widgets.__getIntersectedObjects(viewport)
    // socket.emit('viewportWidgets', { boardId: board_id, widgets: viewportwidgets })
}

async function getStudyDesign() {
    return await fetch('/studyDesign?boardId=' + board_id).then(
        response => response.json()
    ).then(function (data) {
        if (data == null) return;
        if (data.studyType == 'On Board') {
            mode = modes.ENABLE_WIDGETS
        } else if (data.studyType == 'Sidebar') {
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
    console.log(board_id)
    await getStudyDesign()
    socket.emit('connectToRoom', { board_id: board_id })
    userId = await miro.currentUser.getId()
    USER_IS_WIZARD = wizardIds.includes(userId)

    await removePopups()

    //miro.addListener(miro.enums.event.WIDGETS_CREATED, changeVisibility)

    if (!USER_IS_WIZARD) {
        miro.addListener(miro.enums.event.WIDGETS_TRANSFORMATION_UPDATED, widgetMoved)
        await sendWidgetsToWizard()
        socket.on('removeSuggestion', async (data) => {
            console.log(data)
            let suggResponse;
            if (data.type == 'Line') {
                suggResponse = await fetch('/suggestions?boardId=' + board_id + '&parent_id=' + data.parentA_Id + '_' + data.parentB_Id)
            } else if (data.type == 'Note') {
                suggResponse = await fetch('/suggestions?boardId=' + board_id + '&parent_id=' + data.parent_Id)
            }
            let suggSuggestions = await suggResponse.json()
            console.log(suggSuggestions)
            if (suggSuggestions==null || Object.keys(suggSuggestions).length <=1) {
                if (data.type == 'Line') {
                    let suggCircle = await miro.board.widgets.get({
                        id: suggSuggestions.suggCirc_Id
                    })
                    fetch('/suggestionCircle', {

                        // Declare what type of data we're sending
                        headers: {
                            'Content-Type': 'application/json'
                        },
                
                        // Specify the method
                        method: 'POST',
                
                        // A JSON payload
                        body: JSON.stringify({
                            "board_id": board_id,
                            "widget_id": data.parentA_Id + '_' + data.parentB_Id,
                            "suggCirc_Id": null
                        })
                    });
                    await miro.board.widgets.deleteById(suggCircle[0].metadata[client_id].parentId)
                    await miro.board.widgets.deleteById(suggCircle[0].id)

                } else if (data.type == 'Note') {
                    fetch('/suggestionCircle', {

                        // Declare what type of data we're sending
                        headers: {
                            'Content-Type': 'application/json'
                        },
            
                        // Specify the method
                        method: 'POST',
            
                        // A JSON payload
                        body: JSON.stringify({
                            "board_id": board_id,
                            "widget_id": data.parent_Id,
                            "suggCirc_Id": null
                        })
                    });
                    await miro.board.widgets.deleteById(suggSuggestions.suggCirc_Id)
                }
            }
        })


        socket.on('addWidget', async (data) => {
            if (mode != null) {
                if (data.type == 'addSuggestionCircle') {
                    await createSuggestionCircle(data.x, data.y, data.parentId, data.parentType)
                } else if (data.type == 'addSuggestionLine') {
                    await createSuggestionLine(data.startWidgetId, data.endWidgetId, (data.parentAtype == 'ClusterTitle' && data.parentBtype == 'ClusterTitle'))
                } else if (data.type = 'createPopup') {
                    await createPopupSearchWindow(data.id)
                } else if (data.type == 'updateSuggestionCircle') {
                    await updateSuggestionCircle(data.parentId, data.parentType)
                }
            }
        })
        socket.on('getIssuedSuggestion', async (data) => {
            let textRow = await miro.board.selection.get()
            if (textRow.length != 1 || textRow[0].width != 350 || textRow[0].height != 50 || Object.keys(textRow[0].metadata[client_id]).length != 4) return;
            let sugg_DbId = textRow[0].metadata[client_id].sugg_DbId
            await miro.board.widgets.update({
                id: textRow[0].id, style: {
                    backgroundColor: '#D3D3D3',
                    borderOpacity: 1,
                    borderColor: '#000000',
                    fontSize: 20,
                    textAlign: 'l',
                    shapeType: miro.enums.shapeType.ROUNDER,
                },
                text: textRow[0].plainText
            })
            fetch('/suggestions', {

                // Declare what type of data we're sending
                headers: {
                    'Content-Type': 'application/json'
                },

                // Specify the method
                method: 'POST',

                // A JSON payload
                body: JSON.stringify({
                    "board_id": board_id,
                    "status": 4,
                    "sugg_DbId": sugg_DbId
                })
            }).then((response) => {
                return response.text()
            }).then(text => {
            });
        })

        socket.on('updateSuggCircle', async (data) =>{
            let response;
            if (data.type == 'addSuggestionLine') {
                response = await fetch('/suggestionCircle?board_id=' + board_id + '&parent_id=' + data.startWidgetId + '_' + data.endWidgetId)
            } else if (data.type == 'addSuggestionCircle') {
                response = await fetch('/suggestionCircle?board_id=' + board_id + '&parent_id=' + data.parentId)
            }
            let circId = await response.json()
            console.log(circId)
            await miro.board.widgets.update({
                id: circId['suggCirc_Id'],
                text: '🔎︎',
                style: {
                    backgroundColor: '#008000',
                    borderOpacity: 1,
                    fontSize: 20,
                    shapeType: miro.enums.shapeType.CIRCLE,
                }
            })

        })
        if (mode == modes.ENABLE_WIDGETS) {

            miro.addListener(miro.enums.event.SELECTION_UPDATED, selectionClicked)
            miro.initialize({
                extensionPoints: {
                    toolbar: {
                        title: 'Cluster Library',
                        toolbarSvgIcon: cluster,
                        librarySvgIcon: cluster,
                        onClick: async () => {
                            miro.board.ui.openLibrary('toolbar.html', { title: 'Cluster Library' })
                        }
                    }
                },
            })
        } else {
            if (mode == modes.ENABLE_SIDEBAR) {

                let widgets = await miro.board.widgets.get()
                let customWidgets = widgets.filter((widget) => (Object.keys(widget.metadata).length != 0)
                    && (customWidgetTypes.includes(widget.metadata[client_id].type)))
                await hideWidgets(customWidgets)

            }
            socket.on('showSidebar', async (data) => {
                openSidebar()
            })
            socket.on('hideSidebar', async (data) => {
                miro.board.ui.closeLeftSidebar()
            })
            miro.initialize({
                extensionPoints: {
                    toolbar: {
                        title: 'Cluster Library',
                        toolbarSvgIcon: cluster,
                        librarySvgIcon: cluster,
                        onClick: async () => {
                            miro.board.ui.openLibrary('toolbar.html', { title: 'Cluster Library' })

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
    } else {
        miro.initialize({
            extensionPoints: {
                toolbar: {
                    title: 'Cluster Library',
                    toolbarSvgIcon: cluster,
                    librarySvgIcon: cluster,
                    onClick: async () => {
                        miro.board.ui.openLibrary('toolbar.html', { title: 'Cluster Library' })

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