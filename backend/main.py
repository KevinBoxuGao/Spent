import logging
from flask import Flask, jsonify, request
import flask_cors
from google.appengine.ext import ndb
import google.auth.transport.requests
import google.oauth2.id_token
import requests_toolbelt.adapters.appengine
import calendar
import time

requests_toolbelt.adapters.appengine.monkeypatch()
HTTP_REQUEST = google.auth.transport.requests.Request()

app = Flask(__name__)
flask_cors.CORS(app)

class Account(ndb.Model):
    email = ndb.StringProperty()
    expenses = ndb.StringProperty(repeated=True)
    created = ndb.DateTimeProperty(auto_now_add=True)

def query_database(user_id):
    ancestor_key = ndb.Key(Account, user_id)
    query = Account.query(ancestor=ancestor_key).order(-Account.created)
    accountData = query.fetch()

    acDataParsed = []
    if len(accountData) > 0:
        accountData = accountData[0]
        acDataParsed.append({
            'key'       : accountData.key,
            'expenses'     : accountData.expenses,
            'created'   : accountData.created
        })

    return acDataParsed

def dollar(x):
    return '$'+str(round(x, 2))

def stats(data):
    daily = 0
    weekly = 0
    monthly = 0
    alltime = 0
    for transaction in data:
        transaction[2] = float(transaction[2])
        transaction[0] = float(transaction[0])
        if time.time()-transaction[2] < 86400:
            daily += transaction[0]
            weekly += transaction[0]
            monthly += transaction[0]
            alltime += transaction[0]
        elif time.time()-transaction[2] < 604800:
            weekly += transaction[0]
            monthly += transaction[0]
            alltime += transaction[0]
        elif time.time()-transaction[2] < 2592000:
            monthly += transaction[0]
            alltime += transaction[0]
        else:
            alltime += transaction[0]
    return [dollar(daily), dollar(weekly), dollar(monthly), dollar(alltime)]

def renderTransactions(data):
    data.reverse()
    html = """<thead>
            <tr>
              <td class="ttext"><h3>Date</h3></td>
              <td class="ttext"><h3>Description</h3></td>
              <td class="ttext"><h3>Amount</h3></td> 
            </tr>
          </thead>\n\n"""
    for transaction in data:
        html += '<tr><td class="ttext">'+time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(float(transaction[2])-14400))+'</td>\n<td class="ttext">'+str(transaction[1])+'</td>\n<td class="ttext">$'+str(transaction[0])+'</td></tr>\n\n\n'
    return html

@app.route('/accountdata', methods=['GET'])
def getdata():
    """Returns a list of notes added by the current Firebase user."""

    # Verify Firebase auth.
    # [START gae_python_verify_token]
    id_token = request.headers['Authorization'].split(' ').pop()
    claims = google.oauth2.id_token.verify_firebase_token(
        id_token, HTTP_REQUEST)
    if not claims:
        return 'Unauthorized', 401
    # [END gae_python_verify_token]

    data = query_database(claims['sub'])[0]['expenses']
    data2 = []
    for i in range(0, len(data), 3):
        data2.append([data[i], data[i+1], data[i+2]])
   
    return jsonify([stats(data2), renderTransactions(data2)])


@app.route('/accountdata', methods=['POST', 'PUT'])
def addexpense():

    # Verify Firebase auth.
    id_token = request.headers['Authorization'].split(' ').pop()
    claims = google.oauth2.id_token.verify_firebase_token(
        id_token, HTTP_REQUEST)
    if not claims:
        return 'Unauthorized', 401

    json = request.get_json()
    data = query_database(claims['sub'])

    if len(data) == 0:
        return "Unregistered", 401
    try:
        val = float(str(json['expense1']).replace('$', ''))
    except:
        return 'Bad Value', 401

    data = data[0]
    acData = Account(
        parent=ndb.Key(Account, claims['sub']),
        expenses=data['expenses']+[str(val), json['expense2'], str(time.time())])

    # Some providers do not provide one of these so either can be used.
    acData.email = claims.get('name', claims.get('email', 'Unknown'))

    acData.put()
    return 'OK', 200

@app.route('/register', methods=['POST', 'PUT'])
def register():

    # Verify Firebase auth.
    id_token = request.headers['Authorization'].split(' ').pop()
    claims = google.oauth2.id_token.verify_firebase_token(
        id_token, HTTP_REQUEST)
    if not claims:
        return 'Unauthorized', 401
    data = query_database(claims['sub'])
    if len(data) == 0:
        acData = Account(
            parent=ndb.Key(Account, claims['sub']),
            email = claims.get('name', claims.get('email', 'Unknown')),
            expenses=[])

        acData.put()

    return 'OK', 200


@app.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500
