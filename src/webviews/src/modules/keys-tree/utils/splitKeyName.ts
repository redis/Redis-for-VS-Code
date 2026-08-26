/**
 * Splits a key name into the parts that become tree levels.
 *
 * Delimiters that fall inside a Redis hash tag are ignored, so a hash tag
 * spanning several delimiter-separated groups stays in a single tree node
 * instead of being torn apart (e.g. `{portal2:something}:foo:bar`).
 *
 * The hash tag is resolved exactly like Redis does in `keyHashSlot`
 * (cluster.c): the first `{`, then the first `}` after it, and only when there
 * is at least one character in between. Keys without such a span - no braces,
 * unbalanced braces, an empty `{}` - are split as before.
 *
 * NOTE: this logic is duplicated inside `constructKeysToTree` because that
 * function is stringified into a Web Worker Blob by `useDisposableWebworker`
 * and therefore cannot reference anything outside its own body. Keep both
 * copies in sync.
 */
export const splitKeyName = (name: string, delimiterPattern: string): string[] => {
  const tagStart = name.indexOf('{')
  const tagEnd = tagStart === -1 ? -1 : name.indexOf('}', tagStart + 1)

  // no usable hash tag - keep the original behaviour
  if (tagEnd <= tagStart + 1 || !delimiterPattern) {
    return name.split(new RegExp(delimiterPattern, 'g'))
  }

  const regex = new RegExp(delimiterPattern, 'g')
  const parts: string[] = []
  let partStart = 0
  let match = regex.exec(name)

  while (match !== null) {
    const { length } = match[0]

    if (length === 0) {
      // never let a zero-length match stall the scan
      regex.lastIndex += 1
    } else if (match.index <= tagStart || match.index + length > tagEnd) {
      parts.push(name.slice(partStart, match.index))
      partStart = match.index + length
    }

    match = regex.exec(name)
  }

  parts.push(name.slice(partStart))

  return parts
}
