from flask import Flask, request, jsonify
from flask_cors import CORS
import wikipedia
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
    "meaning of life": "42. Obviously.",
    "joke": "Why do Python programmers wear glasses? Because they don't C#.",
    "time": f"The server time is {datetime.datetime.now().strftime('%H:%M')}.",
}

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '').lower()
    
    # Check internal knowledge
    for keyword, answer in KNOWLEDGE_BASE.items():
        if keyword in user_input:
            return jsonify({"reply": f"LoganGPT: {answer}", "source": "internal"})
            
    # Math fallback
    if "+" in user_input:
        try:
            parts = user_input.split("+")
            result = int(parts[0].strip()) + int(parts[1].strip())
            return jsonify({"reply": f"LoganGPT: The answer is {result}.", "source": "calc"})
        except:
            pass

    return jsonify({"reply": "LoganGPT: I don't have that in my internal memory. Try /searchonline to check the web.", "source": "internal"})

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    query = data.get('query', '')
    
    if not query:
        return jsonify({"reply": "Please type something to search."})

    try:
        # 1. Search Wikipedia for the best matching page title
        search_results = wikipedia.search(query, results=1)
        
        if not search_results:
            return jsonify({
                "reply": f"LoganGPT (Online): I searched but found no matching articles for '{query}'.",
                "source": "web"
            })

        # 2. Get the summary of that page
        page_title = search_results[0]
        summary = wikipedia.summary(page_title, sentences=3)
        page_url = wikipedia.page(page_title).url
        
        formatted_reply = (
            f"LoganGPT (Online): Here is what I found on '{page_title}':\n\n"
            f"{summary}\n\n"
            f"🔗 Read more: {page_url}"
        )
        
        return jsonify({"reply": formatted_reply, "source": "web"})

    except wikipedia.exceptions.DisambiguationError as e:
        # Happens if you search "Mercury" (Planet? Element? Freddie?)
        options = ", ".join(e.options[:5])
        return jsonify({
            "reply": f"LoganGPT: Your search was too vague. Did you mean: {options}?",
            "source": "web"
        })
        
    except Exception as e:
        # Fallback for any other error
        print(f"Error: {e}")
        return jsonify({
            "reply": f"LoganGPT (Error): I couldn't reach the knowledge database right now. Please try a different query.",
            "source": "error"
        })

# Required for Vercel
if __name__ == '__main__':
    app.run()
