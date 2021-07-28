const icon = '<circle cx="12" cy="12" r="9" fill="none" fill-rule="evenodd" stroke="currentColor" stroke-width="2"></circle>';
var i = 0;
var client_id = "3074457360917723621"

function addWidgets(widgets) {
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
        return response.text();
    }).then(function (text) {
        // Should be 'OK' if everything was successful
        miro.showNotification(widgets.length.toString());
        //miro.board.widgets.create(text);
    });
}


/**
 * Add Line widget to board taking in two widgets as parameters
 */
function addLine(prevLine) {
    miro.board.widgets.create({
        type: 'LINE',
        startWidgetId: prevLine.startWidgetId,
        endWidgetId: prevLine.endWidgetI,
        style: {
            lineColor: '#000000',
            lineEndStyle: miro.enums.lineArrowheadStyle.NONE,
            lineStartStyle: miro.enums.lineArrowheadStyle.NONE,
            lineStyle: miro.enums.lineStyle.NORMAL,
            lineThickness: 1,
            lineType: miro.enums.lineType.ARROW,
        }
    })
}

function showCoordinates(event) {
    miro.showNotification(JSON.stringify(event.data))
}
function openSidebar() {
    miro.board.ui.openLeftSidebar('/sidebar.html')
}

function showMetadataType(event) {
    let metadata = JSON.stringify(event.data)
    metadata = JSON.parse(metadata)
    type = metadata[0]['metadata'][client_id]['type']
    if (type == 'DotSuggestion') {
        miro.showNotification('This is a suggestion dot!')
    }
}

function createSuggestionLine(startWidgetID, endWidgetID) {
    miro.board.widgets.create({
        type: 'LINE',
        startWidgetId: startWidgetID,
        endWidgetId: endWidgetID,
        capabilities: {
            editable: false
        },
        metadata: {
            [client_id]: {
                type: 'LineSuggestion',
                text: 'test text',
                url: '',
                parentId: '',
                childId: ''
            }
        },
        clientVisible: true,
        style: {
            lineColor: '#000000',
            lineEndStyle: miro.enums.lineArrowheadStyle.NONE,
            lineStartStyle: miro.enums.lineArrowheadStyle.NONE,
            lineStyle: miro.enums.lineStyle.DASHED,
            lineThickness: 1,
            lineType: miro.enums.lineType.ARROW,
        }
    })
}

function createSuggestionCircle(text, parentID) {
    miro.board.widgets.create({
        type: 'SHAPE',
        x: 0,
        y: 0,
        capabilities: {
            editable: false
        },
        metadata: {
            [client_id]: {
                type: 'DotSuggestion',
                text: text,
                url: '',
                childId: ''
            }
        },
        clientVisible: true,
        width: 50,
        height: 50,
        style: {
            backgroundColor: '#000000',
            borderOpacity: 0,
            fontSize: 20,
            shapeType: miro.enums.shapeType.CIRCLE,
        }
    })
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

async function createPopupSearchWindow(suggestionType, x, y, text, parentID) {
    let url = createUrlFromText(text)
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
        clientVisible: true,
        text: '<a style="color: white; text-decoration: none;" href="' + url + '">' + text + '</a>',
        width: 300,
        height: 150,
        style: {
            backgroundColor: '#000000',
            borderOpacity: 0,
            fontSize: 20,
            shapeType: miro.enums.shapeType.ROUNDER,
        }
    })
    if (suggestionType == 'Line') {
        await createAcceptButton(x + 100, y + 60, parentID)
    }
    await createRejectButton(x + 130, y + 60, parentID)
}

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
        clientVisible: true,
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
        clientVisible: true,
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

async function selectionClicked(event) {
    let widgets = await miro.board.selection.get()
    if (widgets.length == 1) {
        let eventMetadata = JSON.stringify(event.data)
        eventMetadata = JSON.parse(eventMetadata)
        try {
            type = eventMetadata[0]['metadata'][client_id]['type']
        } catch (error) {
            removePopups()
            return;
        }
        switch (type) {
            case 'DotSuggestion':
                let x = widgets[0].x
                let y = widgets[0].y
                removePopups()
                createPopupSearchWindow('Dot', x + 170, y - 95, widgets[0].metadata[client_id].text, widgets[0].id)
                break;
            case 'LineSuggestion':
                let startWidget = await miro.board.widgets.get({ id: widgets[0].startWidgetId })
                let endWidget = await miro.board.widgets.get({ id: widgets[0].endWidgetId })
                removePopups()
                createPopupSearchWindow('Line',
                    (startWidget[0].x + endWidget[0].x) / 2,
                    (startWidget[0].y + endWidget[0].y) / 2,
                    widgets[0].metadata[client_id].text,
                    widgets[0].id);
                break;
            case 'Accept':
                await acceptLineSuggestion(widgets[0].metadata[client_id].parentId)
                await removePopups()
                break;
            case 'Reject':
                await miro.board.widgets.deleteById(widgets[0].metadata[client_id].parentId)
                await removePopups()
                break;
            default:
                break;
        }
    } else {
        await removePopups()
    }
}

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

function onLoad(event) {
    miro.showNotification('Widgets created!')
}

async function removePopups() {
    let selectedWidgets = await miro.board.widgets.get()
    let widgets = selectedWidgets.filter((widget) => Object.keys(widget.metadata).length !== 0)
    widgets = widgets.filter((widget) => (widget.metadata[client_id].type !== 'DotSuggestion')
        && (widget.metadata[client_id].type !== 'LineSuggestion'))
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

miro.onReady(async () => {
    miro.addListener(miro.enums.event.SELECTION_UPDATED, selectionClicked)
    await removePopups()
    miro.initialize({
        extensionPoints: {
            toolbar: {
                title: 'Suggestion Library',
                toolbarSvgIcon: icon,
                librarySvgIcon: icon,
                onClick: async () => {
                    miro.board.ui.openLibrary('toolbar.html', {title: 'Suggestion Library'})
                }
            },
            bottomBar: {
                title: 'Reimagining Search',
                svgIcon: icon,
                onClick: async () => {
                    let selectedWidgets = await miro.board.widgets.get()
                    let widgets = selectedWidgets.filter((widget) => (Object.keys(widget.metadata).length == 0)
                        && widget.type == 'SHAPE')
                    createSuggestionLine(widgets[0].id, widgets[1].id)

                    let text = 'COVID 19 and its severe environmental impacts on wildlife and oil'
                    createSuggestionCircle(text)
                    openSidebar()
                    // let widgets = await miro.board.widgets.get()
                    // let line = widgets.filter((widget) => widget.type == 'LINE')
                    // acceptLineSuggestion(line[0].id)
                },
            },

        },
    })

})


