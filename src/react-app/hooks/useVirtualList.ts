import { useState, useMemo, useCallback } from 'react'

interface VirtualListOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
  items: any[]
}

interface VirtualListResult {
  virtualItems: Array<{
    index: number
    start: number
    end: number
    item: any
  }>
  totalHeight: number
  scrollElementProps: {
    style: React.CSSProperties
    onScroll: (e: React.UIEvent) => void
  }
  containerProps: {
    style: React.CSSProperties
  }
}

export function useVirtualList({
  itemHeight,
  containerHeight,
  overscan = 5,
  items
}: VirtualListOptions): VirtualListResult {
  const [scrollTop, setScrollTop] = useState(0)

  const totalHeight = items.length * itemHeight

  const visibleItemsRange = useMemo(() => {
    const visibleStartIndex = Math.floor(scrollTop / itemHeight)
    const visibleEndIndex = Math.min(
      visibleStartIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    )

    const startIndex = Math.max(0, visibleStartIndex - overscan)
    const endIndex = Math.min(items.length - 1, visibleEndIndex + overscan)

    return {
      startIndex,
      endIndex,
      visibleStartIndex,
      visibleEndIndex
    }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  const virtualItems = useMemo(() => {
    const { startIndex, endIndex } = visibleItemsRange
    const result = []

    for (let i = startIndex; i <= endIndex; i++) {
      result.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        item: items[i]
      })
    }

    return result
  }, [visibleItemsRange, itemHeight, items])

  const handleScroll = useCallback((e: React.UIEvent) => {
    const scrollTop = (e.target as HTMLElement).scrollTop
    setScrollTop(scrollTop)
  }, [])

  const scrollElementProps = {
    style: {
      height: containerHeight,
      overflow: 'auto' as const,
      width: '100%'
    },
    onScroll: handleScroll
  }

  const containerProps = {
    style: {
      height: totalHeight,
      position: 'relative' as const,
      width: '100%'
    }
  }

  return {
    virtualItems,
    totalHeight,
    scrollElementProps,
    containerProps
  }
}

// Hook específico para listas de pacientes
export function useVirtualPatientList(patients: any[], containerHeight: number = 400) {
  return useVirtualList({
    items: patients,
    itemHeight: 120, // Height of patient card
    containerHeight,
    overscan: 3
  })
}

// Hook específico para listas de agendamentos
export function useVirtualAppointmentList(appointments: any[], containerHeight: number = 500) {
  return useVirtualList({
    items: appointments,
    itemHeight: 150, // Height of appointment card
    containerHeight,
    overscan: 2
  })
}
