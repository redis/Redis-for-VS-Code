import { constructKeysToTreeMockResult, delimiterMock } from './constructKeysToTreeMockResult'
import { constructKeysToTree } from '../constructKeysToTree'

const constructKeysToTreeTests: any[] = [
  [{
    items: [
      { nameString: 'keys:1:2', type: 'hash', ttl: -1, size: 71 },
      { nameString: 'keys:1:1', type: 'hash', ttl: -1, size: 71 },
      { nameString: 'empty::test', type: 'hash', ttl: -1, size: 71 },
      { nameString: 'test1', type: 'hash', ttl: -1, size: 71 },
      { nameString: 'test2', type: 'hash', ttl: -1, size: 71 },
      { nameString: 'keys:1', type: 'hash', ttl: -1, size: 71 },
      { nameString: 'keys1', type: 'hash', ttl: -1, size: 71 },
      { nameString: 'keys:3', type: 'hash', ttl: -1, size: 71 },
      { nameString: 'keys:2', type: 'hash', ttl: -1, size: 71 },
      { nameString: 'keys_2', type: 'hash', ttl: -1, size: 71 },
    ],
    delimiterPattern: delimiterMock,
  },
  constructKeysToTreeMockResult,
  ],
]

const removeIds = (nodes: any[]): any[] => nodes.map(({ children, id, ...rest }) => ({
  ...rest,
  children: removeIds(children),
}))

// Compact view of the tree: a folder becomes { name: [children] }, a leaf its full name
const toNames = (nodes: any[]): any[] => nodes.map((node) =>
  (node.isLeaf ? node.nameString : { [node.nameString]: toNames(node.children) }))

const toItems = (names: string[]): any[] =>
  names.map((nameString) => ({ nameString, type: 'hash', ttl: -1, size: 71 }))

const hashTagTests: [string[], string, any[]][] = [
  // the reported case: a hash tag spanning two groups is a single node
  [
    ['{portal2:co}:something', '{portal2:tb}:something'],
    ':',
    [
      { '{portal2:co}': ['{portal2:co}:something'] },
      { '{portal2:tb}': ['{portal2:tb}:something'] },
    ],
  ],
  // a hash tag without a delimiter inside groups exactly as before
  [['{user}:1:2'], ':', [{ '{user}': [{ 1: ['{user}:1:2'] }] }]],
  // only the first "{" and the first "}" after it are the hash tag (Redis rule)
  [['a{b:c}:d:{e:f}'], ':', [{ 'a{b:c}': [{ d: [{ '{e': ['a{b:c}:d:{e:f}'] }] }] }]],
  // an empty hash tag is not a hash tag
  [['foo{}:bar'], ':', [{ 'foo{}': ['foo{}:bar'] }]],
  // unbalanced braces fall back to a plain split
  [['foo{bar:baz'], ':', [{ 'foo{bar': ['foo{bar:baz'] }]],
  [['foo}bar{baz:qux'], ':', [{ 'foo}bar{baz': ['foo}bar{baz:qux'] }]],
  // several configured delimiters
  [['{a:b_c}:d_e'], ':|_', [{ '{a:b_c}': [{ d: ['{a:b_c}:d_e'] }] }]],
]

describe('constructKeysToTree', () => {
  it.each(constructKeysToTreeTests)('for input: %s (items), should be output: %s',
    (items, expected) => {
      const result = constructKeysToTree(items)
      expect(removeIds(result)).toEqual(expected)
    })

  it.each(hashTagTests)('should keep the hash tag of %j in a single node (delimiter "%s")',
    (names, delimiterPattern, expected) => {
      const result = constructKeysToTree({ items: toItems(names), delimiterPattern })
      expect(toNames(result)).toEqual(expected)
    })
})
