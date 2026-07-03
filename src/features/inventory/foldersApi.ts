import { baseApi } from '../../services/api';

export interface FolderData {
  _id: string;
  tenantId: string;
  restaurantId: string;
  name: string;
  color: string;
  /** Number of ingredients assigned to this folder (server-computed). */
  ingredientCount: number;
}

export interface FoldersResponse {
  success: boolean;
  folders: FolderData[];
  /** Ingredients not assigned to any folder. */
  ungroupedCount: number;
}

export interface CreateFolderPayload {
  name: string;
  color?: string;
}

export interface UpdateFolderPayload {
  name?: string;
  color?: string;
}

export const foldersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFolders: builder.query<FoldersResponse, void>({
      query: () => '/folders',
      providesTags: (result) =>
        result
          ? [
              ...result.folders.map(({ _id }) => ({ type: 'Folder' as const, id: _id })),
              { type: 'Folder' as const, id: 'LIST' },
            ]
          : [{ type: 'Folder' as const, id: 'LIST' }],
    }),
    createFolder: builder.mutation<{ success: boolean; message: string; folder: FolderData }, CreateFolderPayload>({
      query: (body) => ({
        url: '/folders',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Folder', id: 'LIST' }],
    }),
    updateFolder: builder.mutation<
      { success: boolean; message: string; folder: FolderData },
      { id: string; body: UpdateFolderPayload }
    >({
      query: ({ id, body }) => ({
        url: `/folders/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Folder', id },
        { type: 'Folder', id: 'LIST' },
      ],
    }),
    deleteFolder: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/folders/${id}`,
        method: 'DELETE',
      }),
      // Deleting a folder unassigns its ingredients, so refresh both folders and ingredients.
      invalidatesTags: [{ type: 'Folder', id: 'LIST' }, { type: 'Ingredient', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetFoldersQuery,
  useCreateFolderMutation,
  useUpdateFolderMutation,
  useDeleteFolderMutation,
} = foldersApi;
