import { IAIProvider, AIChatMessage, AIToolDefinition, AICompletionResult } from './ai.interface';

export class MockAIProvider implements IAIProvider {
  private customHandler?: (messages: AIChatMessage[], tools?: AIToolDefinition[]) => Promise<AICompletionResult>;

  constructor(customHandler?: (messages: AIChatMessage[], tools?: AIToolDefinition[]) => Promise<AICompletionResult>) {
    this.customHandler = customHandler;
  }

  async generateCompletion(
    messages: AIChatMessage[],
    tools?: AIToolDefinition[]
  ): Promise<AICompletionResult> {
    if (this.customHandler) {
      return this.customHandler(messages, tools);
    }

    const lastMsg = messages[messages.length - 1];
    // If last message is a tool response, synthesize an answer
    if (lastMsg.role === 'tool') {
      return {
        content: `Based on official transport telematics: ${lastMsg.content}`,
      };
    }

    const query = (lastMsg.content || '').toLowerCase();

    // If tools are provided and user asks a domain question, simulate appropriate tool call
    if (tools && tools.length > 0) {
      if (query.includes('where') || query.includes('location')) {
        return {
          content: null,
          toolCalls: [{ id: 'call_mock_loc', name: 'getChildCurrentLocation', arguments: {} }],
        };
      }
      if (query.includes('arrive') || query.includes('eta') || query.includes('when')) {
        return {
          content: null,
          toolCalls: [{ id: 'call_mock_eta', name: 'getChildETA', arguments: {} }],
        };
      }
      if (query.includes('board') || query.includes('bus')) {
        return {
          content: null,
          toolCalls: [{ id: 'call_mock_board', name: 'getChildBoardingStatus', arguments: {} }],
        };
      }
      if (query.includes('exit') || query.includes('reach') || query.includes('alight')) {
        return {
          content: null,
          toolCalls: [{ id: 'call_mock_exit', name: 'getChildExitStatus', arguments: {} }],
        };
      }
      if (query.includes('alert') || query.includes('delay') || query.includes('exception')) {
        return {
          content: null,
          toolCalls: [{ id: 'call_mock_exc', name: 'getChildActiveExceptions', arguments: {} }],
        };
      }
    }

    return {
      content: "Hello! I am your Aegis School Transport Assistant. I can help you check your child's live bus location, estimated arrival time, boarding status, and safety alerts.",
    };
  }
}
