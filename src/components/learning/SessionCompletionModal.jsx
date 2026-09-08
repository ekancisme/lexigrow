import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './SessionCompletionModal.css'

export default function SessionCompletionModal({ sessionData = {}, onClose }) {
  const navigate = useNavigate()

  useEffect(() => {
    // Optional audio sound effect or vibration
    try {
      if ('vibrate' in navigator) navigator.vibrate(200)
    } catch {}
  }, [])

  const words = sessionData.words || sessionData.targetWords || []

  return (
    <div className="completion-overlay animate-fade-in">
      <div className="completion-modal card-base">
        {/* Confetti decoration */}
        <div className="completion-modal__confetti-wrapper">
          <span className="completion-modal__sparkle sparkle-1">✨</span>
          <span className="completion-modal__sparkle sparkle-2">🎉</span>
          <span className="completion-modal__sparkle sparkle-3">⭐</span>
          <span className="completion-modal__sparkle sparkle-4">🌿</span>
        </div>

        <div className="completion-modal__badge">
          <span className="material-symbols-outlined completion-modal__icon">military_tech</span>
        </div>

        <h2 className="completion-modal__title">Tuyệt vời! Hoàn thành phiên học!</h2>
        <p className="completion-modal__desc">
          Bạn vừa hoàn thành xuất sắc phiên học 10 phút hôm nay và vận dụng thành công các từ vựng mục tiêu vào bài viết thực tế.
        </p>

        {/* Stats strip */}
        <div className="completion-modal__stats">
          <div className="completion-modal__stat-item">
            <span className="material-symbols-outlined completion-modal__stat-icon">local_fire_department</span>
            <div>
              <span className="completion-modal__stat-value">+1 Ngày</span>
              <span className="completion-modal__stat-label">Duy trì Streak</span>
            </div>
          </div>

          <div className="completion-modal__stat-item">
            <span className="material-symbols-outlined completion-modal__stat-icon">workspace_premium</span>
            <div>
              <span className="completion-modal__stat-value">+50 XP</span>
              <span className="completion-modal__stat-label">Điểm tích lũy</span>
            </div>
          </div>

          <div className="completion-modal__stat-item">
            <span className="material-symbols-outlined completion-modal__stat-icon">yard</span>
            <div>
              <span className="completion-modal__stat-value">+{words.length || 3} Mầm cây</span>
              <span className="completion-modal__stat-label">Khu vườn từ vựng</span>
            </div>
          </div>
        </div>

        {/* Words Learned */}
        {words.length > 0 && (
          <div className="completion-modal__words-box">
            <span className="completion-modal__words-title">Từ vựng đã vận dụng thành công:</span>
            <div className="completion-modal__chips">
              {words.map((w, idx) => (
                <span key={idx} className="completion-modal__word-chip">
                  <span className="material-symbols-outlined">check_circle</span>
                  {typeof w === 'string' ? w : w.word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="completion-modal__actions">
          <button
            className="btn-primary completion-modal__btn-primary"
            onClick={() => navigate('/student/progress')}
          >
            <span className="material-symbols-outlined">yard</span>
            Xem Khu vườn Tiến bộ
          </button>

          <button
            className="btn-secondary completion-modal__btn-secondary"
            onClick={() => {
              if (onClose) onClose()
              else navigate('/student/dashboard')
            }}
          >
            Về Trang chủ
          </button>
        </div>
      </div>
    </div>
  )
}
