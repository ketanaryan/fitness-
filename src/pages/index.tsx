import { useState, useEffect, FormEvent, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

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
        const res = await fetch('/api/messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        } else {
          logout();
        }
      } else {
        // THIS IS THE FIX: If no token exists (user logged out), clear the message state.
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
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-md">
        <h1 className="text-xl font-bold">Peak Performance Fitness AI</h1>
        <button onClick={logout} className="px-4 py-2 text-sm font-semibold bg-red-600 rounded-md hover:bg-red-700">Logout</button>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow ${msg.sender === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isAiTyping && (
            <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow bg-gray-700 rounded-bl-none">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                    </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-gray-800 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask about membership or class times..." className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          <button type="submit" disabled={isAiTyping} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed">Send</button>
        </form>
      </footer>
    </div>
  );
}