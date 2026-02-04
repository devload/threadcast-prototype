// Search Types - Aligned with server API
export type SearchResultType = 'MISSION' | 'TODO' | 'COMMENT' | 'PROJECT' | 'ALL';

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  highlightedContent?: string;
  status?: string;
  priority?: string;
  parentId?: string;
  parentTitle?: string;
  workspaceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchFilters {
  type?: SearchResultType;
  missionStatus?: string;
  todoStatus?: string;
}

export interface SearchRequest {
  q: string;
  workspaceId: string;
  type?: SearchResultType;
  missionStatus?: string;
  todoStatus?: string;
  page?: number;
  size?: number;
}

export interface SearchResponse {
  query: string;
  totalCount: number;
  missionCount: number;
  todoCount: number;
  commentCount: number;
  projectCount: number;
  results: SearchResultItem[];
}

// Legacy types for backward compatibility
export type LegacySearchResultType = 'mission' | 'todo' | 'project';

export interface SearchResults {
  missions: SearchResultItem[];
  todos: SearchResultItem[];
  projects: SearchResultItem[];
  totalCount: number;
}
