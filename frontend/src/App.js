import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Use the CSS from the previous response

function App() {
  // ... keep state logic the same ...
  const [messages, setMessages] = useState([
    { text: "Hello! I am LoganGPT. Type / to search online.", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // DETECT ENV: If running locally, use localhost. If deployed, use the real backend.
  // We will set REACT_APP_BACKEND_URL in Vercel later.
  const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:5000";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ... handleInputChange, activateSearchMode, cancelSearchMode (Same as before) ...
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
      const endpoint = currentMode ? `${API_BASE}/api/search` : `${API_BASE}/api/chat`;
      const payload = currentMode ? { query: currentInput } : { message: currentInput };

      const res = await axios.post(endpoint, payload);
      
      setMessages(prev => [...prev, { 
        text: res.data.reply, 
        sender: "bot",
        isWebResult: currentMode 
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { text: "Error: Backend not reachable.", sender: "bot" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  // ... Return HTML/JSX (Same as before) ...
  return (
    // ... Paste the JSX from the previous response here ...
    // If you need the full file again, let me know! 
    // But basically, just copy the return() block from the previous solution.
    <div className="app-container">
       {/* ... headers, chat window, input area ... */}
       {/* SIMPLE VERSION FOR BREVITY IN CONFIG: */}
       <div className="chat-window">
        {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`}>{msg.text}</div>
        ))}
       </div>
       <input value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} />
    </div>
  );
}

export default App;
