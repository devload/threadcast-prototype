package io.threadcast.controller;

import io.threadcast.domain.enums.QuestionCategory;
import io.threadcast.domain.enums.QuestionStatus;
import io.threadcast.dto.request.AnswerQuestionRequest;
import io.threadcast.dto.response.AIQuestionResponse;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.service.AIQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai-questions")
@RequiredArgsConstructor
public class AIQuestionController {

    private final AIQuestionService aiQuestionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AIQuestionResponse>>> getQuestions(
            @RequestParam UUID workspaceId,
            @RequestParam(required = false) QuestionStatus status) {
        List<AIQuestionResponse> questions = aiQuestionService.getQuestions(workspaceId, status);
        return ResponseEntity.ok(ApiResponse.success(questions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AIQuestionResponse>> getQuestion(@PathVariable UUID id) {
        AIQuestionResponse question = aiQuestionService.getQuestion(id);
        return ResponseEntity.ok(ApiResponse.success(question));
    }

    /**
     * Create a new AI question for user clarification.
     * Used by PM Agent when Autonomy level is low and AI needs user input.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AIQuestionResponse>> createQuestion(
            @RequestBody CreateQuestionRequest request) {
        QuestionCategory category = request.category() != null
                ? QuestionCategory.valueOf(request.category())
                : QuestionCategory.CLARIFICATION;

        AIQuestionResponse question = aiQuestionService.createQuestion(
                request.todoId(),
                request.question(),
                category,
                request.options()
        );
        return ResponseEntity.ok(ApiResponse.success(question));
    }

    public record CreateQuestionRequest(
            UUID todoId,
            String question,
            String category,
            List<String> options
    ) {}

    @PostMapping("/{id}/answer")
    public ResponseEntity<ApiResponse<AIQuestionResponse>> answerQuestion(
            @PathVariable UUID id,
            @RequestBody AnswerQuestionRequest request) {
        AIQuestionResponse question = aiQuestionService.answerQuestion(id, request);
        return ResponseEntity.ok(ApiResponse.success(question));
    }

    @PostMapping("/batch-answer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> batchAnswer(
            @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Map<String, String>> answers = (List<Map<String, String>>) request.get("answers");

        List<UUID> questionIds = answers.stream()
                .map(a -> UUID.fromString(a.get("questionId")))
                .toList();
        List<String> answerValues = answers.stream()
                .map(a -> a.get("answer"))
                .toList();

        aiQuestionService.batchAnswer(questionIds, answerValues);

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "answered", questionIds.size(),
                "failed", 0
        )));
    }

    /**
     * Skip a question (let AI decide automatically).
     */
    @PostMapping("/{id}/skip")
    public ResponseEntity<ApiResponse<AIQuestionResponse>> skipQuestion(@PathVariable UUID id) {
        // Skip = auto-decide with AI
        AnswerQuestionRequest request = new AnswerQuestionRequest();
        request.setAutoDecide(true);
        AIQuestionResponse question = aiQuestionService.answerQuestion(id, request);
        return ResponseEntity.ok(ApiResponse.success(question));
    }
}
