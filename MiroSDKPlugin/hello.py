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
# users_ref = ref.child('users')
# users_ref.set({
#     'alanisawesome': {
#         'date_of_birth': 'June 23, 1912',
#         'full_name': 'Alan Turing'
#     },
#     'gracehop': {
#         'date_of_birth': 'December 9, 1906',
#         'full_name': 'Grace Hopper'
#     }
# })

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
    texts = set()
    for link in beautifulSoupObj.find_all('div', class_='Lt3Tzc'):
        texts.add(link.get_text())
    return texts

# Get query related searches from Google search page


def get_query_related_searches(beautifulSoupObj):
    texts = set()
    for link in beautifulSoupObj.find_all('div', class_='BNeawe s3v9rd AP7Wnd lRVwie'):
        texts.add(link.get_text())
    return texts


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
    print(json)
    room = 'wizard' + json['boardId']
    websitedom = scrape_website(json['url'])
    NPsuggestions = getNPSuggestions(websitedom)
    print(NPsuggestions)
    npsuggestions = {'type': 'suggestions',
                     'url': json['url'],
                     'query': getQueryFromURL(json['url']),
                     'np': NPsuggestions}
    browser_history_ref = ref.child('browser_history/' + json['boardId'])
    time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')
    browser_history_ref.push().set({
        "url": json['url'],
        "timestamp": time,
        "suggestions": NPsuggestions
    })
    send(npsuggestions, json=True, to=room)
    npsnippets = {'type': 'snippets',
                  'url': json['url'],
                  'query': getQueryFromURL(json['url']),
                  'np': getNPSnippets(websitedom)}
    send(npsnippets, json=True, to=room)

# Takes in url and scrapes its paragraph contents
# then sends it to wizardin interface


@socketio.on('url')
def scrape_url(json):
    print(json)

    browser_history_ref = ref.child('browser_history/' + json['boardId'])
    time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')

    browser_history_ref.push().set({
        "url": json['url'],
        "timestamp": time,
    })
    websitedom = scrape_website(json['url'])
    nparticle = {
        'type': 'articles',
        'url': json['url'],
        'np': getNParticle(websitedom)}
    print(nparticle)
    room = 'wizard' + json['boardId']
    send(nparticle, json=True, to=room)


@socketio.on('widgets')
def wizard_widget_texts(json):
    board_history_ref = ref.child('board_history/' + json['boardId'])
    time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')

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

@socketio.on('viewportWidgets')
def store_viewport_widgets(json):
    viewport_history_ref = ref.child('viewport_history/' + json['boardId'])
    time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')
    viewport_history_ref.push().set({
        "content": json['widgets'],
        "timestamp": time,
    })


@socketio.on('wizardSuggestion')
def handle_wizard_suggestion(json):
    suggType, parentIdA, parentIdB = None, None, None
    wizard_suggestions_ref = ref.child(
        'wizard_suggestions/' + json['board_id'])
    if json['type'] == 'addSuggestionLine':
        suggType = 'Line'
        parentIdA = json['startWidgetId']
        parentIdB = json['endWidgetId']
        time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')
        wizard_suggestions_ref.push().set({
            "text": json['text'],
            "type": suggType,
            "parentA": {
                "parentId": parentIdA,
                "type": json['parentAType'],
                "text": json['parentAText']
            },
            "parentB": {
                "parentId": parentIdB,
                "type": json['parentBType'],
                "text": json['parentBText']
            },
            "timestamp": time
        })
    else:
        suggType = 'Note'
        parentIdA = json['parentId']
        time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')
        wizard_suggestions_ref.push().set({
            "text": json['text'],
            "type": suggType,
            "parentA": {
                "parentId": parentIdA,
                "type": json['parentType'],
                "text": json['parentText']
            },
            "timestamp": time
        })
    board_ref = ref.child('boards/' + json['board_id'])
    board = board_ref.get()
    print(board)
    print('suggestion_cnt' in board)
    if 'suggestion_cnt' in board:
        print(board['suggestion_cnt'])
        board_ref.update({
            "suggestion_cnt": board['suggestion_cnt']+1
        })
        emit('updateCnt', {"type": "add", "suggestion_cnt": board['suggestion_cnt']+1}, to=json['board_id'])
    else:
        board_ref.update({
            "suggestion_cnt": 1
        })
        emit('updateCnt', {"type": "add", "suggestion_cnt": 1}, to=json['board_id'])
    send(json, json=True, to=json['board_id'])


@socketio.on('json')
def handle_widgets(json):
    send(json, json=True, to=json['board_id'])


@socketio.on('connectToRoom')
def connect_to_room(json):
    room = json['board_id']
    join_room(room)
    print("Joined " + room)
    if len(room)==12:
        board_ref = ref.child('boards/' + json['board_id'])
        return board_ref.get()
    return 'Connected to room!'


@socketio.on('suggestionClicked')
def update_suggestion_count(json):
    board_ref = ref.child('boards/' + json['board_id'])
    board = board_ref.get()
    board_ref.update({
        "suggestion_cnt": board['suggestion_cnt']-1
    })
    print('updated suggestion cnt!')
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


@app.route('/studyDesign', methods=['GET', 'POST'])
def test1():
    # POST request
    board_ref = ref.child('boards/' + request.args.get('boardId'))
    json = request.get_json()
    if request.method == 'POST':
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
        return jsonify(message)  # serialize and use JSON headers


if __name__ == '__main__':
    socketio.run(app)
