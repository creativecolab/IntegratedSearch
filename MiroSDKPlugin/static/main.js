const icon = '<circle cx="12" cy="12" r="9" fill="none" fill-rule="evenodd" stroke="currentColor" stroke-width="2"></circle>';
var i = 0;

function addWidgets(widgets){
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


miro.onReady(() => {

    miro.initialize({
        extensionPoints: {
            bottomBar: {
                title: 'Looking Glass',
                svgIcon: icon,
                positionPriority: 1,
                onClick: async () => {
                    // Get selected widgets
                    let selectedWidgets = await miro.board.widgets.get()
                    let widgets = selectedWidgets.filter((widget) => widget.type !== 'LINE')
                    //miro.showNotification(widgets[0].id)
                    // startWidgetID=widgets[0].id
                    // endWidgetID=widgets[1].id
                    // await miro.board.widgets.create({
                    //     type: 'LINE',
                    //     startWidgetId: startWidgetID,
                    //     endWidgetId: endWidgetID,
                    //     style: {
                    //         lineColor: '#000000',
                    //         lineEndStyle: miro.enums.lineArrowheadStyle.NONE,
                    //         lineStartStyle: miro.enums.lineArrowheadStyle.NONE,
                    //         lineStyle: miro.enums.lineStyle.NORMAL,
                    //         lineThickness: 1,
                    //         lineType: miro.enums.lineType.ARROW,
                    //     }
                    // });
                    miro.showNotification(widgets.length.toString());
                    addWidgets(selectedWidgets);
                    
                },
            },
        },
    })

})