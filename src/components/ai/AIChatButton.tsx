'use client';

import { useState } from 'react';
import { Bot, X } from 'lucide-react';
import AIChatPanel from './AIChatPanel';

export default function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
          isOpen
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-90 glow-accent'
        }`}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[550px] glass rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50 animate-in slide-in-from-bottom-5">
          <AIChatPanel />
        </div>
      )}
    </>
  );
}