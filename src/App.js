import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { auth, googleProvider, db } from './firebase';
// IMPORT getRedirectResult TO FIX MOBILE LOGIN
import { 
  signInWithRedirect, 
  getRedirectResult, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc 
} from "firebase/firestore";

function App() {
  // --- AUTH STATE ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // Starts true to prevent flashing login screen
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // --- CHAT STATE ---
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // --- UI STATE ---
  const [isListening, setIsListening] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const messagesEndRef = useRef(null);
  
  const API_BASE = ""; 

  // 1. HANDLE REDIRECT RESULT (Crucial for Mobile)
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        await getRedirectResult(auth);
        // We don't need to do anything with the result here, 
        // onAuthStateChanged will catch the user update automatically.
      } catch (error) {
        console.error("Redirect Error:", error);
        alert("Google Login Error: " + error.message);
      }
    };
    handleRedirect();
  }, []);

  // 2. LISTEN FOR AUTH CHANGES
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("User detected:", currentUser?.email);
      setUser(currentUser);
      setAuthLoading(false); // Only stop loading once Firebase is definitely done
    });
    return unsubscribe;
  }, []);

  // 3. LOAD CHATS
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "chats"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatsData);
      if (chatsData.length > 0 && !activeChatId) setActiveChatId(chatsData[0].id);
    });
    return unsubscribe;
  }, [user]);

  // 4. LOAD MESSAGES
  useEffect(() => {
    if (!activeChatId) { setMessages([]); return; }
    const q = query(collection(db, "chats", activeChatId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => doc.data()));
    });
    return unsubscribe;
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- HANDLERS ---
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

  // MOBILE FRIENDLY LOGIN
  const handleGoogleLogin = () => {
    setAuthLoading(true); // Show loading while redirecting
    signInWithRedirect(auth, googleProvider);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert(e.message); }
  };

  const logout = () => {
    signOut(auth);
    setChats([]);
    setMessages([]);
    setActiveChatId(null);
  };

  const createNewChat = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, "chats"), {
        userId: user.uid, title: "New Chat", createdAt: serverTimestamp()
      });
      setActiveChatId(docRef.id);
      setSidebarOpen(false);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChatId) return;
    const textToSend = input;
    const isSearch = isSearchMode;
    
    setInput("");
    setIsSearchMode(false);
    setShowCommands(false);

    await addDoc(collection(db, "chats", activeChatId, "messages"), {
      text: textToSend, sender: "user", createdAt: serverTimestamp()
    });

    if (messages.length === 0) {
      updateDoc(doc(db, "chats", activeChatId), { title: textToSend.slice(0, 30) });
    }

    try {
      const endpoint = isSearch ? `/api/search` : `/api/chat`;
      const payload = isSearch ? { query: textToSend } : { message: textToSend };
      const res = await axios.post(endpoint, payload);
      
      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        text: res.data.reply, sender: "bot", isWebResult: isSearch, createdAt: serverTimestamp()
      });
    } catch (error) {
      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        text: "Error: Could not reach LoganGPT server.", sender: "bot", createdAt: serverTimestamp()
      });
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Browser not supported"); return; }
    if (isListening) { window.location.reload(); return; }
    
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

  if (authLoading) return <div className="loading-screen" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color:'white', background:'black'}}>Loading LoganGPT...</div>;

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>LoganGPT</h1>
          <p>Sign in to continue</p>
          {/* REDIRECT LOGIN (Works on Mobile) */}
          <button className="google-btn" onClick={handleGoogleLogin}>Continue with Google</button>
          <div className="divider">OR</div>
          <form onSubmit={handleEmailAuth}>
            <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
            <button type="submit" className="auth-btn">{isRegistering ? "Create Account" : "Sign In"}</button>
          </form>
          <p className="toggle-auth" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? "Has account? Login" : "No account? Register"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
            <button className="new-chat-btn" onClick={createNewChat}>+ New Chat</button>
            <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>×</button>
        </div>
        <div className="chat-list">
          {chats.map(chat => (
            <div key={chat.id} className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`} onClick={() => {setActiveChatId(chat.id); setSidebarOpen(false);}}>
              {chat.title}
            </div>
          ))}
        </div>
        <div className="user-profile">
            <span>{user.email.split('@')[0]}</span>
            <button onClick={logout}>Sign Out</button>
        </div>
      </div>

      <div className="main-content">
        <header className="chat-header">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <h1>LoganGPT</h1>
          <div style={{width: 24}}></div>
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
              <div className="empty-state">
                  <h2>Welcome back</h2>
                  <p>Start a new chat to begin</p>
              </div>
          )}
        </div>

        <div className="input-area">
          {showCommands && (
            <div className="command-menu">
                <div className="command-item" onClick={activateSearchMode}>
                    <span className="cmd-icon">🌐</span>
                    <div className="cmd-info">
                        <span className="cmd-title">Search Online</span>
                        <span className="cmd-desc">Search the web for real-time info</span>
                    </div>
                </div>
            </div>
          )}

          {isSearchMode && (
              <div className="search-mode-bar">
                  <span>Searching the web...</span>
                  <button onClick={() => {setIsSearchMode(false); setInput("");}}>Cancel</button>
              </div>
          )}
          
          <div className={`input-wrapper ${isListening ? 'listening' : ''} ${isSearchMode ? 'searching' : ''}`}>
            <button className={`mic-btn ${isListening ? 'active' : ''}`} onClick={handleVoiceInput}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
            </button>

            <input 
                value={input} 
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
                placeholder={isSearchMode ? "What do you want to search?" : "Message LoganGPT..."} 
                disabled={!activeChatId}
            />
            
            <button className="send-btn" onClick={sendMessage}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
