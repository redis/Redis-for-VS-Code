import { splitKeyName } from '../splitKeyName'

const singleDelimiter = ':'
const multipleDelimiters = ':|_'

const splitKeyNameTests: [string, string, string[]][] = [
  // no braces at all - behaviour is unchanged
  ['keys:1:2', singleDelimiter, ['keys', '1', '2']],
  ['empty::test', singleDelimiter, ['empty', '', 'test']],
  ['keys1', singleDelimiter, ['keys1']],
  ['keys_2', multipleDelimiters, ['keys', '2']],

  // hash tag spanning several groups stays in one part
  ['{portal2:co}:something', singleDelimiter, ['{portal2:co}', 'something']],
  ['{portal2:tb}:something:else', singleDelimiter, ['{portal2:tb}', 'something', 'else']],
  ['prefix:{portal2:co}:something', singleDelimiter, ['prefix', '{portal2:co}', 'something']],
  ['{portal2:co}', singleDelimiter, ['{portal2:co}']],
  ['tail:{portal2:co}', singleDelimiter, ['tail', '{portal2:co}']],

  // hash tag without a delimiter inside - behaviour is unchanged
  ['{user}:1:2', singleDelimiter, ['{user}', '1', '2']],

  // only the first "{" and the first "}" after it form the hash tag (Redis rule),
  // so the trailing braces are plain characters and keep splitting
  ['a{b:c}:d:{e:f}', singleDelimiter, ['a{b:c}', 'd', '{e', 'f}']],

  // an empty hash tag is not a hash tag for Redis - the whole key is hashed
  ['foo{}:bar:baz', singleDelimiter, ['foo{}', 'bar', 'baz']],
  ['foo{}{bar:baz}:x', singleDelimiter, ['foo{}{bar', 'baz}', 'x']],

  // unbalanced braces - fall back to a plain split
  ['foo{bar:baz', singleDelimiter, ['foo{bar', 'baz']],
  ['foo}bar{baz:qux', singleDelimiter, ['foo}bar{baz', 'qux']],
  ['foo}bar:{baz', singleDelimiter, ['foo}bar', '{baz']],
  ['}}}:{{{', singleDelimiter, ['}}}', '{{{']],

  // several configured delimiters
  ['{a:b_c}:d_e', multipleDelimiters, ['{a:b_c}', 'd', 'e']],
  ['{a_b}:c', multipleDelimiters, ['{a_b}', 'c']],

  // the settings UI cannot produce an empty delimiter, but a degenerate pattern
  // must still terminate instead of looping on zero-length matches
  ['abc', '', ['a', 'b', 'c']],
  ['{a:b}:c', '|:', ['{a:b}:c']],
]

describe('splitKeyName', () => {
  it.each(splitKeyNameTests)('for "%s" with pattern "%s" should return %j',
    (name, pattern, expected) => {
      expect(splitKeyName(name, pattern)).toEqual(expected)
    })
})
