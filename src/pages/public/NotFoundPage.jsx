import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './NotFoundPage.css'

export default function NotFoundPage() {
  const { language } = useLanguage()

  return (
    <div className="eduvia-page eduvia-404-page">
      <div className="eduvia-404-hero">
        <h1 className="eduvia-404-code">404</h1>
        <h2 className="eduvia-404-title">
          {language === 'vi' ? 'Rất tiếc! Không tìm thấy trang' : 'Oops, Page Not Found'}
        </h2>
        <p className="eduvia-404-desc">
          {language === 'vi'
            ? 'Trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc đường dẫn bị thay đổi. Vui lòng quay về trang chủ hoặc khám phá các khóa học khác trên LexiGrow.'
            : 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Please return to the homepage or explore our courses.'}
        </p>
        <Link to="/student/home" className="eduvia-btn eduvia-btn--lime">
          {language === 'vi' ? 'Về trang chủ' : 'Back To Homepage'}
        </Link>
      </div>
    </div>
  )
}
