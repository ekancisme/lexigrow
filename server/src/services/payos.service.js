import PayOSPackage from '@payos/node'

const PayOS = PayOSPackage.PayOS || PayOSPackage.default?.PayOS || PayOSPackage

let payOSClient = null

export function getPayOSClient() {
  if (!payOSClient) {
    const clientId = process.env.PAYOS_CLIENT_ID
    const apiKey = process.env.PAYOS_API_KEY
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY

    if (!clientId || !apiKey || !checksumKey) {
      console.warn('⚠️ PayOS configuration is missing in environment variables.')
      return null
    }

    payOSClient = new PayOS({ clientId, apiKey, checksumKey })
  }
  return payOSClient
}

/**
 * Create PayOS payment link for subscription purchase
 */
export async function createPayOSPaymentLink({
  orderCode,
  amount,
  description,
  buyerName,
  buyerEmail,
  returnUrl,
  cancelUrl,
  items = [],
}) {
  const client = getPayOSClient()
  if (!client) {
    throw new Error('PayOS client is not configured properly.')
  }

  // PayOS description max length is 25 chars
  const sanitizedDescription = (description || `LEXIGROW-${orderCode}`)
    .substring(0, 25)
    .trim()

  const paymentData = {
    orderCode: Number(orderCode),
    amount: Math.round(Number(amount)),
    description: sanitizedDescription,
    buyerName: buyerName || 'LexiGrow User',
    buyerEmail: buyerEmail || undefined,
    returnUrl,
    cancelUrl,
    items,
  }

  const paymentLinkResponse = await client.paymentRequests.create(paymentData)
  return paymentLinkResponse
}

/**
 * Verify PayOS webhook data integrity using Checksum Key
 */
export async function verifyPayOSWebhookData(webhookBody) {
  const client = getPayOSClient()
  if (!client) {
    throw new Error('PayOS client is not configured.')
  }
  return client.webhooks.verify(webhookBody)
}

/**
 * Query payment link info by orderCode
 */
export async function getPayOSPaymentInfo(orderCode) {
  const client = getPayOSClient()
  if (!client) {
    throw new Error('PayOS client is not configured.')
  }
  return client.paymentRequests.get(orderCode)
}

