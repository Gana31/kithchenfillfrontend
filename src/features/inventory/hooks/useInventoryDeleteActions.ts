import { useCallback, useState } from 'react';
import { useAppDispatch } from '../../../store/store';
import { showToast } from '../../../store/toastSlice';
import { useDeleteIngredientMutation, IngredientData } from '../inventoryApi';

interface UseInventoryDeleteActionsOptions {
  onDeleteSuccess: () => void;
  onBulkDeleteSuccess: () => void;
}

export function useInventoryDeleteActions({
  onDeleteSuccess,
  onBulkDeleteSuccess,
}: UseInventoryDeleteActionsOptions) {
  const dispatch = useAppDispatch();
  const [deleteIngredient] = useDeleteIngredientMutation();
  const [ingredientToDelete, setIngredientToDelete] = useState<IngredientData | null>(null);
  const [bulkDeleteItems, setBulkDeleteItems] = useState<IngredientData[]>([]);

  const requestDelete = useCallback((ingredient: IngredientData) => {
    setIngredientToDelete(ingredient);
  }, []);

  const requestBulkDelete = useCallback((items: IngredientData[]) => {
    setBulkDeleteItems(items);
  }, []);

  const executeBulkDelete = useCallback(async () => {
    if (bulkDeleteItems.length === 0) return;
    const targets = bulkDeleteItems;
    setBulkDeleteItems([]);

    try {
      const results = await Promise.allSettled(
        targets.map((item) => deleteIngredient(item._id).unwrap())
      );
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = targets.length - successCount;

      if (successCount > 0) {
        onBulkDeleteSuccess();
        dispatch(
          showToast({
            title: 'Deleted',
            message: `${successCount} ingredient${successCount === 1 ? '' : 's'} removed.`,
            type: 'success',
          })
        );
      }
      if (failCount > 0) {
        dispatch(
          showToast({
            title: 'Partial Delete',
            message: `${failCount} item${failCount === 1 ? '' : 's'} could not be deleted.`,
            type: 'error',
          })
        );
      }
    } catch (err: any) {
      dispatch(
        showToast({
          title: 'Delete Failed',
          message: err.data?.error || 'Failed to delete ingredients.',
          type: 'error',
        })
      );
    }
  }, [bulkDeleteItems, deleteIngredient, dispatch, onBulkDeleteSuccess]);

  const executeDeleteIngredient = useCallback(async () => {
    if (!ingredientToDelete) return;
    const target = ingredientToDelete;
    setIngredientToDelete(null);

    try {
      await deleteIngredient(target._id).unwrap();
      onDeleteSuccess();
      dispatch(
        showToast({
          title: 'Success',
          message: `Ingredient "${target.name}" successfully deleted.`,
          type: 'success',
        })
      );
    } catch (err: any) {
      dispatch(
        showToast({
          title: 'Delete Failed',
          message: err.data?.error || 'Failed to delete ingredient.',
          type: 'error',
        })
      );
    }
  }, [ingredientToDelete, deleteIngredient, dispatch, onDeleteSuccess]);

  return {
    ingredientToDelete,
    bulkDeleteItems,
    requestDelete,
    requestBulkDelete,
    cancelDelete: () => setIngredientToDelete(null),
    cancelBulkDelete: () => setBulkDeleteItems([]),
    executeDeleteIngredient,
    executeBulkDelete,
  };
}
