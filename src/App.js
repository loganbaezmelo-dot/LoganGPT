import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { auth, googleProvider, db } from './firebase';
import { 
  signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged 
} from "firebase/auth";
import { 
  collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc 
} from "firebase/firestore";

function App() {
  // --- AUTH STATE ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // --- CHAT STATE ---
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // --- APP STATE ---
  const [isListening, setIsListening] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Use relative path for Vercel
  const API_BASE = ""; 

  // 1. LISTEN FOR AUTH CHANGES
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. LOAD CHAT LIST WHEN USER LOGS IN
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "chats"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatsData);
      // Select first chat if none selected
      if (chatsData.length > 0 && !activeChatId) {
        setActiveChatId(chatsData[0].id);
      }
    });
    return unsubscribe;
  }, [user]);

  // 3. LOAD MESSAGES WHEN ACTIVE CHAT CHANGES
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, "chats", activeChatId, "messages"), 
      orderBy("createdAt", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data());
      setMessages(msgs);
    });

    return unsubscribe;
  }, [activeChatId]);

  // SCROLL TO BOTTOM
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- AUTH ACTIONS ---
  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (e) { alert(e.message); }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) { alert(e.message); }
  };

  const logout = () => {
    signOut(auth);
    setChats([]);
    setMessages([]);
    setActiveChatId(null);
  };

  // --- CHAT ACTIONS ---
  const createNewChat = async () => {
    if (!user) return;
    const docRef = await addDoc(collection(db, "chats"), {
      userId: user.uid,
      title: "New Chat",
      createdAt: serverTimestamp()
    });
    setActiveChatId(docRef.id);
    setSidebarOpen(false); // Close sidebar on mobile
  };

  const selectChat = (id) => {
    setActiveChatId(id);
    setSidebarOpen(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChatId) return;
    
    const textToSend = input;
    const isSearch = isSearchMode;
    
    setInput("");
    setIsSearchMode(false);

    // 1. Save User Message to DB
    await addDoc(collection(db, "chats", activeChatId, "messages"), {
      text: textToSend,
      sender: "user",
      createdAt: serverTimestamp()
    });

    // 2. Rename Chat Title if it's the first message
    if (messages.length === 0) {
      const chatTitle = textToSend.slice(0, 30);
      const chatRef = doc(db, "chats", activeChatId);
      updateDoc(chatRef, { title: chatTitle });
    }

    // 3. Call Python API
    try {
      const endpoint = isSearch ? `/api/search` : `/api/chat`;
      const payload = isSearch ? { query: textToSend } : { message: textToSend };
      
      const res = await axios.post(endpoint, payload);
      const botReply = res.data.reply;

      // 4. Save Bot Reply to DB
      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        text: botReply,
        sender: "bot",
        isWebResult: isSearch,
        createdAt: serverTimestamp()
      });

    } catch (error) {
      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        text: "Error: Could not reach LoganGPT server.",
        sender: "bot",
        createdAt: serverTimestamp()
      });
    }
  };

  // --- VOICE ---
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Browser not supported"); return; }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    setIsListening(true);
    recognition.start();

    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
  };

  if (authLoading) return <div className="loading-screen">Loading LoganGPT...</div>;

  // --- LOGIN SCREEN ---
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>Welcome to LoganGPT</h1>
          <p>Login to save your history</p>
          <form onSubmit={handleEmailAuth}>
            <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
            <button type="submit" className="auth-btn">{isRegistering ? "Sign Up" : "Login"}</button>
          </form>
          <button className="google-btn" onClick={handleGoogleLogin}>Sign in with Google</button>
          <p className="toggle-auth" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? "Already have an account? Login" : "Need an account? Sign Up"}
          </p>
        </div>
      </div>
    );
  }

  // --- MAIN APP UI ---
  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
            <button className="new-chat-btn" onClick={createNewChat}>+ New Chat</button>
            <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>×</button>
        </div>
        <div className="chat-list">
          {chats.map(chat => (
            <div key={chat.id} className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`} onClick={() => selectChat(chat.id)}>
              {chat.title}
            </div>
          ))}
        </div>
        <div className="user-profile">
            <span>{user.email.split('@')[0]}</span>
            <button onClick={logout}>Logout</button>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="main-content">
        <header className="chat-header">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <h1>LoganGPT</h1>
          <div style={{width: 30}}></div> 
        </header>

        <div className="chat-window">
          {activeChatId ? (
             <>
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                    <div className="message-content">
                        {msg.isWebResult && <span className="web-badge">WEB RESULT</span>}
                        {msg.text}
                    </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
             </>
          ) : (
              <div className="empty-state">Click "+ New Chat" to start</div>
          )}
        </div>

        <div className="input-area">
          {isSearchMode && <div className="search-indicator"><button onClick={() => setIsSearchMode(false)}>✖</button> SEARCH MODE</div>}
          <div className={`input-wrapper ${isListening ? 'listening-mode' : ''}`}>
            <button className={`mic-btn ${isListening ? 'active' : ''}`} onClick={handleVoiceInput}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
            </button>
            <input 
                value={input} 
                onChange={(e) => {
                    setInput(e.target.value);
                    if(e.target.value === "/" && !isSearchMode) setIsSearchMode(true); // Simplified command
                }} 
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
                placeholder={isSearchMode ? "Search..." : "Message..."} 
                disabled={!activeChatId}
            />
            <button className="send-btn" onClick={sendMessage}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
