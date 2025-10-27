import { Router } from 'express';
import { EndpointController } from '../controllers/EndpointController';
import { timeoutHandler } from '../middlewares/timeout-handler';
import { getFlowEndpointRateLimiter } from '../../../../config/security.config';
import { env } from '../../../../config/env.config';

/**
 * Flow Endpoint Routes - WhatsApp Flow Data API
 * Base path: /flows/endpoint
 *
 * CRITICAL: Must respond in < 3 seconds
 */
export function createEndpointRoutes(endpointController: EndpointController): Router {
  const router = Router();

  // Apply timeout middleware (enforce < 2.5s to be safe)
  router.use(timeoutHandler(env.FLOW_ENDPOINT_TIMEOUT));

  // Apply rate limiting
  router.use(getFlowEndpointRateLimiter());

  /**
   * @openapi
   * /flows/endpoint/{flowName}:
   *   post:
   *     tags:
   *       - Flow Endpoint
   *     summary: WhatsApp Flow Data Exchange Endpoint
   *     description: |
   *       Processes encrypted WhatsApp Flow interactions with RSA-2048 + AES-128-GCM encryption.
   *
   *       **CRITICAL:** Must respond in < 3 seconds
   *
   *       **Multiple Flows Support:**
   *       Use the `flowName` path parameter to specify which flow to use:
   *       - Example: `POST /flows/endpoint/csat-feedback`
   *       - Multiple flows: `/flows/endpoint/nps-survey`, `/flows/endpoint/product-feedback`
   *
   *       **Fallback System (3 layers):**
   *       1. Path parameter `/:flowName` (primary)
   *       2. Token mapping cache (ping → INIT sequence)
   *       3. Default flow from env: `DEFAULT_FLOW_NAME=csat-feedback`
   *
   *       **Flow Actions:**
   *       - `ping`: Health check
   *       - `INIT`: Initialize new flow session
   *       - `data_exchange`: Exchange data during flow interaction
   *       - `navigate`: Navigate to specific screen
   *       - `complete`: Complete flow session
   *
   *       **Encryption Flow:**
   *       1. Decrypt AES key using RSA-2048 private key
   *       2. Decrypt flow data using AES-128-GCM (with IV FLIP)
   *       3. Process flow logic and generate response
   *       4. Encrypt response using same AES key
   *       5. Return encrypted response
   *
   *       **Reference:** https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint
   *     operationId: handleFlowRequest
   *     parameters:
   *       - in: path
   *         name: flowName
   *         required: true
   *         schema:
   *           type: string
   *         description: Flow identifier (e.g., csat-feedback, nps-survey)
   *         example: csat-feedback
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/FlowRequest'
   *           example:
   *             encrypted_aes_key: 'kMgDf0h3K5aR9wF2qT8vN1bL4cX6mJ7hG3pS0zD5uE...'
   *             encrypted_flow_data: 'eyJ2ZXJzaW9uIjoiMy4wIiwic2NyZWVuIjoiU0NSRUVOX05BTUUiLCJkYXRhIjp7fX0='
   *             initial_vector: 'MTIzNDU2Nzg5MDEyMzQ1Ng=='
   *     responses:
   *       200:
   *         description: Flow request processed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/FlowResponse'
   *             example:
   *               encrypted_flow_data_b64: 'eyJzY3JlZW4iOiJORVhUX1NDUkVFTiIsImRhdGEiOnt9fQ=='
   *               encrypted_aes_key: 'kMgDf0h3K5aR9wF2qT8vN1bL4cX6mJ7hG3pS0zD5uE...'
   *               initial_vector_b64: 'MTIzNDU2Nzg5MDEyMzQ1Ng=='
   *       400:
   *         description: Invalid request or validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             examples:
   *               cannotIdentifyFlow:
   *                 summary: Cannot identify flow (all fallback layers failed)
   *                 value:
   *                   error: 'ValidationError'
   *                   message: 'Cannot identify flow. Use path parameter: POST /flows/endpoint/{flowName}'
   *                   statusCode: 400
   *               invalidPayload:
   *                 summary: Invalid encrypted payload
   *                 value:
   *                   error: 'ValidationError'
   *                   message: 'Invalid encrypted data format'
   *                   statusCode: 400
   *       404:
   *         description: Flow not found or inactive
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               error: 'NotFoundError'
   *               message: 'Flow not found: csat-feedback'
   *               statusCode: 404
   *       500:
   *         description: Decryption error or server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               error: 'DecryptionError'
   *               message: 'Failed to decrypt request'
   *               statusCode: 500
   *       504:
   *         description: Request timeout (> 3 seconds)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */

  // Primary route: with flowName path parameter
  router.post('/:flowName', endpointController.handleRequest);

  // Fallback route: without flowName (relies on token mapping or default flow)
  // This handles cases where WhatsApp sends requests to /flows/endpoint without path parameter
  router.post('/', endpointController.handleRequest);

  return router;
}
