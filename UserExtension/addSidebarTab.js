
let board_id = window.location.href.substr(27, 12)
fetch('https://90d2-47-156-139-9.ngrok.io/studyDesign?boardId=' + board_id).then(
    response => response.json()
).then(async function (data) {
    if (data.studyType == 'On Board') {
        return
    } else {
        //Reflects how many suggestions are on the board
        const cntDisplay = document.createElement("div");
        socket.emit('connectToRoom', { board_id: board_id })

        let suggestion_cnt = data.suggestion_cnt != null ? data.suggestion_cnt : 0
        console.log(suggestion_cnt)

        cntDisplay.id = "extension-cnt";
        cntDisplay.innerHTML = suggestion_cnt
        document.getElementsByTagName('html')[0].append(cntDisplay);



        const pluginToggle = document.createElement("div");
        pluginToggle.id = "extension-toggle";
        let pluginToggleState = false
        pluginToggle.innerHTML = `${pluginToggleState ? '<🔎︎' : '🔎︎>'}`
        document.getElementsByTagName('html')[0].append(pluginToggle);

        //Add listener from database to retrive updated suggestion count
        /**
         * When updateCnt signal is received, increment if suggestion is added or decrement if suggestion is removed
         */
        socket.on('updateCnt', json => {

            let cntDisplay = document.getElementById('extension-cnt')
            if(cntDisplay.innerHTML < json['suggestion_cnt']){
                let pluginToggle = document.getElementById('extension-toggle')
                pluginToggle.style.backgroundColor = '#008000'
            }
            cntDisplay.innerHTML = json['suggestion_cnt']

        })
        pluginToggle.onclick = () => {
            pluginToggleState = !pluginToggleState;
            pluginToggle.innerHTML = `${pluginToggleState ? '<🔎︎' : '🔎︎>'}`
            pluginToggle.style.backgroundColor = 'transparent'
            if (pluginToggleState) {
                socket.emit('showSidebar', { boardId: board_id })
            } else {
                socket.emit('hideSidebar', { boardId: board_id })
            }
        };
    }
});
