import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type CollectionsState = {
  bookCollections: Record<string, number>;
  setCollection: (volumeId: string, shelfId: number) => void;
  removeCollection: (volumeId: string) => void;
};

const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set) => ({
      bookCollections: {},
      setCollection: (volumeId, shelfId) =>
        set((state) => ({ bookCollections: { ...state.bookCollections, [volumeId]: shelfId } })),
      removeCollection: (volumeId) =>
        set((state) => {
          const next = { ...state.bookCollections };
          delete next[volumeId];
          return { bookCollections: next };
        }),
    }),
    {
      name: 'book-collections',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useCollectionsStore;
