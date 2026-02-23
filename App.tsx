/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import { 
  Send, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Copy, 
  Check, 
  Github, 
  Menu, 
  X,
  Sparkles,
  ChevronRight,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Message {
  id?: number;
  role: "user" | "model";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  messages?: Message[];
}

// --- Components ---

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/50 hover:text-white"
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

export default function App() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [autoScroll, setAutoScroll] = useState(false); // User requested "no auto scroll" by default
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Fetch all chats on mount
  useEffect(() => {
    fetchChats();
  }, []);

  // Fetch messages when currentChatId changes
  useEffect(() => {
    if (currentChatId) {
      fetchChatDetails(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  // Handle auto-scroll logic
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, autoScroll]);

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chats");
      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.error("Failed to fetch chats", err);
    }
  };

  const fetchChatDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/chats/${id}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to fetch chat details", err);
    }
  };

  const createNewChat = async () => {
    const id = crypto.randomUUID();
    const title = "New Conversation";
    try {
      await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title }),
      });
      await fetchChats();
      setCurrentChatId(id);
    } catch (err) {
      console.error("Failed to create chat", err);
    }
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chats/${id}`, { method: "DELETE" });
      await fetchChats();
      if (currentChatId === id) setCurrentChatId(null);
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    let chatId = currentChatId;
    if (!chatId) {
      // Create a new chat if none selected
      const id = crypto.randomUUID();
      const title = input.slice(0, 30) + (input.length > 30 ? "..." : "");
      await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title }),
      });
      await fetchChats();
      setCurrentChatId(id);
      chatId = id;
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Save user message to DB
      await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userMessage),
      });

      // Call Gemini
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages, userMessage].map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        })),
      });

      const aiContent = response.text || "I'm sorry, I couldn't generate a response.";
      const aiMessage: Message = { role: "model", content: aiContent };

      setMessages((prev) => [...prev, aiMessage]);

      // Save AI message to DB
      await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiMessage),
      });
    } catch (err) {
      console.error("Error calling Gemini", err);
      setMessages((prev) => [...prev, { role: "model", content: "Error: Failed to connect to AI service." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0502] text-white overflow-hidden font-sans">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff4e00]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#3a1510]/20 blur-[150px] rounded-full" />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-[#ff4e00]/5 blur-[100px] rounded-full" />
      </div>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="relative z-20 w-72 h-full border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col"
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ff4e00] flex items-center justify-center shadow-[0_0_15px_rgba(255,78,0,0.4)]">
                  <Sparkles size={18} className="text-white" />
                </div>
                <h1 className="text-xl font-semibold tracking-tight">Zenith</h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <button
              onClick={createNewChat}
              className="mx-4 mb-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group"
            >
              <Plus size={18} className="text-[#ff4e00] group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">New Chat</span>
            </button>

            <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
              <div className="px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold flex items-center gap-2">
                <History size={12} />
                Recent History
              </div>
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setCurrentChatId(chat.id)}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                    currentChatId === chat.id 
                      ? "bg-[#ff4e00]/10 text-white border border-[#ff4e00]/20" 
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare size={16} className={cn(currentChatId === chat.id ? "text-[#ff4e00]" : "text-white/30")} />
                    <span className="text-sm truncate font-medium">{chat.title}</span>
                  </div>
                  <button
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 border-top border-white/10">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/20" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-medium truncate">Guest User</p>
                  <p className="text-[10px] text-white/40">Free Tier</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col h-full bg-transparent">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 backdrop-blur-md bg-black/10">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/80">
                {currentChatId ? chats.find(c => c.id === currentChatId)?.title : "Zenith AI"}
              </span>
              <ChevronRight size={14} className="text-white/20" />
              <span className="text-[10px] uppercase tracking-widest text-[#ff4e00] font-bold">Live</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1 border border-white/10">
              <span className="text-[10px] text-white/40 font-medium">Auto-scroll</span>
              <button 
                onClick={() => setAutoScroll(!autoScroll)}
                className={cn(
                  "w-8 h-4 rounded-full relative transition-colors",
                  autoScroll ? "bg-[#ff4e00]" : "bg-white/20"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                  autoScroll ? "left-4.5" : "left-0.5"
                )} />
              </button>
            </div>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all"
            >
              <Github size={20} />
            </a>
          </div>
        </header>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 custom-scrollbar scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#ff4e00] to-[#3a1510] flex items-center justify-center shadow-[0_0_50px_rgba(255,78,0,0.2)]"
              >
                <Sparkles size={40} className="text-white" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-4xl font-light tracking-tight">How can I assist you today?</h2>
                <p className="text-white/40 text-lg font-light">Experience the next generation of conversational intelligence.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
                {[
                  "Explain quantum entanglement",
                  "Write a React hook for local storage",
                  "Draft a professional email to a client",
                  "Ideas for a sci-fi short story"
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left text-sm text-white/70 hover:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-12 pb-12">
              {messages.map((message, idx) => (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  key={idx}
                  className={cn(
                    "flex gap-6 group",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border",
                    message.role === "user" 
                      ? "bg-white/10 border-white/20" 
                      : "bg-[#ff4e00]/10 border-[#ff4e00]/20"
                  )}>
                    {message.role === "user" ? <div className="w-5 h-5 rounded-full bg-zinc-500" /> : <Sparkles size={20} className="text-[#ff4e00]" />}
                  </div>
                  <div className={cn(
                    "flex-1 space-y-4",
                    message.role === "user" ? "text-right" : "text-left"
                  )}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">
                        {message.role === "user" ? "User" : "Zenith AI"}
                      </span>
                      {message.role === "model" && <CopyButton text={message.content} />}
                    </div>
                    <div className={cn(
                      "prose prose-invert max-w-none text-white/90 leading-relaxed",
                      "prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl",
                      "prose-code:text-[#ff4e00] prose-code:bg-[#ff4e00]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none"
                    )}>
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </Markdown>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-6 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-[#ff4e00]/5 border border-[#ff4e00]/10 flex items-center justify-center">
                    <Sparkles size={20} className="text-[#ff4e00]/30" />
                  </div>
                  <div className="flex-1 space-y-3 pt-2">
                    <div className="h-2 w-24 bg-white/5 rounded-full" />
                    <div className="h-2 w-full bg-white/5 rounded-full" />
                    <div className="h-2 w-2/3 bg-white/5 rounded-full" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-12 pt-0">
          <div className="max-w-4xl mx-auto relative">
            <form 
              onSubmit={handleSendMessage}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ff4e00] to-[#3a1510] rounded-[2rem] opacity-20 group-focus-within:opacity-40 blur transition-all duration-500" />
              <div className="relative flex items-end gap-2 p-2 rounded-[1.8rem] bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask Zenith anything..."
                  className="flex-1 max-h-48 min-h-[56px] bg-transparent border-none focus:ring-0 text-white placeholder-white/20 py-4 px-6 resize-none custom-scrollbar"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className={cn(
                    "p-4 rounded-2xl transition-all flex items-center justify-center",
                    input.trim() && !isLoading 
                      ? "bg-[#ff4e00] text-white shadow-[0_0_20px_rgba(255,78,0,0.3)] hover:scale-105" 
                      : "bg-white/5 text-white/20 cursor-not-allowed"
                  )}
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
            <p className="mt-4 text-[10px] text-center text-white/20 font-medium uppercase tracking-widest">
              Powered by Gemini 3 Flash • Persistent History Enabled
            </p>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
