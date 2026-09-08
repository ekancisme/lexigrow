import api from './api.js'

export const paymentService = {
  // Public / User methods
  getPlans(role) {
    const query = role ? `?role=${role}` : ''
    return api.get(`/payments/plans${query}`)
  },

  getMySubscription() {
    return api.get('/payments/my-subscription')
  },

  createPaymentLink(planSlug, billingCycle = 'monthly') {
    return api.post('/payments/create-payment-link', { planSlug, billingCycle })
  },

  getTeacherSponsorship() {
    return api.get('/payments/teacher-sponsorship')
  },

  getMyTransactions() {
    return api.get('/payments/my-transactions')
  },

  // Admin methods
  adminGetPlans() {
    return api.get('/admin/pricing/plans')
  },

  adminCreatePlan(planData) {
    return api.post('/admin/pricing/plans', planData)
  },

  adminUpdatePlan(id, planData) {
    return api.put(`/admin/pricing/plans/${id}`, planData)
  },

  adminDeletePlan(id) {
    return api.delete(`/admin/pricing/plans/${id}`)
  },

  adminGetTransactions(query = '') {
    return api.get(`/admin/pricing/transactions${query ? '?' + query : ''}`)
  },

  adminGetSubscriptions(query = '') {
    return api.get(`/admin/pricing/subscriptions${query ? '?' + query : ''}`)
  },

  adminGrantSubscription(data) {
    return api.post('/admin/pricing/grant-subscription', data)
  },
}

export default paymentService
