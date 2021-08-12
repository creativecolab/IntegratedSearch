from flask import Flask, render_template, jsonify, request, send_file
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO, send, emit

import eventlet

app = Flask(__name__)
cors = CORS(app)
socketio = SocketIO(app)

@socketio.on('test')
def handle_my_custom_event(json):
    print(json)
    send(json, json=True, broadcast=True)

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


@app.route('/test1', methods=['GET','POST'])
def test1():
    # POST request
    if request.method == 'POST':
        return '', 200

    # GET request
    else:
        message = {'greeting':'Hello from Flask!'}
        return jsonify(message)  # serialize and use JSON headers

if __name__ == '__main__':
    socketio.run(app)