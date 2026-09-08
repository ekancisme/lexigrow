import mongoose from 'mongoose'
import LearningOperation from '../models/LearningOperation.js'
import { hash, fail } from '../utils/learning.js'
// The operation receipt and all domain writes commit together. MongoDB replica set required.
export async function transactIntent(student, scope, key, payload, work) {
  const fingerprint = hash(payload),
    query = { student, scope, key }
  const previous = await LearningOperation.findOne(query).lean()
  if (previous) {
    if (previous.fingerprint !== fingerprint)
      fail('Idempotency key reused with different data', 409)
    return { result: previous.result, replayed: true }
  }

  // Try transaction first; fallback to sequential if MongoDB doesn't support it.
  try {
    const result = await mongoose.connection.transaction(async (tx) => {
      const receipt = await LearningOperation.findOne(query).session(tx)
      if (receipt) {
        if (receipt.fingerprint !== fingerprint)
          fail('Idempotency key reused with different data', 409)
        return { result: receipt.result, replayed: true }
      }
      const [op] = await LearningOperation.create([{ ...query, fingerprint }], {
        session: tx,
      })
      const data = await work(tx)
      op.result = JSON.parse(JSON.stringify(data))
      await op.save({ session: tx })
      return { result: op.result, replayed: false }
    })
    return result
  } catch (err) {
    // Fallback for standalone MongoDB: run sequentially (no atomicity but works for dev)
    if (err.message && (
      err.message.includes('Transaction numbers are only allowed on a replica set') ||
      err.message.includes('does not support retryable writes') ||
      err.message.includes('Transaction is not supported')
    )) {
      console.warn(
        `⚠️ [transactIntent] MongoDB transaction not supported (standalone mode). ` +
        `Falling back to sequential execution for ${scope}:${key}. ` +
        `For production, use a replica set.`
      )

      // Check again for race condition (idempotency)
      const committed = await LearningOperation.findOne(query).lean()
      if (committed) {
        if (committed.fingerprint !== fingerprint)
          fail('Idempotency key reused with different data', 409)
        return { result: committed.result, replayed: true }
      }

      // Create operation without transaction
      const [op] = await LearningOperation.create([{ ...query, fingerprint }])
      const data = await work(null) // work() receives null tx, must handle it
      op.result = JSON.parse(JSON.stringify(data))
      await op.save()
      return { result: op.result, replayed: false }
    }

    // Duplicate key: another process already created it
    if (err.code === 11000) {
      const committed = await LearningOperation.findOne(query).lean()
      if (!committed) throw err
      if (committed.fingerprint !== fingerprint)
        fail('Idempotency key reused with different data', 409)
      return { result: committed.result, replayed: true }
    }

    throw err
  }
}
