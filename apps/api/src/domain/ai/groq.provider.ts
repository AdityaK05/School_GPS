import { IAIProvider, AIChatMessage, AIToolDefinition, AICompletionResult } from './ai.interface';

export interface GroqProviderConfig {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
}

export class GroqAIProvider implements IAIProvider {
  private readonly apiKey?: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(cfg: GroqProviderConfig = {}) {
    this.apiKey = cfg.apiKey || process.env.GROQ_API_KEY;
    this.model = cfg.model || process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    this.timeoutMs = cfg.timeoutMs || 15000;
  }

  async generateCompletion(
    messages: AIChatMessage[],
    tools?: AIToolDefinition[]
  ): Promise<AICompletionResult> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured on the server environment.');
    }

    const payload: any = {
      model: this.model,
      messages: messages.map((m) => {
        const msg: any = { role: m.role };
        if (m.content !== null && m.content !== undefined) {
          msg.content = m.content;
        } else if (!m.tool_calls) {
          msg.content = '';
        }
        if (m.name) msg.name = m.name;
        if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
        if (m.tool_calls) msg.tool_calls = m.tool_calls;
        return msg;
      }),
      temperature: 0.2,
      max_tokens: 1024,
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API returned HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      if (!choice || !choice.message) {
        throw new Error('Groq API returned an empty or invalid choice payload.');
      }

      const msg = choice.message;
      let toolCalls: AICompletionResult['toolCalls'];

      if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
        toolCalls = msg.tool_calls.map((tc: any) => {
          let parsedArgs = {};
          try {
            parsedArgs = typeof tc.function.arguments === 'string'
              ? JSON.parse(tc.function.arguments)
              : tc.function.arguments;
          } catch {
            parsedArgs = {};
          }
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: parsedArgs,
          };
        });
      }

      return {
        content: msg.content || null,
        toolCalls,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Groq API request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
