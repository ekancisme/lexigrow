import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import paymentService from '../../services/payment.service.js'
import './PricingPage.css'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const orderCode = searchParams.get('orderCode')
  const { user } = useAuth()
  const [tierInfo, setTierInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await paymentService.getMySubscription()
        setTierInfo(res.data)
      } catch (err) {
        console.error('Error fetching subscription status:', err)
      } finally {
        setLoading(false)
      }
    }
    checkStatus()
  }, [])

  return (
    <div className="pricing-page" style={{ textAlign: 'center', maxWidth: 650, paddingTop: '5rem' }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 48 }}>
          check_circle
        </span>
      </div>

      <h1 className="text-headline-lg" style={{ marginBottom: '0.5rem' }}>
        Payment Successful!
      </h1>
      <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '2rem' }}>
        Thank you for upgrading your subscription on LexiGrow. Your plan has been automatically activated via PayOS.
      </p>

      {orderCode && (
        <div
          style={{
            background: 'var(--color-surface-container, #f1f5f9)',
            padding: '1rem',
            borderRadius: 12,
            marginBottom: '2rem',
            fontSize: '0.9rem',
          }}
        >
          <span>Order Code: </span>
          <strong>#{orderCode}</strong>
          {tierInfo && (
            <div style={{ marginTop: '0.5rem' }}>
              <span>Activated Plan: </span>
              <strong style={{ color: 'var(--color-primary, #1a73e8)' }}>
                {tierInfo.tier?.toUpperCase()} ({tierInfo.planName})
              </strong>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link
          to={user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'}
          className="btn-primary"
          style={{ padding: '0.85rem 1.75rem', textDecoration: 'none', borderRadius: 12, fontWeight: 700 }}
        >
          Start Learning Now
        </Link>
        <Link
          to="/pricing"
          className="btn-secondary"
          style={{ padding: '0.85rem 1.75rem', textDecoration: 'none', borderRadius: 12, fontWeight: 600 }}
        >
          View Pricing Plans
        </Link>
      </div>
    </div>
  )
}
