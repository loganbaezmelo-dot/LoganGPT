from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime

app = Flask(__name__)
CORS(app)

# --- THE INTERNAL BRAIN ---
# You can add as many facts here as you want!
# Format: "keyword": "The answer"
KNOWLEDGE_BASE = {
    "hello": "Hello! I am LoganGPT, your personal AI assistant.",
    "hi": "Hi there! How can I help you today?",
    "name": "My name is LoganGPT.",
    "creator": "I was created by a developer using React and Python.",
    "weather": "I can't feel the wind, but I can search online if you type /searchonline!",
    "color": "I dream in shades of midnight blue and electric green.",
    "meaning of life": "42. Obviously.",
    "joke": "Why do Python programmers wear glasses? Because they don't C#.",
    "python": "Python is a powerful programming language. I am written in it!",
    "javascript": "JavaScript powers the internet. My frontend is built with it.",
    "react": "React is a JavaScript library for building user interfaces.",
    "time": f"I don't have a watch, but the server says it's {datetime.datetime.now().strftime('%Y-%m-%d')}.",
    "food": "I consume data and electricity. Delicious.",
    "capital": "I know many capitals! The capital of France is Paris. The capital of Japan is Tokyo.",
    "love": "I am a robot, so I don't feel love, but I appreciate your company!",
    "tired": "You should rest! Coding is hard work.",
    "money": "Money makes the world go round, but I run on free Vercel hosting.",
    "music": "I like electronic music. Beep boop."
}

def get_smart_response(user_input):
    """
    Scans the user input for keywords found in the KNOWLEDGE_BASE.
    """
    user_input = user_input.lower()

    # 1. Check for specific keywords in the dictionary
    for keyword, answer in KNOWLEDGE_BASE.items():
        if keyword in user_input:
            return answer
    
    # 2. Basic Math (Simple addition calculator)
    if "+" in user_input:
        try:
            parts = user_input.split("+")
            result = int(parts[0].strip()) + int(parts[1].strip())
            return f"The answer is {result}."
        except:
            pass

    # 3. Fallback if no keywords match
    return "I don't have that in my internal memory yet. Try asking about 'Python', 'Jokes', 'Time', or use /searchonline to find out more."

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '')
    
    # Get a specific response based on input
    response_text = get_smart_response(user_input)
    
    return jsonify({
        "reply": f"LoganGPT: {response_text}",
        "source": "internal"
    })

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    query = data.get('query', '')
    
    # Keep the simulated search logic
    return jsonify({
        "reply": f"LoganGPT (Online): I searched the web for '{query}'.\n\nResult: This is a widely discussed topic. Top sources indicate that '{query}' is trending relevant to current events.",
        "source": "web"
    })

# Required for Vercel
if __name__ == '__main__':
    app.run()
