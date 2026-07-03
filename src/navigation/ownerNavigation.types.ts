export type OwnerRootStackParamList = {
  MainTabs: undefined;
  AddRecipe: { recipeId?: string } | undefined;
  FolderDetail: {
    folderId: string;
    folderName?: string;
    folderColor?: string;
  };
};
