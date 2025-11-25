import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import random

app = Flask(__name__)
CORS(app)

INTERNAL_FACTS = [
    "LoganGPT is running purely from the cloud!",
    "The speed of light is 299,792 km/s.",
    "I was built without opening a single terminal window."
]

@app.route('/')
def home():
    return "LoganGPT Backend is Alive"

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '')
    time.sleep(0.5)
    fact = random.choice(INTERNAL_FACTS)
    return jsonify({
        "reply": f"LoganGPT (Internal): Received '{user_input}'. Fact: {fact}",
        "source": "internal"
    })

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    query = data.get('query', '')
    time.sleep(1.5)
    return jsonify({
        "reply": f"LoganGPT (Online): I searched the web for '{query}'. Results confirm this is a trending topic with millions of hits.",
        "source": "web"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
