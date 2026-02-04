package io.threadcast.service;

import io.threadcast.domain.AIAnswer;
import io.threadcast.domain.AIQuestion;
import io.threadcast.domain.Todo;
import io.threadcast.domain.Workspace;
import io.threadcast.domain.enums.ActorType;
import io.threadcast.domain.enums.AutonomyLevel;
import io.threadcast.domain.enums.QuestionCategory;
import io.threadcast.domain.enums.QuestionStatus;
import io.threadcast.dto.request.AnswerQuestionRequest;
import io.threadcast.dto.response.AIQuestionResponse;
import io.threadcast.exception.BadRequestException;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.AIAnswerRepository;
import io.threadcast.repository.AIQuestionRepository;
import io.threadcast.repository.TodoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIQuestionService {

    private final AIQuestionRepository aiQuestionRepository;
    private final AIAnswerRepository aiAnswerRepository;
    private final TodoRepository todoRepository;
    private final WebSocketService webSocketService;
    private final MetadataService metadataService;

    @Transactional(readOnly = true)
    public List<AIQuestionResponse> getQuestions(UUID workspaceId, QuestionStatus status) {
        List<AIQuestion> questions;
        if (status != null) {
            questions = aiQuestionRepository.findByWorkspaceIdAndStatus(workspaceId, status);
        } else {
            questions = aiQuestionRepository.findByWorkspaceId(workspaceId);
        }
        return questions.stream()
                .map(AIQuestionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AIQuestionResponse getQuestion(UUID id) {
        AIQuestion question = aiQuestionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Question not found: " + id));
        return AIQuestionResponse.from(question);
    }

    @Transactional
    public AIQuestionResponse answerQuestion(UUID id, AnswerQuestionRequest request) {
        AIQuestion question = aiQuestionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Question not found: " + id));

        if (question.getStatus() == QuestionStatus.ANSWERED) {
            throw new BadRequestException("Question already answered");
        }

        String answerText;
        ActorType answeredBy;

        if (request.isAutoDecide()) {
            // AI auto-decide (use first option or default)
            answerText = question.getOptions() != null && !question.getOptions().isEmpty()
                    ? question.getOptions().get(0).get("value")
                    : "auto-decided";
            answeredBy = ActorType.AI;
            question.markAsAutoResolved();
        } else {
            answerText = request.getCustomAnswer() != null
                    ? request.getCustomAnswer()
                    : request.getAnswer();
            answeredBy = ActorType.USER;
        }

        AIAnswer answer = AIAnswer.create(question, answerText, answeredBy);
        aiAnswerRepository.save(answer);
        aiQuestionRepository.save(question);

        Todo todo = question.getTodo();
        UUID workspaceId = todo.getMission().getWorkspace().getId();

        // 1. Save answer to Todo's meta for Worker context
        saveAnswerToTodoMeta(todo, question, answerText);

        // 2. Notify via WebSocket
        webSocketService.notifyQuestionAnswered(workspaceId, question);

        // 3. Check if all questions for this Todo are answered
        long pendingCount = aiQuestionRepository.countByTodoIdAndStatus(todo.getId(), QuestionStatus.PENDING);
        if (pendingCount == 0) {
            // All questions answered - notify that Todo is ready to start
            webSocketService.notifyTodoReadyToStart(todo.getMission().getId(), todo);
            log.info("All questions answered for Todo: {} ({}). Ready to start!", todo.getTitle(), todo.getId());
        }

        return AIQuestionResponse.from(question);
    }

    /**
     * Save the answered question to Todo's meta for Worker context.
     * Stores in meta.answeredQuestions array.
     */
    private void saveAnswerToTodoMeta(Todo todo, AIQuestion question, String answerText) {
        try {
            // Parse existing meta
            Map<String, Object> meta = todo.getMeta() != null
                    ? new com.fasterxml.jackson.databind.ObjectMapper()
                            .readValue(todo.getMeta(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {})
                    : new HashMap<>();

            // Get or create answeredQuestions list
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> answeredQuestions = (List<Map<String, Object>>) meta.get("answeredQuestions");
            if (answeredQuestions == null) {
                answeredQuestions = new java.util.ArrayList<>();
            }

            // Add this answer
            Map<String, Object> answerEntry = new HashMap<>();
            answerEntry.put("questionId", question.getId().toString());
            answerEntry.put("question", question.getQuestion());
            answerEntry.put("category", question.getCategory().name());
            answerEntry.put("answer", answerText);
            answerEntry.put("answeredAt", java.time.LocalDateTime.now().toString());
            answeredQuestions.add(answerEntry);

            meta.put("answeredQuestions", answeredQuestions);

            // Save back to Todo
            todo.setMeta(metadataService.toMetaString(meta));
            todoRepository.save(todo);

            log.info("Saved answer to Todo meta: {} -> {}", question.getQuestion(), answerText);
        } catch (Exception e) {
            log.error("Failed to save answer to Todo meta", e);
            // Don't fail the whole operation if meta save fails
        }
    }

    @Transactional
    public void batchAnswer(List<UUID> questionIds, List<String> answers) {
        for (int i = 0; i < questionIds.size(); i++) {
            UUID questionId = questionIds.get(i);
            String answer = i < answers.size() ? answers.get(i) : "auto-decided";

            AIQuestion question = aiQuestionRepository.findById(questionId).orElse(null);
            if (question != null && question.getStatus() == QuestionStatus.PENDING) {
                AIAnswer aiAnswer = AIAnswer.create(question, answer, ActorType.USER);
                aiAnswerRepository.save(aiAnswer);
                aiQuestionRepository.save(question);
            }
        }
    }

    /**
     * Create a new AI question for user clarification.
     * Respects workspace autonomy level - if autonomy is high enough for this
     * category, the question will be auto-resolved instead of asking the user.
     *
     * @param todoId Todo ID to associate the question with
     * @param questionText The question text
     * @param category Question category
     * @param options Optional predefined answer options
     * @return Created question response (may be auto-resolved based on autonomy)
     */
    @Transactional
    public AIQuestionResponse createQuestion(UUID todoId, String questionText,
                                             QuestionCategory category, List<String> options) {
        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new NotFoundException("Todo not found: " + todoId));

        Workspace workspace = todo.getMission().getWorkspace();
        int autonomyValue = workspace.getAutonomy();

        // Convert string options to the expected format
        List<Map<String, String>> optionMaps = null;
        if (options != null && !options.isEmpty()) {
            optionMaps = options.stream()
                    .map(opt -> Map.of("label", opt, "value", opt))
                    .collect(Collectors.toList());
        }

        // Check if we should ask the question based on autonomy level
        boolean shouldAsk = AutonomyLevel.shouldAskQuestion(autonomyValue, category);

        AIQuestion question = AIQuestion.create(
                todo,
                questionText,
                null,  // context - can be added later if needed
                category,
                optionMaps
        );

        if (shouldAsk) {
            // Normal flow: save question and notify user
            question = aiQuestionRepository.save(question);
            webSocketService.notifyQuestionCreated(workspace.getId(), question);
        } else {
            // High autonomy: auto-resolve the question
            question = aiQuestionRepository.save(question);
            autoResolveQuestion(question, workspace.getId());
        }

        return AIQuestionResponse.from(question);
    }

    /**
     * Auto-resolve a question when autonomy level is high enough.
     * Uses the first option if available, otherwise uses a default answer.
     */
    private void autoResolveQuestion(AIQuestion question, UUID workspaceId) {
        String autoAnswer = question.getOptions() != null && !question.getOptions().isEmpty()
                ? question.getOptions().get(0).get("value")
                : "auto-decided by AI (high autonomy)";

        AIAnswer answer = AIAnswer.create(question, autoAnswer, ActorType.AI);
        aiAnswerRepository.save(answer);

        question.markAsAutoResolved();
        aiQuestionRepository.save(question);

        // Notify that question was auto-resolved
        webSocketService.notifyQuestionAnswered(workspaceId, question);
    }
}
