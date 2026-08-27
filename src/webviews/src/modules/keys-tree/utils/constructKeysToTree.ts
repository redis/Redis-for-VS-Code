import { SortOrder } from 'uiSrc/constants'
import { KeyInfo } from 'uiSrc/interfaces'

interface Props {
  items: KeyInfo[]
  delimiterPattern?: string
  delimiters?: string[]
  sorting?: SortOrder
}

export const constructKeysToTree = (props: Props): any[] => {
  const { items: keys, delimiterPattern = ':', delimiters = [], sorting = 'ASC' } = props

  // Declared inline because this whole function is stringified into a Web Worker
  // Blob by `useDisposableWebworker` and cannot reference module scope.
  // Keep in sync with uiSrc/modules/keys-tree/utils/splitKeyName.
  const splitKeyName = (name: string, pattern: string): string[] => {
    const tagStart = name.indexOf('{')
    const tagEnd = tagStart === -1 ? -1 : name.indexOf('}', tagStart + 1)

    // no usable hash tag - keep the original behaviour
    if (tagEnd <= tagStart + 1 || !pattern) {
      return name.split(new RegExp(pattern, 'g'))
    }

    const regex = new RegExp(pattern, 'g')
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

  const keysSymbol = `keys${delimiterPattern}keys`
  const tree: any = {}

  keys.forEach((key: any) => {
    // eslint-disable-next-line prefer-object-spread
    let currentNode: any = tree
    const { nameString: name = '' } = key
    const nameSplitted = splitKeyName(name, delimiterPattern)
    const lastIndex = nameSplitted.length - 1

    nameSplitted.forEach((value: any, index: number) => {
      // create a key leaf
      if (index === lastIndex) {
        // eslint-disable-next-line prefer-object-spread
        currentNode[name + keysSymbol] = Object.assign({}, key, { isLeaf: true })
      } else if (currentNode[value] === undefined) {
        currentNode[value] = {}
      }

      currentNode = currentNode[value]
    })
  })

  const ids: any = {}

  // common functions
  const getUniqueId = (): number | string => {
    const candidateId = Math.random().toString(36)

    if (ids[candidateId]) {
      return getUniqueId()
    }

    ids[candidateId] = true
    return candidateId
  }

  // Folders should be always before leaves
  const sortKeysAndFolder = (nodes: string[]) => {
    nodes.sort((a, b) => {
      // Custom sorting for items ending with "keys:keys"
      if (a.endsWith(keysSymbol) && !b.endsWith(keysSymbol)) {
        return 1
      }
      if (!a.endsWith(keysSymbol) && b.endsWith(keysSymbol)) {
        return -1
      }

      // Regular sorting
      if (sorting === 'ASC') {
        return a.localeCompare(b, 'en')
      }
      if (sorting === 'DESC') {
        return b.localeCompare(a, 'en')
      }

      return 0
    })
  }

  // FormatTreeData
  const formatTreeData = (tree: any, previousKey = '', delimiter = ':', prevIndex = '') => {
    const treeNodes: string[] = Object.keys(tree)

    sortKeysAndFolder(treeNodes)

    return treeNodes.map((key, index) => {
      const name = key?.toString()
      const node: any = { nameString: name }
      const path = prevIndex ? `${prevIndex}.${index}` : `${index}`

      // populate node with children nodes
      if (!tree[key].isLeaf && Object.keys(tree[key]).length > 0) {
        const delimiterView = delimiters.length === 1 ? delimiters[0] : '-'
        node.children = formatTreeData(
          tree[key],
          `${previousKey + name + delimiterView}`,
          delimiter,
          path,
        )
        node.keyCount = node.children.reduce((a: number, b: any) => a + (b.keyCount || 1), 0)
        node.keyApproximate = (node.keyCount / keys.length) * 100
        node.fullName = previousKey + name
      } else {
        // populate leaf
        node.isLeaf = true
        node.children = []
        node.nameString = name.slice(0, -keysSymbol.length)
        node.nameBuffer = tree[key]?.name
        node.fullName = previousKey + name + delimiter
      }

      node.path = path
      node.id = getUniqueId()
      return node
    })
  }

  return formatTreeData(tree, '', delimiterPattern)
}
