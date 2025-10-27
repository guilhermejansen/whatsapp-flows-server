import { z } from 'zod';
import { FlowJSON } from '../../../shared/types/flow-types';
import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * FlowValidator Service
 * Validates Flow JSON structure with Zod v4
 */
export class FlowValidator {
  private static readonly screenSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    terminal: z.boolean().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    layout: z.object({
      type: z.string(),
      children: z.array(z.unknown()),
    }),
    refresh_on_back: z.boolean().optional(),
  });

  private static readonly flowJsonSchema = z.object({
    version: z.string().regex(/^\d+\.\d+$/, { message: 'Version must be in format X.Y' }),
    screens: z.array(FlowValidator.screenSchema).min(1, 'Flow must have at least one screen'),
    data_channel_uri: z.string().url().optional(),
  });

  /**
   * Validate Flow JSON structure
   */
  public validate(flowJson: unknown): FlowJSON {
    try {
      return FlowValidator.flowJsonSchema.parse(flowJson) as FlowJSON;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`);
        throw new ValidationError('Flow JSON validation failed', {
          errors: messages,
        });
      }
      throw error;
    }
  }

  /**
   * Validate screen IDs are unique
   */
  public validateUniqueScreenIds(flowJson: FlowJSON): void {
    const screenIds = flowJson.screens.map((screen) => screen.id);
    const uniqueIds = new Set(screenIds);

    if (screenIds.length !== uniqueIds.size) {
      throw new ValidationError('Screen IDs must be unique', {
        screenIds,
      });
    }
  }

  /**
   * Validate at least one terminal screen exists
   */
  public validateTerminalScreen(flowJson: FlowJSON): void {
    const hasTerminal = flowJson.screens.some((screen) => screen.terminal === true);

    if (!hasTerminal) {
      throw new ValidationError('Flow must have at least one terminal screen');
    }
  }

  /**
   * Complete validation
   */
  public validateComplete(flowJson: unknown): FlowJSON {
    const validatedFlow = this.validate(flowJson);
    this.validateUniqueScreenIds(validatedFlow);
    this.validateTerminalScreen(validatedFlow);
    return validatedFlow;
  }
}
