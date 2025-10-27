import { Request, Response, NextFunction } from 'express';
import { HandleFlowRequestUseCase } from '../../../../application/use-cases/flows/HandleFlowRequestUseCase';
import { FlowRequestDTO } from '../../../../application/dtos/FlowRequestDTO';

/**
 * Endpoint Controller - Handles Flow Data API requests
 * CRITICAL: Must respond in < 3 seconds
 */
export class EndpointController {
  constructor(private readonly handleFlowRequestUseCase: HandleFlowRequestUseCase) {}

  public handleRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get flowName from path parameter (primary) or query parameter (legacy support)
      const flowName = req.params.flowName || (req.query.flow as string);

      const requestDto: FlowRequestDTO = {
        encrypted_aes_key: req.body.encrypted_aes_key,
        encrypted_flow_data: req.body.encrypted_flow_data,
        initial_vector: req.body.initial_vector,
        flow_name: flowName, // Can be undefined (fallback system will handle)
      };

      const response = await this.handleFlowRequestUseCase.execute(requestDto);

      // Return encrypted response as plain base64 string (WhatsApp format)
      res.send(response);
    } catch (error) {
      next(error);
    }
  };
}
