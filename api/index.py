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
        # SEARCH WIKIPEDIA
        # We limit results to 1 to be fast
        search_results = wikipedia.search(query, results=1)
        
        if not search_results:
            return f"I checked the web but found no results for '{query}'."

        page_title = search_results[0]

        # GET SUMMARY
        try:
            summary = wikipedia.summary(page_title, sentences=2, auto_suggest=False)
        except wikipedia.exceptions.DisambiguationError as e:
            # If vague, pick the first option
            page_title = e.options[0]
            summary = wikipedia.summary(page_title, sentences=2, auto_suggest=False)
        except:
            return f"I found a page for '{page_title}' but couldn't read it."

        # GENERATE LINK
        clean_url_title = page_title.replace(" ", "_")
        wiki_url = f"https://en.wikipedia.org/wiki/{clean_url_title}"
        
        return (
            f"Here is what I found on '{page_title}':\n\n"
            f"{summary}\n\n"
            f"🔗 Read more: {wiki_url}"
        )

    except Exception as e:
        return f"Search Error: {str(e)}"

@app.route('/', methods=['GET'])
def home():
    return "LoganGPT Brain is Active!"

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_input = data.get('message', '').lower()
        
        # 1. INTERNAL CHECK
        for keyword, answer in KNOWLEDGE_BASE.items():
            if keyword in user_input:
                return jsonify({"reply": f"LoganGPT (Internal): {answer}"})

        # 2. MATH CHECK
        if "+" in user_input:
            try:
                parts = user_input.split("+")
                result = int(parts[0].strip()) + int(parts[1].strip())
                return jsonify({"reply": f"LoganGPT (Calc): {result}"})
            except:
                pass

        # 3. AUTO-SEARCH FALLBACK
        # If we don't know the answer, we search automatically
        result = perform_search(user_input)
        return jsonify({"reply": f"LoganGPT (Auto-Web): {result}"})

    except Exception as e:
        return jsonify({"reply": f"LoganGPT Error: {str(e)}"})

@app.route('/api/search', methods=['POST'])
def search_manual():
    try:
        data = request.json
        query = data.get('query', '')
        if not query: return jsonify({"reply": "Please type something."})
        
        result = perform_search(query)
        return jsonify({"reply": f"LoganGPT (Manual): {result}"})
    except Exception as e:
        return jsonify({"reply": f"Search Error: {str(e)}"})

# Vercel needs this
if __name__ == '__main__':
    app.run()
