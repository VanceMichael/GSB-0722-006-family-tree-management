export interface FamilyMember {
  id: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  deathDate?: string;
  photo?: string;
  biography: string;
  birthPlace: string;
  isAlive: boolean;
}

export type RelationshipType = 'parent-child' | 'spouse' | 'sibling';

export interface Relationship {
  id: string;
  type: RelationshipType;
  fromMemberId: string;
  toMemberId: string;
  notes?: string;
}

export type EventCategory = 'birth' | 'marriage' | 'death' | 'education' | 'career' | 'other';

export interface FamilyEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  relatedMemberIds: string[];
  category: EventCategory;
}

export interface FamilyTreeState {
  members: FamilyMember[];
  relationships: Relationship[];
  events: FamilyEvent[];
  selectedMemberId: string | null;
}

export interface TreeNode {
  id: string;
  data: FamilyMember;
  children: TreeNode[];
  spouse?: FamilyMember;
}
