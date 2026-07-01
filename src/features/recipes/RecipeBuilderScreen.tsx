import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, RefreshControl, TouchableOpacity, Alert, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Card from '../../components/Card';
import SearchBar from '../../components/SearchBar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import ScreenContainer from '../../components/ScreenContainer';
import SpacedStack from '../../components/SpacedStack';
import HeaderIconButton from '../../components/HeaderIconButton';
import { AsyncContent } from '../../components/AsyncStateViews';
import { useDeleteRecipeMutation, useGetRecipesQuery, RecipeData } from './recipesApi';
import { formatInr } from '../dashboard/dashboardUtils';
import { OwnerRootStackParamList } from '../../navigation/ownerNavigation.types';
import { filterRecipesBySearch } from './recipeFormUtils';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import { useGetIngredientsQuery, STOCK_SORT_FETCH_LIMIT } from '../inventory/inventoryApi';
import RecipePreviewModal from './components/RecipePreviewModal';

type OwnerTabParamList = {
  Dashboard: undefined;
  Inventory: undefined;
  Recipes: undefined;
  Counter: undefined;
  Profile: undefined;
};

type RecipesTabNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<OwnerTabParamList, 'Recipes'>,
  NativeStackNavigationProp<OwnerRootStackParamList>
>;

export default function RecipeBuilderScreen() {
  const navigation = useNavigation<RecipesTabNavigation>();
  const dispatch = useAppDispatch();
  const { primary, muted, isDark } = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [previewRecipe, setPreviewRecipe] = useState<RecipeData | null>(null);
  const { data, isLoading, isFetching, error, refetch } = useGetRecipesQuery();
  const [deleteRecipe, { isLoading: isDeleting }] = useDeleteRecipeMutation();
  const { data: ingredientsData } = useGetIngredientsQuery(
    {
      page: 1,
      limit: STOCK_SORT_FETCH_LIMIT,
      search: '',
      sortBy: 'name-asc',
      stockFilter: 'all',
    },
    { refetchOnMountOrArgChange: 120 }
  );

  const ingredients = ingredientsData?.ingredients ?? [];

  const recipes = data?.recipes ?? [];
  const filteredRecipes = useMemo(
    () => filterRecipesBySearch(recipes, searchQuery),
    [recipes, searchQuery]
  );

  const openAddRecipe = useCallback(() => {
    navigation.navigate('AddRecipe');
  }, [navigation]);

  const openEditRecipe = useCallback(
    (recipeId: string) => {
      setPreviewRecipe(null);
      navigation.navigate('AddRecipe', { recipeId });
    },
    [navigation]
  );

  const openPreview = useCallback((recipe: RecipeData) => {
    setPreviewRecipe(recipe);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewRecipe(null);
  }, []);

  const confirmDelete = useCallback(
    (recipe: RecipeData) => {
      Alert.alert(
        'Delete recipe?',
        `Remove "${recipe.name}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteRecipe(recipe._id).unwrap();
                dispatch(
                  showToast({
                    title: 'Recipe deleted',
                    message: recipe.name,
                    type: 'success',
                  })
                );
              } catch (err: any) {
                dispatch(
                  showToast({
                    title: 'Delete failed',
                    message: err?.data?.error || 'Could not delete recipe.',
                    type: 'error',
                  })
                );
              }
            },
          },
        ]
      );
    },
    [deleteRecipe, dispatch]
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className="mr-6">
          <HeaderIconButton icon="add" onPress={openAddRecipe} />
        </View>
      ),
    });
  }, [navigation, openAddRecipe]);

  const hasRecipes = recipes.length > 0;
  const showEmptySearch = hasRecipes && filteredRecipes.length === 0 && searchQuery.trim().length > 0;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenContainer
        scrollable
        bottomInset={120}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}
        scrollProps={{
          refreshControl: (
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={primary} />
          ),
        }}
      >
        {hasRecipes ? (
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search recipes..."
            className="mb-4"
          />
        ) : null}

        <AsyncContent
          isLoading={isLoading}
          error={error}
          isEmpty={!hasRecipes}
          loadingMessage="Loading recipes…"
          errorMessage="Could not load recipes. Check your connection and API."
          emptyIcon="book-outline"
          emptyTitle="No recipes yet"
          emptyMessage="Tap + to create your first batch recipe using real ingredient costs from inventory."
          emptyActionLabel="Add recipe"
          onEmptyAction={openAddRecipe}
          onRetry={refetch}
        >
          {showEmptySearch ? (
            <View className="items-center py-10">
              <Ionicons name="search-outline" size={32} color={muted} />
              <Text className="text-sm font-bold text-muted dark:text-muted-dark mt-3">
                No recipes match &quot;{searchQuery.trim()}&quot;
              </Text>
            </View>
          ) : (
            <SpacedStack gap={16}>
              {filteredRecipes.map((recipe) => {
                const costing = recipe.costing;
                const batchCost = costing?.batchCost ?? 0;
                const yieldLabel = `${recipe.batchYieldAmount}${recipe.batchYieldUnit}`;
                const customCount = recipe.customCostLines?.length ?? 0;
                const itemCount = recipe.ingredientsUsed.length + customCount;

                return (
                  <Card key={recipe._id} className="p-5">
                    <Pressable onPress={() => openPreview(recipe)}>
                      <View className="flex-row justify-between items-start">
                        <View className="flex-grow pr-3">
                          <Text className="text-base font-semibold text-text dark:text-text-dark leading-tight">
                            {recipe.name}
                          </Text>
                          <View className="flex-row items-center mt-2 flex-wrap" style={{ gap: 12 }}>
                            <View className="flex-row items-center" style={{ gap: 4 }}>
                              <Ionicons name="leaf-outline" size={12} color={muted} />
                              <Text className="text-[11px] text-muted dark:text-muted-dark font-bold">
                                {itemCount} items
                              </Text>
                            </View>
                            <View className="flex-row items-center" style={{ gap: 4 }}>
                              <Ionicons name="scale-outline" size={12} color={muted} />
                              <Text className="text-[11px] text-muted dark:text-muted-dark font-bold">
                                Yield: {yieldLabel}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View className="items-end">
                          <Text className="text-xs text-muted dark:text-muted-dark font-bold uppercase">Total cost</Text>
                          <Text className="text-lg font-semibold text-primary mt-0.5">{formatInr(batchCost)}</Text>
                        </View>
                      </View>
                    </Pressable>

                    <View
                      className="flex-row items-center justify-end mt-4 pt-3 border-t border-border/30 dark:border-border-dark/30"
                      style={{ gap: 16 }}
                    >
                      <TouchableOpacity
                        onPress={() => openEditRecipe(recipe._id)}
                        className="flex-row items-center"
                        style={{ gap: 6 }}
                        disabled={isDeleting}
                      >
                        <Ionicons name="create-outline" size={18} color={primary} />
                        <Text className="text-xs font-bold text-primary">Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => confirmDelete(recipe)}
                        className="flex-row items-center"
                        style={{ gap: 6 }}
                        disabled={isDeleting}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        <Text className="text-xs font-bold text-red-500">Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })}
            </SpacedStack>
          )}
        </AsyncContent>
      </ScreenContainer>

      <RecipePreviewModal
        visible={previewRecipe !== null}
        recipe={previewRecipe}
        ingredients={ingredients}
        onClose={closePreview}
        onEdit={openEditRecipe}
      />
    </>
  );
}
