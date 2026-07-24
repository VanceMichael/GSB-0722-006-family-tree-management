import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FamilyMember, Relationship, FamilyEvent, FamilyTreeState } from '../../types';
import type { RootState } from '../../app/store';

const STORAGE_KEY = 'family-tree-data';

const loadFromStorage = (): Partial<FamilyTreeState> => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      return JSON.parse(serialized);
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return {};
};

const storedData = loadFromStorage();

const initialState: FamilyTreeState = {
  members: storedData.members || [],
  relationships: storedData.relationships || [],
  events: storedData.events || [],
  selectedMemberId: null,
};

const familyTreeSlice = createSlice({
  name: 'familyTree',
  initialState,
  reducers: {
    addMember: (state, action: PayloadAction<FamilyMember>) => {
      state.members.push(action.payload);
    },
    updateMember: (state, action: PayloadAction<FamilyMember>) => {
      const index = state.members.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.members[index] = action.payload;
      }
    },
    deleteMember: (state, action: PayloadAction<string>) => {
      state.members = state.members.filter(m => m.id !== action.payload);
      state.relationships = state.relationships.filter(
        r => r.fromMemberId !== action.payload && r.toMemberId !== action.payload
      );
      state.events = state.events.map(e => ({
        ...e,
        relatedMemberIds: e.relatedMemberIds.filter(id => id !== action.payload),
      }));
      if (state.selectedMemberId === action.payload) {
        state.selectedMemberId = null;
      }
    },
    selectMember: (state, action: PayloadAction<string | null>) => {
      state.selectedMemberId = action.payload;
    },
    addRelationship: (state, action: PayloadAction<Relationship>) => {
      state.relationships.push(action.payload);
    },
    updateRelationship: (state, action: PayloadAction<Relationship>) => {
      const index = state.relationships.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.relationships[index] = action.payload;
      }
    },
    deleteRelationship: (state, action: PayloadAction<string>) => {
      state.relationships = state.relationships.filter(r => r.id !== action.payload);
    },
    addEvent: (state, action: PayloadAction<FamilyEvent>) => {
      state.events.push(action.payload);
    },
    updateEvent: (state, action: PayloadAction<FamilyEvent>) => {
      const index = state.events.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
    },
    deleteEvent: (state, action: PayloadAction<string>) => {
      state.events = state.events.filter(e => e.id !== action.payload);
    },
    loadSampleData: (state) => {
      state.members = [
        {
          id: '1',
          name: '张三',
          gender: 'male',
          birthDate: '1940-01-15',
          deathDate: '2020-03-10',
          photo: '',
          biography: '家族第一代，曾担任家族企业创始人。',
          birthPlace: '北京市',
          isAlive: false,
        },
        {
          id: '2',
          name: '李氏',
          gender: 'female',
          birthDate: '1945-05-20',
          deathDate: '2018-08-15',
          photo: '',
          biography: '张三的妻子，贤惠持家。',
          birthPlace: '天津市',
          isAlive: false,
        },
        {
          id: '3',
          name: '张建国',
          gender: 'male',
          birthDate: '1970-08-10',
          photo: '',
          biography: '张三的长子，现任家族企业总经理。',
          birthPlace: '北京市',
          isAlive: true,
        },
        {
          id: '4',
          name: '王氏',
          gender: 'female',
          birthDate: '1972-12-05',
          photo: '',
          biography: '张建国的妻子。',
          birthPlace: '上海市',
          isAlive: true,
        },
        {
          id: '5',
          name: '张建华',
          gender: 'male',
          birthDate: '1975-03-22',
          photo: '',
          biography: '张三的次子，从事教育工作。',
          birthPlace: '北京市',
          isAlive: true,
        },
        {
          id: '6',
          name: '张明',
          gender: 'male',
          birthDate: '1998-06-15',
          photo: '',
          biography: '张建国之子，大学生。',
          birthPlace: '北京市',
          isAlive: true,
        },
      ];
      
      state.relationships = [
        { id: 'r1', type: 'spouse', fromMemberId: '1', toMemberId: '2' },
        { id: 'r2', type: 'parent-child', fromMemberId: '1', toMemberId: '3' },
        { id: 'r3', type: 'parent-child', fromMemberId: '2', toMemberId: '3' },
        { id: 'r4', type: 'parent-child', fromMemberId: '1', toMemberId: '5' },
        { id: 'r5', type: 'parent-child', fromMemberId: '2', toMemberId: '5' },
        { id: 'r6', type: 'spouse', fromMemberId: '3', toMemberId: '4' },
        { id: 'r7', type: 'sibling', fromMemberId: '3', toMemberId: '5' },
        { id: 'r8', type: 'parent-child', fromMemberId: '3', toMemberId: '6' },
        { id: 'r9', type: 'parent-child', fromMemberId: '4', toMemberId: '6' },
      ];
      
      state.events = [
        {
          id: 'e1',
          title: '张三诞辰',
          date: '1940-01-15',
          description: '家族第一代张三出生于北京。',
          relatedMemberIds: ['1'],
          category: 'birth',
        },
        {
          id: 'e2',
          title: '张三与李氏结婚',
          date: '1965-10-01',
          description: '张三与李氏在北京市结婚。',
          relatedMemberIds: ['1', '2'],
          category: 'marriage',
        },
        {
          id: 'e3',
          title: '张建国出生',
          date: '1970-08-10',
          description: '张三的长子张建国出生。',
          relatedMemberIds: ['3'],
          category: 'birth',
        },
        {
          id: 'e4',
          title: '张三去世',
          date: '2020-03-10',
          description: '家族第一代张三因病去世，享年80岁。',
          relatedMemberIds: ['1'],
          category: 'death',
        },
      ];
    },
  },
});

export const {
  addMember,
  updateMember,
  deleteMember,
  selectMember,
  addRelationship,
  updateRelationship,
  deleteRelationship,
  addEvent,
  updateEvent,
  deleteEvent,
  loadSampleData,
} = familyTreeSlice.actions;

export const selectAllMembers = (state: RootState) => state.familyTree.members;
export const selectMemberById = (state: RootState, memberId: string) =>
  state.familyTree.members.find(m => m.id === memberId);
export const selectAllRelationships = (state: RootState) => state.familyTree.relationships;
export const selectAllEvents = (state: RootState) => state.familyTree.events;
export const selectSelectedMember = (state: RootState) => {
  if (!state.familyTree.selectedMemberId) return null;
  return state.familyTree.members.find(m => m.id === state.familyTree.selectedMemberId) || null;
};

export default familyTreeSlice.reducer;
