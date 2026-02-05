package io.threadcast.domain;

import io.threadcast.domain.enums.ActorType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_answer")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AIAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false, unique = true)
    private AIQuestion question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActorType answeredBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public static AIAnswer create(AIQuestion question, String answer, ActorType answeredBy) {
        AIAnswer aiAnswer = AIAnswer.builder()
                .question(question)
                .answer(answer)
                .answeredBy(answeredBy)
                .build();
        question.setAnswer(aiAnswer);
        question.markAsAnswered();
        return aiAnswer;
    }
}
