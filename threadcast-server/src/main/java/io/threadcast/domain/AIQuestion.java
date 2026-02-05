package io.threadcast.domain;

import io.threadcast.domain.enums.QuestionCategory;
import io.threadcast.domain.enums.QuestionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "ai_question")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AIQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "todo_id", nullable = false)
    private Todo todo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(columnDefinition = "TEXT")
    private String context;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private QuestionStatus status = QuestionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionCategory category;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "TEXT")
    private List<Map<String, String>> options;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private AIAnswer answer;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public static AIQuestion create(Todo todo, String question, String context,
                                     QuestionCategory category, List<Map<String, String>> options) {
        return AIQuestion.builder()
                .todo(todo)
                .question(question)
                .context(context)
                .category(category)
                .options(options)
                .build();
    }

    public void markAsAnswered() {
        this.status = QuestionStatus.ANSWERED;
    }

    public void markAsAutoResolved() {
        this.status = QuestionStatus.AUTO_RESOLVED;
    }

    public void expire() {
        this.status = QuestionStatus.EXPIRED;
    }
}
