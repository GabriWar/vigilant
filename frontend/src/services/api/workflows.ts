/**
 * Workflows API client
 */
import { apiClient } from './client';

export interface WorkflowStep {
  order: number;
  request_id: number;
  continue_on_error: boolean;
  extract_variables: string[];
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  steps: WorkflowStep[];
  schedule_enabled: boolean;
  schedule_interval?: number;
  last_executed_at?: string;
  last_execution_status?: string;
  last_execution_error?: string;
  execution_count: number;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowWithVariables extends Workflow {
  variables: Variable[];
}

export interface Variable {
  id: number;
  workflow_id: number;
  request_id?: number;
  name: string;
  description?: string;
  source: 'response_body' | 'response_header' | 'cookie' | 'static' | 'random';
  extract_method: 'json_path' | 'regex' | 'cookie_value' | 'header_value' | 'full_body' | 'random_string' | 'random_number' | 'random_uuid';
  extract_pattern?: string;
  random_length?: number;
  random_format?: string;
  static_value?: string;
  current_value?: string;
  created_at: string;
  updated_at: string;
  last_extracted_at?: string;
}

export interface WorkflowExecution {
  id: number;
  workflow_id: number;
  status: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  steps_completed: number;
  steps_total: number;
  step_results: any[];
  variables_extracted: Record<string, string>;
  error_message?: string;
  error_step?: number;
}

export interface WorkflowCreateData {
  name: string;
  description?: string;
  is_active?: boolean;
  steps: WorkflowStep[];
  schedule_enabled?: boolean;
  schedule_interval?: number;
}

export interface WorkflowUpdateData {
  name?: string;
  description?: string;
  is_active?: boolean;
  steps?: WorkflowStep[];
  schedule_enabled?: boolean;
  schedule_interval?: number;
}

export interface VariableCreateData {
  workflow_id: number;
  request_id?: number;
  name: string;
  description?: string;
  source: string;
  extract_method: string;
  extract_pattern?: string;
  random_length?: number;
  random_format?: string;
  static_value?: string;
}

export const workflowsApi = {
  /**
   * Get all workflows
   */
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<Workflow[]> => {
    const response = await apiClient.get('/workflows', { params });
    return response.data;
  },

  /**
   * Get workflow by ID with variables
   */
  getById: async (id: number): Promise<WorkflowWithVariables> => {
    const response = await apiClient.get(`/workflows/${id}`);
    return response.data;
  },

  /**
   * Create workflow
   */
  create: async (data: WorkflowCreateData): Promise<Workflow> => {
    const response = await apiClient.post('/workflows', data);
    return response.data;
  },

  /**
   * Update workflow
   */
  update: async (id: number, data: WorkflowUpdateData): Promise<Workflow> => {
    const response = await apiClient.put(`/workflows/${id}`, data);
    return response.data;
  },

  /**
   * Delete workflow
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/workflows/${id}`);
  },

  /**
   * Execute workflow
   */
  execute: async (
    id: number,
    overrideVariables?: Record<string, string>,
    background: boolean = false
  ): Promise<WorkflowExecution> => {
    const response = await apiClient.post(
      `/workflows/${id}/execute`,
      { workflow_id: id, override_variables: overrideVariables },
      { params: { background } }
    );
    return response.data;
  },

  /**
   * Get workflow executions
   */
  getExecutions: async (
    id: number,
    params?: { skip?: number; limit?: number }
  ): Promise<WorkflowExecution[]> => {
    const response = await apiClient.get(`/workflows/${id}/executions`, { params });
    return response.data;
  },

  /**
   * Create variable
   */
  createVariable: async (
    workflowId: number,
    data: VariableCreateData
  ): Promise<Variable> => {
    const response = await apiClient.post(`/workflows/${workflowId}/variables`, data);
    return response.data;
  },

  /**
   * Get variables
   */
  getVariables: async (workflowId: number): Promise<Variable[]> => {
    const response = await apiClient.get(`/workflows/${workflowId}/variables`);
    return response.data;
  },

  /**
   * Update variable
   */
  updateVariable: async (
    workflowId: number,
    variableId: number,
    data: Partial<VariableCreateData>
  ): Promise<Variable> => {
    const response = await apiClient.put(
      `/workflows/${workflowId}/variables/${variableId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete variable
   */
  deleteVariable: async (workflowId: number, variableId: number): Promise<void> => {
    await apiClient.delete(`/workflows/${workflowId}/variables/${variableId}`);
  },
};
