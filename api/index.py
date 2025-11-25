from flask import Flask, request, jsonify
from flask_cors import CORS
from duckduckgo_search import DDGS
import datetime

app = Flask(__name__)
CORS(app)

# --- INTERNAL KNOWLEDGE ---
KNOWLEDGE_BASE = {
    "hello": "Hello! I am LoganGPT, your personal AI assistant.",
    "hi": "Hi there! How can I help you today?",
    "name": "My name is LoganGPT.",
    "creator": "I was created by a developer using React and Python.",
    "weather": "I can't feel the wind, but I can search online if you type /searchonline!",
    "color": "I dream in shades of midnight blue and electric green.",
    "meaning of life": "42. Obviously.",
    "joke": "Why do Python programmers wear glasses? Because they don't C#.",
    "time": f"I don't have a watch, but the server says it's {datetime.datetime.now().strftime('%Y-%m-%d')}.",
}

def get_smart_response(user_input):
    user_input = user_input.lower()
    
    # 1. Check dictionary
    for keyword, answer in KNOWLEDGE_BASE.items():
        if keyword in user_input:
            return answer
            
    # 2. Math
    if "+" in user_input:
        try:
            parts = user_input.split("+")
            result = int(parts[0].strip()) + int(parts[1].strip())
            return f"The answer is {result}."
        except:
            pass
            
    return "I don't have that in my internal memory. Try asking about 'Python', 'Jokes', or use /searchonline for real news."

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '')
    response_text = get_smart_response(user_input)
    return jsonify({"reply": f"LoganGPT: {response_text}", "source": "internal"})

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    query = data.get('query', '')
    
    if not query:
        return jsonify({"reply": "Please type a query to search."})

    try:
        # Perform the Real Search using DuckDuckGo
        # We limit to 3 results to keep it fast for Vercel Free Tier
        results = DDGS().text(query, max_results=3)
        
        # Format the results nicely
        formatted_response = f"LoganGPT (Online): Here is what I found for '{query}':\n\n"
        
        if not results:
             formatted_response += "No results found. The web is quiet today."
        
        for result in results:
            title = result.get('title', 'No Title')
            link = result.get('href', '#')
            body = result.get('body', 'No summary available.')
            
            formatted_response += f"🔹 {title}\n{body}\nSource: {link}\n\n"

    except Exception as e:
        # Fallback if the search fails (sometimes happens on free servers)
        formatted_response = f"LoganGPT (Error): I tried to search, but the connection timed out. Error: {str(e)}"

    return jsonify({
        "reply": formatted_response,
        "source": "web"
    })

if __name__ == '__main__':
    app.run()
