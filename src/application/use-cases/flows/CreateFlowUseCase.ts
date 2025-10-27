import { IFlowRepository } from '../../../domain/flows/repositories/IFlowRepository';
import { FlowValidator } from '../../../domain/flows/services/FlowValidator';
import { Flow } from '../../../domain/flows/entities/Flow';
import { CreateFlowDTO } from '../../dtos/CreateFlowDTO';
import { logger } from '../../../infrastructure/logging/winston-logger';

export class CreateFlowUseCase {
  constructor(
    private readonly flowRepository: IFlowRepository,
    private readonly flowValidator: FlowValidator
  ) {}

  public async execute(dto: CreateFlowDTO): Promise<Flow> {
    logger.info('Creating flow', { name: dto.name });

    // Validate Flow JSON
    const validatedFlowJson = this.flowValidator.validateComplete(dto.flowJson);

    // Create flow
    const flow = await this.flowRepository.create(
      dto.name,
      dto.version || '7.2',
      validatedFlowJson,
      dto.description,
      dto.status || 'active',
      dto.metaFlowId,
      dto.templateName
    );

    logger.info('Flow created', { flowId: flow.id, name: flow.name });

    return flow;
  }
}
