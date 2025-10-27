import { FlowJSON, FlowStatus } from '../../../shared/types/flow-types';
import { ValidationError } from '../../../shared/errors/ValidationError';

/**
 * Flow Entity - Represents a WhatsApp Flow JSON template
 */
export class Flow {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly version: string,
    public readonly flowJson: FlowJSON,
    public readonly description: string | undefined,
    public readonly status: FlowStatus,
    public readonly metaFlowId: string | undefined,
    public readonly templateName: string | undefined,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationError('Flow name cannot be empty');
    }

    if (!this.flowJson || !this.flowJson.screens || this.flowJson.screens.length === 0) {
      throw new ValidationError('Flow must have at least one screen');
    }

    // Validate version format
    if (!this.version.match(/^\d+\.\d+$/)) {
      throw new ValidationError('Flow version must be in format X.Y (e.g., 7.2)');
    }
  }

  /**
   * Get screen by ID
   */
  public getScreen(screenId: string) {
    return this.flowJson.screens.find((screen) => screen.id === screenId);
  }

  /**
   * Get first screen (initial screen)
   */
  public getFirstScreen() {
    if (this.flowJson.screens.length === 0) {
      throw new ValidationError('Flow has no screens');
    }
    return this.flowJson.screens[0];
  }

  /**
   * Check if screen is terminal (last screen)
   */
  public isTerminalScreen(screenId: string): boolean {
    const screen = this.getScreen(screenId);
    return screen?.terminal === true;
  }

  /**
   * Get all screen IDs
   */
  public getScreenIds(): string[] {
    return this.flowJson.screens.map((screen) => screen.id);
  }

  /**
   * Check if flow is active
   */
  public isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Create from database row
   */
  static fromDatabase(row: any): Flow {
    return new Flow(
      row.id,
      row.name,
      row.version,
      row.flow_json,
      row.description,
      row.status,
      row.meta_flow_id,
      row.template_name,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }
}
