package io.threadcast.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "workspace")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Workspace extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 500)
    private String path;  // 프로젝트 root 경로 (예: /Users/devload/myproject)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @OneToMany(mappedBy = "workspace", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Project> projects = new HashSet<>();

    @OneToMany(mappedBy = "workspace", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Mission> missions = new HashSet<>();

    /**
     * AI Autonomy Level (0-100)
     * - 0-30: Low autonomy - AI asks many questions before decisions
     * - 31-70: Medium autonomy - AI asks for major decisions
     * - 71-100: High autonomy - AI makes most decisions independently
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer autonomy = 50;

    /**
     * 워크스페이스 메타데이터 (JSON)
     * 모든 Mission/Todo에 상속됨
     *
     * 예시:
     * {
     *   "repo": {
     *     "type": "git",
     *     "url": "https://github.com/user/repo.git",
     *     "branch": "main",
     *     "credential": "github-token-1"
     *   },
     *   "build": {
     *     "command": "./gradlew build",
     *     "testCommand": "./gradlew test"
     *   },
     *   "agent": {
     *     "model": "claude-sonnet-4-20250514",
     *     "maxTokens": 8000
     *   }
     * }
     */
    @Column(columnDefinition = "TEXT")
    private String meta;

    public static Workspace create(String name, String description, String path, User owner) {
        return Workspace.builder()
                .name(name)
                .description(description)
                .path(path)
                .owner(owner)
                .build();
    }

    /**
     * Todo 작업을 위한 worktree 경로 반환
     * @param todoId Todo UUID
     * @return worktree 경로 (예: /path/to/project/.worktrees/todo-{todoId})
     */
    public String getWorktreePath(UUID todoId) {
        return path + "/.worktrees/todo-" + todoId.toString();
    }

    /**
     * worktrees 디렉토리 경로 반환
     */
    public String getWorktreesDir() {
        return path + "/.worktrees";
    }
}
