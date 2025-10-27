import { Router } from 'express';
import { WebhookController } from '../controllers/WebhookController';
import { getWebhookRateLimiter } from '../../../../config/security.config';

/**
 * Webhook Routes - WhatsApp webhook receiver
 * Base path: /webhooks/whatsapp
 */
export function createWebhookRoutes(webhookController: WebhookController): Router {
  const router = Router();

  // Apply rate limiting
  router.use(getWebhookRateLimiter());

  /**
   * @openapi
   * /webhooks/whatsapp:
   *   get:
   *     tags:
   *       - Webhooks
   *     summary: Webhook verification endpoint
   *     description: |
   *       Verifies webhook configuration with WhatsApp Business Platform.
   *
   *       **WhatsApp Setup:**
   *       1. Go to Meta App Dashboard > WhatsApp > Configuration
   *       2. Enter your webhook URL: `https://your-domain.com/webhooks/whatsapp`
   *       3. Enter verify token from your .env (META_VERIFY_TOKEN)
   *       4. Click "Verify and Save"
   *
   *       **Verification Flow:**
   *       - WhatsApp sends GET request with hub.mode, hub.verify_token, hub.challenge
   *       - Server validates verify_token matches META_VERIFY_TOKEN
   *       - Server responds with hub.challenge value
   *
   *       **Reference:** https://developers.facebook.com/docs/graph-api/webhooks/getting-started
   *     operationId: verifyWebhook
   *     parameters:
   *       - in: query
   *         name: hub.mode
   *         required: true
   *         schema:
   *           type: string
   *           enum: [subscribe]
   *         example: subscribe
   *       - in: query
   *         name: hub.verify_token
   *         required: true
   *         schema:
   *           type: string
   *         description: Verification token configured in Meta App Dashboard
   *         example: your_verify_token_here
   *       - in: query
   *         name: hub.challenge
   *         required: true
   *         schema:
   *           type: string
   *         description: Challenge string to echo back
   *         example: challenge_1234567890
   *     responses:
   *       200:
   *         description: Webhook verified successfully
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   *             example: challenge_1234567890
   *       403:
   *         description: Invalid verify token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               error: 'ForbiddenError'
   *               message: 'Invalid verify token'
   *               statusCode: 403
   *       400:
   *         description: Missing required parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/', webhookController.verify);

  /**
   * @openapi
   * /webhooks/whatsapp:
   *   post:
   *     tags:
   *       - Webhooks
   *     summary: WhatsApp event receiver
   *     description: |
   *       Receives WhatsApp Business Platform events, specifically nfm_reply (Flow completion) events.
   *
   *       **Event Processing:**
   *       1. Validates webhook signature using META_APP_SECRET
   *       2. Extracts nfm_reply event with flow completion data
   *       3. Stores webhook event in database
   *       4. Stores flow response data
   *       5. Forwards event to callback webhook URL (if configured)
   *
   *       **nfm_reply Event:**
   *       - Sent when user completes or abandons a flow
   *       - Contains response_json (STRING) with flow data
   *       - Includes user information and metadata
   *
   *       **Security:**
   *       - All webhooks are validated with X-Hub-Signature-256 header
   *       - Uses HMAC-SHA256 with META_APP_SECRET
   *
   *       **Reference:** https://developers.facebook.com/docs/whatsapp/flows/guides/sendingaflow#receiving-the-response
   *     operationId: handleWebhook
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/WebhookEvent'
   *           example:
   *             object: whatsapp_business_account
   *             entry:
   *               - id: '123456789'
   *                 changes:
   *                   - value:
   *                       messaging_product: whatsapp
   *                       metadata:
   *                         display_phone_number: '+1234567890'
   *                         phone_number_id: '987654321'
   *                       messages:
   *                         - from: '5511999999999'
   *                           id: 'wamid.ABC123'
   *                           timestamp: '1234567890'
   *                           type: interactive
   *                           interactive:
   *                             type: nfm_reply
   *                             nfm_reply:
   *                               response_json: '{"feedback_rating":"5","feedback_comment":"Great service!"}'
   *                               body: Sent
   *                               name: flow
   *                     field: messages
   *     responses:
   *       200:
   *         description: Webhook processed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *       400:
   *         description: Invalid webhook payload
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Invalid webhook signature
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               error: 'ForbiddenError'
   *               message: 'Invalid webhook signature'
   *               statusCode: 403
   *       500:
   *         description: Server error processing webhook
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post('/', webhookController.handleWebhook);

  return router;
}
