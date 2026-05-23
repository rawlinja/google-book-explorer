import { describe, it, expect, beforeEach } from 'vitest';
import useCollectionsStore from '../collections';

beforeEach(() => {
  useCollectionsStore.setState({ bookCollections: {} });
});

describe('collections store', () => {
  it('adds a book to a shelf', () => {
    useCollectionsStore.getState().setCollection('vol1', 2);
    expect(useCollectionsStore.getState().bookCollections['vol1']).toBe(2);
  });

  it('updates the shelf when a book is moved', () => {
    useCollectionsStore.getState().setCollection('vol1', 2);
    useCollectionsStore.getState().setCollection('vol1', 4);
    expect(useCollectionsStore.getState().bookCollections['vol1']).toBe(4);
  });

  it('removes a book from its collection', () => {
    useCollectionsStore.getState().setCollection('vol1', 2);
    useCollectionsStore.getState().removeCollection('vol1');
    expect(useCollectionsStore.getState().bookCollections['vol1']).toBeUndefined();
  });

  it('does not affect other books when removing one', () => {
    useCollectionsStore.getState().setCollection('vol1', 2);
    useCollectionsStore.getState().setCollection('vol2', 4);
    useCollectionsStore.getState().removeCollection('vol1');
    expect(useCollectionsStore.getState().bookCollections['vol2']).toBe(4);
  });
});
