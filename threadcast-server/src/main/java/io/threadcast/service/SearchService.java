package io.threadcast.service;

import io.threadcast.domain.Comment;
import io.threadcast.domain.Mission;
import io.threadcast.domain.Project;
import io.threadcast.domain.Todo;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.SearchType;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.dto.request.SearchRequest;
import io.threadcast.dto.response.SearchResponse;
import io.threadcast.repository.CommentRepository;
import io.threadcast.repository.MissionRepository;
import io.threadcast.repository.ProjectRepository;
import io.threadcast.repository.TodoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {

    private final MissionRepository missionRepository;
    private final TodoRepository todoRepository;
    private final CommentRepository commentRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public SearchResponse search(SearchRequest request) {
        String query = request.getQ().trim();
        UUID workspaceId = request.getWorkspaceId();
        SearchType type = request.getType();
        int page = request.getPage() != null ? request.getPage() : 0;
        int size = request.getSize() != null ? request.getSize() : 20;

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));

        List<SearchResponse.SearchResultItem> results = new ArrayList<>();
        int missionCount = 0;
        int todoCount = 0;
        int commentCount = 0;
        int projectCount = 0;

        // Search Missions
        if (type == SearchType.ALL || type == SearchType.MISSION) {
            List<Mission> missions = searchMissions(workspaceId, query, request.getMissionStatus(), pageable);
            for (Mission mission : missions) {
                results.add(SearchResponse.fromMission(mission, query));
            }
            // Only run count query when searching ALL types (needed for filter counts)
            // or when results might be paginated
            if (type == SearchType.ALL) {
                missionCount = (int) missionRepository.countSearchResults(workspaceId, query);
            } else {
                missionCount = missions.size();
            }
        }

        // Search Todos
        if (type == SearchType.ALL || type == SearchType.TODO) {
            List<Todo> todos = searchTodos(workspaceId, query, request.getTodoStatus(), pageable);
            for (Todo todo : todos) {
                results.add(SearchResponse.fromTodo(todo, query));
            }
            if (type == SearchType.ALL) {
                todoCount = (int) todoRepository.countSearchResults(workspaceId, query);
            } else {
                todoCount = todos.size();
            }
        }

        // Search Comments
        if (type == SearchType.ALL || type == SearchType.COMMENT) {
            List<Comment> comments = commentRepository.searchByWorkspaceIdAndQuery(workspaceId, query, pageable);
            for (Comment comment : comments) {
                results.add(SearchResponse.fromComment(comment, query));
            }
            if (type == SearchType.ALL) {
                commentCount = (int) commentRepository.countSearchResults(workspaceId, query);
            } else {
                commentCount = comments.size();
            }
        }

        // Search Projects
        if (type == SearchType.ALL || type == SearchType.PROJECT) {
            List<Project> projects = projectRepository.searchByWorkspaceIdAndQuery(workspaceId, query, pageable);
            for (Project project : projects) {
                results.add(SearchResponse.fromProject(project, query));
            }
            if (type == SearchType.ALL) {
                projectCount = (int) projectRepository.countSearchResults(workspaceId, query);
            } else {
                projectCount = projects.size();
            }
        }

        // Sort results by updatedAt (most recent first)
        results.sort(Comparator.comparing(
                SearchResponse.SearchResultItem::getUpdatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())
        ));

        // Limit results if searching ALL types
        if (type == SearchType.ALL && results.size() > size) {
            results = results.subList(0, size);
        }

        int totalCount = missionCount + todoCount + commentCount + projectCount;

        return SearchResponse.builder()
                .query(query)
                .totalCount(totalCount)
                .missionCount(missionCount)
                .todoCount(todoCount)
                .commentCount(commentCount)
                .projectCount(projectCount)
                .results(results)
                .build();
    }

    private List<Mission> searchMissions(UUID workspaceId, String query, MissionStatus status, Pageable pageable) {
        if (status != null) {
            return missionRepository.searchByWorkspaceIdAndQueryAndStatus(workspaceId, query, status, pageable);
        }
        return missionRepository.searchByWorkspaceIdAndQuery(workspaceId, query, pageable);
    }

    private List<Todo> searchTodos(UUID workspaceId, String query, TodoStatus status, Pageable pageable) {
        if (status != null) {
            return todoRepository.searchByWorkspaceIdAndQueryAndStatus(workspaceId, query, status, pageable);
        }
        return todoRepository.searchByWorkspaceIdAndQuery(workspaceId, query, pageable);
    }
}
