import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { auth, googleProvider, db } from './firebase';
// Using signInWithRedirect for better mobile compatibility
import { 
  signInWithRedirect, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged 
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
  
  // Vercel handles the API routing automatically via the "rewrites" in vercel.json
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

    // Query chats where userId matches current user, ordered by newest first
    const q = query(collection(db, "chats"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatsData);
      
      // If no chat is selected but chats exist, select the most recent one
      if (chatsData.length > 0 && !activeChatId) {
        setActiveChatId(chatsData[0].id);
      }
    });
    return unsubscribe;
  }, [user, activeChatId]);

  // 3. LOAD MESSAGES WHEN ACTIVE CHAT CHANGES
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const q = query
