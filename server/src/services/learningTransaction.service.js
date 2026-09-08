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
    if (err.code !== 11000) throw err
    const committed = await LearningOperation.findOne(query).lean()
    if (!committed) throw err
    if (committed.fingerprint !== fingerprint)
      fail('Idempotency key reused with different data', 409)
    return { result: committed.result, replayed: true }
  }
}
