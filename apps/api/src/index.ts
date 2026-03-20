import { createLogger } from './lib/logger';

const logger = createLogger('api');

logger.info('WBC API starting...');

// HTTP server setup will be added during implementation
// For now, just verify the module loads correctly
logger.info('WBC API module loaded successfully');
