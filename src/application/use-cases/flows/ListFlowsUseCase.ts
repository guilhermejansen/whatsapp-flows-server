import { IFlowRepository } from '../../../domain/flows/repositories/IFlowRepository';
import { Flow } from '../../../domain/flows/entities/Flow';
import { FlowStatus } from '../../../shared/types/flow-types';

export class ListFlowsUseCase {
  constructor(private readonly flowRepository: IFlowRepository) {}

  public async execute(status?: FlowStatus): Promise<Flow[]> {
    return this.flowRepository.findAll(status);
  }
}
