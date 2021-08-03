from flask import Flask, render_template, jsonify, request, send_file
app = Flask(__name__)

app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True

data = 2

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/sidebar.html')
def sidebar():
    return render_template('sidebar.html')

@app.route('/toolbar.html')
def toolbar():
    return render_template('toolbar.html')

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
        return '', 200

    # GET request
    else:
        message = {'greeting':'Hello from Flask!'}
        return jsonify(message)  # serialize and use JSON headers

@app.route('/image')
def get_image():
    if request.args.get('type') == '1':
       filename = 'ok.gif'
    else:
       filename = 'error.gif'
    return send_file(filename, mimetype='image/gif')