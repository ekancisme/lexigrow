import React from 'react';

/**
 * Mascot — Linh vật minh họa cho các Empty States
 * @param {string} variant - 'sad' | 'happy' | 'neutral'
 * @param {string} message - Lời nhắn hiển thị cùng mascot
 * @param {string} className - Class CSS bổ sung
 */
export const Mascot = ({ variant = 'neutral', message, className = '' }) => {
  const variants = {
    sad: {
      emoji: '😢',
      label: 'Sad',
      color: '#94a3b8',
      bg: '#f1f5f9'
    },
    happy: {
      emoji: '🌟',
      label: 'Happy',
      color: '#f59e0b',
      bg: '#fef3c7'
    },
    neutral: {
      emoji: '🧠',
      label: 'Neutral',
      color: '#3b82f6',
      bg: '#dbeafe'
    }
  };

  const config = variants[variant] || variants.neutral;

  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-8 ${className}`}>
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-lg transition-all hover:scale-110"
        style={{
          background: config.bg,
          color: config.color,
          boxShadow: `0 8px 24px ${config.color}33`
        }}
      >
        {config.emoji}
      </div>
      {message && (
        <p className="text-center text-gray-600 max-w-sm text-sm leading-relaxed">
          {message}
        </p>
      )}
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        {config.label}
      </span>
    </div>
  );
};

export default Mascot;