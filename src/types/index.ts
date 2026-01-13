// Re-export all types
export * from './user';
export * from './family';
export * from './auth';
export * from './activity.types';
// Note: log.types.ts contains old types - use ActivityLog from activity.types.ts instead
// export * from './log.types';
export * from './stats.types';
export * from './sync';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  values: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
}

// Generic repository interface
export interface Repository<T, CreateDTO, UpdateDTO> {
  getById(id: string): Promise<T | null>;
  getAll(): Promise<T[]>;
  create(data: CreateDTO & { id: string }): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<void>;
}

// Query options for list operations
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}