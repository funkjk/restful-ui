import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { verifyWebhook } from 'svelte-clerk/webhooks';
import { deleteConfig, listConfigs } from '$lib/restful/config-server/ConfigStore';
import { logger } from '$lib/utils/logger';

/**
 * Clerk Webhook endpoint for user deletion events
 * Handles user.deleted event and deletes all configurations for that user (FR-020)
 */
export const POST = async (event: RequestEvent) => {
    try {
        const payload = await event.request.text();
        const headers = {
            'svix-id': event.request.headers.get('svix-id') || '',
            'svix-timestamp': event.request.headers.get('svix-timestamp') || '',
            'svix-signature': event.request.headers.get('svix-signature') || '',
        };

        // Verify webhook signature (security)
        if (!headers['svix-id'] || !headers['svix-timestamp'] || !headers['svix-signature']) {
            logger.warn('Missing webhook signature headers');
            return json({ error: 'Missing webhook signature' }, { status: 400 });
        }

        // Verify webhook using svelte-clerk
        // verifyWebhook automatically reads CLERK_WEBHOOK_SIGNING_SECRET from environment
        let webhookEvent;
        try {
            webhookEvent = await verifyWebhook(payload, headers);
        } catch (error) {
            logger.error('Webhook verification failed', { error });
            return json({ error: 'Invalid webhook signature' }, { status: 401 });
        }

        const { type, data } = webhookEvent;

        // Handle user.deleted event
        if (type === 'user.deleted') {
            const userId = data.id;
            
            if (!userId) {
                logger.warn('user.deleted event missing user ID');
                return json({ error: 'Missing user ID' }, { status: 400 });
            }

            // Get all configurations for this user
            const configs = await listConfigs(userId);
            
            // Delete all configurations for this user
            for (const config of configs) {
                try {
                    await deleteConfig(config.configurationId, userId);
                    logger.info('Configuration deleted on user deletion', {
                        configurationId: config.configurationId,
                        userId,
                    });
                } catch (error) {
                    logger.error('Failed to delete configuration on user deletion', {
                        configurationId: config.configurationId,
                        userId,
                        error,
                    });
                    // Continue with other configs even if one fails
                }
            }

            logger.info('User configurations deleted', {
                userId,
                count: configs.length,
            });

            return json({ success: true, deletedCount: configs.length });
        }

        // Ignore other event types
        logger.debug('Unhandled webhook event type', { type });
        return json({ success: true, message: 'Event type not handled' });
    } catch (error) {
        logger.error('Webhook processing failed', { error });
        return json(
            {
                success: false,
                error: `Failed to process webhook: ${error instanceof Error ? error.message : String(error)}`,
            },
            { status: 500 }
        );
    }
};

