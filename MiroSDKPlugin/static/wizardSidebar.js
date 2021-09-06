var client_id = "3074457360917723621"
const wizardIds = ['3074457360917294320', '3074457360807760467']//first is developerID, second is wizard's ID
var socket = io();
var board_id;
var user_id;
var wizard_topic;
const WIZARD_TOPICS = {
    COVID_19: "COVID-19",
    SPACE_TRAVEL: "Space Travel",
    NONE: "None"
}


const lineSuggPreChoices_COVID19 = [
    'Ecotourism',
    'National Parks Service',
    'Road Traffic',
    'NO2 and biomass',
    'Deforestation',
    'Carbon emissions of the rich',
    'Environmental racism',
    'Carbon inequality',
    'Decreased transport',
    'Greenhouse gas levels',
    'Waste collection',
    'Recycling Programs',
    'Waste management policies',
    'Essential waste workers',
    'Cold chain',
    'Pharmeceutical transport',
    'Food transport',
    'Blockchain',
    'Post-covid Green Recovery',
    'Ecological restoration',
    'Sustainable development goals',
    'CFC-free coldchain equipment',
    'Indigenous forest gardens',
    'Mass timber',
    'Global Footprint Network',
    'Regulations',
    'Business Act On Climate Pledge',
    'Paris Agreement']
    

const lineSuggPreChoices_SpaceTravel = ['International space alliance',
'Commtttee on the Peaceful Uses of Outer Space',
'Outer Space Treaty',
'The Wolf Amendment',
'International Lunar Research Station',
'Climate Change',
'Climate Change rocket emissions',
'Climate Change sea ice loss',
'Climate Change ozone layer depletion',
'Climate Change temperature increases',
'International space agencies with commercial purposes',
'International Telecommunications Union',
'International Telecommunications Satellite Consortium', 
'International Maritime Satellite Organization', 
'Space exploration lost political support',
"NASA's budget peaked during Apollo program"]

const noteSuggPreChoices_COVID19 = ['Organic and inorganic pollutants',
'Soap discharge',
'Air pollution',
'Air pollution CO2',
'Air pollution NO2',
'Air pollution ozone spikes',
'Chlorofluorocarbons',
'Noise pollution',
'Soil pollution',
'Plastic pollution',
'Water pollution',
'Road-killing',
'Biodiversity',
'Breeding success of birds',
'Reduced fishing',
'Reduced boat disturbance',
'Wildlife conservation and management',
'Invasive alien species',
'Endangered species',
'Illegal killing/poaching of wildlife',
'Tourism',
'Heritage conservation',
'Indigenous people',
'Power Industry',
'Oil and gas',
'Nuclear energy',
'Manufacturing and food industry',
'Packaging industry',
'Food and dinning industry',
'Steel industry',
'Construction industry',
'Agriculture industry',
'Fishing industry',
'Bike sales',
'E-commerce',
'Municipal solid waste',
'Biomedical waste'].concat(lineSuggPreChoices_COVID19)

const noteSuggPreChoices_SpaceTravel = ['Nazi Germany',
'Cold War',
'Sputnik 1',
'Explorer 1',
'Moon Race',
'Apollo 11',
'Apollo Soyuz Test Project',
'International Space Station',
'Tiangong Space Station',
'United States',
'DARPA and NASA',
'Soviet Union',
'Russian Federal Space Agency (Roskosmos)',
'Ministry of General Machine Building',
'Strategic Missle Forces',
'Europe',
'European Space Agency',
'China',
'China Aerospace Science and Technology Corportation',
'China National Space Administration',
'Japan',
'Japan Aerospace Exploration Agency',
'Space stations',
'Soviet space station Salyut',
'U.S space station Skylab',
'China space station Tiangong-1',
'China space station Tiangong-2',
'Space shuttle',
'Challenger shuttle disaster',
'Colombia shuttle disaster',
'Satellite communication',
'Satellite communication homeland defense',
'Satellite communication weather surveillance',
'Satellite communication navigation',
'Satellite communication disasters',
'Kepler Space Telescope',
'Mariner spacecraft',
'Voyager',
"NASA's Commerical Crew Program",
'Space X reusable rocket development',
'Space X Dragon capsule',
'Space X Falcon Heavy',
'Blue Origin sub-orbital space tourism',
'Virgin Galactic sub-orbital space tourism',
'Satellite Maxx Production',
'Commerical Resupply Services (CRS)',
'Artemis Program',
'Artemis Program Lunar economy',
'Artemis Program Helium-3',
'Space-based solar power',
'Asteroid mining',
'Space hotels',
'Aurora Station',
'Bigelow Aerospace',
'2015 SPACE Act',
'Federal Aviation Administration (FAA)',
'FAA Recommended Practices',
'National Environmental Policy and Clean Air',
'Class II Airman Medical Certification',
'U.S. Commercial Space Launch Competitiveness Act'].concat(lineSuggPreChoices_SpaceTravel)




miro.onReady(async () => {
    user_id = await miro.currentUser.getId()
    //hide study design from wizard
    if(user_id==wizardIds[1]){
        let studyDesign= document.getElementById('studyDesign')
        studyDesign.remove()
        let submitBtn= document.getElementById('submitBtn')
        submitBtn.remove()
    }
    let board = await miro.board.info.get()
    board_id=board.id
    await getStudyDesign()

    setWizardSuggestions(document.getElementById('wizardTopic'))
})

async function getStudyDesign(){
    return await fetch('/studyDesign?boardId=' + board_id).then(
        response => response.json()
    ).then(function (data) {
        if(user_id==wizardIds[0]){
            let studyType = document.getElementById('studyType')
            studyType.value = data.studyType
        }
        let wizardTopic = document.getElementById('wizardTopic')
        wizardTopic.value = data.topicTask

    });
}

function setStudyDesign(){
    let studyType = document.getElementById('studyType')
    let wizardTopic = document.getElementById('wizardTopic')
    fetch('/studyDesign?boardId=' + board_id, {

        // Declare what type of data we're sending
        headers: {
            'Content-Type': 'application/json'
        },

        // Specify the method
        method: 'POST',

        // A JSON payload
        body: JSON.stringify({
            "studyType": studyType.value,
            "topicTask": wizardTopic.value
        })
    }).then( (response)=> {
        return response.text()
    }).then(text =>{

        let submitSuccess = document.getElementById('submitSuccess')
        submitSuccess.innerText=text
    });
}

function removeExistSuggFromWizardSugg(listType, existSuggList) {
    let noteSuggPreChoices;
    let noteSuggStr = ''
    let lineSuggStr = ''

    if (wizard_topic == 'COVID-19') {
        noteSuggPreChoices = noteSuggPreChoices_COVID19;
        lineSuggPreChoices = lineSuggPreChoices_COVID19
    } else if (wizard_topic == 'Space Travel') {
        noteSuggPreChoices = noteSuggPreChoices_SpaceTravel;
        lineSuggPreChoices = lineSuggPreChoices_SpaceTravel;
    }
    if (listType == 'cluster') {
        existSuggList.forEach(widget => {
            widget.metadata[client_id].text.forEach(text => {
                let index = noteSuggPreChoices.indexOf(text)
                if (index > -1) {
                    noteSuggPreChoices.splice(index, 1);
                }
            })
        })

        noteSuggPreChoices.forEach(sugg => {
            noteSuggStr += '<option value="' + sugg + '"/>'
        })

        return noteSuggStr;
    } else if (listType == 'cross-polination') {
        existSuggList.forEach(widget => {
            widget.metadata[client_id].text.forEach(text => {
                let index = lineSuggPreChoices.indexOf(text)
                if (index > -1) {
                    lineSuggPreChoices.splice(index, 1);
                }
            })
        })
        lineSuggPreChoices.forEach(sugg => {
            lineSuggStr += '<option value="' + sugg + '"/>'
        })
        return lineSuggStr;
    } else {
        console.log('Enter valid suggestion type!')
    }
}

function getNoteWizSuggestions(widgets) {

    noteSugg = widgets.filter(widget => Object.keys(widget.metadata).length != 0
        && widget.metadata[client_id].type == 'NoteSuggestion')
    return noteSugg
}

function getLineWizSuggestions(widgets) {
    lineSugg = widgets.filter(widget => Object.keys(widget.metadata).length != 0
        && widget.metadata[client_id].type == 'LineSuggestion')
    return lineSugg
}

/**
 * Sets options for wizard suggestions according to the wizard topic
 * @param {select element} wizardTopic Select element containing the wizard topic
 */
 async function setWizardSuggestions(wizardTopic) {
    wizard_topic = wizardTopic.value;

    //let widgets = await miro.board.widgets.get()
    let response = await fetch('/suggestions?boardId=' + board_id)
    let activeSuggestions = await response.json()
    cleanWizardLists(activeSuggestions)
    

    let noteSuggChoices = document.getElementById('noteSuggestionChoices')
    let lineSuggChoices = document.getElementById('lineSuggestionChoices')
    let lineSuggStr='', noteSuggStr='';

    if(wizard_topic==WIZARD_TOPICS.COVID_19){
        noteSuggPreChoices_COVID19.forEach(sugg => {
            noteSuggStr += '<option value="' + sugg + '"/>'
        })
        lineSuggPreChoices_COVID19.forEach(sugg => {
            lineSuggStr += '<option value="' + sugg + '"/>'
        })
    
    }else if (wizard_topic==WIZARD_TOPICS.SPACE_TRAVEL){
        noteSuggPreChoices_SpaceTravel.forEach(sugg => {
            noteSuggStr += '<option value="' + sugg + '"/>'
        })
        lineSuggPreChoices_SpaceTravel.forEach(sugg => {
            lineSuggStr += '<option value="' + sugg + '"/>'
        })
    }

    noteSuggChoices.innerHTML = noteSuggStr
    lineSuggChoices.innerHTML = lineSuggStr


}

function cleanWizardLists(querySuggestions){
    
    for (const property in querySuggestions) {
        if (querySuggestions[property].type=='Note'){
            if(wizard_topic==WIZARD_TOPICS.COVID_19){
                noteSuggPreChoices_COVID19.splice(noteSuggPreChoices_COVID19.indexOf(querySuggestions[property].text), 1)
            }else if (wizard_topic==WIZARD_TOPICS.SPACE_TRAVEL){
                noteSuggPreChoices_SpaceTravel.splice(noteSuggPreChoices_SpaceTravel.indexOf(querySuggestions[property].text), 1)
            }
        }else if (querySuggestions[property].type=='Line'){
            if(wizard_topic==WIZARD_TOPICS.COVID_19){
                lineSuggPreChoices_COVID19.splice(lineSuggPreChoices_COVID19.indexOf(querySuggestions[property].text), 1)
            }else if (wizard_topic==WIZARD_TOPICS.SPACE_TRAVEL){
                lineSuggPreChoices_SpaceTravel.splice(lineSuggPreChoices_SpaceTravel.indexOf(querySuggestions[property].text), 1)
            }
        }
    }
}

async function addSuggestionCircle() {
    let widgets = await miro.board.selection.get({ metadata: {} } || {
        metadata: {
            [client_id]: {
                type: 'Cluster'
            }
        }
    } || {
        metadata: {
            [client_id]: {
                type: 'ClusterTitle'
            }
        }
    }|| {
        metadata: {
            [client_id]: {
                type: 'Topic'
            }
    }});
    //widgets=widgets.filter(widget => Object.keys(widget.metadata).length==0)
    if (widgets.length != 1) {
        miro.showNotification('Please select 1 text box/shape/sticky note first!')
    } else {
        let textElements = [];
        let textElement1 = document.getElementById('noteSuggestionText1')
        let i = 0;
        if (textElement1.value.trim() !== '') {
            textElements[i++] = textElement1.value.trim()
        }
        let textElement2 = document.getElementById('noteSuggestionText2')
        if (textElement2.value.trim() !== '') {
            textElements[i++] = textElement2.value.trim()
        }
        let textElement3 = document.getElementById('noteSuggestionText3')
        if (textElement3.value.trim() !== '') {
            textElements[i++] = textElement3.value.trim()
        }
        if (textElements.length != 0) {
            let parentType = Object.keys(widgets[0].metadata).length!==0 ? widgets[0].metadata[client_id].type : widgets[0].type
            // let appendTextToQuery = parentType=='ClusterTitle' || (Object.keys(widgets[0].metadata).length==0 && widgets[0].plainText.length < 50)

            socket.emit('addSuggestion', {
                type: 'addSuggestionCircle',
                parentText: widgets[0].plainText,
                parentType: parentType,
                text: textElements,
                x: widgets[0].bounds.right,
                y: widgets[0].bounds.top,
                parentId: widgets[0].id,
                board_id: board_id
            })

            let noteSuggChoices = document.getElementById('noteSuggestionChoices')
            noteSuggChoices.innerHTML = noteSuggChoices.innerHTML.replace('<option value="' + textElement1.value + '"></option>', '')
            noteSuggChoices.innerHTML = noteSuggChoices.innerHTML.replace('<option value="' + textElement2.value + '"></option>', '')
            noteSuggChoices.innerHTML = noteSuggChoices.innerHTML.replace('<option value="' + textElement3.value + '"></option>', '')
            textElement1.value = ''
            textElement2.value = ''
            textElement3.value = ''
        } else {
            miro.showNotification('No text entered!')
        }
    }

}

async function addSuggestionLine() {
    let widgets = await miro.board.selection.get({ metadata: {} } || {
        metadata: {
            [client_id]: {
                type: 'Cluster'
            }
        }
    } || {
        metadata: {
            [client_id]: {
                type: 'ClusterTitle'
            }
        }
    } || {
        metadata: {
            [client_id]: {
                type: 'Topic'
            }
        }})
    //widgets=widgets.filter(widget => Object.keys(widget.metadata).length==0)
    if (widgets.length != 2) {
        miro.showNotification('Please select 2 text boxes/shapes/sticky notes to connect (You can select multiple items using the ctrl button).')
    } else {

        let textElements = [];
        let textElement1 = document.getElementById('lineSuggestionText1')
        let i = 0;
        if (textElement1.value.trim() !== '') {
            textElements[i++] = textElement1.value.trim()
        }
        let textElement2 = document.getElementById('lineSuggestionText2')
        if (textElement2.value.trim() !== '') {
            textElements[i++] = textElement2.value.trim()
        }
        let textElement3 = document.getElementById('lineSuggestionText3')
        if (textElement3.value.trim() !== '') {
            textElements[i++] = textElement3.value.trim()
        }
        if (textElements.length != 0) {
            if(widgets[1].id<widgets[0].id){
                widgets=[widgets[1], widgets[0]]
            }
            let parentAType = Object.keys(widgets[0].metadata).length!==0 ? widgets[0].metadata[client_id].type : widgets[0].type
            let parentBType = Object.keys(widgets[1].metadata).length!==0 ? widgets[1].metadata[client_id].type : widgets[1].type
            // let appendTextToQuery= (parentAType=='ClusterTitle' && parentBType=='ClusterTitle')
            //console.log(parentText)
            socket.emit('addSuggestion', {
                type: 'addSuggestionLine',
                parentAText: widgets[0].plainText,
                parentBText: widgets[1].plainText,
                parentAType: parentAType,
                parentBType: parentBType,
                startWidgetId: widgets[0].id,
                endWidgetId: widgets[1].id,
                text: textElements,
                board_id: board_id
            })
            //Delete text inside lineSuggestionTexts
            let lineSuggChoices = document.getElementById('lineSuggestionChoices')
            lineSuggChoices.innerHTML = lineSuggChoices.innerHTML.replace('<option value="' + textElement1.value + '"></option>', '')
            lineSuggChoices.innerHTML = lineSuggChoices.innerHTML.replace('<option value="' + textElement2.value + '"></option>', '')
            lineSuggChoices.innerHTML = lineSuggChoices.innerHTML.replace('<option value="' + textElement3.value + '"></option>', '')
            textElement1.value = ''
            textElement2.value = ''
            textElement3.value = ''
        } else {
            miro.showNotification('No text entered!')
        }
    }
}

