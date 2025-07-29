import { useState, useEffect, FormEvent, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Image from 'next/image';

interface Message {
  _id?: string;
  text: string;
  sender: 'user' | 'ai';
}

export default function Home() {
  const { token, logout, isLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- NO LOGIC CHANGES BELOW THIS LINE ---

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [token, isLoading, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    const fetchMessages = async () => {
      if (token) {
        const res = await fetch(`/api/messages?timestamp=${new Date().getTime()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        } else {
          logout();
        }
      } else {
        setMessages([]);
      }
    };
    fetchMessages();
  }, [token, logout]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '' || isAiTyping) return;

    const userMessage: Message = { text: inputValue, sender: 'user' };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsAiTyping(true);

    await fetch('/api/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userMessage)
    });

    const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
    });
    
    if (res.ok) {
        const { reply } = await res.json();
        const aiMessage: Message = { text: reply, sender: 'ai' };
        setMessages(prev => [...prev, aiMessage]);

        await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(aiMessage)
        });
    } else {
        const aiError: Message = { text: "Sorry, something went wrong. Please try again.", sender: 'ai' };
        setMessages(prev => [...prev, aiError]);
    }
    
    setIsAiTyping(false);
  };
  
  if (isLoading || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- UI & STYLING CHANGES START HERE ---

  return (
    <div className="flex flex-col h-screen text-white font-sans">
      <header className="flex items-center justify-between p-4 bg-gray-900/70 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-10">
        <h1 className="text-xl font-bold">Peak Performance Fitness AI</h1>
        <button onClick={logout} className="px-4 py-2 text-sm font-semibold bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200">Logout</button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {/* AI Avatar */}
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white"><path d="M12 2a10 10 0 0 0-3.536 19.166l.004.004.004.003.003.003c.038.026.078.044.117.062a10 10 0 0 0 6.824 0c.04-.018.079-.036.117-.062l.003-.003.004-.003.004-.004A10 10 0 0 0 12 2ZM8 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-.5-5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Z"/></svg>
                </div>
              )}

              {/* Message Bubble */}
              <div className={`max-w-md px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 rounded-br-lg' : 'bg-gray-700 rounded-bl-lg'}`}>
                <p className="text-base font-medium whitespace-pre-wrap">{msg.text}</p>
              </div>

              {/* User Avatar */}
              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-300"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                </div>
              )}
            </div>
          ))}

          {/* AI Typing Indicator */}
          {isAiTyping && (
            <div className="flex items-start gap-3 fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white"><path d="M12 2a10 10 0 0 0-3.536 19.166l.004.004.004.003.003.003c.038.026.078.044.117.062a10 10 0 0 0 6.824 0c.04-.018.079-.036.117-.062l.003-.003.004-.003.004-.004A10 10 0 0 0 12 2ZM8 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-.5-5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Z"/></svg>
              </div>
              <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow bg-gray-700 rounded-bl-none">
                  <div className="flex items-center justify-center space-x-1.5 h-5">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-gray-900/70 backdrop-blur-sm border-t border-gray-700 sticky bottom-0 z-10">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3 max-w-4xl mx-auto">
          <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask about membership or class times..." className="w-full px-4 py-3 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"/>
          <button type="submit" disabled={isAiTyping} className="p-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>
          </button>
        </form>
      </footer>
    </div>
  );
}