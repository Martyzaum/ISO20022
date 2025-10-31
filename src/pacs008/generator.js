import { create } from 'xmlbuilder2';
import {
  NAMESPACE,
  MSG_DEF_IDR,
  isValidPaymentInitiationForm,
  isValidPaymentPurpose,
  isValidAccountType,
  isValidInstructionPriority,
  isValidServiceLevel
} from './types.js';
import {
  validateISPB,
  validateCPFOrCNPJ,
  validateAccountNumber,
  validateAgency,
  validatePixKey,
  validateTxId,
  generateMsgId,
  generateEndToEndId,
  formatUTCDateTime,
  formatCPFOrCNPJ,
  formatAccountNumber
} from './utils.js';

function validateBasicParams(params) {
  if (!params.fromISPB || !validateISPB(params.fromISPB)) {
    throw new Error(`Invalid fromISPB: ${params.fromISPB}. Must be 8 alphanumeric characters [0-9A-Z]`);
  }
  
  if (!params.toISPB || !validateISPB(params.toISPB)) {
    throw new Error(`Invalid toISPB: ${params.toISPB}. Must be 8 alphanumeric characters [0-9A-Z]`);
  }
  
  if (!params.instructionPriority || !isValidInstructionPriority(params.instructionPriority)) {
    throw new Error(`Invalid instructionPriority: ${params.instructionPriority}. Must be HIGH or NORM`);
  }
  
  if (!params.serviceLevel || !isValidServiceLevel(params.serviceLevel)) {
    throw new Error(`Invalid serviceLevel: ${params.serviceLevel}. Must be PAGPRI, PAGFRD, or PAGAGD`);
  }
}

function validatePriorityServiceLevelConsistency(instructionPriority, serviceLevel) {
  if (instructionPriority === 'HIGH' && serviceLevel !== 'PAGPRI') {
    throw new Error('When instructionPriority is HIGH, serviceLevel must be PAGPRI');
  }
  
  if (instructionPriority === 'NORM' && serviceLevel !== 'PAGFRD' && serviceLevel !== 'PAGAGD') {
    throw new Error('When instructionPriority is NORM, serviceLevel must be PAGFRD or PAGAGD');
  }
}

function validateTransactionsArray(transactions, serviceLevel) {
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    throw new Error('transactions array is required and must contain at least one transaction');
  }
  
  const maxTransactions = serviceLevel === 'PAGAGD' ? 500 : 10;
  if (transactions.length > maxTransactions) {
    throw new Error(`Maximum ${maxTransactions} transactions allowed for service level ${serviceLevel}`);
  }
}

function validateTransactionBasic(tx, index) {
  if (!tx.initiationForm || !isValidPaymentInitiationForm(tx.initiationForm)) {
    throw new Error(`Invalid initiationForm at index ${index}: ${tx.initiationForm}`);
  }
  
  if (['QRES', 'QRDN', 'INIC', 'AUTO'].includes(tx.initiationForm)) {
    if (!tx.txId) {
      throw new Error(`txId is required for initiationForm ${tx.initiationForm} at index ${index}`);
    }
    if (!validateTxId(tx.txId, tx.initiationForm)) {
      throw new Error(`Invalid txId format at index ${index}: ${tx.txId}`);
    }
  }
  
  if (!tx.purpose || !isValidPaymentPurpose(tx.purpose)) {
    throw new Error(`Invalid purpose at index ${index}: ${tx.purpose}`);
  }
  
  if (!tx.amount || typeof tx.amount !== 'number' || tx.amount <= 0) {
    throw new Error(`Invalid amount at index ${index}: ${tx.amount}`);
  }
  
  if (!tx.acceptanceDateTime || !(tx.acceptanceDateTime instanceof Date)) {
    throw new Error(`Invalid acceptanceDateTime at index ${index}`);
  }
}

function validateTransactionDebtor(tx, index) {
  if (!tx.debtor?.name || tx.debtor.name.length > 140) {
    throw new Error(`Invalid debtor.name at index ${index}`);
  }
  if (!tx.debtor.cpfCnpj || !validateCPFOrCNPJ(tx.debtor.cpfCnpj)) {
    throw new Error(`Invalid debtor.cpfCnpj at index ${index}`);
  }
  
  if (!tx.debtorAccount || !validateAccountNumber(tx.debtorAccount.accountNumber)) {
    throw new Error(`Invalid debtorAccount.accountNumber at index ${index}`);
  }
  if (!tx.debtorAccount.type || !isValidAccountType(tx.debtorAccount.type)) {
    throw new Error(`Invalid debtorAccount.type at index ${index}`);
  }
  if (tx.debtorAccount.agency && !validateAgency(tx.debtorAccount.agency)) {
    throw new Error(`Invalid debtorAccount.agency at index ${index}`);
  }
  
  if (!tx.debtorAgentISPB || !validateISPB(tx.debtorAgentISPB)) {
    throw new Error(`Invalid debtorAgentISPB at index ${index}`);
  }
}

function validateTransactionCreditor(tx, index) {
  if (!tx.creditor?.cpfCnpj || !validateCPFOrCNPJ(tx.creditor.cpfCnpj)) {
    throw new Error(`Invalid creditor.cpfCnpj at index ${index}`);
  }
  
  if (!tx.creditorAccount || !validateAccountNumber(tx.creditorAccount.accountNumber)) {
    throw new Error(`Invalid creditorAccount.accountNumber at index ${index}`);
  }
  if (!tx.creditorAccount.type || !isValidAccountType(tx.creditorAccount.type)) {
    throw new Error(`Invalid creditorAccount.type at index ${index}`);
  }
  if (tx.creditorAccount.agency && !validateAgency(tx.creditorAccount.agency)) {
    throw new Error(`Invalid creditorAccount.agency at index ${index}`);
  }
  
  if (!tx.creditorAgentISPB || !validateISPB(tx.creditorAgentISPB)) {
    throw new Error(`Invalid creditorAgentISPB at index ${index}`);
  }
}

function validateTransactionPixKey(tx, index) {
  const requiresPixKey = ['QRDN', 'QRES', 'APDN', 'INIC'].includes(tx.initiationForm);
  const shouldNotHavePixKey = ['MANU', 'AUTO'].includes(tx.initiationForm);
  
  if (requiresPixKey && (!tx.creditorAccount.pixKey || !validatePixKey(tx.creditorAccount.pixKey))) {
    throw new Error(`Pix key is required for initiationForm ${tx.initiationForm} at index ${index}`);
  }
  
  if (shouldNotHavePixKey && tx.creditorAccount.pixKey) {
    throw new Error(`Pix key should not be provided for initiationForm ${tx.initiationForm} at index ${index}`);
  }
}

function validateAmountCount(tx, index) {
  if (tx.purpose === 'GSCB' && tx.structuredRemittance.amounts.length !== 2) {
    throw new Error(`GSCB requires exactly 2 amounts (VLCP and VLDN) at index ${index}`);
  }
  
  if (tx.purpose === 'OTHR' && tx.structuredRemittance.amounts.length !== 1) {
    throw new Error(`OTHR requires exactly 1 amount (VLDN) at index ${index}`);
  }
}

function validateAmountItem(amt, index) {
  if (!amt.amount || typeof amt.amount !== 'number' || amt.amount <= 0) {
    throw new Error(`Invalid amount in structuredRemittance.amounts at index ${index}`);
  }
  if (!amt.reason || (amt.reason !== 'VLCP' && amt.reason !== 'VLDN')) {
    throw new Error(`Invalid reason in structuredRemittance.amounts at index ${index}: ${amt.reason}`);
  }
}

function validateStructuredRemittanceAmounts(tx, index) {
  if (!tx.structuredRemittance.amounts || !Array.isArray(tx.structuredRemittance.amounts)) {
    throw new Error(`structuredRemittance.amounts array is required at index ${index}`);
  }
  
  validateAmountCount(tx, index);
  
  for (const amt of tx.structuredRemittance.amounts) {
    validateAmountItem(amt, index);
  }
}

function validateTransactionStructuredRemittance(tx, index) {
  if (tx.purpose !== 'GSCB' && tx.purpose !== 'OTHR') {
    return;
  }
  
  if (!tx.structuredRemittance) {
    throw new Error(`structuredRemittance is required for purpose ${tx.purpose} at index ${index}`);
  }
  
  if (!tx.structuredRemittance.agentModality) {
    throw new Error(`structuredRemittance.agentModality is required at index ${index}`);
  }
  
  if (!tx.structuredRemittance.facilitatorISPB || !validateISPB(tx.structuredRemittance.facilitatorISPB)) {
    throw new Error(`Invalid structuredRemittance.facilitatorISPB at index ${index}`);
  }
  
  validateStructuredRemittanceAmounts(tx, index);
}

function validateTransaction(tx, index) {
  validateTransactionBasic(tx, index);
  validateTransactionDebtor(tx, index);
  validateTransactionCreditor(tx, index);
  validateTransactionPixKey(tx, index);
  validateTransactionStructuredRemittance(tx, index);
  
  if (tx.remittanceInfo && tx.remittanceInfo.length > 140) {
    throw new Error(`remittanceInfo exceeds 140 characters at index ${index}`);
  }
}

function validateAllTransactions(transactions) {
  for (let i = 0; i < transactions.length; i++) {
    validateTransaction(transactions[i], i);
  }
}

function buildAppHdr(doc, params, msgId, creationDateTime) {
  const appHdr = doc.ele('AppHdr');
  appHdr.ele('Fr').ele('FIId').ele('FinInstnId').ele('Othr').ele('Id').txt(params.fromISPB);
  appHdr.ele('To').ele('FIId').ele('FinInstnId').ele('Othr').ele('Id').txt(params.toISPB);
  appHdr.ele('BizMsgIdr').txt(msgId);
  appHdr.ele('MsgDefIdr').txt(MSG_DEF_IDR);
  appHdr.ele('CreDt').txt(creationDateTime);
  appHdr.ele('Sgntr');
  return appHdr;
}

function buildGroupHeader(fiToFICstmrCdtTrf, params, msgId, creationDateTime) {
  const grpHdr = fiToFICstmrCdtTrf.ele('GrpHdr');
  grpHdr.ele('MsgId').txt(msgId);
  grpHdr.ele('CreDtTm').txt(creationDateTime);
  grpHdr.ele('NbOfTxs').txt(params.transactions.length.toString());
  
  const sttlmInf = grpHdr.ele('SttlmInf');
  sttlmInf.ele('SttlmMtd').txt('CLRG');
  
  const pmtTpInf = grpHdr.ele('PmtTpInf');
  pmtTpInf.ele('InstrPrty').txt(params.instructionPriority);
  const svcLvl = pmtTpInf.ele('SvcLvl');
  svcLvl.ele('Prtry').txt(params.serviceLevel);
}

function buildTransactionRemittance(cdtTrfTxInf, tx) {
  if (!tx.remittanceInfo && !tx.structuredRemittance) {
    return;
  }
  
  const rmtInf = cdtTrfTxInf.ele('RmtInf');
  
  if (tx.remittanceInfo) {
    rmtInf.ele('Ustrd').txt(tx.remittanceInfo);
  }
  
  if (tx.structuredRemittance) {
    const strd = rmtInf.ele('Strd');
    const rfrdDocInf = strd.ele('RfrdDocInf');
    const rfrdDocInfTp = rfrdDocInf.ele('Tp');
    const cdOrPrtry = rfrdDocInfTp.ele('CdOrPrtry');
    cdOrPrtry.ele('Prtry').txt(tx.structuredRemittance.agentModality);
    rfrdDocInfTp.ele('Issr').txt(tx.structuredRemittance.facilitatorISPB);
    
    const rfrdDocAmt = strd.ele('RfrdDocAmt');
    for (const amt of tx.structuredRemittance.amounts) {
      const adjstmntAmtAndRsn = rfrdDocAmt.ele('AdjstmntAmtAndRsn');
      adjstmntAmtAndRsn.ele('Amt', { Ccy: 'BRL' }).txt(amt.amount.toFixed(2));
      adjstmntAmtAndRsn.ele('Rsn').txt(amt.reason);
    }
  }
}

function buildTransaction(fiToFICstmrCdtTrf, tx, params, creationDate) {
  const cdtTrfTxInf = fiToFICstmrCdtTrf.ele('CdtTrfTxInf');
  
  const pmtId = cdtTrfTxInf.ele('PmtId');
  const endToEndId = tx.endToEndId || generateEndToEndId(params.fromISPB, creationDate);
  pmtId.ele('EndToEndId').txt(endToEndId);
  
  if (tx.txId) {
    pmtId.ele('TxId').txt(tx.txId);
  }
  
  cdtTrfTxInf.ele('IntrBkSttlmAmt', { Ccy: 'BRL' }).txt(tx.amount.toFixed(2));
  cdtTrfTxInf.ele('AccptncDtTm').txt(formatUTCDateTime(tx.acceptanceDateTime));
  cdtTrfTxInf.ele('ChrgBr').txt('SLEV');
  
  const mndtRltdInf = cdtTrfTxInf.ele('MndtRltdInf');
  const tp = mndtRltdInf.ele('Tp');
  const lclInstrm = tp.ele('LclInstrm');
  lclInstrm.ele('Prtry').txt(tx.initiationForm);
  
  if (tx.initiatorCNPJ) {
    const initgPty = cdtTrfTxInf.ele('InitgPty');
    const id = initgPty.ele('Id');
    const orgId = id.ele('OrgId');
    const othr = orgId.ele('Othr');
    othr.ele('Id').txt(formatCPFOrCNPJ(tx.initiatorCNPJ));
  }
  
  const dbtr = cdtTrfTxInf.ele('Dbtr');
  dbtr.ele('Nm').txt(tx.debtor.name);
  const dbtrId = dbtr.ele('Id');
  const dbtrPrvtId = dbtrId.ele('PrvtId');
  const dbtrOthr = dbtrPrvtId.ele('Othr');
  dbtrOthr.ele('Id').txt(formatCPFOrCNPJ(tx.debtor.cpfCnpj));
  
  const dbtrAcct = cdtTrfTxInf.ele('DbtrAcct');
  const dbtrAcctId = dbtrAcct.ele('Id');
  const dbtrAcctOthr = dbtrAcctId.ele('Othr');
  dbtrAcctOthr.ele('Id').txt(formatAccountNumber(tx.debtorAccount.accountNumber));
  if (tx.debtorAccount.agency) {
    dbtrAcctOthr.ele('Issr').txt(tx.debtorAccount.agency);
  }
  const dbtrAcctTp = dbtrAcct.ele('Tp');
  dbtrAcctTp.ele('Cd').txt(tx.debtorAccount.type);
  
  const dbtrAgt = cdtTrfTxInf.ele('DbtrAgt');
  dbtrAgt.ele('FinInstnId').ele('ClrSysMmbId').ele('MmbId').txt(tx.debtorAgentISPB);
  
  const cdtrAgt = cdtTrfTxInf.ele('CdtrAgt');
  cdtrAgt.ele('FinInstnId').ele('ClrSysMmbId').ele('MmbId').txt(tx.creditorAgentISPB);
  
  const cdtr = cdtTrfTxInf.ele('Cdtr');
  const cdtrId = cdtr.ele('Id');
  const cdtrPrvtId = cdtrId.ele('PrvtId');
  const cdtrOthr = cdtrPrvtId.ele('Othr');
  cdtrOthr.ele('Id').txt(formatCPFOrCNPJ(tx.creditor.cpfCnpj));
  
  const cdtrAcct = cdtTrfTxInf.ele('CdtrAcct');
  const cdtrAcctId = cdtrAcct.ele('Id');
  const cdtrAcctOthr = cdtrAcctId.ele('Othr');
  cdtrAcctOthr.ele('Id').txt(formatAccountNumber(tx.creditorAccount.accountNumber));
  if (tx.creditorAccount.agency) {
    cdtrAcctOthr.ele('Issr').txt(tx.creditorAccount.agency);
  }
  const cdtrAcctTp = cdtrAcct.ele('Tp');
  cdtrAcctTp.ele('Cd').txt(tx.creditorAccount.type);
  
  if (tx.creditorAccount.pixKey) {
    const prxy = cdtrAcct.ele('Prxy');
    prxy.ele('Id').txt(tx.creditorAccount.pixKey);
  }
  
  const purp = cdtTrfTxInf.ele('Purp');
  purp.ele('Cd').txt(tx.purpose);
  
  buildTransactionRemittance(cdtTrfTxInf, tx);
}

export function createPacs008(params) {
  validateBasicParams(params);
  validatePriorityServiceLevelConsistency(params.instructionPriority, params.serviceLevel);
  validateTransactionsArray(params.transactions, params.serviceLevel);
  validateAllTransactions(params.transactions);
  
  const msgId = generateMsgId(params.fromISPB);
  const creationDate = params.creationDate || new Date();
  const creationDateTime = formatUTCDateTime(creationDate);
  
  const doc = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
    .ele(NAMESPACE, 'Envelope');
  
  buildAppHdr(doc, params, msgId, creationDateTime);
  
  const document = doc.ele('Document');
  const fiToFICstmrCdtTrf = document.ele('FIToFICstmrCdtTrf');
  
  buildGroupHeader(fiToFICstmrCdtTrf, params, msgId, creationDateTime);
  
  for (const tx of params.transactions) {
    buildTransaction(fiToFICstmrCdtTrf, tx, params, creationDate);
  }
  
  return doc.end({ prettyPrint: true, indent: '    ' });
}

export function createSingleTransactionMessage(params) {
  return createPacs008({
    ...params,
    transactions: [params.transaction]
  });
}
