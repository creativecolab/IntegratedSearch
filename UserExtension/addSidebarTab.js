let boardId = window.location.href.substr(27, 12)

//Reflects how many suggestions are on the board
let suggestion_cnt = 0;
const cntDisplay = document.createElement("div");
socket.emit('connectToRoom', { board_id: boardId }, async (response)=>{
    suggestion_cnt = response.suggestion_cnt!= null ? response.suggestion_cnt : 0
    console.log(suggestion_cnt)
    
    cntDisplay.id = "extension-cnt";
    cntDisplay.innerHTML = suggestion_cnt
    document.getElementsByTagName('html')[0].append(cntDisplay);
})
console.log(suggestion_cnt)
//pull current suggestion count from database and display it

const pluginToggle = document.createElement("div");
pluginToggle.id = "extension-toggle";
let pluginToggleState = false

/**
 * When updateCnt signal is received, increment if suggestion is added or decrement if suggestion is removed
 */
socket.on('updateCnt', json => {
    //console.log(json)
    if(json.type=='add'){
        suggestion_cnt+=1
        let cntDisplay = document.getElementById('extension-cnt')
        cntDisplay.innerHTML=suggestion_cnt
        let pluginToggle = document.getElementById('extension-toggle')
        pluginToggle.style.backgroundColor = '#008000'
    }else if (json.type=='remove'){
        suggestion_cnt-=1
        if(suggestion_cnt <= 0) {
            suggestion_cnt=0;
            let pluginToggle = document.getElementById('extension-toggle')
            pluginToggle.style.backgroundColor = 'transparent'
        }
        let cntDisplay = document.getElementById('extension-cnt')
        cntDisplay.innerHTML=suggestion_cnt
    }
})
pluginToggle.onclick = () => {
    pluginToggleState = !pluginToggleState;
    pluginToggle.innerHTML = `${pluginToggleState ? '<' : '>'}`
    pluginToggle.style.backgroundColor = 'transparent'
    if(pluginToggleState){
        socket.emit('showSidebar', {boardId: boardId})
    }else{
        socket.emit('hideSidebar', {boardId: boardId})
    }
};
pluginToggle.innerHTML = `${pluginToggleState ? '<' : '>'}`
document.getElementsByTagName('html')[0].append(pluginToggle);