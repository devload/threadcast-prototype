package io.threadcast.domain.enums;

public enum QuestionCategory {
    // Existing categories
    ARCHITECTURE,
    IMPLEMENTATION,
    CONFIGURATION,
    SECURITY,
    NAMING,
    OTHER,

    // New categories for PM Agent Autonomy-based questioning
    CLARIFICATION,      // Need clarification on requirements
    DESIGN_DECISION,    // Design choice needed
    PRIORITY,           // Priority/ordering decision
    SCOPE,              // Scope boundary question
    TECHNICAL,          // Technical approach question
    RISK                // Risk assessment question
}
