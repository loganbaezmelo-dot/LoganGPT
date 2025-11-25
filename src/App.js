import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { text: "Hello! I am LoganGPT on Vercel. Type / to search.", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // WE NO LONGER NEED A FULL URL, JUST THE PATH
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

  const sendMessage = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    const currentMode = isSearchMode; 

    setMessages(prev => [...prev, { text: currentInput, sender: "user" }]);
    setInput("");
    if (isSearchMode) setIsSearchMode(false);
    setIsLoading(true);

    try {
      // It will now hit /api/chat or /api/search on the same domain
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
        {isLoading && <div className="message bot">...</div>}
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
        <div className="input-wrapper">
            <input value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder={isSearchMode ? "Search web..." : "Type / for commands..."} />
            <button onClick={sendMessage}>➤</button>
        </div>
      </div>
    </div>
  );
}

export default App;
