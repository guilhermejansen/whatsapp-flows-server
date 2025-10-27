import { Request, Response, NextFunction } from 'express';
import { CreateFlowUseCase } from '../../../../application/use-cases/flows/CreateFlowUseCase';
import { ListFlowsUseCase } from '../../../../application/use-cases/flows/ListFlowsUseCase';
import { GetFlowByIdUseCase } from '../../../../application/use-cases/flows/GetFlowByIdUseCase';
import { UpdateFlowUseCase } from '../../../../application/use-cases/flows/UpdateFlowUseCase';
import { DeleteFlowUseCase } from '../../../../application/use-cases/flows/DeleteFlowUseCase';
import { ResponseBuilder } from '../../../../shared/utils/response-builder';
import { FlowStatus } from '../../../../shared/types/flow-types';

/**
 * Flow Controller - CRUD operations for Flows
 */
export class FlowController {
  constructor(
    private readonly createFlowUseCase: CreateFlowUseCase,
    private readonly listFlowsUseCase: ListFlowsUseCase,
    private readonly getFlowByIdUseCase: GetFlowByIdUseCase,
    private readonly updateFlowUseCase: UpdateFlowUseCase,
    private readonly deleteFlowUseCase: DeleteFlowUseCase
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const flow = await this.createFlowUseCase.execute(req.body);
      ResponseBuilder.created(res, flow);
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as FlowStatus | undefined;
      const flows = await this.listFlowsUseCase.execute(status);
      ResponseBuilder.success(res, flows);
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const flow = await this.getFlowByIdUseCase.execute(req.params.id);
      ResponseBuilder.success(res, flow);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const flow = await this.updateFlowUseCase.execute(req.params.id, req.body);
      ResponseBuilder.success(res, flow);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.deleteFlowUseCase.execute(req.params.id);
      ResponseBuilder.noContent(res);
    } catch (error) {
      next(error);
    }
  };
}
