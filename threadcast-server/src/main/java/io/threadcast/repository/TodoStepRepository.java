package io.threadcast.repository;

import io.threadcast.domain.TodoStep;
import io.threadcast.domain.enums.StepStatus;
import io.threadcast.domain.enums.StepType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TodoStepRepository extends JpaRepository<TodoStep, UUID> {

    List<TodoStep> findByTodoIdOrderByStepTypeAsc(UUID todoId);

    Optional<TodoStep> findByTodoIdAndStepType(UUID todoId, StepType stepType);

    Optional<TodoStep> findByTodoIdAndStatus(UUID todoId, StepStatus status);
}
