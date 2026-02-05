package io.threadcast.domain;

import io.threadcast.domain.enums.Complexity;
import io.threadcast.domain.enums.Priority;
import io.threadcast.domain.enums.StepType;
import io.threadcast.domain.enums.TodoStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "todo")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Todo extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_id", nullable = false)
    private Mission mission;

    /**
     * Optional: specific project within the workspace where this Todo will be executed.
     * If null, the Todo works at the workspace root level.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TodoStatus status = TodoStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Complexity complexity = Complexity.MEDIUM;

    @Column(nullable = false)
    private Integer orderIndex;

    private Integer estimatedTime;

    private Integer actualTime;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "todo", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("stepType ASC")
    @Builder.Default
    private List<TodoStep> steps = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "todo_dependency",
            joinColumns = @JoinColumn(name = "todo_id"),
            inverseJoinColumns = @JoinColumn(name = "depends_on_id")
    )
    @Builder.Default
    private Set<Todo> dependencies = new HashSet<>();

    @OneToMany(mappedBy = "todo", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    /**
     * Todo 메타데이터 (JSON)
     * Workspace/Mission meta를 오버라이드하며, 이 Todo에만 적용
     *
     * 예시:
     * {
     *   "instructions": "JwtAuthenticationFilter 클래스를 생성하고...",
     *   "files": {
     *     "target": ["src/security/JwtFilter.java"],
     *     "context": ["src/config/SecurityConfig.java"],
     *     "test": ["src/test/security/JwtFilterTest.java"]
     *   },
     *   "acceptance": [
     *     "토큰 없으면 401 반환",
     *     "만료된 토큰이면 401 반환",
     *     "유효한 토큰이면 SecurityContext에 인증 정보 설정"
     *   ],
     *   "commands": {
     *     "test": "./gradlew test --tests *JwtFilterTest*",
     *     "verify": "curl -H 'Authorization: Bearer xxx' localhost:8080/api/me"
     *   }
     * }
     */
    @Column(columnDefinition = "TEXT")
    private String meta;

    public static Todo create(Mission mission, String title, String description,
                              Priority priority, Complexity complexity,
                              Integer orderIndex, Integer estimatedTime) {
        Todo todo = Todo.builder()
                .mission(mission)
                .title(title)
                .description(description)
                .priority(priority)
                .complexity(complexity)
                .orderIndex(orderIndex)
                .estimatedTime(estimatedTime)
                .build();
        todo.initializeSteps();
        return todo;
    }

    public void initializeSteps() {
        for (StepType stepType : StepType.values()) {
            TodoStep step = TodoStep.create(this, stepType);
            steps.add(step);
        }
    }

    public void startThreading() {
        this.status = TodoStatus.THREADING;
        this.startedAt = LocalDateTime.now();
    }

    public void complete() {
        this.status = TodoStatus.WOVEN;
        this.completedAt = LocalDateTime.now();
        if (this.startedAt != null) {
            this.actualTime = (int) java.time.Duration.between(this.startedAt, this.completedAt).toMinutes();
        }
        mission.updateProgress();
    }

    public void fail() {
        this.status = TodoStatus.TANGLED;
    }

    public StepType getCurrentStep() {
        return steps.stream()
                .filter(s -> s.getStatus() == io.threadcast.domain.enums.StepStatus.IN_PROGRESS)
                .map(TodoStep::getStepType)
                .findFirst()
                .orElse(null);
    }

    public void addDependency(Todo dependency) {
        this.dependencies.add(dependency);
    }

    public boolean areDependenciesMet() {
        return dependencies.stream()
                .allMatch(d -> d.getStatus() == TodoStatus.WOVEN);
    }

    /**
     * Check if this todo is ready to start.
     * A todo is ready if it's PENDING and all dependencies are WOVEN.
     */
    public boolean isReadyToStart() {
        return status == TodoStatus.PENDING && areDependenciesMet();
    }

    /**
     * Check if this todo is blocked by unfinished dependencies.
     */
    public boolean isBlocked() {
        return !dependencies.isEmpty() && !areDependenciesMet();
    }

    /**
     * Get the working directory path for this Todo.
     * If project is set, uses project's absolute path.
     * Otherwise, uses workspace's root path.
     */
    public String getWorkingPath() {
        if (project != null) {
            return project.getAbsolutePath();
        }
        return mission.getWorkspace().getPath();
    }

    /**
     * Get the worktree path for this Todo.
     */
    public String getWorktreePath() {
        if (project != null) {
            return project.getWorktreePath(id);
        }
        return mission.getWorkspace().getWorktreePath(id);
    }
}
