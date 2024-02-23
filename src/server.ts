import { Server as HttpServer } from 'http';
import { Application } from 'express';
import envConfig from './config';
import { winstonLogger } from '@dtlee2k1/jobber-shared';
import healthRouter from './routes';
import { checkConnection } from './elasticsearch';

const SERVER_PORT = 4001;
const logger = winstonLogger(`${envConfig.ELASTIC_SEARCH_URL}`, 'notificationServer', 'debug');

export function start(app: Application) {
  startServer(app);
  app.use(healthRouter);
  startQueues();
  startElasticSearch();
}

async function startQueues() {}

async function startElasticSearch() {
  await checkConnection();
}

function startServer(app: Application) {
  try {
    const httpServer = new HttpServer(app);
    logger.info(`Worker with process id of ${process.pid} on notification server has started`);
    httpServer.listen(SERVER_PORT, () => {
      logger.info(`Notification server running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    logger.log({ level: 'error', message: `NotificationService startServer() method: ${error}` });
  }
}
