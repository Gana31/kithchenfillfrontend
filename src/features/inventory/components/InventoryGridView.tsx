import React, { useState, useRef, useCallback, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, PanResponder, LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { IngredientData } from '../inventoryApi';
import { getGridCardWidth, GRID_GAP } from '../inventoryUtils';
import IngredientGridCard from './IngredientGridCard';

interface CardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridSelectionState {
  active: boolean;
  count: number;
  total: number;
  allSelected: boolean;
}

export interface InventoryGridViewHandle {
  clearSelection: () => void;
  selectAll: () => void;
  deleteSelected: () => void;
}

interface InventoryGridViewProps {
  items: IngredientData[];
  updatingId: string | null;
  onEdit: (item: IngredientData) => void;
  onStepAdjust: (item: IngredientData, type: 'add' | 'deduct', baseAmount: number) => void;
  onBulkDelete: (items: IngredientData[]) => void;
  onSelectionChange?: (state: GridSelectionState) => void;
  onDragSelectingChange?: (active: boolean) => void;
  selectionClearToken?: number;
}

const InventoryGridView = forwardRef<InventoryGridViewHandle, InventoryGridViewProps>(function InventoryGridView(
  {
    items,
    updatingId,
    onEdit,
    onStepAdjust,
    onBulkDelete,
    onSelectionChange,
    onDragSelectingChange,
    selectionClearToken = 0,
  },
  ref
) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = getGridCardWidth(screenWidth);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const cardRects = useRef<Map<string, CardRect>>(new Map());
  const cardRefs = useRef<Map<string, View>>(new Map());
  const selectionModeRef = useRef(selectionMode);
  const isDraggingRef = useRef(false);
  const continuousSelectRef = useRef(false);
  const suppressToggleUntil = useRef(0);

  selectionModeRef.current = selectionMode;

  const setSelectionActive = useCallback((active: boolean) => {
    setSelectionMode(active);
    if (!active) {
      setSelectedIds(new Set());
    }
  }, []);

  const measureAllCards = useCallback(() => {
    cardRefs.current.forEach((view, id) => {
      view.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          cardRects.current.set(id, { x, y, width, height });
        }
      });
    });
  }, []);

  const hitTestCard = useCallback((pageX: number, pageY: number): string | null => {
    for (const [id, rect] of cardRects.current.entries()) {
      if (
        pageX >= rect.x &&
        pageX <= rect.x + rect.width &&
        pageY >= rect.y &&
        pageY <= rect.y + rect.height
      ) {
        return id;
      }
    }
    return null;
  }, []);

  const addToSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const enterSelectionWith = useCallback(
    (id: string) => {
      suppressToggleUntil.current = Date.now() + 500;
      continuousSelectRef.current = true;
      isDraggingRef.current = true;
      onDragSelectingChange?.(true);
      setSelectionActive(true);
      setSelectedIds(new Set([id]));
      measureAllCards();
    },
    [measureAllCards, onDragSelectingChange, setSelectionActive]
  );

  const toggleSelect = useCallback(
    (id: string) => {
      if (isDraggingRef.current) return;
      if (Date.now() < suppressToggleUntil.current) return;

      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        if (next.size === 0) {
          setSelectionActive(false);
        }
        return next;
      });
    },
    [setSelectionActive]
  );

  const selectAll = useCallback(() => {
    setSelectionActive(true);
    setSelectedIds(new Set(items.map((item) => item._id)));
    requestAnimationFrame(measureAllCards);
  }, [items, measureAllCards, setSelectionActive]);

  const clearSelection = useCallback(() => {
    continuousSelectRef.current = false;
    isDraggingRef.current = false;
    setSelectionActive(false);
  }, [setSelectionActive]);

  const deleteSelected = useCallback(() => {
    const selected = items.filter((item) => selectedIds.has(item._id));
    if (selected.length === 0) return;
    onBulkDelete(selected);
  }, [items, onBulkDelete, selectedIds]);

  useImperativeHandle(ref, () => ({
    clearSelection,
    selectAll,
    deleteSelected,
  }), [clearSelection, selectAll, deleteSelected]);

  useEffect(() => {
    if (selectionClearToken > 0) {
      clearSelection();
    }
  }, [selectionClearToken, clearSelection]);

  const selectedCount = selectedIds.size;
  const allSelected = items.length > 0 && selectedCount === items.length;

  useEffect(() => {
    onSelectionChange?.({
      active: selectionMode,
      count: selectedCount,
      total: items.length,
      allSelected,
    });
  }, [selectionMode, selectedCount, items.length, allSelected, onSelectionChange]);

  const endDragSelect = useCallback(() => {
    continuousSelectRef.current = false;
    isDraggingRef.current = false;
    onDragSelectingChange?.(false);
  }, [onDragSelectingChange]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () =>
          continuousSelectRef.current || selectionModeRef.current,
        onMoveShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          if (continuousSelectRef.current) {
            return Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1;
          }
          if (selectionModeRef.current) {
            return Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 8;
          }
          return false;
        },
        onPanResponderGrant: (evt) => {
          isDraggingRef.current = true;
          onDragSelectingChange?.(true);
          measureAllCards();
          const id = hitTestCard(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
          if (id) addToSelection(id);
        },
        onPanResponderMove: (evt) => {
          const id = hitTestCard(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
          if (id) addToSelection(id);
        },
        onPanResponderTerminationRequest: () =>
          !(continuousSelectRef.current || isDraggingRef.current),
        onPanResponderRelease: endDragSelect,
        onPanResponderTerminate: endDragSelect,
      }),
    [addToSelection, endDragSelect, hitTestCard, measureAllCards, onDragSelectingChange]
  );

  const registerCardRef = useCallback((id: string, view: View | null) => {
    if (view) {
      cardRefs.current.set(id, view);
    } else {
      cardRefs.current.delete(id);
      cardRects.current.delete(id);
    }
  }, []);

  const handleCardLayout = useCallback((id: string) => {
    const view = cardRefs.current.get(id);
    view?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        cardRects.current.set(id, { x, y, width, height });
      }
    });
  }, []);

  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, alignItems: 'flex-start' }}
      {...panResponder.panHandlers}
    >
      {items.map((item) => (
        <View
          key={item._id}
          ref={(node) => registerCardRef(item._id, node)}
          onLayout={(_e: LayoutChangeEvent) => handleCardLayout(item._id)}
          style={{ width: cardWidth, alignSelf: 'flex-start' }}
        >
          <IngredientGridCard
            ingredient={item}
            cardWidth={cardWidth}
            isUpdating={updatingId === item._id}
            selectionMode={selectionMode}
            isSelected={selectedIds.has(item._id)}
            onEdit={() => onEdit(item)}
            onLongPress={() => enterSelectionWith(item._id)}
            onToggleSelect={() => toggleSelect(item._id)}
            onStepAdjust={onStepAdjust}
          />
        </View>
      ))}
    </View>
  );
});

export default InventoryGridView;
