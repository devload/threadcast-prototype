package io.threadcast.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Project represents a sub-module or service within a Workspace.
 * For monorepo/MSA structures, a Workspace can contain multiple Projects.
 *
 * Example:
 *   Workspace: whatap-server (root: /Users/dev/whatap-server)
 *     - Project: agent (path: ./agent)
 *     - Project: collector (path: ./collector)
 *     - Project: web (path: ./web)
 */
@Entity
@Table(name = "project")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Project extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Relative path from workspace root.
     * Examples: ".", "./agent", "./services/auth"
     */
    @Column(nullable = false, length = 500)
    private String path;

    /**
     * Programming language or framework (optional).
     * Examples: "java", "kotlin", "typescript", "python"
     */
    @Column(length = 50)
    private String language;

    /**
     * Build tool or framework (optional).
     * Examples: "gradle", "maven", "npm", "cargo"
     */
    @Column(length = 50)
    private String buildTool;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Todo> todos = new ArrayList<>();

    public static Project create(Workspace workspace, String name, String description, String path) {
        return Project.builder()
                .workspace(workspace)
                .name(name)
                .description(description)
                .path(path)
                .build();
    }

    /**
     * Get absolute path by combining workspace root path and project relative path.
     */
    public String getAbsolutePath() {
        String workspacePath = workspace.getPath();
        if (path == null || path.equals(".") || path.isEmpty()) {
            return workspacePath;
        }
        // Remove leading "./" if present
        String relativePath = path.startsWith("./") ? path.substring(2) : path;
        return workspacePath + "/" + relativePath;
    }

    /**
     * Get worktree path for a specific Todo.
     */
    public String getWorktreePath(UUID todoId) {
        return getAbsolutePath() + "/.worktrees/todo-" + todoId.toString();
    }
}
