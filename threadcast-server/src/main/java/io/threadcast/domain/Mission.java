package io.threadcast.domain;

import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.Priority;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "mission")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Mission extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MissionStatus status = MissionStatus.BACKLOG;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    @Column(nullable = false)
    @Builder.Default
    private Integer progress = 0;

    private Integer estimatedTime;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    /**
     * Todo 완료 시 다음 Todo 자동 시작 여부.
     * true면 의존성이 충족된 다음 Todo를 자동으로 THREADING 상태로 전환.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean autoStartEnabled = true;

    /**
     * 연결된 JIRA 이슈 키 (예: PROJ-123)
     */
    @Column(length = 50)
    private String jiraIssueKey;

    /**
     * 연결된 JIRA 이슈 URL
     */
    @Column(length = 500)
    private String jiraIssueUrl;

    /**
     * 연결된 Sentry 이슈 ID
     */
    @Column(length = 50)
    private String sentryIssueId;

    /**
     * 연결된 Sentry 이슈 URL
     */
    @Column(length = 500)
    private String sentryIssueUrl;

    @OneToMany(mappedBy = "mission", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<Todo> todos = new ArrayList<>();

    /**
     * 미션 메타데이터 (JSON)
     * 워크스페이스 meta를 오버라이드하고, 모든 Todo에 상속됨
     *
     * 예시:
     * {
     *   "repo": {
     *     "branch": "feature/auth"
     *   },
     *   "context": {
     *     "files": ["docs/auth-spec.md", "src/types/User.java"],
     *     "description": "JWT 기반 인증 시스템 구현"
     *   },
     *   "constraints": {
     *     "noNewDependencies": true,
     *     "testRequired": true
     *   }
     * }
     */
    @Column(columnDefinition = "TEXT")
    private String meta;

    public static Mission create(Workspace workspace, String title, String description, Priority priority) {
        return Mission.builder()
                .workspace(workspace)
                .title(title)
                .description(description)
                .priority(priority)
                .build();
    }

    public void startThreading() {
        this.status = MissionStatus.THREADING;
        this.startedAt = LocalDateTime.now();
    }

    public void complete() {
        this.status = MissionStatus.WOVEN;
        this.completedAt = LocalDateTime.now();
        this.progress = 100;
    }

    public void archive() {
        this.status = MissionStatus.ARCHIVED;
    }

    public void drop() {
        this.status = MissionStatus.DROPPED;
    }

    public void updateProgress() {
        if (todos.isEmpty()) {
            this.progress = 0;
            return;
        }
        long wovenCount = todos.stream()
                .filter(t -> t.getStatus() == io.threadcast.domain.enums.TodoStatus.WOVEN)
                .count();
        this.progress = (int) ((wovenCount * 100) / todos.size());

        if (this.progress == 100) {
            complete();
        }
    }

    public void addTodo(Todo todo) {
        todos.add(todo);
        todo.setMission(this);
    }
}
