import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { pipelineQueue } from './pipeline.queue';

export function setupBullBoardDashboard() {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(pipelineQueue)],
    serverAdapter,
  });

  return serverAdapter.getRouter();
}
