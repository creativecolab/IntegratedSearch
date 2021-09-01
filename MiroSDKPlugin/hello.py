from enum import auto
from typing import Text
from flask import Flask, render_template, jsonify, request, send_file
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO, send, emit, join_room, leave_room

from datetime import datetime
import numpy as np
import pandas as pd
from bs4 import BeautifulSoup
import requests
import nltk
from textblob import TextBlob, Word
from gensim.models import Word2Vec
from sklearn.datasets import make_blobs
from sklearn.cluster import KMeans
import math
import re
import signal
import threading
import urllib.request

import logging

import eventlet

import firebase_admin
from firebase_admin import credentials, db

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
logging.getLogger('flask_cors').level = logging.INFO
socketio = SocketIO(app, cors_allowed_origins="*")
app.config['CORS_HEADERS'] = 'Content-Type'

cred = credentials.Certificate("MiroSDKPlugin\serviceAccountKey.json")

firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://reimagining-search-default-rtdb.firebaseio.com'
})

ref = db.reference()

client_id = "3074457360917723621"
# NLP


def scrape_website(url):
    req = requests.get(url)
    soup = BeautifulSoup(req.text, "html.parser")
    return soup

# Get p tags of BeautifulSoup object, used to parse webpages visited


def get_site_article(beautifulSoupObj):
    texts = set()
    for link in beautifulSoupObj.find_all('p'):
        texts.add(link.get_text())
    return texts

# Get each result header from Google search page


def get_query_headers(beautifulSoupObj):
    texts = set()
    for link in beautifulSoupObj.find_all('div', class_='BNeawe vvjwJb AP7Wnd'):
        texts.add(link.get_text())
    return texts

# Get each result description from Google search page


def get_query_results_descriptions(beautifulSoupObj):
    texts = set()
    for link in beautifulSoupObj.find_all('div', class_='BNeawe s3v9rd AP7Wnd'):
        texts.add(link.get_text())
    return texts

# Get common questions section from Google search page


def get_query_common_questions(beautifulSoupObj):
    texts = []
    for link in beautifulSoupObj.find_all('div', class_='Lt3Tzc'):
        texts.append(link.get_text())
    return texts

# Get query related searches from Google search page


def get_query_related_searches(beautifulSoupObj):
    texts = []
    for link in beautifulSoupObj.find_all('div', class_='BNeawe s3v9rd AP7Wnd lRVwie'):
        texts.append(link.get_text())
    return texts

def get_query_autocomplete(googleurl):
    startIndex = googleurl.find('=')
    endIndex = googleurl.find('&')
    queryString = googleurl[startIndex+1: endIndex]
    target_url = 'https://www.google.com/complete/search?q=' + queryString+'+&pq='+queryString+'&client=chrome'
    ##Naive, assuming search query has no brackets
    autocompletesuggestions=''
    for line in urllib.request.urlopen(target_url):
        googleautosugg=line.decode('utf-8')
        startBracket = googleautosugg.index('[', 1)
        endBracket = googleautosugg.index(']', 1)
        autocompletesuggestions = googleautosugg[startBracket+1: endBracket]
    autocompletesuggestions.replace('"', "" )
    return autocompletesuggestions.split(',')




def getQueryFromURL(googleurl):
    startIndex = googleurl.find('=')
    endIndex = googleurl.find('&')
    return re.sub("\+", " ", googleurl[startIndex+1: endIndex])


def setToString(set):
    return '; '.join(set)


def cleanPhrases(phrases):
    for count, phrase in enumerate(phrases):
        phrases[count] = Word(re.sub("[^a-zA-Z ]+", "", phrase).strip())
    return phrases


def getNParticle(websitedom):
    paragraphs = get_site_article(websitedom)
    paragraphString = setToString(paragraphs)
    blob = TextBlob(paragraphString)
    phrases = cleanPhrases(blob.noun_phrases)
    frequency = {}
    # iterating over the list
    for item in phrases:
        # checking the element in dictionary
        if item in frequency:
            # incrementing the count
            frequency[item] += 1
        else:
            # initializing the count
            frequency[item] = 1
    return dict(sorted(frequency.items(), key=lambda item: item[1], reverse=True))


def getNPSnippets(websitedom):
    snippets = get_query_results_descriptions(websitedom)
    snippetsString = setToString(snippets)
    blob = TextBlob(snippetsString)
    phrases = cleanPhrases(blob.noun_phrases)
    frequency = {}

    # iterating over the list
    for item in phrases:
        # checking the element in dictionary
        if item in frequency:
            # incrementing the count
            frequency[item] += 1
        else:
            # initializing the count
            frequency[item] = 1
    return dict(sorted(frequency.items(), key=lambda item: item[1], reverse=True))


def getNPSuggestions(websitedom):
    commquestions = get_query_common_questions(websitedom)
    relsearches = get_query_related_searches(websitedom)
    commquestions.update(relsearches)
    suggString = setToString(commquestions)
    blob = TextBlob(suggString)
    phrases = cleanPhrases(blob.noun_phrases)
    frequency = {}

    # iterating over the list
    for item in phrases:
        # checking the element in dictionary
        if item in frequency:
            # incrementing the count
            frequency[item] += 1
        else:
            # initializing the count
            frequency[item] = 1
    return dict(sorted(frequency.items(), key=lambda item: item[1], reverse=True))


def getNPwebpages(websitedom):
    texts = set()
    for link in websitedom.find_all('a'):
        texts.add(link.get('href'))
    texts = [x for x in texts if '/url?q=' in x]
    frequency = {}
    for count, text in enumerate(texts):
        cutoff = text.find('&')
        texts[count] = text[7: cutoff]
        article = get_site_article(scrape_website(texts[count]))
        articleString = setToString(article)
        blob = TextBlob(articleString)
        phrases = cleanPhrases(blob.noun_phrases)
        for item in phrases:
            # checking the element in dictionary
            if item in frequency:
                # incrementing the count
                frequency[item] += 1
            else:
                # initializing the count
                frequency[item] = 1
    return dict(sorted(frequency.items(), key=lambda item: item[1], reverse=True))


def getNPmiro(boardWidgetsTexts):
    texts = set()
    for text in boardWidgetsTexts:
        texts.add(text)
    textString = setToString(texts)
    blob = TextBlob(textString)
    phrases = cleanPhrases(blob.noun_phrases)
    frequency = {}
    for item in phrases:
        # checking the element in dictionary
        if item in frequency:
            # incrementing the count
            frequency[item] += 1
        else:
            # initializing the count
            frequency[item] = 1
    return dict(sorted(frequency.items(), key=lambda item: item[1], reverse=True))


# WEB SOCKET
@socketio.on('query')
def scrape_search(json):
    room = 'wizard' + json['boardId']
    websitedom = scrape_website(json['url'])
    commquestions = get_query_common_questions(websitedom)
    relsearches = get_query_related_searches(websitedom)
    autocomplete = get_query_autocomplete(json['url'])
    npsuggestions = {'type': 'suggestions',
                     'url': json['url'],
                     'query': getQueryFromURL(json['url']),
                     'commquestions': commquestions,
                     'relsearches': relsearches,
                     'autocomplete': autocomplete}
    browser_history_ref = ref.child('browser_history/' + json['boardId'])
    time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')

    NPsnippets = getNPSnippets(websitedom)
    send(npsuggestions, json=True, to=room)
    npsnippets = {'type': 'snippets',
                  'url': json['url'],
                  'query': getQueryFromURL(json['url']),
                  'np': NPsnippets}
    browser_history_ref.push().set({
        "url": json['url'],
        "timestamp": time,
        "related_searches": relsearches,
        "people_also_ask": commquestions,
        "autocomplete": autocomplete
    })
    send(npsnippets, json=True, to=room)

# Takes in url and scrapes its paragraph contents
# then sends it to wizardin interface


@socketio.on('url')
def scrape_url(json):
    browser_history_ref = ref.child('browser_history/' + json['boardId'])
    time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')
    websitedom = scrape_website(json['url'])
    NParticle = getNParticle(websitedom)
    #to clear data
    #browser_history_ref.delete()

    browser_history_ref.push().set({
        "url": json['url'],
        "timestamp": time,
        "article": NParticle
    })
    nparticle = {
        'type': 'articles',
        'url': json['url'],
        'np': NParticle}
    room = 'wizard' + json['boardId']
    send(nparticle, json=True, to=room)


@socketio.on('widgets')
def wizard_widget_texts(json):
    board_history_ref = ref.child('board_history/' + json['boardId'])
    time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')
    # To clear data for board
    #board_history_ref.delete()

    board_history_ref.push().set({
        "content": json['widgets'],
        "timestamp": time,
    })

    widgetTypes = ['SHAPE', 'STICKER', 'TEXT']
    customWidgetTypes = ['Topic', 'Cluster', 'ClusterTitle']
    filteredWidgets = [x for x in json['widgets'] if x['type'] in widgetTypes
                       and (not x['metadata'] or x['metadata'][client_id]['type'] in customWidgetTypes)]
    widgetTexts = list(map(lambda x: x['plainText'], filteredWidgets))
    npmiro = {
        'type': 'miro',
        'np': getNPmiro(list(widgetTexts))
    }
    room = 'wizard' + json['boardId']
    send(npmiro, json=True, to=room)


# @socketio.on('viewportWidgets')
# def store_viewport_widgets(json):
#     viewport_history_ref = ref.child('viewport_history/' + json['boardId'])
#     time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')

#     #To clear data
#     #viewport_history_ref.delete()

#     viewport_history_ref.push().set({
#         "content": json['widgets'],
#         "timestamp": time,
#     })


@socketio.on('addSuggestion')
def add_suggestion(json):
    suggestions_ref = ref.child(
        'suggestions/' + json['board_id'])
    widgets_with_suggestions_ref = ref.child(
        'widgets_with_suggestions/' + json['board_id'])
    if json['type'] == 'addSuggestionLine':
        suggType = 'Line'
        parentIdA = json['startWidgetId']
        parentIdB = json['endWidgetId']
        currSuggestions = widgets_with_suggestions_ref.child(
            parentIdA+'_' + parentIdB).get()

        time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')
        for text in json['text']:
            suggestionKey = suggestions_ref.push().key
            suggestions_ref.child(suggestionKey).set({
                "text": text,
                "type": suggType,
                "parentA_Id": parentIdA,
                "parentA_type": json['parentAType'],
                "parentA_text": json['parentAText'],
                "parentB_Id": parentIdB,
                "parentB_type": json['parentBType'],
                "parentB_text": json['parentBText'],
                "status": 1,  # Status measures: 1 for not clicked, 2 for opened sidebar, 3 for opened card suggestions on board, 4 for queried, 5 for deleted
                "time_created": time
            })

            widgets_with_suggestions_ref.child(
                parentIdA+'_' + parentIdB + '/' +suggestionKey ).set({'status': 1})
        if not bool(currSuggestions) or 'suggCirc_Id' not in currSuggestions:
            emit("addWidget", json, to=json['board_id'], include_self=False)
        else:
            emit("updateSuggCircle", json, to=json['board_id'], include_self=False)

    else:
        suggType = 'Note'
        parentId = json['parentId']
        currSuggestions = widgets_with_suggestions_ref.child(parentId).get()
        time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')
        for text in json['text']:
            suggestionKey = suggestions_ref.push().key
            suggestions_ref.child(suggestionKey).set({
                "text": text,
                "type": suggType,
                "parent_Id": parentId,
                "parent_type": json['parentType'],
                # DB stores the parent text at time of CREATION
                "parent_text": json['parentText'],
                "status": 1,
                "time_created": time
            })
            widgets_with_suggestions_ref.child(parentId + '/' + suggestionKey).set({'status' : 1})

        if not bool(currSuggestions) or 'suggCirc_Id' not in currSuggestions:
            emit("addWidget", json, to=json['board_id'], include_self=False)
        else:
            emit("updateSuggCircle", json, to=json['board_id'], include_self=False)

    board_ref = ref.child('boards/' + json['board_id'])
    board = board_ref.get()
    if 'suggestion_cnt' in board:
        print(board['suggestion_cnt'])
        board_ref.update({
            "suggestion_cnt": board['suggestion_cnt'] + len(json['text'])
        })
        emit('updateCnt', {"suggestion_cnt": board['suggestion_cnt']+len(json['text'])}, to=json['board_id'])
    else:
        board_ref.update({
            "suggestion_cnt": len(json['text'])
        })
        emit('updateCnt', {"suggestion_cnt": len(json['text'])}, to=json['board_id'])
    #json['suggestionKeys'] = suggestionKeys
    # print(json)


@socketio.on('removeSuggestion')
def remove_suggestion(json):
    suggId = json['sugg_DbId']
    widgets_with_suggestions_ref = ref.child(
        'widgets_with_suggestions/' + json['board_id'])
    if json['type']=='Note':
        widgets_with_suggestions_ref.child(json['parent_Id'] + '/' + suggId).delete()
    elif json['type'] == 'Line':
        widgets_with_suggestions_ref.child(json['parentA_Id'] + '_' + json['parentB_Id'] +'/' + suggId).delete()
    suggestions_ref = ref.child('suggestions/' + json['board_id'])
    time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')
    suggestions_ref.child(suggId).update({
        'status': 5,
        'time_updated': time
    })
    board_ref = ref.child('boards/' + json['board_id'])
    board = board_ref.get()
    board_ref.update({
        "suggestion_cnt": board['suggestion_cnt'] - 1
    })
    emit('updateCnt', {"suggestion_cnt": board['suggestion_cnt']-1}, to=json['board_id'])
    emit('removeSuggestion', json, to=json['board_id'], include_self=False)

@socketio.on('queriedSuggestion')
def query_suggestion(json):
    suggId = json['sugg_DbId']
    suggestions_ref = ref.child('suggestions/' + json['board_id'])
    time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')
    currStatus = suggestions_ref.child(suggId + '/status').get()
    suggestions_ref.child(suggId).update({
        'status': max(4, currStatus),
        'time_updated': time
    })
    emit('queriedSuggestion', json, to=json['board_id'], include_self=False)


@socketio.on('json')
def handle_widgets(json):
    emit("addWidget", json, to=json['board_id'])


@socketio.on('connectToRoom')
def connect_to_room(json):
    room = json['board_id']
    join_room(room)
    print("Joined " + room)
    return 'Connected to room!'


@socketio.on('suggestionClicked')
def update_suggestion_count(json):
    if json['type'] == 'remove':
        board_ref = ref.child('boards/' + json['board_id'])
        board = board_ref.get()
        board_ref.update({
            "suggestion_cnt": board['suggestion_cnt']-1
        })

    emit('updateCnt', {
        "type": json['type'],
        "suggestion_cnt": board['suggestion_cnt']-1,
        "suggestion_id": json['suggestion_id']
    }, to=json['board_id'])


@socketio.on('popup')
def send_popup_data(json):
    popup_history_ref = ref.child('popup_history/' + json['boardId'])
    try:
        popup_history_ref.push().set({
            'text': json['text'],
            'type': json['type'],
            'parentA': json['parentA'],
            'parentB': json['parentB']
        })
    except KeyError:
        popup_history_ref.push().set({
            'text': json['text'],
            'type': json['type'],
            'parentA': json['parentA']
        })


@socketio.on('showSidebar')
def change_sidebar(json):
    print(json)
    emit('showSidebar', json, to=json['boardId'])


@socketio.on('hideSidebar')
def change_sidebar(json):
    print(json)
    emit('hideSidebar', json, to=json['boardId'])

@socketio.on('getIssuedSuggestion')
def get_issued_suggestion(json):
    emit('getIssuedSuggestion', json, to=json['boardId'])

@socketio.on('sidebarOpened')
def store_sidebar_(json):
    sidebar_ref = ref.child('sidebar_opened/' + json['board_id'])
    time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')
    sidebar_ref.push({'time': time})

# FLASK ROUTING
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/sidebar.html')
def sidebar():
    return render_template('sidebar.html')


@app.route('/toolbar.html')
def toolbar():
    return render_template('toolbar.html')


@app.route('/wizardSidebar.html')
def wizard_sidebar():
    return render_template('wizardSidebar.html')


@app.route('/wizardPhrases.html')
def wizard_phrases():
    return render_template('wizardPhrases.html')

@app.route('/startPage.html')
def start_page():
    return render_template('startPage.html')


@app.route('/suggestions', methods=['GET', 'POST'])
def active_suggestions():
    if request.method == 'GET':
        if 'sugg_id' in request.args:
            suggestions_ref = ref.child(
                'suggestions/' + request.args.get('boardId') + '/' + request.args.get('sugg_id'))
            suggestions = suggestions_ref.get()
        elif 'parent_id' in request.args:
            suggestions_ref = ref.child(
                'widgets_with_suggestions/' + request.args.get('boardId') + '/' + request.args.get('parent_id'))
            
            suggestions = suggestions_ref.get()
        else:
            suggestions_ref = ref.child(
                'suggestions/' + request.args.get('boardId'))
            suggestions = suggestions_ref.order_by_child(
                'status').end_at(4).get()
        return jsonify(suggestions)
    elif request.method == 'POST':
        json = request.get_json()
        suggestions_ref = ref.child('suggestions/' + json['board_id'])
        suggId = json['sugg_DbId']
        currStatus = suggestions_ref.child(suggId + '/status').get()
        time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')
        if 'suggCirc_Id' in json:
            suggestions_ref.child(suggId).update({
                'status': max(json['status'], currStatus),
                'suggCirc_Id': json['suggCirc_Id'],
                'time_updated': time
            })
        else:
            suggestions_ref.child(suggId).update({
                'status': max(json['status'], currStatus),
                'time_updated': time
            })
        return 'Success', 200

@app.route('/suggestionCircleClicked', methods=['POST'])
def suggestion_circle_clicked():
    if request.method == 'POST':
        json = request.get_json()
        time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')
        json['time'] = time
        suggestion_circle_clicked_ref = ref.child('suggestion_circle_clicked/' + json['board_id'] + '/' + json['parent_id'])
        key = suggestion_circle_clicked_ref.push().key
        suggestion_circle_clicked_ref.child(key).set(json['suggestionIds'])
        suggestion_circle_clicked_ref.child(key).update({'time': time})
    return 'Success', 200

@app.route('/suggestionCircle', methods=['POST', 'GET'])
def add_suggestion_circle():
    if request.method=='POST':

        json = request.get_json()
        widgets_with_suggestions_ref = ref.child(
            'widgets_with_suggestions/' + json['board_id'])
        print(json)
        widgets_with_suggestions_ref.child(json['widget_id']).update({
            'suggCirc_Id': json['suggCirc_Id']
        })
        return 'Success', 200
    else:
        widgets_with_suggestions_ref = ref.child(
            'widgets_with_suggestions/' + request.args.get('board_id') + '/' + request.args.get('parent_id'))
        suggCirc_Id = widgets_with_suggestions_ref.get()
        print(suggCirc_Id)
        return jsonify(suggCirc_Id)


@app.route('/studyDesign', methods=['GET', 'POST'])
def test1():
    # POST request
    board_ref = ref.child('boards/' + request.args.get('boardId'))
    if request.method == 'POST':
        json = request.get_json()
        time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')
        board_ref.update({
            "studyType": json['studyType'],
            "topicTask": json['topicTask'],
            "lastUpdated": time
        })
        return 'Added to database', 200

    # GET request
    else:
        message = board_ref.get()
        print(message)
        return jsonify(message)  # serialize and use JSON headers


if __name__ == '__main__':
    socketio.run(app)
