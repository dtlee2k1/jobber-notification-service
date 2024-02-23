import { winstonLogger } from '@dtlee2k1/jobber-shared';
import envConfig from '@notifications/config';
import { Channel, ConsumeMessage } from 'amqplib';
import { createConnection } from './connection';

const logger = winstonLogger(`${envConfig.ELASTIC_SEARCH_URL}`, 'emailConsumer', 'debug');

export async function consumeAuthEmailMessages(channel: Channel) {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    const exchangeName = 'jobber-auth-notification';
    const routingKey = 'auth-email';
    const queueName = 'auth-email-queue';

    await channel.assertExchange(exchangeName, 'direct');
    const authEmailQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(authEmailQueue.queue, exchangeName, routingKey);

    channel.consume(authEmailQueue.queue, (msg: ConsumeMessage | null) => {
      console.log(JSON.parse(msg!.content.toString()));
      // Send emails
      channel.ack(msg!);
    });
  } catch (error) {
    logger.log({ level: 'error', message: `NotificationService EmailConsumer consumeAuthEmailMessages() method error: ${error}` });
  }
}

export async function consumeOrderEmailMessages(channel: Channel) {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    const exchangeName = 'jobber-order-notification';
    const routingKey = 'order-email';
    const queueName = 'order-email-queue';

    await channel.assertExchange(exchangeName, 'direct');
    const orderEmailQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(orderEmailQueue.queue, exchangeName, routingKey);

    channel.consume(orderEmailQueue.queue, (msg: ConsumeMessage | null) => {
      console.log(JSON.parse(msg!.content.toString()));
      // Send emails
      channel.ack(msg!);
    });
  } catch (error) {
    logger.log({ level: 'error', message: `NotificationService EmailConsumer consumeOrderEmailMessages() method error: ${error}` });
  }
}
