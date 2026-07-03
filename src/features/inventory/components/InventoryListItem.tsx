import React from 'react';
import { View } from 'react-native';
import { IngredientData } from '../inventoryApi';
import { LIST_CARD_HEIGHT, LIST_ITEM_GAP, LIST_ITEM_STRIDE } from '../inventoryUtils';
import { SCROLL_GAP_TOUCH } from '../../../components/scrollUtils';
import IngredientCard from './IngredientCard';

export interface InventoryListItemProps {
  ingredient: IngredientData;
  horizontalPadding: number;
  isUpdating: boolean;
  onEditById: (id: string) => void;
  onAdjustById: (id: string) => void;
  onDeleteById: (id: string) => void;
  onStepAdjust: (id: string, type: 'add' | 'deduct', amount: number) => void;
}

function InventoryListItem({
  ingredient,
  horizontalPadding,
  isUpdating,
  onEditById,
  onAdjustById,
  onDeleteById,
  onStepAdjust,
}: InventoryListItemProps) {
  const id = ingredient._id;

  return (
    <View
      style={{
        height: LIST_ITEM_STRIDE,
        paddingBottom: LIST_ITEM_GAP,
        paddingHorizontal: horizontalPadding,
        overflow: 'hidden',
        ...SCROLL_GAP_TOUCH,
      }}
      collapsable={false}
    >
      <View style={{ height: LIST_CARD_HEIGHT, overflow: 'hidden' }} collapsable={false}>
        <IngredientCard
          ingredient={ingredient}
          isUpdating={isUpdating}
          onEdit={() => onEditById(id)}
          onAdjust={() => onAdjustById(id)}
          onStepAdjust={(type, amount) => onStepAdjust(id, type, amount)}
          onDelete={() => onDeleteById(id)}
        />
      </View>
    </View>
  );
}

function propsAreEqual(prev: InventoryListItemProps, next: InventoryListItemProps) {
  return (
    prev.horizontalPadding === next.horizontalPadding &&
    prev.isUpdating === next.isUpdating &&
    prev.ingredient._id === next.ingredient._id &&
    prev.ingredient.currentStock === next.ingredient.currentStock &&
    prev.ingredient.minThreshold === next.ingredient.minThreshold &&
    prev.ingredient.purchasePrice === next.ingredient.purchasePrice &&
    prev.ingredient.image === next.ingredient.image &&
    prev.ingredient.name === next.ingredient.name &&
    prev.onEditById === next.onEditById &&
    prev.onAdjustById === next.onAdjustById &&
    prev.onDeleteById === next.onDeleteById &&
    prev.onStepAdjust === next.onStepAdjust
  );
}

export default React.memo(InventoryListItem, propsAreEqual);
