from flask import Flask, request, jsonify
from flask_cors import CORS
import wikipedia
import datetime

app = Flask(__name__)
CORS(app)

# --- INTERNAL KNOWLEDGE ---
KNOWLEDGE_BASE = {
    "hello": "Hello! I am LoganGPT.",
    "hi": "Hi there! How can I help?",
    "name": "My name is LoganGPT.",
    "creator": "I was created by a developer using React and Python.",
    "weather": "I can't feel the wind, but I can check the web if you ask for a specific city.",
    "meaning of life": "42.",
    "joke": "Why do Python programmers wear glasses? Because they don't C#.",
    "time": f"Server time: {datetime.datetime.now().strftime('%H:%M')}.",
}

def perform_search(query):
    """
    Helper function to search Wikipedia.
    Used by both the /search command AND the auto-fallback.
    """
    try:
        # 1. Search Wikipedia
        search_results = wikipedia.search(query, results=1)
        
        if not search_results:
            return f"I checked my database and the web, but found no results for '{query}'."

        # 2. Get Summary
        page_title = search_results[0]
        summary = wikipedia.summary(page_title, sentences=2)
        page_url = wikipedia.page(page_title).url
        
        return (
            f"Here is what I found on the web regarding '{page_title}':\n\n"
            f"{summary}\n\n"
            f"🔗 Read more: {page_url}"
        )

    except wikipedia.exceptions.DisambiguationError as e:
        options = ", ".join(e.options[:3])
        return f"That topic is too vague. Did you mean: {options}?"
        
    except Exception as e:
        return f"I tried to search the web, but hit an error: {str(e)}"

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '')
    user_input_lower = user_input.lower()
    
    # 1. PRIORITY: Check Internal Knowledge Base
    for keyword, answer in KNOWLEDGE_BASE.items():
        if keyword in user_input_lower:
            return jsonify({
                "reply": f"LoganGPT (Internal): {answer}",
                "source": "internal"
            })
            
    # 2. PRIORITY: Check Math
    if "+" in user_input:
        try:
            parts = user_input.split("+")
            result = int(parts[0].strip()) + int(parts[1].strip())
            return jsonify({
                "reply": f"LoganGPT (Calc): The answer is {result}.",
                "source": "internal"
            })
        except:
            pass

    # 3. FALLBACK: Auto-Search the Web
    # If we reached here, we don't know the answer internally.
    # Instead of giving up, we search automatically.
    search_result = perform_search(user_input)
    
    return jsonify({
        "reply": f"LoganGPT (Auto-Web): {search_result}",
        "source": "web"
    })

@app.route('/api/search', methods=['POST'])
def search_manual():
    # This route stays for when the user EXPLICITLY uses /searchonline
    data = request.json
    query = data.get('query', '')
    
    if not query:
        return jsonify({"reply": "Please type something to search."})

    result = perform_search(query)
    
    return jsonify({
        "reply": f"LoganGPT (Manual Search): {result}",
        "source": "web"
    })

if __name__ == '__main__':
    app.run()
