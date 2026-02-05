package io.threadcast.domain;

import io.threadcast.domain.enums.StepStatus;
import io.threadcast.domain.enums.StepType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "todo_step")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TodoStep {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "todo_id", nullable = false)
    private Todo todo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StepType stepType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StepStatus status = StepStatus.PENDING;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @Column(columnDefinition = "TEXT")
    private String output;

    public static TodoStep create(Todo todo, StepType stepType) {
        return TodoStep.builder()
                .todo(todo)
                .stepType(stepType)
                .build();
    }

    public void start() {
        this.status = StepStatus.IN_PROGRESS;
        this.startedAt = LocalDateTime.now();
    }

    public void complete(String output) {
        this.status = StepStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
        this.output = output;
    }

    public void fail() {
        this.status = StepStatus.FAILED;
        this.completedAt = LocalDateTime.now();
    }

    public void skip() {
        this.status = StepStatus.SKIPPED;
        this.completedAt = LocalDateTime.now();
    }
}
