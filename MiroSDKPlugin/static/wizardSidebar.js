var client_id = "3074457360917723621"
const wizardIds = ['3074457360917294320', '3074457360807760467']
var socket = io();


miro.onReady(async () => {

})

async function addSuggestionCircle(){
    let widgets=await miro.board.selection.get()
    widgets=widgets.filter(widget => Object.keys(widget.metadata).length==0)
    if(widgets.length!=1){
        miro.showNotification('Please select 1 text box/shape/sticky note first!')
    }else{
        let textElements=[];
        let textElement1 = document.getElementById('noteSuggestionText1')
        if(textElement1.value.trim()!==''){
            textElements[0]=textElement1.value
        }
        let textElement2= document.getElementById('noteSuggestionText2')
        if(textElement2.value.trim()!==''){
            textElements[1]=textElement2.value
        }
        let textElement3= document.getElementById('noteSuggestionText3')
        if(textElement3.value.trim()!==''){
            textElements[2]=textElement3.value
        }
        if(textElements.length!=0){
            socket.emit('test', {
                type: 'addSuggestionCircle',
                text: textElements,
                x: widgets[0].bounds.right,
                y: widgets[0].bounds.top,
                parentId: widgets[0].id
            })
        }else{
            miro.showNotification('No text entered!')
        }
    }
    
}

async function addSuggestionLine(){
    let widgets=await miro.board.selection.get()
    widgets=widgets.filter(widget => Object.keys(widget.metadata).length==0)
    if(widgets.length!=2){
        miro.showNotification('Please select 2 text boxes/shapes/sticky notes to connect (You can select multiple items using the ctrl button).')
    }else{
        
        let textElements=[];
        let textElement1 = document.getElementById('lineSuggestionText1')
        if(textElement1.value.trim()!==''){
            textElements[0]=textElement1.value
        }
        let textElement2= document.getElementById('lineSuggestionText2')
        if(textElement2.value.trim()!==''){
            textElements[1]=textElement2.value
        }
        let textElement3= document.getElementById('lineSuggestionText3')
        if(textElement3.value.trim()!==''){
            textElements[2]=textElement3.value
        }
        if(textElements.length!=0){
            socket.emit('test', {
                type: 'addSuggestionLine',
                startWidgetId: widgets[0].id,
                endWidgetId: widgets[1].id,
                text: textElements,
            })
        }else{
            miro.showNotification('No text entered!')
        }
    }
}