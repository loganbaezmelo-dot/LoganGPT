from flask import Flask, request, jsonify
from flask_cors import CORS
import wikipedia
import datetime

app = Flask(__name__)
CORS(app)

KNOWLEDGE_BASE = {
    "hello": "Hello! I am LoganGPT.",
    "hi": "Hi there! How can I help?",
    "name": "My name is LoganGPT.",
    "creator": "I was created by a developer using React and Python.",
    "meaning of life": "42.",
    "joke": "Why do Python programmers wear glasses? Because they don't C#.",
    "time": f"Server time: {datetime.datetime.now().strftime('%H:%M')}.",
}

def perform_search(query):
    try:
        # 1. Search for the query (get top result)
        search_results = wikipedia.search(query, results=1)
        
        if not search_results:
            return f"I searched the web but found no results for '{query}'."

        page_title = search_results[0]

        try:
            # 2. Try to get the summary directly
            # auto_suggest=False prevents it from guessing wrong and crashing
            summary = wikipedia.summary(page_title, sentences=2, auto_suggest=False)
        
        except wikipedia.exceptions.DisambiguationError as e:
            # 3. FIX FOR "Wii": If vague, pick the first option automatically
            page_title = e.options[0]
            summary = wikipedia.summary(page_title, sentences=2, auto_suggest=False)
            
        except wikipedia.exceptions.PageError:
            # Fallback if the specific page title fails to load
            return f"I found a page named '{page_title}' but couldn't read its content. Try being more specific."

        # 4. FIX FOR "Wii U": Construct URL manually to avoid library crashes
        # The library crashes when generating URLs for titles with symbols sometimes.
        clean_url_title = page_title.replace(" ", "_")
        wiki_url = f"https://en.wikipedia.org/wiki/{clean_url_title}"
        
        return (
            f"Here is what I found on '{page_title}':\n\n"
            f"{summary}\n\n"
            f"🔗 Read more: {wiki_url}"
        )

    except Exception as e:
        return f"I encountered a search error: {str(e)}"

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '')
    user_input_lower = user_input.lower()
    
    # 1. Check Internal Knowledge
    for keyword, answer in KNOWLEDGE_BASE.items():
        if keyword in user_input_lower:
            return jsonify({
                "reply": f"LoganGPT (Internal): {answer}",
                "source": "internal"
            })
            
    # 2. Check Math
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

    # 3. Auto-Web Search
    search_result = perform_search(user_input)
    
    return jsonify({
        "reply": f"LoganGPT (Auto-Web): {search_result}",
        "source": "web"
    })

@app.route('/api/search', methods=['POST'])
def search_manual():
    data = request.json
    query = data.get('query', '')
    if not query: return jsonify({"reply": "Please type something."})
    result = perform_search(query)
    return jsonify({"reply": f"LoganGPT (Manual): {result}", "source": "web"})

if __name__ == '__main__':
    app.run()
