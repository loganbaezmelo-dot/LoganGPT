from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time

app = Flask(__name__)
CORS(app)

INTERNAL_FACTS = [
    "I am running on Vercel Serverless Functions!",
    "This hosting is 100% free.",
    "The server sleeps when not in use but wakes up instantly."
]

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '')
    # Simulated logic
    fact = random.choice(INTERNAL_FACTS)
    return jsonify({
        "reply": f"LoganGPT (Internal): {fact}",
        "source": "internal"
    })

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    query = data.get('query', '')
    return jsonify({
        "reply": f"LoganGPT (Online): I searched Vercel for '{query}'. Result: Highly Relevant.",
        "source": "web"
    })

# Vercel requires this specific handling for serverless
if __name__ == '__main__':
    app.run()
