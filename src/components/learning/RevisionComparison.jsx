import { useState } from 'react'
import './RevisionComparison.css'

export default function RevisionComparison({ originalDraft = '', revisedDraft = '', resolvedItems = [], onProceed }) {
  const [viewMode, setViewMode] = useState('side_by_side') // 'side_by_side' or 'diff'

  return (
    <div className="rev-comp card-base animate-fade-in">
      <div className="rev-comp__header">
        <div className="rev-comp__header-left">
          <div className="rev-comp__icon-wrap">
            <span className="material-symbols-outlined">difference</span>
          </div>
          <div>
            <h3 className="rev-comp__title">So sánh Bản sửa đổi (Revision Comparison)</h3>
            <p className="rev-comp__sub">Xem các cải thiện và sửa lỗi từ vựng giữa bản nháp đầu tiên và bản sửa.</p>
          </div>
        </div>

        <div className="rev-comp__view-toggle">
          <button
            className={`rev-comp__toggle-btn ${viewMode === 'side_by_side' ? 'rev-comp__toggle-btn--active' : ''}`}
            onClick={() => setViewMode('side_by_side')}
          >
            <span className="material-symbols-outlined">vertical_split</span>
            Song song
          </button>
          <button
            className={`rev-comp__toggle-btn ${viewMode === 'diff' ? 'rev-comp__toggle-btn--active' : ''}`}
            onClick={() => setViewMode('diff')}
          >
            <span className="material-symbols-outlined">view_agenda</span>
            Xem bản mới
          </button>
        </div>
      </div>

      {/* Resolved Badges */}
      {resolvedItems && resolvedItems.length > 0 && (
        <div className="rev-comp__resolved-bar">
          <span className="rev-comp__resolved-label">
            <span className="material-symbols-outlined">task_alt</span> Đã giải quyết {resolvedItems.length} lỗi/gợi ý:
          </span>
          <div className="rev-comp__resolved-chips">
            {resolvedItems.map((item, idx) => (
              <span key={idx} className="rev-comp__chip">
                {typeof item === 'string' ? item : item.word || item.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      <div className={`rev-comp__content rev-comp__content--${viewMode}`}>
        {viewMode === 'side_by_side' && (
          <div className="rev-comp__panel rev-comp__panel--original">
            <div className="rev-comp__panel-title">
              <span className="material-symbols-outlined">history</span>
              Bản nháp 1 (Original Draft)
            </div>
            <div className="rev-comp__text-box">
              {originalDraft || 'Không có dữ liệu bài viết cũ.'}
            </div>
          </div>
        )}

        <div className="rev-comp__panel rev-comp__panel--revised">
          <div className="rev-comp__panel-title rev-comp__panel-title--success">
            <span className="material-symbols-outlined">auto_fix_high</span>
            Bản sửa đổi (Revised Version)
          </div>
          <div className="rev-comp__text-box rev-comp__text-box--highlight">
            {revisedDraft || 'Đang cập nhật bài viết mới...'}
          </div>
        </div>
      </div>

      {onProceed && (
        <div className="rev-comp__actions">
          <button className="btn-primary rev-comp__proceed-btn" onClick={onProceed}>
            Hoàn thành phiên học
            <span className="material-symbols-outlined">check_circle</span>
          </button>
        </div>
      )}
    </div>
  )
}
