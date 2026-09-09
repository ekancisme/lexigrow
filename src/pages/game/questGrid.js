export function cellsFor(word) {
  return Array.from(
    { length: word.length },
    (_, i) =>
      `${word.row + (word.direction === 'down' ? i : 0)},${word.col + (word.direction === 'across' ? i : 0)}`,
  )
}

export function gridFor(quest) {
  const grid = {}
  for (const word of quest.words)
    cellsFor(word).forEach((key, i) => {
      grid[key] ??= { words: [], number: null }
      grid[key].words.push(word.id)
      if (i === 0) grid[key].number = word.number
    })
  return grid
}
