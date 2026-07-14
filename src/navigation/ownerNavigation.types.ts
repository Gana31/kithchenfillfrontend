export type OwnerRootStackParamList = {
  MainTabs: undefined;
  AddRecipe: {
    recipeId?: string;
    prefillName?: string;
    prefillYieldAmount?: number;
    prefillYieldUnit?: 'g' | 'ml' | 'pcs';
    prefillPlateId?: string;
  } | undefined;
  FolderDetail: {
    folderId: string;
    folderName?: string;
    folderColor?: string;
  };
  AddPlate: { plateId?: string; prefillRecipeId?: string } | undefined;
  AddUdhaar: { udhaarId?: string } | undefined;
};
