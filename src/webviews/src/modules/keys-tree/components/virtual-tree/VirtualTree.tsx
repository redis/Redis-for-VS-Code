import React, { useCallback, useEffect, useRef, useState } from 'react'
import AutoSizer, { Size } from 'react-virtualized-auto-sizer'
import { debounce, get, isUndefined, set } from 'lodash'
import {
  TreeWalker,
  TreeWalkerValue,
  FixedSizeTree as Tree,
} from 'react-vtree'
import cx from 'classnames'

import { AllKeyTypes, DEFAULT_DELIMITER, DEFAULT_TREE_SORTING, KeyTypes, MAX_HEIGHT_TREE, SortOrder } from 'uiSrc/constants'
import { KeyInfo, Nullable, RedisString } from 'uiSrc/interfaces'
import { bufferToString } from 'uiSrc/utils'
import { useDisposableWebworker } from 'uiSrc/hooks'
import { Database } from 'uiSrc/store'
import { NodeMeta, TreeData, TreeNode } from './interfaces'
import { Node } from '../node'
import { MIN_NODE_WIDTH, PADDING_LEVEL } from '../../constants'

import { useKeysApi } from '../../hooks/useKeys'
import { splitKeyName } from '../../utils'
import styles from './styles.module.scss'

export interface Props {
  items: KeyInfo[]
  delimiterPattern: string
  delimiters?: string[]
  loading: boolean
  deleting?: boolean
  sorting?: SortOrder
  statusSelected: Nullable<string>,
  database: Database
  statusOpen: OpenedNodes
  webworkerFn: (...args: any) => any
  onStatusOpen?: (name: string, value: boolean) => void
  onStatusSelected?: (key: RedisString, keyString: string, type: AllKeyTypes) => void
  setConstructingTree: (status: boolean) => void
  onDeleteLeaf: (key: RedisString) => void
  onDeleteClicked: (type: AllKeyTypes) => void
}

interface OpenedNodes {
  [key: string]: boolean
}

const VirtualTree = (props: Props) => {
  const {
    items = [],
    delimiterPattern,
    delimiters = [],
    statusOpen = {},
    statusSelected,
    loading,
    database,
    deleting = false,
    sorting = DEFAULT_TREE_SORTING,
    onStatusOpen,
    onStatusSelected,
    setConstructingTree,
    webworkerFn,
    onDeleteClicked,
    onDeleteLeaf,
  } = props

  const [rerenderState, rerender] = useState({})
  const [containerWidth, setContainerWidth] = useState(0)
  const controller = useRef<Nullable<AbortController>>(null)
  const elements = useRef<any>({})
  const nodes = useRef<TreeNode[]>([])
  const innerRef = useRef<HTMLDivElement>(null)
  const isNotRendered = useRef<boolean>(true)

  const keysApi = useKeysApi()

  const { result, run: runWebworker } = useDisposableWebworker(webworkerFn)

  useEffect(() =>
    () => {
      nodes.current = []
      elements.current = {}
    }, [])

  useEffect(() => {
    setTimeout(() => {
      rerender({})
    }, 0)
  }, [statusOpen])

  // receive result from the "runWebworker"
  useEffect(() => {
    if (!result) {
      return
    }

    elements.current = {}
    nodes.current = result
    rerender({})
    setConstructingTree?.(false)
  }, [result])

  useEffect(() => {
    if (!items?.length) {
      nodes.current = []
      elements.current = {}
      rerender({})
      runWebworker?.({ items: [], delimiterPattern, delimiters, sorting })
      return
    }

    setConstructingTree?.(true)
    runWebworker?.({ items, delimiterPattern, delimiters, sorting })
  }, [items, delimiterPattern])

  const handleUpdateSelected = useCallback((name: RedisString, keyString: string, type: AllKeyTypes) => {
    onStatusSelected?.(name, keyString, type)
  }, [onStatusSelected])

  const handleUpdateOpen = useCallback((fullName: string, value: boolean) => {
    onStatusOpen?.(fullName, value)
  }, [onStatusOpen, nodes])

  const onResize = useCallback((size: Size) => {
    setContainerWidth(size.width)
  }, [])

  const updateNodeByPath = (path: string, data: any) => {
    const paths = path.replaceAll('.', '.children.')

    const node = get(nodes.current, paths)
    const fullData = { ...node, ...data }

    if (node) {
      set(nodes.current, paths, fullData)
    }
  }

  const formatItem = useCallback((item: KeyInfo) => ({
    ...item,
    nameString: bufferToString(item.name as string),
  }), [])

  const getMetadata = useCallback((
    itemsInit: any[][] = [],
  ): void => {
    keysApi.fetchKeysMetadataTree(
      itemsInit,
      controller.current?.signal,
      (loadedItems) =>
        onSuccessFetchedMetadata(loadedItems),
      () => { rerender({}) },
    )
  }, [])

  const onSuccessFetchedMetadata = useCallback((
    loadedItems: any[],
  ) => {
    const items = loadedItems.map(formatItem)

    items.forEach((item) => updateNodeByPath(item.path ?? '', item))

    rerender({})
  }, [])

  const getMetadataDebounced = debounce(() => {
    const entries = Object.entries(elements.current)

    getMetadata(entries)

    elements.current = {}
  }, 100)

  const getMetadataNode = useCallback((nameBuffer: any, path: string) => {
    elements.current[path] = nameBuffer
    getMetadataDebounced()
  }, [])

  const getNestingLevel = useCallback((nestingLevel: number) => {
    const calculatedWidth = (nestingLevel * PADDING_LEVEL) + MIN_NODE_WIDTH

    return calculatedWidth < containerWidth
      ? nestingLevel
      : Math.floor((containerWidth - MIN_NODE_WIDTH) / PADDING_LEVEL)
  }, [containerWidth])

  // This helper function constructs the object that will be sent back at the step
  // [2] during the treeWalker function work. Except for the mandatory `data`
  // field you can put any additional data here.

  const getNodeData = (
    node: TreeNode,
    nestingLevel: number,
  ): TreeWalkerValue<TreeData, NodeMeta> => ({
    data: {
      id: node.id.toString(),
      isLeaf: node.isLeaf,
      keyCount: node.keyCount,
      name: node.name,
      nameString: node.nameString,
      nameBuffer: node.nameBuffer,
      ttl: node.ttl,
      size: node.size,
      type: node.type,
      fullName: node.fullName,
      shortName: node.nameString == null ? undefined : splitKeyName(node.nameString, delimiterPattern).pop(),
      delimiters,
      nestingLevel: getNestingLevel(nestingLevel),
      deleting,
      path: node.path,
      getMetadata: getMetadataNode,
      onDeleteClicked,
      updateStatusSelected: handleUpdateSelected,
      updateStatusOpen: handleUpdateOpen,
      onDelete: onDeleteLeaf,
      keyApproximate: node.keyApproximate,
      isSelected: !!node.isLeaf && statusSelected === node?.nameString,
      isOpenByDefault: statusOpen[node.fullName],
    },
    nestingLevel,
    node,
  })

  // The `treeWalker` function runs only on tree re-build which is performed
  // whenever the `treeWalker` prop is changed.
  const treeWalker = useCallback(
    function* treeWalker(): ReturnType<TreeWalker<TreeData, NodeMeta>> {
      // Step [1]: Define the root multiple nodes of our tree
      for (let i = 0; i < nodes.current.length; i++) {
        yield getNodeData(nodes.current[i], 0)
      }

      // Step [2]: Get the parent component back. It will be the object
      // the `getNodeData` function constructed, so you can read any data from it.
      while (true) {
        const parentMeta = yield

        for (let i = 0; i < parentMeta.node.children?.length; i++) {
          // Step [3]: Yielding all the children of the provided component. Then we
          // will return for the step [2] with the first children.
          yield getNodeData(
            parentMeta.node.children[i],
            parentMeta.nestingLevel + 1,
          )
        }
      }
    },
    [statusSelected, statusOpen, rerenderState, containerWidth, database],
  )

  const containerHeight = isUndefined(innerRef.current?.clientHeight)
    ? 1
    : innerRef.current?.clientHeight < MAX_HEIGHT_TREE
      ? innerRef.current?.clientHeight
      : MAX_HEIGHT_TREE

  const onItemsRendered = () => {
    if (isNotRendered.current) {
      isNotRendered.current = false
    }
    rerender({})
  }

  return (
    <div style={{ height: containerHeight }}>
      <AutoSizer onResize={onResize}>
        {({ height, width }) => (
          <div className="relative" data-testid="virtual-tree">
            {nodes.current.length > 0 && (
              <Tree
                async
                height={height}
                width={width}
                innerRef={innerRef}
                itemSize={22}
                treeWalker={treeWalker}
                onItemsRendered={onItemsRendered}
                className={cx(styles.customScroll, { 'data-loading': loading })}
              >
                {Node}
              </Tree>
            )}
            {nodes.current.length === 0 && loading && (
              <div className={styles.loadingContainer} style={{ width: width || 0, height: height || 0 }} data-testid="virtual-tree-spinner">
                <div className={styles.loadingBody}>
                  {/* <EuiLoadingSpinner size="xl" className={styles.loadingSpinner} />
                  <EuiIcon type={loadingIcon || 'empty'} className={styles.loadingIcon} /> */}
                </div>
              </div>
            )}
          </div>
        )}
      </AutoSizer>
    </div>
  )
}

export default VirtualTree
