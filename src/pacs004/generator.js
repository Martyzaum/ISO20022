import { create } from 'xmlbuilder2';
import {
  NAMESPACE,
  MSG_DEF_IDR,
  isValidReturnReasonCode
} from './types.js';
import {
  validateISPB,
  validateEndToEndId,
  validateRtrId,
  generateMsgId,
  generateRtrId,
  formatUTCDateTime
} from './utils.js';

function validateFromISPB(fromISPB) {
  if (!fromISPB || !validateISPB(fromISPB)) {
    throw new Error(`Invalid fromISPB: ${fromISPB}. Must be 8 alphanumeric characters [0-9A-Z]`);
  }
}

function validateToISPB(toISPB) {
  if (!toISPB || !validateISPB(toISPB)) {
    throw new Error(`Invalid toISPB: ${toISPB}. Must be 8 alphanumeric characters [0-9A-Z]`);
  }
}

function validateTransactionsArray(transactions) {
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    throw new Error('transactions array is required and must contain at least one transaction');
  }
}

function validateTransactionBasic(tx, index) {
  if (!tx.orgnlEndToEndId || !validateEndToEndId(tx.orgnlEndToEndId)) {
    throw new Error(`Invalid orgnlEndToEndId at index ${index}: ${tx.orgnlEndToEndId}. Must follow pattern Exxxxxxxxyyyymmddhhmmkkkkkkkkkkk`);
  }
  
  if (tx.rtrId && !validateRtrId(tx.rtrId)) {
    throw new Error(`Invalid rtrId at index ${index}: ${tx.rtrId}. Must follow pattern DxxxxxxxxyyyyMMddHHmmkkkkkkkkkkk`);
  }
  
  if (!tx.amount || typeof tx.amount !== 'number' || tx.amount <= 0) {
    throw new Error(`Invalid amount at index ${index}: ${tx.amount}. Must be a positive number`);
  }
  
  if (!tx.settlementPriority || (tx.settlementPriority !== 'HIGH' && tx.settlementPriority !== 'NORM')) {
    throw new Error(`Invalid settlementPriority at index ${index}: ${tx.settlementPriority}. Must be HIGH or NORM`);
  }
  
  if (!tx.returnReasonCode || !isValidReturnReasonCode(tx.returnReasonCode)) {
    throw new Error(`Invalid returnReasonCode at index ${index}: ${tx.returnReasonCode}. Must be one of: BE08, FR01, MD06, SL02`);
  }
}

function validateTransactionAgents(tx, index) {
  if (!tx.debtorAgentISPB || !validateISPB(tx.debtorAgentISPB)) {
    throw new Error(`Invalid debtorAgentISPB at index ${index}: ${tx.debtorAgentISPB}. Must be 8 alphanumeric characters [0-9A-Z]`);
  }
  
  if (!tx.creditorAgentISPB || !validateISPB(tx.creditorAgentISPB)) {
    throw new Error(`Invalid creditorAgentISPB at index ${index}: ${tx.creditorAgentISPB}. Must be 8 alphanumeric characters [0-9A-Z]`);
  }
}

function validateTransactionInfo(tx, index) {
  if (tx.additionalInfo && Array.isArray(tx.additionalInfo)) {
    for (const info of tx.additionalInfo) {
      if (info && info.length > 105) {
        throw new Error(`Additional info at index ${index} exceeds 105 characters: ${info}`);
      }
    }
  }
  
  if (tx.remittanceInfo && tx.remittanceInfo.length > 140) {
    throw new Error(`Remittance info at index ${index} exceeds 140 characters: ${tx.remittanceInfo}`);
  }
}

function validateTransaction(tx, index) {
  validateTransactionBasic(tx, index);
  validateTransactionAgents(tx, index);
  validateTransactionInfo(tx, index);
}

function validateAllTransactions(transactions) {
  for (let i = 0; i < transactions.length; i++) {
    validateTransaction(transactions[i], i);
  }
}

export function createPacs004(params) {
  validateFromISPB(params.fromISPB);
  validateToISPB(params.toISPB);
  validateTransactionsArray(params.transactions);
  validateAllTransactions(params.transactions);
  
  // Generate MsgId
  const msgId = generateMsgId(params.fromISPB);
  
  // Get creation date
  const creationDate = params.creationDate || new Date();
  const creationDateTime = formatUTCDateTime(creationDate);
  
  // Build XML structure
  const doc = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
    .ele(NAMESPACE, 'Envelope');
  
  // AppHdr (Business Application Header)
  const appHdr = doc.ele('AppHdr');
  
  // From
  appHdr.ele('Fr')
    .ele('FIId')
    .ele('FinInstnId')
    .ele('Othr')
    .ele('Id').txt(params.fromISPB);
  
  // To
  appHdr.ele('To')
    .ele('FIId')
    .ele('FinInstnId')
    .ele('Othr')
    .ele('Id').txt(params.toISPB);
  
  // BizMsgIdr
  appHdr.ele('BizMsgIdr').txt(msgId);
  
  // MsgDefIdr
  appHdr.ele('MsgDefIdr').txt(MSG_DEF_IDR);
  
  // CreDt
  appHdr.ele('CreDt').txt(creationDateTime);
  
  appHdr.ele('Sgntr');
  
  // Document
  const document = doc.ele('Document');
  const pmtRtr = document.ele('PmtRtr');
  
  // GrpHdr (Group Header)
  const grpHdr = pmtRtr.ele('GrpHdr');
  grpHdr.ele('MsgId').txt(msgId);
  grpHdr.ele('CreDtTm').txt(creationDateTime);
  grpHdr.ele('NbOfTxs').txt(params.transactions.length.toString());
  
  // SttlmInf
  const sttlmInf = grpHdr.ele('SttlmInf');
  sttlmInf.ele('SttlmMtd').txt('CLRG');
  
  // TxInf (Transaction Information) - one for each transaction
  for (const tx of params.transactions) {
    const txInf = pmtRtr.ele('TxInf');
    
    // RtrId (generate if not provided)
    const rtrId = tx.rtrId || generateRtrId(params.fromISPB, creationDate);
    txInf.ele('RtrId').txt(rtrId);
    
    // OrgnlEndToEndId
    txInf.ele('OrgnlEndToEndId').txt(tx.orgnlEndToEndId);
    
    // RtrdIntrBkSttlmAmt
    txInf.ele('RtrdIntrBkSttlmAmt', { Ccy: 'BRL' }).txt(tx.amount.toFixed(2));
    
    // SttlmPrty
    txInf.ele('SttlmPrty').txt(tx.settlementPriority);
    
    // ChrgBr
    txInf.ele('ChrgBr').txt('SLEV');
    
    // RtrRsnInf
    const rtrRsnInf = txInf.ele('RtrRsnInf');
    const rsn = rtrRsnInf.ele('Rsn');
    rsn.ele('Cd').txt(tx.returnReasonCode);
    
    // AdditionalInfo
    if (tx.additionalInfo && Array.isArray(tx.additionalInfo)) {
      for (const info of tx.additionalInfo) {
        if (info && info.length <= 105) {
          rtrRsnInf.ele('AddtlInf').txt(info);
        }
      }
    }
    
    // OrgnlTxRef
    const orgnlTxRef = txInf.ele('OrgnlTxRef');
    
    // RemittanceInformation (optional)
    if (tx.remittanceInfo) {
      const rmtInf = orgnlTxRef.ele('RmtInf');
      rmtInf.ele('Ustrd').txt(tx.remittanceInfo);
    }
    
    // DbtrAgt
    const dbtrAgt = orgnlTxRef.ele('DbtrAgt');
    dbtrAgt.ele('FinInstnId')
      .ele('ClrSysMmbId')
      .ele('MmbId').txt(tx.debtorAgentISPB);
    
    // CdtrAgt
    const cdtrAgt = orgnlTxRef.ele('CdtrAgt');
    cdtrAgt.ele('FinInstnId')
      .ele('ClrSysMmbId')
      .ele('MmbId').txt(tx.creditorAgentISPB);
  }
  
  // Generate XML string
  const xml = doc.end({ prettyPrint: true, indent: '    ' });
  
  return xml;
}

export function createSingleReturnMessage(params) {
  return createPacs004({
    ...params,
    transactions: [params.transaction]
  });
}
