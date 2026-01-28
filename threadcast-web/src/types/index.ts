// Enums
export type MissionStatus = 'BACKLOG' | 'PENDING' | 'THREADING' | 'IN_PROGRESS' | 'WOVEN' | 'COMPLETED' | 'TANGLED' | 'ARCHIVED' | 'SKIPPED';
export type TodoStatus = 'BACKLOG' | 'PENDING' | 'THREADING' | 'IN_PROGRESS' | 'WOVEN' | 'COMPLETED' | 'TANGLED' | 'ARCHIVED' | 'SKIPPED';
export type StepType = 'ANALYSIS' | 'DESIGN' | 'IMPLEMENTATION' | 'VERIFICATION' | 'REVIEW' | 'INTEGRATION';
export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Complexity = 'LOW' | 'MEDIUM' | 'HIGH' | 'SIMPLE' | 'COMPLEX' | 'UNKNOWN';
export type ActorType = 'AI' | 'USER' | 'SYSTEM';
export type EventType =
  | 'MISSION_CREATED' | 'MISSION_STARTED' | 'MISSION_COMPLETED' | 'MISSION_ARCHIVED'
  | 'TODO_CREATED' | 'TODO_STARTED' | 'TODO_COMPLETED' | 'TODO_FAILED'
  | 'STEP_COMPLETED' | 'AI_QUESTION' | 'AI_ANSWER' | 'COMMENT_ADDED';

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
  ownerId: string;
}

export interface Mission {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  status: MissionStatus;
  priority: Priority;
  progress: number;
  todoStats: TodoStats;
  tags?: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
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
  title: string;
  description?: string;
  status: TodoStatus;
  priority: Priority;
  complexity: Complexity;
  estimatedTime?: number;
  actualTime?: number;
  orderIndex: number;
  steps: TodoStep[];
  dependencies: string[];
  aiContext?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface TodoStep {
  id: string;
  todoId: string;
  stepType: StepType;
  status: StepStatus;
  notes?: string;
  completedAt?: string;
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

export interface AIQuestion {
  id: string;
  todoId: string;
  question: string;
  context?: string;
  status: 'PENDING' | 'ANSWERED';
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
