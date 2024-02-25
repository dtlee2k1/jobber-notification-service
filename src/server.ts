import { Server as HttpServer } from 'http';
import { Application } from 'express';
import envConfig from './config';
import { IEmailMessageDetails, winstonLogger } from '@dtlee2k1/jobber-shared';
import healthRouter from './routes';
import { checkConnection } from './elasticsearch';
import { createConnection } from './queues/connection';
import { Channel } from 'amqplib';
import { consumeAuthEmailMessages, consumeOrderEmailMessages } from './queues/email.consumer';

const SERVER_PORT = 4001;
const logger = winstonLogger(`${envConfig.ELASTIC_SEARCH_URL}`, 'notificationServer', 'debug');

export function start(app: Application) {
  startServer(app);
  app.use(healthRouter);
  startQueues();
  startElasticSearch();
}

async function startQueues() {
  const emailChannel = (await createConnection()) as Channel;

  // Handle consume auth email
  await consumeAuthEmailMessages(emailChannel);
  const verifyLink = `${envConfig.CLIENT_URL}/confirm_email/v_token=abcxyz1234567890`;
  const messageDetails: IEmailMessageDetails = {
    receiverEmail: `${envConfig.SENDER_EMAIL}`,
    verifyLink,
    template: 'verifyEmail'
  };
  await emailChannel.assertExchange('jobber-auth-notification', 'direct');
  const message = JSON.stringify(messageDetails);
  emailChannel.publish('jobber-auth-notification', 'auth-email', Buffer.from(message));

  // Handle consume order email
  await consumeOrderEmailMessages(emailChannel);
  // await emailChannel.assertExchange('jobber-auth-notification', 'direct');
  // const message1 = JSON.stringify({ name: 'User 1', service: 'Notification order service' });
  // emailChannel.publish('jobber-order-notification', 'order-email', Buffer.from(message1));
}

function startElasticSearch() {
  checkConnection();
}

function startServer(app: Application) {
  try {
    const httpServer = new HttpServer(app);
    logger.info(`Worker with process id of ${process.pid} on notification server has started`);
    httpServer.listen(SERVER_PORT, () => {
      logger.info(`Notification server running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    logger.log({ level: 'error', message: `NotificationService startServer() method error: ${error}` });
  }
}
