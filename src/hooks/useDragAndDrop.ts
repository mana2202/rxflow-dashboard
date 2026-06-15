import { useState, useCallback } from 'react';

export interface DragState<T> {
  item: T | null;
  sourceId: string | null;
}

export interface UseDragAndDropResult<T> {
  dragState: DragState<T>;
  isDragging: boolean;
  onDragStart: (item: T, sourceId: string) => (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (targetId: string, onMove: (item: T, from: string, to: string) => void) => (e: React.DragEvent) => void;
  isDropTarget: (columnId: string) => boolean;
}

export function useDragAndDrop<T>(): UseDragAndDropResult<T> {
  const [dragState, setDragState] = useState<DragState<T>>({ item: null, sourceId: null });
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const onDragStart = useCallback((item: T, sourceId: string) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragState({ item, sourceId });
  }, []);

  const onDragEnd = useCallback(() => {
    setDragState({ item: null, sourceId: null });
    setDropTarget(null);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const col = (e.currentTarget as HTMLElement).dataset.columnId;
    if (col) setDropTarget(col);
  }, []);

  const onDrop = useCallback(
    (targetId: string, onMove: (item: T, from: string, to: string) => void) => (e: React.DragEvent) => {
      e.preventDefault();
      const { item, sourceId } = dragState;
      if (item && sourceId && sourceId !== targetId) {
        onMove(item, sourceId, targetId);
      }
      setDragState({ item: null, sourceId: null });
      setDropTarget(null);
    },
    [dragState]
  );

  const isDropTarget = useCallback((columnId: string) => dropTarget === columnId, [dropTarget]);

  return {
    dragState,
    isDragging: dragState.item !== null,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    isDropTarget,
  };
}
