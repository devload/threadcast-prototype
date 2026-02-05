package io.threadcast.domain.enums;

/**
 * Autonomy level thresholds and decision logic.
 * Determines when AI should ask questions vs make decisions autonomously.
 */
public enum AutonomyLevel {
    LOW(0, 30),      // AI asks many questions before decisions
    MEDIUM(31, 70),  // AI asks for major decisions only
    HIGH(71, 100);   // AI makes most decisions independently

    private final int minValue;
    private final int maxValue;

    AutonomyLevel(int minValue, int maxValue) {
        this.minValue = minValue;
        this.maxValue = maxValue;
    }

    /**
     * Get the autonomy level from a numeric value (0-100)
     */
    public static AutonomyLevel fromValue(int value) {
        if (value <= 30) return LOW;
        if (value <= 70) return MEDIUM;
        return HIGH;
    }

    /**
     * Determine if a question should be asked based on autonomy level and category.
     *
     * @param autonomyValue The workspace autonomy value (0-100)
     * @param category The question category
     * @return true if question should be asked, false if AI should auto-decide
     */
    public static boolean shouldAskQuestion(int autonomyValue, QuestionCategory category) {
        AutonomyLevel level = fromValue(autonomyValue);
        QuestionPriority priority = QuestionPriority.fromCategory(category);

        return switch (priority) {
            case CRITICAL -> true;  // Always ask for critical questions
            case IMPORTANT -> level == LOW || level == MEDIUM;  // Ask at medium or low
            case NORMAL -> level == LOW;  // Only ask at low autonomy
        };
    }

    /**
     * Question priority levels based on category
     */
    public enum QuestionPriority {
        CRITICAL,   // Always ask (RISK, SECURITY)
        IMPORTANT,  // Ask at medium or low (ARCHITECTURE, DESIGN_DECISION, SCOPE)
        NORMAL;     // Only ask at low (all others)

        public static QuestionPriority fromCategory(QuestionCategory category) {
            return switch (category) {
                case RISK, SECURITY -> CRITICAL;
                case ARCHITECTURE, DESIGN_DECISION, SCOPE -> IMPORTANT;
                default -> NORMAL;
            };
        }
    }
}
