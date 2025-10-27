import { IFlowRepository } from '../../../domain/flows/repositories/IFlowRepository';
import { Flow } from '../../../domain/flows/entities/Flow';
import { NotFoundError } from '../../../shared/errors/ValidationError';

export class GetFlowByIdUseCase {
  constructor(private readonly flowRepository: IFlowRepository) {}

  public async execute(id: string): Promise<Flow> {
    const flow = await this.flowRepository.findById(id);

    if (!flow) {
      throw new NotFoundError('Flow', id);
    }

    return flow;
  }
}
