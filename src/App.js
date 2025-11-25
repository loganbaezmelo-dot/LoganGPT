import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { text: "Hello! I am LoganGPT. Type / or use the Mic button to speak.", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  
  // Use relative path for Vercel (works for both local and prod)
  const API_BASE = ""; 

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e) => {
      const val = e.target.value;
      setInput(val);
      if (val === "/" && !isSearchMode) setShowCommands(true);
      else setShowCommands(false);
  };
  
  const activateSearchMode = () => {
    setIsSearchMode(true);
    setShowCommands(false);
    setInput("");
  };

  const cancelSearchMode = () => {
    setIsSearchMode(false);
    setInput("");
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser. Try Chrome or Safari.");
      return;
    }

    // If already listening, stop it manually (toggle behavior)
    if (isListening) {
      window.location.reload(); // Simple way to reset state if stuck
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Voice Error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    const currentMode = isSearchMode; 

    setMessages(prev => [...prev, { text: currentInput, sender: "user" }]);
    setInput("");
    if (isSearchMode) setIsSearchMode(false);
    setIsLoading(true);

    try {
      const endpoint = currentMode ? `/api/search` : `/api/chat`;
      const payload = currentMode ? { query: currentInput } : { message: currentInput };

      const res = await axios.post(endpoint, payload);
      
      setMessages(prev => [...prev, { 
        text: res.data.reply, 
        sender: "bot",
        isWebResult: currentMode 
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { text: "Error: AI is sleeping or broken.", sender: "bot" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="app-container">
      <header className="chat-header"><h1>LoganGPT</h1></header>

      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === 'user' ? 'user' : 'bot'}`}>
            <div className="message-content">
              {msg.isWebResult && <span className="web-badge">WEB RESULT</span>}
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && <div className="message bot"><div className="message-content">Thinking...</div></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
         {showCommands && (
          <div className="command-menu">
            <div className="command-item" onClick={activateSearchMode}>
              <span>🌐</span> /searchonline
            </div>
          </div>
        )}
        
        {isSearchMode && <div className="search-indicator"><button onClick={cancelSearchMode}>✖</button> SEARCH MODE</div>}
        
        <div className={`input-wrapper ${isListening ? 'listening-mode' : ''}`}>
            
            {/* SVG MIC ICON */}
            <button 
              className={`mic-btn ${isListening ? 'active' : ''}`} 
              onClick={handleVoiceInput}
              title="Speak"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>

            <input 
              value={input} 
              onChange={handleInputChange} 
              onKeyDown={handleKeyDown} 
              placeholder={isListening ? "Listening..." : (isSearchMode ? "Search web..." : "Message...")} 
            />
            
            <button className="send-btn" onClick={sendMessage}>➤</button>
        </div>
      </div>
    </div>
  );
}

export default App;
