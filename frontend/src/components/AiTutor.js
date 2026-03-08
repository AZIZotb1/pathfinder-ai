import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';

const AiTutor = ({ goal, roadmapData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const roadmapContext = roadmapData 
        ? `The user is learning to become a ${goal}. Here's their roadmap:\n${roadmapData.map((step, i) => 
            `Step ${i + 1}: ${step.title} - ${step.description}`
          ).join('\n')}`
        : `The user wants to become a ${goal}.`;

      const history = messages.slice(-4).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: roadmapContext,
          history: history
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, something went wrong. Please try again in a moment."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      const welcomeMessage = roadmapData 
        ? `Hi! I can see you're working on becoming a ${goal}. I've reviewed your ${roadmapData.length}-step roadmap. Ask me anything about the steps, or if you need help understanding any concepts!`
        : `Hi! I'm here to help you become a ${goal}. Ask me anything!`;
      
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
    }
  };

  return (
    <>
      {/* Floating Button - Properly Centered Icon */}
      {!isOpen && (
        <button
          onClick={startConversation}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-96 bg-gray-900 rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-700 overflow-hidden">
          
          {/* Header */}
          <div className="p-4 bg-gray-900 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-bold text-white text-sm">AI Tutor</h3>
                <p className="text-xs text-gray-400 truncate">Learning: {goal}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-900">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-100 border border-gray-700'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {/* Loading Indicator - Compact */}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-2xl flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-sm text-gray-400">Thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-gray-900 border-t border-gray-700">
            {/* Changed items-stretch to items-center here */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask about your roadmap..."
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              {/* Send Button - Using Lucide's strict size prop */}
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-11 h-11 shrink-0 flex items-center justify-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={20} color="white" className="animate-spin" />
                ) : (
                  <Send size={20} color="white" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiTutor;