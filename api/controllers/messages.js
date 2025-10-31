import { createPacs002, createACSPMessage, createACCCMessage, createACSCMessage, createRJCTMessage } from '../../src/pacs002/generator.js';
import { createPacs004 } from '../../src/pacs004/generator.js';
import { createPacs008 } from '../../src/pacs008/generator.js';
import { getOrCreateMessage, getMessageById, listMessages, getStatisticsFormatted } from '../services/messageService.js';
import { validatePaginationParams, validateMessageType, validateId } from '../utils/validation.js';

function formatMessageResponse(message) {
  return {
    id: message.id,
    idempotencyKey: message.idempotency_key,
    messageType: message.message_type,
    msgId: message.msg_id,
    endToEndId: message.end_to_end_id,
    status: message.status,
    createdAt: message.created_at,
    ...(message.updated_at && { updatedAt: message.updated_at }),
    ...(message.request_data && { requestData: message.request_data }),
    ...(message.xml_content && { xml: message.xml_content })
  };
}

export async function generatePacs002(req, res) {
  try {
    const {
      fromISPB,
      toISPB,
      transactionStatus,
      originalEndToEndId,
      originalInstructionId,
      statusReasonCode,
      additionalInfo,
      settlementDate,
      accountingDate
    } = req.body;

    const requestData = {
      fromISPB,
      toISPB,
      transactionStatus,
      orgnlEndToEndId: originalEndToEndId,
      orgnlInstrId: originalInstructionId || originalEndToEndId,
      statusReasonInfo: statusReasonCode ? {
        code: statusReasonCode,
        additionalInfo: additionalInfo || []
      } : undefined,
      settlementDate: settlementDate ? new Date(settlementDate) : undefined,
      accountingDate: accountingDate ? new Date(accountingDate) : undefined,
      creationDate: new Date()
    };

    const generatorFn = (data) => {
      const statusMap = {
        ACSP: createACSPMessage,
        ACCC: createACCCMessage,
        ACSC: createACSCMessage,
        RJCT: createRJCTMessage
      };
      
      const generator = statusMap[data.transactionStatus];
      return generator ? generator(data) : createPacs002(data);
    };

    const message = await getOrCreateMessage(
      req.idempotencyKey,
      'PACS002',
      requestData,
      generatorFn
    );

    res.status(message.isNew ? 201 : 200).json({
      success: true,
      message: formatMessageResponse(message),
      isNew: message.isNew
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

export async function generatePacs004(req, res) {
  try {
    const {
      fromISPB,
      toISPB,
      transactions
    } = req.body;

    const transformedTransactions = transactions.map(tx => ({
      orgnlEndToEndId: tx.originalEndToEndId,
      amount: tx.amount,
      settlementPriority: tx.settlementPriority || 'HIGH',
      returnReasonCode: tx.returnReasonCode,
      additionalInfo: tx.additionalInfo || [],
      debtorAgentISPB: tx.debtorAgentISPB,
      creditorAgentISPB: tx.creditorAgentISPB,
      remittanceInfo: tx.remittanceInfo
    }));

    const requestData = {
      fromISPB,
      toISPB,
      transactions: transformedTransactions,
      creationDate: new Date()
    };

    const message = await getOrCreateMessage(
      req.idempotencyKey,
      'PACS004',
      requestData,
      (data) => createPacs004(data)
    );

    res.status(message.isNew ? 201 : 200).json({
      success: true,
      message: formatMessageResponse(message),
      isNew: message.isNew
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

export async function generatePacs008(req, res) {
  try {
    const {
      fromISPB,
      toISPB,
      instructionPriority,
      serviceLevel,
      transactions
    } = req.body;

    const transformedTransactions = transactions.map(tx => ({
      amount: tx.amount,
      acceptanceDateTime: tx.acceptanceDateTime ? new Date(tx.acceptanceDateTime) : new Date(),
      initiationForm: tx.initiationForm || 'MANU',
      txId: tx.txId,
      initiatorCNPJ: tx.initiatorCNPJ,
      debtor: {
        name: tx.debtor.name,
        cpfCnpj: tx.debtor.cpfCnpj
      },
      debtorAccount: {
        accountNumber: tx.debtorAccount.accountNumber,
        agency: tx.debtorAccount.agency,
        type: tx.debtorAccount.type
      },
      debtorAgentISPB: tx.debtorAgentISPB,
      creditorAgentISPB: tx.creditorAgentISPB,
      creditor: {
        cpfCnpj: tx.creditor.cpfCnpj
      },
      creditorAccount: {
        accountNumber: tx.creditorAccount.accountNumber,
        agency: tx.creditorAccount.agency,
        type: tx.creditorAccount.type,
        pixKey: tx.creditorAccount.pixKey
      },
      purpose: tx.purpose || 'IPAY',
      remittanceInfo: tx.remittanceInfo,
      structuredRemittance: tx.structuredRemittance ? {
        agentModality: tx.structuredRemittance.agentModality,
        facilitatorISPB: tx.structuredRemittance.facilitatorISPB,
        amounts: tx.structuredRemittance.amounts.map(amt => ({
          amount: amt.amount,
          reason: amt.reason
        }))
      } : undefined
    }));

    const requestData = {
      fromISPB,
      toISPB,
      instructionPriority: instructionPriority || 'HIGH',
      serviceLevel: serviceLevel || 'PAGPRI',
      transactions: transformedTransactions,
      creationDate: new Date()
    };

    const message = await getOrCreateMessage(
      req.idempotencyKey,
      'PACS008',
      requestData,
      (data) => createPacs008(data)
    );

    res.status(message.isNew ? 201 : 200).json({
      success: true,
      message: formatMessageResponse(message),
      isNew: message.isNew
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

export async function getMessage(req, res) {
  try {
    const { id } = req.params;
    const validatedId = validateId(id);
    const message = getMessageById(validatedId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: formatMessageResponse(message)
    });
  } catch (error) {
    const statusCode = error.message.includes('Invalid ID') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
}

export async function listMessagesController(req, res) {
  try {
    const {
      limit = 50,
      offset = 0,
      messageType
    } = req.query;

    const { limit: validatedLimit, offset: validatedOffset } = validatePaginationParams(limit, offset);
    const validatedMessageType = messageType ? validateMessageType(messageType) : null;

    const messages = listMessages({
      limit: validatedLimit,
      offset: validatedOffset,
      messageType: validatedMessageType
    });

    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg.id,
        idempotencyKey: msg.idempotency_key,
        messageType: msg.message_type,
        msgId: msg.msg_id,
        endToEndId: msg.end_to_end_id,
        status: msg.status,
        createdAt: msg.created_at
      })),
      pagination: {
        limit: validatedLimit,
        offset: validatedOffset
      }
    });
  } catch (error) {
    const statusCode = error.message.includes('Invalid') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
}

export async function getStats(req, res) {
  try {
    const stats = getStatisticsFormatted();
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
