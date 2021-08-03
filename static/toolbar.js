var client_id = "3074457360917723621"

miro.onReady(async () => {
    
})

async function connectionLineBtnClicked(){
    let widgets=await miro.board.selection.get()
    if(widgets.length!=2){
        miro.showNotification('Please select 2 text boxes/shapes/sticky notes to connect (You can select multiple items using the ctrl button).')
    }else{
        addLine(widgets[0].id, widgets[1].id)
    }
}

async function addLine(startWidgetId, endWidgetId) {
    miro.board.widgets.create({
        type: 'LINE',
        startWidgetId: startWidgetId,
        endWidgetId: endWidgetId,
        style: {
            lineColor: '#000000',
            lineEndStyle: miro.enums.lineArrowheadStyle.NONE,
            lineStartStyle: miro.enums.lineArrowheadStyle.NONE,
            lineStyle: miro.enums.lineStyle.DASHED,
            lineThickness: 3,
            lineType: 0,
        }
    })
}


async function addClusterGroup(){
    let viewport = await miro.board.viewport.get()
    let centeredX = viewport.x + viewport.width / 2
    let centeredY = viewport.y + viewport.height / 2
    await miro.board.widgets.create({
        type: 'SHAPE',
        x: centeredX,
        y: centeredY,
        capabilities: {
            editable: false
        },
        metadata: {
            [client_id]: {
                type: 'Cluster'
            }
        },
        clientVisible: true,
        width: 200,
        height: 200,
        style: {
            backgroundOpacity: 0,
            borderColor: '#000000',
            borderStyle: 1,
            shapeType: miro.enums.shapeType.ROUNDER,
        }
    })
}

async function addClusterTitle(){
    let viewport = await miro.board.viewport.get()
    let centeredX = viewport.x + viewport.width / 2
    let centeredY = viewport.y + viewport.height / 2
    await miro.board.widgets.create({
        type: 'TEXT',
        x: centeredX,
        y: centeredY,
        scale:4,
        style: {
            backgroundColor: '#FFFF00',
            highlighting: 'yellow'
        }
    })
}

