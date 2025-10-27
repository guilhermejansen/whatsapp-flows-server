import { Router } from 'express';
import { FlowController } from '../controllers/FlowController';
import { authenticateToken, authorizeRole } from '../middlewares/auth-middleware';
import { validateRequest } from '../middlewares/validate-request';
import {
  createFlowSchema,
  updateFlowSchema,
  uuidSchema,
} from '../../../../application/dtos/validation-schemas';

/**
 * Flow Routes - CRUD operations
 * Base path: /api/flows
 *
 * IMPORTANT: All routes are protected with authentication
 * Requires: Authorization: Bearer <API_TOKEN>
 */
export function createFlowRoutes(flowController: FlowController): Router {
  const router = Router();

  /**
   * @openapi
   * /api/flows:
   *   post:
   *     tags:
   *       - Flows
   *     summary: Create new flow
   *     description: |
   *       Creates a new WhatsApp Flow in the system.
   *
   *       **Requirements:**
   *       - Authentication required (Bearer token)
   *       - Admin role required
   *
   *       **Flow JSON Structure:**
   *       - Must follow WhatsApp Flow JSON specification
   *       - Version must be between 2.0 and 7.2
   *       - Minimum 1 screen, maximum 20 screens
   *       - Each screen must have valid layout and components
   *
   *       **Use Cases:**
   *       1. Create from WhatsApp Manager template
   *       2. Create custom flow with FlowJson structure
   *       3. Import flow from external source
   *
   *       **Reference:** https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson
   *     operationId: createFlow
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateFlowRequest'
   *           example:
   *             name: 'CSAT Feedback Flow'
   *             version: '7.2'
   *             description: 'Customer satisfaction feedback collection'
   *             status: 'active'
   *             templateName: 'templates_csat_src_dev_1_0_UTILITY_99e0c'
   *             flowJson:
   *               version: '7.2'
   *               routing_model:
   *                 SCREEN_1: ['SCREEN_2']
   *                 SCREEN_2: []
   *               data_api_version: '3.0'
   *               screens:
   *                 - id: SCREEN_1
   *                   title: 'Welcome'
   *                   layout:
   *                     type: 'SingleColumnLayout'
   *                     children: []
   *     responses:
   *       201:
   *         description: Flow created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Flow'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized - Invalid or missing token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post(
    '/',
    authenticateToken,
    authorizeRole(['admin']),
    validateRequest(createFlowSchema, 'body'),
    flowController.create
  );

  /**
   * @openapi
   * /api/flows:
   *   get:
   *     tags:
   *       - Flows
   *     summary: List all flows
   *     description: |
   *       Returns a list of all flows with optional filtering and pagination.
   *
   *       **Authentication:** Required (Bearer token)
   *
   *       **Filters:**
   *       - status: Filter by flow status (active, inactive, deprecated)
   *       - search: Search by flow name or description
   *
   *       **Sorting:**
   *       - sortBy: created_at, updated_at, name
   *       - sortOrder: asc, desc
   *
   *       **Pagination:**
   *       - page: Page number (default: 1)
   *       - limit: Items per page (default: 10, max: 100)
   *     operationId: listFlows
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, inactive, deprecated]
   *         description: Filter by flow status
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search in flow name or description
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [created_at, updated_at, name]
   *           default: created_at
   *         description: Field to sort by
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Sort order
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Items per page
   *     responses:
   *       200:
   *         description: List of flows
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Flow'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/', authenticateToken, flowController.list);

  /**
   * @openapi
   * /api/flows/{id}:
   *   get:
   *     tags:
   *       - Flows
   *     summary: Get flow by ID
   *     description: |
   *       Returns detailed information about a specific flow.
   *
   *       **Authentication:** Required (Bearer token)
   *
   *       **Response includes:**
   *       - Flow metadata (name, version, status, description)
   *       - Complete FlowJson structure
   *       - Creation and update timestamps
   *       - Meta integration details (if configured)
   *     operationId: getFlowById
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Flow UUID
   *         example: '123e4567-e89b-12d3-a456-426614174000'
   *     responses:
   *       200:
   *         description: Flow details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Flow'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Flow not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               error: 'NotFoundError'
   *               message: 'Flow not found'
   *               statusCode: 404
   */
  router.get(
    '/:id',
    authenticateToken,
    validateRequest(uuidSchema, 'params'),
    flowController.getById
  );

  /**
   * @openapi
   * /api/flows/{id}:
   *   put:
   *     tags:
   *       - Flows
   *     summary: Update flow
   *     description: |
   *       Updates an existing flow. Supports partial updates.
   *
   *       **Requirements:**
   *       - Authentication required (Bearer token)
   *       - Admin role required
   *
   *       **Updatable Fields:**
   *       - name: Flow name
   *       - version: Flow JSON version
   *       - flowJson: Complete flow structure
   *       - description: Flow description
   *       - status: active, inactive, or deprecated
   *       - metaFlowId: WhatsApp Flow ID
   *       - templateName: Template identifier
   *
   *       **Important:**
   *       - At least one field must be provided
   *       - Validation applies to all provided fields
   *       - Updating flowJson replaces entire structure
   *     operationId: updateFlow
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Flow UUID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateFlowRequest'
   *           example:
   *             status: 'inactive'
   *             description: 'Updated description'
   *     responses:
   *       200:
   *         description: Flow updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Flow'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Flow not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.put(
    '/:id',
    authenticateToken,
    authorizeRole(['admin']),
    validateRequest(uuidSchema, 'params'),
    validateRequest(updateFlowSchema, 'body'),
    flowController.update
  );

  /**
   * @openapi
   * /api/flows/{id}:
   *   delete:
   *     tags:
   *       - Flows
   *     summary: Delete flow
   *     description: |
   *       Permanently deletes a flow from the system.
   *
   *       **Requirements:**
   *       - Authentication required (Bearer token)
   *       - Admin role required
   *
   *       **Warning:**
   *       - This action is irreversible
   *       - All associated sessions and responses will be affected
   *       - Consider setting status to 'deprecated' instead for soft delete
   *
   *       **Best Practice:**
   *       - Archive flow data before deletion
   *       - Verify no active sessions are using this flow
   *       - Update WhatsApp Manager flow configuration
   *     operationId: deleteFlow
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Flow UUID
   *         example: '123e4567-e89b-12d3-a456-426614174000'
   *     responses:
   *       204:
   *         description: Flow deleted successfully (no content)
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Flow not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.delete(
    '/:id',
    authenticateToken,
    authorizeRole(['admin']),
    validateRequest(uuidSchema, 'params'),
    flowController.delete
  );

  return router;
}
