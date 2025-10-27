import { IFlowRepository } from '../../../domain/flows/repositories/IFlowRepository';
import { logger } from '../../../infrastructure/logging/winston-logger';

export class DeleteFlowUseCase {
  constructor(private readonly flowRepository: IFlowRepository) {}

  public async execute(id: string): Promise<void> {
    logger.info('Deleting flow', { flowId: id });

    await this.flowRepository.delete(id);

    logger.info('Flow deleted', { flowId: id });
  }
}
