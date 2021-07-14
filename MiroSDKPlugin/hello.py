from flask import Flask, render_template, jsonify, request


app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')

def createLine(widgets):
    if len(widgets['widgets'])>=2:
        line={
            'type': "line",
            'startWidgetID': widgets['widgets'][0]['id'],
            'endWidgetID': widgets['widgets'][1]['id']
        }
        return jsonify(line)
    else:
        return 'OK'

@app.route('/test1', methods=['GET','POST'])
def test1():
    # POST request
    if request.method == 'POST':
        print(request.get_json())
        return createLine(request.get_json()), 200

    # GET request
    else:
        message = {'greeting':'Hello from Flask!'}
        return jsonify(message)  # serialize and use JSON headers

    