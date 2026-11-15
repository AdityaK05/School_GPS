export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }[];
}

export interface AIToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface AICompletionResult {
  content: string | null;
  toolCalls?: {
    id: string;
    name: string;
    arguments: Record<string, any>;
  }[];
}

export interface IAIProvider {
  generateCompletion(
    messages: AIChatMessage[],
    tools?: AIToolDefinition[]
  ): Promise<AICompletionResult>;
}
