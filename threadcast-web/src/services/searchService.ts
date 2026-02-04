import { api } from './api';
import type { SearchRequest, SearchResponse, SearchResultItem, SearchResultType } from '../types/search';

export const searchService = {
  /**
   * Main search function - calls server API
   *
   * @param q Search query (min 2 characters)
   * @param workspaceId Workspace ID
   * @param options Search options (type, status filters, pagination)
   */
  async search(
    q: string,
    workspaceId: string,
    options?: {
      type?: SearchResultType;
      missionStatus?: string;
      todoStatus?: string;
      page?: number;
      size?: number;
    }
  ): Promise<SearchResponse> {
    if (!q || q.trim().length < 2) {
      return {
        query: q,
        totalCount: 0,
        missionCount: 0,
        todoCount: 0,
        commentCount: 0,
        projectCount: 0,
        results: [],
      };
    }

    const params: Record<string, string | number> = {
      q: q.trim(),
    };

    if (options?.type) params.type = options.type;
    if (options?.missionStatus) params.missionStatus = options.missionStatus;
    if (options?.todoStatus) params.todoStatus = options.todoStatus;
    if (options?.page !== undefined) params.page = options.page;
    if (options?.size !== undefined) params.size = options.size;

    const response = await api.get<SearchResponse>(
      `/workspaces/${workspaceId}/search`,
      { params }
    );

    return response;
  },

  /**
   * Search with full request object
   */
  async searchWithRequest(request: SearchRequest): Promise<SearchResponse> {
    return this.search(request.q, request.workspaceId, {
      type: request.type,
      missionStatus: request.missionStatus,
      todoStatus: request.todoStatus,
      page: request.page,
      size: request.size,
    });
  },

  /**
   * Quick search - limited results for autocomplete/typeahead
   */
  async quickSearch(q: string, workspaceId: string, limit = 5): Promise<SearchResultItem[]> {
    const response = await this.search(q, workspaceId, { size: limit });
    return response.results;
  },

  /**
   * Search missions only
   */
  async searchMissions(
    q: string,
    workspaceId: string,
    status?: string,
    page = 0,
    size = 20
  ): Promise<SearchResponse> {
    return this.search(q, workspaceId, {
      type: 'MISSION',
      missionStatus: status,
      page,
      size,
    });
  },

  /**
   * Search todos only
   */
  async searchTodos(
    q: string,
    workspaceId: string,
    status?: string,
    page = 0,
    size = 20
  ): Promise<SearchResponse> {
    return this.search(q, workspaceId, {
      type: 'TODO',
      todoStatus: status,
      page,
      size,
    });
  },

  /**
   * Search projects only
   */
  async searchProjects(q: string, workspaceId: string, page = 0, size = 20): Promise<SearchResponse> {
    return this.search(q, workspaceId, {
      type: 'PROJECT',
      page,
      size,
    });
  },

  /**
   * Search comments only
   */
  async searchComments(q: string, workspaceId: string, page = 0, size = 20): Promise<SearchResponse> {
    return this.search(q, workspaceId, {
      type: 'COMMENT',
      page,
      size,
    });
  },
};
