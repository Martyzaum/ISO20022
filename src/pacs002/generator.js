import { create } from 'xmlbuilder2';
import {
  NAMESPACE,
  MSG_DEF_IDR,
  isValidTransactionStatus,
  isValidStatusReasonCode
} from './types.js';
import {
  validateISPB,
  validateOrgnlInstrId,
  validateEndToEndId,
  generateMsgId,
  formatUTCDateTime,
  formatISODate
} from './utils.js';

export function createPacs002(params) {
  // Validate required parameters
  if (!params.fromISPB || !validateISPB(params.fromISPB)) {
    throw new Error(`Invalid fromISPB: ${params.fromISPB}. Must be 8 alphanumeric characters [0-9A-Z]`);
  }
  
  if (!params.toISPB || !validateISPB(params.toISPB)) {
    throw new Error(`Invalid toISPB: ${params.toISPB}. Must be 8 alphanumeric characters [0-9A-Z]`);
  }
  
  if (!params.transactionStatus || !isValidTransactionStatus(params.transactionStatus)) {
    throw new Error(`Invalid transactionStatus: ${params.transactionStatus}. Must be one of: ACSP, ACCC, ACSC, RJCT`);
  }
  
  if (!params.orgnlInstrId || !validateOrgnlInstrId(params.orgnlInstrId)) {
    throw new Error(`Invalid orgnlInstrId: ${params.orgnlInstrId}. Must follow pattern [E|D]xxxxxxxxyyyymmddhhmmkkkkkkkkkkk`);
  }
  
  if (!params.orgnlEndToEndId || !validateEndToEndId(params.orgnlEndToEndId)) {
    throw new Error(`Invalid orgnlEndToEndId: ${params.orgnlEndToEndId}. Must follow pattern Exxxxxxxxyyyymmddhhmmkkkkkkkkkkk`);
  }
  
  // Validate status reason info for RJCT status
  if (params.transactionStatus === 'RJCT') {
    if (!params.statusReasonInfo || !params.statusReasonInfo.code) {
      throw new Error('statusReasonInfo.code is required for RJCT status');
    }
    if (!isValidStatusReasonCode(params.statusReasonInfo.code)) {
      throw new Error(`Invalid status reason code: ${params.statusReasonInfo.code}`);
    }
  }
  
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
  const fiToFIPmtStsRpt = document.ele('FIToFIPmtStsRpt');
  
  // GrpHdr (Group Header)
  const grpHdr = fiToFIPmtStsRpt.ele('GrpHdr');
  grpHdr.ele('MsgId').txt(msgId);
  grpHdr.ele('CreDtTm').txt(creationDateTime);
  
  // TxInfAndSts (Transaction Information and Status)
  const txInfAndSts = fiToFIPmtStsRpt.ele('TxInfAndSts');
  txInfAndSts.ele('OrgnlInstrId').txt(params.orgnlInstrId);
  txInfAndSts.ele('OrgnlEndToEndId').txt(params.orgnlEndToEndId);
  txInfAndSts.ele('TxSts').txt(params.transactionStatus);
  
  // StsRsnInf (Status Reason Information) - for RJCT or optional
  if (params.statusReasonInfo) {
    const stsRsnInf = txInfAndSts.ele('StsRsnInf');
    
    if (params.statusReasonInfo.code) {
      stsRsnInf.ele('Rsn').ele('Cd').txt(params.statusReasonInfo.code);
    }
    
    if (params.statusReasonInfo.additionalInfo && Array.isArray(params.statusReasonInfo.additionalInfo)) {
      for (const info of params.statusReasonInfo.additionalInfo) {
        if (info && info.length <= 105) {
          stsRsnInf.ele('AddtlInf').txt(info);
        }
      }
    }
  }
  
  // FctvIntrBkSttlmDt (Effective Interbank Settlement Date) - for ACCC/ACSC
  if (params.settlementDate && (params.transactionStatus === 'ACCC' || params.transactionStatus === 'ACSC')) {
    const fctvIntrBkSttlmDt = txInfAndSts.ele('FctvIntrBkSttlmDt');
    fctvIntrBkSttlmDt.ele('DtTm').txt(formatUTCDateTime(params.settlementDate));
  }
  
  // OrgnlTxRef (Original Transaction Reference) - for ACCC/ACSC
  if (params.accountingDate && (params.transactionStatus === 'ACCC' || params.transactionStatus === 'ACSC')) {
    const orgnlTxRef = txInfAndSts.ele('OrgnlTxRef');
    orgnlTxRef.ele('IntrBkSttlmDt').txt(formatISODate(params.accountingDate));
  }
  
  // Generate XML string
  const xml = doc.end({ prettyPrint: true, indent: '    ' });
  
  return xml;
}

export function createACSPMessage(params) {
  return createPacs002({
    ...params,
    transactionStatus: 'ACSP'
  });
}

export function createACCCMessage(params) {
  return createPacs002({
    ...params,
    transactionStatus: 'ACCC'
  });
}

export function createACSCMessage(params) {
  return createPacs002({
    ...params,
    transactionStatus: 'ACSC'
  });
}

export function createRJCTMessage(params) {
  if (!params.statusReasonInfo || !params.statusReasonInfo.code) {
    throw new Error('statusReasonInfo.code is required for RJCT messages');
  }
  
  return createPacs002({
    ...params,
    transactionStatus: 'RJCT'
  });
}
