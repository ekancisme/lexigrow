import React from 'react';
import './ShimmerSkeleton.css';

/**
 * ShimmerSkeleton — Hiển thị placeholder đang tải với hiệu ứng shimmer
 * @param {string} variant - 'card' | 'text' | 'circle' | 'custom'
 * @param {string} className - Class CSS bổ sung
 * @param {object} style - Style bổ sung
 * @param {number} lines - Số dòng văn bản (chỉ cho variant 'text')
 * @param {string} width - Chiều rộng (chỉ cho variant 'custom')
 * @param {string} height - Chiều cao (chỉ cho variant 'custom')
 */
export const ShimmerSkeleton = ({
  variant = 'card',
  className = '',
  style = {},
  lines = 3,
  width,
  height,
}) => {
  if (variant === 'card') {
    return (
      <div className={`shimmer-box shimmer-card ${className}`} style={style}>
        <div className="shimmer-card__header">
          <div className="shimmer-circle" />
          <div className="shimmer-line shimmer-line--short" />
        </div>
        <div className="shimmer-card__body">
          <div className="shimmer-line" />
          <div className="shimmer-line" />
          <div className="shimmer-line shimmer-line--short" />
        </div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`shimmer-text ${className}`} style={style}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={`shimmer-line ${i === lines - 1 ? 'shimmer-line--short' : ''}`}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div className={`shimmer-circle ${className}`} style={style} />
    );
  }

  // Custom
  return (
    <div
      className={`shimmer-box ${className}`}
      style={{
        width: width || '100%',
        height: height || '100%',
        ...style,
      }}
    />
  );
};

export default ShimmerSkeleton;