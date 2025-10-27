import { Flow } from '../entities/Flow';
import { FlowSession } from '../entities/FlowSession';
import { DecryptedFlowResponse } from '../../../shared/types/flow-types';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { FLOW_ACTIONS } from '../../../shared/constants/flow-actions';

/**
 * FlowEngine Service
 * Handles navigation logic between Flow screens
 */
export class FlowEngine {
  /**
   * Process INIT action - return first screen
   */
  public processInit(flow: Flow, session: FlowSession): DecryptedFlowResponse {
    const firstScreen = flow.getFirstScreen();

    // Update session
    session.navigateToScreen(firstScreen.id);

    return {
      version: flow.version,
      screen: firstScreen.id,
      data: firstScreen.data || {},
    };
  }

  /**
   * Process data_exchange action - navigate to next screen or stay on current
   */
  public processDataExchange(
    flow: Flow,
    session: FlowSession,
    incomingData: Record<string, any>,
    currentScreen?: string
  ): DecryptedFlowResponse {
    // Update session data
    session.updateSessionData(incomingData);

    // If no current screen specified, stay on current
    if (!currentScreen && session.currentScreen) {
      currentScreen = session.currentScreen;
    }

    if (!currentScreen) {
      throw new ValidationError('Current screen not specified');
    }

    const screen = flow.getScreen(currentScreen);
    if (!screen) {
      throw new ValidationError(`Screen '${currentScreen}' not found in flow`);
    }

    return {
      version: flow.version,
      screen: currentScreen,
      data: {
        ...screen.data,
        ...session.sessionData,
      },
    };
  }

  /**
   * Process navigate action - move to specified screen
   */
  public processNavigate(
    flow: Flow,
    session: FlowSession,
    nextScreen: string,
    incomingData?: Record<string, any>
  ): DecryptedFlowResponse {
    // Update session data if provided
    if (incomingData) {
      session.updateSessionData(incomingData);
    }

    // Navigate to next screen
    session.navigateToScreen(nextScreen);

    const screen = flow.getScreen(nextScreen);
    if (!screen) {
      throw new ValidationError(`Screen '${nextScreen}' not found in flow`);
    }

    return {
      version: flow.version,
      screen: nextScreen,
      data: {
        ...screen.data,
        ...session.sessionData,
      },
    };
  }

  /**
   * Process complete action - mark session as completed
   */
  public processComplete(
    flow: Flow,
    session: FlowSession,
    finalData?: Record<string, any>
  ): DecryptedFlowResponse {
    // Update session data if provided
    if (finalData) {
      session.updateSessionData(finalData);
    }

    // Mark session as completed
    session.complete();

    return {
      version: flow.version,
      data: {
        acknowledged: true,
      },
    };
  }

  /**
   * Process ping action - health check
   * WhatsApp expects: { version: "7.2", data: { status: "active" } }
   */
  public processPing(): DecryptedFlowResponse {
    return {
      version: '7.2',
      data: {
        status: 'active',
      },
    };
  }

  /**
   * Route action to appropriate handler
   */
  public processAction(
    action: string,
    flow: Flow,
    session: FlowSession,
    data?: Record<string, any>,
    currentScreen?: string,
    nextScreen?: string
  ): DecryptedFlowResponse {
    switch (action) {
      case FLOW_ACTIONS.PING:
        return this.processPing();

      case FLOW_ACTIONS.INIT:
        return this.processInit(flow, session);

      case FLOW_ACTIONS.DATA_EXCHANGE:
        return this.processDataExchange(flow, session, data || {}, currentScreen);

      case FLOW_ACTIONS.NAVIGATE:
        if (!nextScreen) {
          throw new ValidationError('Next screen must be specified for navigate action');
        }
        return this.processNavigate(flow, session, nextScreen, data);

      case FLOW_ACTIONS.COMPLETE:
        return this.processComplete(flow, session, data);

      default:
        throw new ValidationError(`Unknown action: ${action}`);
    }
  }
}
