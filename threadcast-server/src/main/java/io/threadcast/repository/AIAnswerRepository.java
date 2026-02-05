package io.threadcast.repository;

import io.threadcast.domain.AIAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AIAnswerRepository extends JpaRepository<AIAnswer, UUID> {

    Optional<AIAnswer> findByQuestionId(UUID questionId);

    boolean existsByQuestionId(UUID questionId);
}
