import { 
  findByIdempotencyKey, 
  insertMessage, 
  findById,
  findAll,
  updateStatus,
  updateXmlContent,
  getStatistics
} from '../database.js';

export async function getOrCreateMessage(idempotencyKey, messageType, requestData, generatorFn) {
  const existing = findByIdempotencyKey(idempotencyKey);

  if (existing) {
    try {
      return {
        ...existing,
        request_data: JSON.parse(existing.request_data),
        isNew: false
      };
    } catch (error) {
      throw new Error('Failed to parse stored request data');
    }
  }

  let xmlContent;
  try {
    xmlContent = generatorFn(requestData);
  } catch (error) {
    throw new Error(`Failed to generate message: ${error.message}`);
  }
  
  
  const msgIdMatch = xmlContent.match(/<MsgId>([^<]+)<\/MsgId>/);
  const endToEndIdMatch = xmlContent.match(/<EndToEndId>([^<]+)<\/EndToEndId>/);
  
  const msgId = msgIdMatch ? msgIdMatch[1] : null;
  const endToEndId = endToEndIdMatch ? endToEndIdMatch[1] : null;

  try {
    const insertedId = insertMessage({
      idempotencyKey,
      messageType,
      requestData: JSON.stringify(requestData),
      xmlContent,
      msgId,
      endToEndId,
      status: 'generated'
    });

    return {
      id: insertedId,
      idempotency_key: idempotencyKey,
      message_type: messageType,
      request_data: requestData,
      xml_content: xmlContent,
      msg_id: msgId,
      end_to_end_id: endToEndId,
      status: 'generated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isNew: true
    };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const existing = findByIdempotencyKey(idempotencyKey);
      
      if (existing) {
        try {
          return {
            ...existing,
            request_data: JSON.parse(existing.request_data),
            isNew: false
          };
        } catch (parseError) {
          throw new Error('Failed to parse stored request data');
        }
      }
    }
    throw error;
  }
}

export function getMessageById(id) {
  const message = findById(id);

  if (!message) {
    return null;
  }

  try {
    return {
      ...message,
      request_data: JSON.parse(message.request_data)
    };
  } catch (error) {
    throw new Error('Failed to parse stored request data');
  }
}

export function listMessages({ limit = 50, offset = 0, messageType = null } = {}) {
  if (messageType && !['PACS002', 'PACS004', 'PACS008'].includes(messageType)) {
    throw new Error('Invalid messageType');
  }

  const messages = findAll({ limit, offset, messageType });

  return messages.map(msg => {
    try {
      return {
        ...msg,
        request_data: JSON.parse(msg.request_data)
      };
    } catch (error) {
      return {
        ...msg,
        request_data: null
      };
    }
  });
}

export function updateMessageStatus(id, status) {
  if (!['generated', 'sent', 'failed'].includes(status)) {
    throw new Error('Invalid status');
  }
  
  return updateStatus(id, status);
}

export function updateMessageXml(id, xmlContent) {
  return updateXmlContent(id, xmlContent);
}

export function getStatisticsFormatted() {
  const { total, stats } = getStatistics();

  return {
    total,
    byType: stats.reduce((acc, stat) => {
      if (!acc[stat.message_type]) {
        acc[stat.message_type] = {};
      }
      acc[stat.message_type][stat.status] = stat.count;
      return acc;
    }, {})
  };
}

