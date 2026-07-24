import { configureStore } from '@reduxjs/toolkit';
import familyTreeReducer from '../features/familyTree/familyTreeSlice';

const STORAGE_KEY = 'family-tree-data';

export const store = configureStore({
  reducer: {
    familyTree: familyTreeReducer,
  },
});

store.subscribe(() => {
  try {
    const state = store.getState();
    const dataToSave = {
      members: state.familyTree.members,
      relationships: state.familyTree.relationships,
      events: state.familyTree.events,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
