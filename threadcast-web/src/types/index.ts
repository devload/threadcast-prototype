// Enums
export type MissionStatus = 'BACKLOG' | 'PENDING' | 'THREADING' | 'IN_PROGRESS' | 'WOVEN' | 'COMPLETED' | 'TANGLED' | 'DROPPED' | 'ARCHIVED' | 'SKIPPED';
export type TodoStatus = 'BACKLOG' | 'PENDING' | 'THREADING' | 'IN_PROGRESS' | 'WOVEN' | 'COMPLETED' | 'TANGLED' | 'ARCHIVED' | 'SKIPPED';
export type StepType = 'ANALYSIS' | 'DESIGN' | 'IMPLEMENTATION' | 'VERIFICATION' | 'REVIEW' | 'INTEGRATION';
export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Complexity = 'LOW' | 'MEDIUM' | 'HIGH' | 'SIMPLE' | 'COMPLEX' | 'UNKNOWN';
export type ActorType = 'AI' | 'USER' | 'SYSTEM';
export type EventType =
  | 'MISSION_CREATED' | 'MISSION_STARTED' | 'MISSION_COMPLETED' | 'MISSION_ARCHIVED'
  | 'TODO_CREATED' | 'TODO_STARTED' | 'TODO_COMPLETED' | 'TODO_FAILED'
  | 'STEP_COMPLETED' | 'AI_QUESTION' | 'AI_ANSWER' | 'COMMENT_ADDED'
  | 'AI_ACTIVITY'  // AI work activity/response summary
  | 'TODO_READY_TO_START' | 'TODO_DEPENDENCIES_CHANGED';  // Dependency orchestration events

// Entities
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  autonomyLevel: number;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  path: string;
  ownerId: string;
  stats?: WorkspaceStats;
  projects?: ProjectSummary[];
  recentMissions?: MissionSummary[];
  createdAt?: string;
}

export interface WorkspaceStats {
  projectCount: number;
  missionCount: number;
  activeMissionCount: number;
  completedMissionCount: number;
  totalTodoCount: number;
  activeTodoCount: number;
  pendingQuestionCount?: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  path: string;
  language?: string;
  todoCount: number;
}

export interface MissionSummary {
  id: string;
  title: string;
  status: MissionStatus;
  progress: number;
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  path: string;
  absolutePath: string;
  language?: string;
  buildTool?: string;
  todoCount: number;
  activeTodoCount: number;
  createdAt: string;
}

export interface Mission {
  id: string;
  workspaceId: string;
  workspacePath?: string;
  title: string;
  description?: string;
  status: MissionStatus;
  priority: Priority;
  progress: number;
  estimatedTime?: number;
  todoStats: TodoStats;
  tags?: string[];
  autoStartEnabled?: boolean;  // Auto-start next todo when one completes
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  // JIRA 연동 정보
  jiraIssueKey?: string;
  jiraIssueUrl?: string;
  // Sentry 연동 정보
  sentryIssueId?: string;
  sentryIssueUrl?: string;
}

export interface TodoStats {
  total: number;
  pending: number;
  threading: number;
  woven: number;
  tangled: number;
}

export interface Todo {
  id: string;
  missionId: string;
  missionTitle?: string;
  projectId?: string;
  projectName?: string;
  workingPath?: string;
  worktreePath?: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: Priority;
  complexity: Complexity;
  estimatedTime?: number;
  actualTime?: number;
  orderIndex: number;
  steps: TodoStep[];
  dependencies: TodoDependency[];  // Changed from string[] to TodoDependency[]
  dependentIds?: string[];         // Todos that depend on this one
  isBlocked?: boolean;             // Has unmet dependencies
  isReadyToStart?: boolean;        // PENDING with all dependencies met
  aiContext?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface TodoDependency {
  id: string;
  title: string;
  status: TodoStatus;
}

export interface TodoStep {
  id: string;
  todoId: string;
  stepType: StepType;
  status: StepStatus;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  /** Real-time progress percentage (0-100) for IN_PROGRESS steps */
  progress?: number;
  /** Real-time activity message */
  message?: string;
}

/**
 * Real-time step progress update from WebSocket.
 */
export interface StepProgressUpdate {
  todoId: string;
  missionId: string;
  stepId: string;
  stepType: StepType;
  status: StepStatus;
  progress?: number;
  message?: string;
  output?: string;
  startedAt?: string;
  completedAt?: string;
  completedSteps: number;
  totalSteps: number;
}

export interface TimelineEvent {
  id: string;
  workspaceId: string;
  eventType: EventType;
  actorType?: ActorType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  missionId?: string;
  todoId?: string;
  timestamp?: string;
  createdAt: string;
}

export type QuestionCategory =
  | 'ARCHITECTURE' | 'IMPLEMENTATION' | 'CONFIGURATION' | 'SECURITY' | 'NAMING' | 'OTHER'
  | 'CLARIFICATION' | 'DESIGN_DECISION' | 'PRIORITY' | 'SCOPE' | 'TECHNICAL' | 'RISK';

export interface AIQuestionOption {
  id: string;
  label: string;
  description?: string;
}

export interface AIQuestion {
  id: string;
  todoId: string;
  todoTitle?: string;
  question: string;
  context?: string;
  status: 'PENDING' | 'ANSWERED';
  category?: QuestionCategory;
  options?: AIQuestionOption[];
  createdAt: string;
}

export interface AIAnswer {
  id: string;
  questionId: string;
  answer: string;
  answeredBy: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  todoId: string;
  stepType: StepType;
  userId: string;
  content: string;
  createdAt: string;
}

// Project Dashboard Types
export interface ProjectDashboard {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  path: string;
  absolutePath: string;
  language?: string;
  buildTool?: string;
  createdAt: string;
  stats: ProjectStats;
  todos: ProjectTodoSummary[];
  linkedMissions: ProjectLinkedMission[];
  activeWorktrees: ProjectWorktree[];
  gitStatus: ProjectGitStatus;
}

export interface ProjectStats {
  totalTodos: number;
  threadingTodos: number;
  wovenTodos: number;
  pendingTodos: number;
  tangledTodos: number;
  linkedMissions: number;
  commits: number;
  aiActions: number;
  linesAdded: number;
  linesRemoved: number;
  progress: number;
}

export interface ProjectTodoSummary {
  id: string;
  title: string;
  status: TodoStatus;
  priority: Priority;
  complexity: Complexity;
  stepProgress: string;
  completedSteps: number;
  totalSteps: number;
  missionId?: string;
  missionTitle?: string;
}

export interface ProjectLinkedMission {
  id: string;
  title: string;
  status: MissionStatus;
  todoCount: number;
  progress: number;
}

export interface ProjectWorktree {
  todoId: string;
  todoTitle: string;
  path: string;
  branch: string;
}

export interface ProjectGitStatus {
  currentBranch: string;
  lastCommit?: string;
  commitCount: number;
  branchCount: number;
  uncommittedChanges: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Auth Types
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// AI Analysis Types
export interface ProjectInsights {
  framework: string;
  stateManagement: string;
  styling: string;
  existingPatterns: string[];
}

export interface AIAnalysisResult {
  missionId: string;
  suggestedTodos: SuggestedTodo[];
  questions: AIQuestionSuggestion[];
  confidence: number;
  analysisTime: number;
  projectInsights?: ProjectInsights;  // From Workspace Agent analysis
  pendingRequestId?: string;          // Analysis request ID (HTTP callback architecture)
  status?: 'PENDING' | 'COMPLETED' | 'FAILED';  // Analysis status
}

export interface SuggestedTodo {
  id: string;              // Temporary ID
  title: string;
  description: string;
  complexity: Complexity;
  estimatedTime: number;
  isUncertain: boolean;    // Flag for uncertain items
  uncertainReason?: string;
  relatedFiles?: string[]; // From Workspace Agent analysis
  reasoning?: string;      // From Workspace Agent analysis
}

export interface AIQuestionSuggestion {
  id: string;
  question: string;
  context: string;
  relatedTodoId: string;   // Connected SuggestedTodo ID
  options: string[];
}
