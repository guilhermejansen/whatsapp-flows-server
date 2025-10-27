import { IFlowRepository } from '../../../domain/flows/repositories/IFlowRepository';
import { FlowValidator } from '../../../domain/flows/services/FlowValidator';
import { Flow } from '../../../domain/flows/entities/Flow';
import { UpdateFlowDTO } from '../../dtos/CreateFlowDTO';
import { logger } from '../../../infrastructure/logging/winston-logger';

export class UpdateFlowUseCase {
  constructor(
    private readonly flowRepository: IFlowRepository,
    private readonly flowValidator: FlowValidator
  ) {}

  public async execute(id: string, dto: UpdateFlowDTO): Promise<Flow> {
    logger.info('Updating flow', { flowId: id });

    // Validate Flow JSON if provided
    if (dto.flowJson) {
      dto.flowJson = this.flowValidator.validateComplete(dto.flowJson);
    }

    // Update flow
    const flow = await this.flowRepository.update(id, dto);

    logger.info('Flow updated', { flowId: flow.id, name: flow.name });

    return flow;
  }
}
