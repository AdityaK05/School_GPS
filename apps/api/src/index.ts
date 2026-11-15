import { createServer } from './server';
import { logger } from '@school-transport-platform/utils';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const server = createServer();

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`School Transport Platform Backend running on port ${PORT}`);
});
