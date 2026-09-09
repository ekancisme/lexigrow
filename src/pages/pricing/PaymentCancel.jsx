import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './PricingPage.css'

export default function PaymentCancel() {
  const [searchParams] = useSearchParams()
  const orderCode = searchParams.get('orderCode')
  const { t } = useLanguage()

  return (
    <div className="pricing-page" style={{ textAlign: 'center', maxWidth: 600, paddingTop: '5rem' }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 48 }}>
          cancel
        </span>
      </div>

      <h1 className="text-headline-lg" style={{ marginBottom: '0.5rem' }}>
        {t('payment.cancelTitle', 'Payment Cancelled')}
      </h1>
      <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '2rem' }}>
        {t('payment.cancelDesc', 'Your payment was cancelled or could not be completed. Your account has not been charged.')}
      </p>

      {orderCode && (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', marginBottom: '2rem' }}>
          {t('payment.orderCode', 'Order Code')}: <strong>#{orderCode}</strong>
        </p>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link
          to="/pricing"
          className="btn-primary"
          style={{ padding: '0.85rem 1.75rem', textDecoration: 'none', borderRadius: 12, fontWeight: 700 }}
        >
          {t('payment.tryAgain', 'Retry Payment')}
        </Link>
        <Link
          to="/"
          className="btn-secondary"
          style={{ padding: '0.85rem 1.75rem', textDecoration: 'none', borderRadius: 12, fontWeight: 600 }}
        >
          {t('common.back', 'Back to Home')}
        </Link>
      </div>
    </div>
  )
}
