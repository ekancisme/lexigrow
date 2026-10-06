export const MIN_LEARNING_ESSAY_WORDS = 60
export const MAX_LEARNING_ESSAY_WORDS = 100

export function isValidLearningEssayWordCount(wordCount) {
  return Number.isInteger(wordCount)
    && wordCount >= MIN_LEARNING_ESSAY_WORDS
    && wordCount <= MAX_LEARNING_ESSAY_WORDS
}
