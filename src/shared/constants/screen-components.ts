/**
 * WhatsApp Flow Screen Component Types
 * Ref: https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson/
 */

export const SCREEN_COMPONENTS = {
  // Layout
  SINGLE_COLUMN_LAYOUT: 'SingleColumnLayout',

  // Input Components
  TEXT_INPUT: 'TextInput',
  TEXT_AREA: 'TextArea',
  RADIO_BUTTONS_GROUP: 'RadioButtonsGroup',
  CHECKBOX_GROUP: 'CheckboxGroup',
  DROPDOWN: 'Dropdown',
  DATE_PICKER: 'DatePicker',
  OPT_IN: 'OptIn',

  // Display Components
  TEXT_HEADING: 'TextHeading',
  TEXT_SUBHEADING: 'TextSubheading',
  TEXT_BODY: 'TextBody',
  TEXT_CAPTION: 'TextCaption',
  IMAGE: 'Image',

  // Navigation
  FOOTER: 'Footer',
} as const;

export type ScreenComponent = (typeof SCREEN_COMPONENTS)[keyof typeof SCREEN_COMPONENTS];

export const FLOW_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DEPRECATED: 'deprecated',
} as const;

export type FlowStatus = (typeof FLOW_STATUS)[keyof typeof FLOW_STATUS];

export const SESSION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  ERROR: 'error',
} as const;

export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];
