import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SearchBar from '../../components/SearchBar';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import ScreenContainer from '../../components/ScreenContainer';
import FloatingActionButton from '../../components/FloatingActionButton';
import { LoadingView, ErrorState, EmptyStateCard } from '../../components/AsyncStateViews';
import { SCROLL_LIST_PROPS, LIST_VIRTUALIZATION_PROPS, GRID_VIRTUALIZATION_PROPS } from '../../components/scrollUtils';
import { ScrollGap } from '../../components/SpacedStack';
import { useDeleteRecipeMutation, useGetRecipesQuery, RecipeData } from './recipesApi';
import { OwnerRootStackParamList } from '../../navigation/ownerNavigation.types';
import { filterRecipesBySearch } from './recipeFormUtils';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import { useGetIngredientsQuery, STOCK_SORT_FETCH_LIMIT } from '../inventory/inventoryApi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RecipePreviewModal from './components/RecipePreviewModal';
import RecipeCard from './components/RecipeCard';
import { useRecipePreferences } from './hooks/useRecipePreferences';

type OwnerTabParamList = {
  Dashboard: undefined;
  Inventory: undefined;
  Recipes: undefined;
  Plates: undefined;
  Udhaar: undefined;
  Profile: undefined;
};

type RecipesTabNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<OwnerTabParamList, 'Recipes'>,
  NativeStackNavigationProp<OwnerRootStackParamList>
>;

const HPAD = 16;
const GRID_GAP = 10;
const GRID_COLUMNS = 3;

export default function RecipeBuilderScreen() {
  const navigation = useNavigation<RecipesTabNavigation>();
  const dispatch = useAppDispatch();
  const { primary, muted, isDark, background } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [previewRecipe, setPreviewRecipe] = useState<RecipeData | null>(null);
  const { prefsLoaded, layout, handleLayoutChange } = useRecipePreferences();
  const { data, isLoading, error, refetch } = useGetRecipesQuery();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const listRef = useRef<FlatList<RecipeData>>(null);
  const isRefreshingRef = useRef(false);

  const onRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    try {
      await Promise.all([refetch(), new Promise((resolve) => setTimeout(resolve, 700))]);
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [refetch]);

  useEffect(() => {
    const unsubscribe = (
      navigation as { addListener: (event: string, cb: () => void) => () => void }
    ).addListener('recipesTabRepress', onRefresh);
    return unsubscribe;
  }, [navigation, onRefresh]);
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

  const isGrid = layout === 'grid';
  const cardWidth = (width - HPAD * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

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
      Alert.alert('Delete recipe?', `Remove "${recipe.name}"? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe(recipe._id).unwrap();
              dispatch(showToast({ title: 'Recipe deleted', message: recipe.name, type: 'success' }));
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
      ]);
    },
    [deleteRecipe, dispatch]
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className="flex-row items-center mr-4" style={{ gap: 8 }}>
          <TouchableOpacity
            onPress={onRefresh}
            disabled={isRefreshing}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark justify-center items-center"
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={primary} />
            ) : (
              <Ionicons name="refresh-outline" size={17} color={muted} />
            )}
          </TouchableOpacity>
          {prefsLoaded ? (
            <View className="flex-row bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-xl p-0.5">
              <TouchableOpacity
                onPress={() => handleLayoutChange('list')}
                activeOpacity={0.7}
                className={`w-9 h-9 rounded-lg justify-center items-center ${layout === 'list' ? 'bg-primary/15' : ''}`}
              >
                <Ionicons name="list-outline" size={18} color={layout === 'list' ? primary : muted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleLayoutChange('grid')}
                activeOpacity={0.7}
                className={`w-9 h-9 rounded-lg justify-center items-center ${layout === 'grid' ? 'bg-primary/15' : ''}`}
              >
                <Ionicons name="grid-outline" size={18} color={layout === 'grid' ? primary : muted} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ),
    });
  }, [navigation, openAddRecipe, prefsLoaded, layout, handleLayoutChange, primary, muted, isRefreshing, onRefresh]);

  const hasRecipes = recipes.length > 0;
  const showEmptySearch = hasRecipes && filteredRecipes.length === 0 && searchQuery.trim().length > 0;

  const renderItem = useCallback(
    ({ item }: { item: RecipeData }) => (
      <RecipeCard
        recipe={item}
        layout={layout}
        width={isGrid ? cardWidth : undefined}
        muted={muted}
        primary={primary}
        isDeleting={isDeleting}
        onPreview={openPreview}
        onEdit={openEditRecipe}
        onDelete={confirmDelete}
      />
    ),
    [layout, isGrid, cardWidth, muted, primary, isDeleting, openPreview, openEditRecipe, confirmDelete]
  );

  const listHeader = hasRecipes ? (
    <View style={{ paddingHorizontal: isGrid ? HPAD : 0 }}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search recipes..."
        className="mb-4"
      />
    </View>
  ) : null;

  const renderEmpty = () => {
    let content: React.ReactNode;
    if (isLoading) {
      content = <LoadingView message="Loading recipes…" />;
    } else if (error) {
      content = <ErrorState message="Could not load recipes. Check your connection and API." onRetry={refetch} />;
    } else if (showEmptySearch) {
      content = (
        <View className="items-center py-10">
          <Ionicons name="search-outline" size={32} color={muted} />
          <Text className="text-sm font-bold text-muted dark:text-muted-dark mt-3">
            No recipes match &quot;{searchQuery.trim()}&quot;
          </Text>
        </View>
      );
    } else {
      content = (
        <EmptyStateCard
          icon="book-outline"
          title="No recipes yet"
          message="Tap + to create your first batch recipe using real ingredient costs from inventory."
          actionLabel="Add recipe"
          onAction={openAddRecipe}
        />
      );
    }
    return <View style={{ paddingHorizontal: isGrid ? HPAD : 0 }}>{content}</View>;
  };

  return (
    <ScreenContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <FlatList
        ref={listRef}
        key={layout}
        style={{
          flex: 1,
          backgroundColor: Platform.OS === 'android'
            ? (isDark ? 'rgba(9, 9, 10, 0.015)' : 'rgba(255, 255, 255, 0.015)')
            : 'transparent'
        }}
        data={filteredRecipes}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        numColumns={isGrid ? GRID_COLUMNS : 1}
        columnWrapperStyle={isGrid ? { gap: GRID_GAP, paddingHorizontal: HPAD } : undefined}
        ItemSeparatorComponent={isGrid ? undefined : () => <ScrollGap height={16} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmpty()}
        contentContainerStyle={{
          gap: isGrid ? GRID_GAP : 0,
          paddingHorizontal: isGrid ? 0 : HPAD,
          paddingTop: 16,
          paddingBottom: insets.bottom + 120,
          flexGrow: 1,
          backgroundColor: Platform.OS === 'android'
            ? (isDark ? 'rgba(9, 9, 10, 0.015)' : 'rgba(255, 255, 255, 0.015)')
            : 'transparent'
        }}
        {...SCROLL_LIST_PROPS}
        {...(isGrid ? GRID_VIRTUALIZATION_PROPS : LIST_VIRTUALIZATION_PROPS)}
      />

      <FloatingActionButton onPress={openAddRecipe} icon="add" />

      <RecipePreviewModal
        visible={previewRecipe !== null}
        recipe={previewRecipe}
        ingredients={ingredients}
        onClose={closePreview}
        onEdit={openEditRecipe}
      />
    </ScreenContainer>
  );
}
