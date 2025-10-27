/**
 * WhatsApp Flow Actions
 * Ref: https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint/
 */

export const FLOW_ACTIONS = {
  PING: 'ping',
  INIT: 'INIT',
  DATA_EXCHANGE: 'data_exchange',
  NAVIGATE: 'navigate',
  COMPLETE: 'complete',
} as const;

export type FlowAction = (typeof FLOW_ACTIONS)[keyof typeof FLOW_ACTIONS];

export const isValidFlowAction = (action: string): action is FlowAction => {
  return Object.values(FLOW_ACTIONS).includes(action as FlowAction);
};
