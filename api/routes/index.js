import express from 'express';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import {
  generatePacs002,
  generatePacs004,
  generatePacs008,
  getMessage,
  listMessagesController,
  getStats
} from '../controllers/messages.js';
import { validateMessage } from '../controllers/validation.js';

const router = express.Router();

router.post('/pacs002', idempotencyMiddleware, generatePacs002);
router.post('/pacs004', idempotencyMiddleware, generatePacs004);
router.post('/pacs008', idempotencyMiddleware, generatePacs008);

router.get('/messages', listMessagesController);
router.get('/messages/:id', getMessage);

router.get('/stats', getStats);

router.post('/validate', validateMessage);

export default router;
