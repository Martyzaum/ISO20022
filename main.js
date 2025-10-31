/**
 * ISO20022 Message Generator - Main Script
 * Generates examples for PACS002, PACS004, and PACS008 messages
 * 
 * Usage:
 *   node main.js              # Generate and validate with business rules only
 *   node main.js --xsd        # Generate and validate with XSD validation enabled
 *   node main.js --sign       # Generate and sign XML messages (requires cert/private-key.pem and cert/certificate.pem)
 *   node main.js --xsd --sign # Generate with XSD validation and signing enabled
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createACSPMessage,
  createACCCMessage,
  createACSCMessage,
  createRJCTMessage
} from './src/pacs002/generator.js';
import { validatePacs002 } from './src/pacs002/validator.js';
import { generateEndToEndId } from './src/pacs002/utils.js';
import { createPacs004 } from './src/pacs004/generator.js';
import { validatePacs004 } from './src/pacs004/validator.js';
import { createPacs008 } from './src/pacs008/generator.js';
import { validatePacs008 } from './src/pacs008/validator.js';
import { signXml } from './src/validation/xmlSigner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Example ISPBs
const PSP_PAGADOR = '99999010'; // PSP do usuário pagador
const PSP_RECEBEDOR = '00038166'; // PSP do usuário recebedor
const SPI_ISPB = '00038166'; // SPI system ISPB

const OUTPUT_DIR = join(__dirname, 'out');

// Parse command line arguments
const args = process.argv.slice(2);
const useXsdValidation = args.includes('--xsd');
const useSigning = args.includes('--sign');

if (useXsdValidation) {
  console.log('📋 XSD validation enabled');
}

if (useSigning) {
  console.log('✍️  XML signing enabled');
}

// Load signing credentials if --sign is enabled
let signingCredentials = null;
if (useSigning) {
  try {
    // Try to load from environment variables or files
    const privateKeyPath = process.env.PRIVATE_KEY_PATH || join(__dirname, 'cert', 'private-key.pem');
    const certificatePath = process.env.CERTIFICATE_PATH || join(__dirname, 'cert', 'certificate.pem');
    
    if (existsSync(privateKeyPath) && existsSync(certificatePath)) {
      signingCredentials = {
        privateKeyPEM: readFileSync(privateKeyPath, 'utf-8'),
        certificatePEM: readFileSync(certificatePath, 'utf-8')
      };
      console.log(`✓ Loaded signing credentials from:`);
      console.log(`  - Private key: ${privateKeyPath}`);
      console.log(`  - Certificate: ${certificatePath}`);
    } else {
      console.warn(`⚠️  Signing enabled but credentials not found:`);
      console.warn(`  Expected:`);
      console.warn(`    - Private key: ${privateKeyPath}`);
      console.warn(`    - Certificate: ${certificatePath}`);
      console.warn(`  Or set environment variables:`);
      console.warn(`    - PRIVATE_KEY_PATH`);
      console.warn(`    - CERTIFICATE_PATH`);
      console.warn(`  Disabling signing...`);
      signingCredentials = null;
    }
  } catch (error) {
    console.error(`✗ Error loading signing credentials: ${error.message}`);
    console.error(`  Disabling signing...`);
    signingCredentials = null;
  }
}

/**
 * Signs XML if signing is enabled
 */
function signMessageIfEnabled(xml) {
  if (!useSigning || !signingCredentials) {
    return xml;
  }
  
  try {
    const signedXml = signXml(xml, signingCredentials);
    return signedXml;
  } catch (error) {
    console.error(`✗ Error signing XML: ${error.message}`);
    console.error(`  Returning unsigned XML...`);
    return xml;
  }
}

/**
 * Saves XML message to file
 */
function saveMessage(filename, xml) {
  // Sign if enabled
  const finalXml = signMessageIfEnabled(xml);
  
  const filePath = join(OUTPUT_DIR, filename);
  writeFileSync(filePath, finalXml, 'utf-8');
  console.log(`✓ Generated: ${filename}${useSigning && signingCredentials ? ' (signed)' : ''}`);
  return filePath;
}

/**
 * Validates and displays results
 */
async function validateAndDisplay(filename, xml, validator) {
  console.log(`\nValidating ${filename}...`);
  
  // Sign XML first if signing is enabled (validation needs signed XML)
  const xmlToValidate = signMessageIfEnabled(xml);
  
  // Prepare validation options
  const validationOptions = useXsdValidation ? {
    xsd: true,
    signature: useSigning && signingCredentials, // Enable signature validation if signing is enabled
    businessRules: true,
    preprocess: true
  } : {
    xsd: false,
    signature: useSigning && signingCredentials, // Enable signature validation if signing is enabled
    businessRules: true,
    preprocess: false
  };
  
  const validation = await validator(xmlToValidate, validationOptions);
  
  if (validation.valid) {
    console.log(`✓ Validation passed!`);
    if (useXsdValidation && validation.xsd) {
      console.log(`  - XSD: ✓ Valid`);
      if (validation.detected) {
        console.log(`  - Detected: ${validation.detected.message} v${validation.detected.spiVersion}`);
        if (validation.detected.xsdFile) {
          console.log(`  - XSD File: ${validation.detected.xsdFile}`);
        }
      }
    }
    if (useSigning && signingCredentials && validation.signature) {
      if (validation.signature.ok) {
        console.log(`  - Signature: ✓ Valid`);
      } else {
        console.log(`  - Signature: ✗ Invalid`);
        for (const sigErr of validation.signature.errors) {
          console.log(`    - ${sigErr.message || sigErr}`);
        }
      }
    }
  } else {
    console.log(`✗ Validation failed:`);
    for (const err of validation.errors) {
      console.log(`  - ${err}`);
    }
    
    // Show detailed XSD errors if available
    if (useXsdValidation && validation.xsd && !validation.xsd.ok) {
      console.log(`\n  XSD Errors:`);
      for (const xsdErr of validation.xsd.errors) {
        const location = xsdErr.line ? ` (line ${xsdErr.line}, col ${xsdErr.column})` : '';
        console.log(`    - ${xsdErr.message}${location}`);
      }
    }
  }
  
  return validation.valid;
}

/**
 * Main function to generate all scenarios
 */
async function main() {
  console.log('='.repeat(60));
  console.log('ISO20022 Message Generator');
  console.log('Generating examples for PACS002, PACS004, and PACS008');
  if (useXsdValidation) {
    console.log('XSD Validation: ENABLED');
  }
  if (useSigning && signingCredentials) {
    console.log('XML Signing: ENABLED');
  }
  console.log('='.repeat(60));
  
  let totalMessages = 0;
  
  // ============================================
  // PACS002 - Payment Status Report
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('PACS002 - Payment Status Report');
  console.log('='.repeat(60));
  
  // Generate example EndToEndIds
  const originalEndToEndId = generateEndToEndId(PSP_PAGADOR);
  const originalInstrId = originalEndToEndId; // Same for this example
  
  const now = new Date();
  
  // Scenario 1: ACSP - Payment instruction accepted by debtor PSP
  console.log('\n' + '-'.repeat(60));
  console.log('Scenario 1: ACSP - Accepted Settlement in Process');
  console.log('PSP do pagador aceita a instrução de pagamento');
  console.log('-'.repeat(60));
  
  const acspMessage = createACSPMessage({
    fromISPB: PSP_PAGADOR,
    toISPB: SPI_ISPB,
    orgnlInstrId: originalInstrId,
    orgnlEndToEndId: originalEndToEndId,
    creationDate: now
  });
  
  saveMessage('pacs002_ACSP_example.xml', acspMessage);
  await validateAndDisplay('pacs002_ACSP_example.xml', acspMessage, validatePacs002);
  totalMessages++;
  
  // Scenario 2: ACCC - Settlement completed, notification to creditor PSP
  console.log('\n' + '-'.repeat(60));
  console.log('Scenario 2: ACCC - Accepted Settlement Completed (Creditor)');
  console.log('SPI notifica conclusão da transação ao PSP recebedor');
  console.log('-'.repeat(60));
  
  const settlementDate = new Date(now.getTime() + 1000); // 1 second later
  
  const acccMessage = createACCCMessage({
    fromISPB: SPI_ISPB,
    toISPB: PSP_RECEBEDOR,
    orgnlInstrId: originalInstrId,
    orgnlEndToEndId: originalEndToEndId,
    settlementDate: settlementDate,
    accountingDate: settlementDate,
    creationDate: settlementDate
  });
  
  saveMessage('pacs002_ACCC_example.xml', acccMessage);
  await validateAndDisplay('pacs002_ACCC_example.xml', acccMessage, validatePacs002);
  totalMessages++;
  
  // Scenario 3: ACSC - Settlement completed, notification to debtor PSP
  console.log('\n' + '-'.repeat(60));
  console.log('Scenario 3: ACSC - Accepted Settlement Completed (Debtor)');
  console.log('SPI notifica conclusão da transação ao PSP pagador');
  console.log('-'.repeat(60));
  
  const acscMessage = createACSCMessage({
    fromISPB: SPI_ISPB,
    toISPB: PSP_PAGADOR,
    orgnlInstrId: originalInstrId,
    orgnlEndToEndId: originalEndToEndId,
    settlementDate: settlementDate,
    accountingDate: settlementDate,
    creationDate: settlementDate
  });
  
  saveMessage('pacs002_ACSC_example.xml', acscMessage);
  await validateAndDisplay('pacs002_ACSC_example.xml', acscMessage, validatePacs002);
  totalMessages++;
  
  // Scenario 4: RJCT - Payment rejected with different error codes
  console.log('\n' + '-'.repeat(60));
  console.log('Scenario 4: RJCT - Rejected (Multiple error codes)');
  console.log('PSP rejeita a instrução de pagamento');
  console.log('-'.repeat(60));
  
  // Common rejection scenarios
  const rejectionScenarios = [
    {
      code: 'AB03',
      info: ['Timeout no SPI durante liquidação'],
      filename: 'pacs002_RJCT_AB03_Timeout.xml',
      description: 'Timeout durante liquidação'
    },
    {
      code: 'AC03',
      info: ['Conta transacional do recebedor inexistente ou inválida'],
      filename: 'pacs002_RJCT_AC03_InvalidAccount.xml',
      description: 'Conta inválida'
    },
    {
      code: 'AC06',
      info: ['Conta transacional do recebedor está bloqueada'],
      filename: 'pacs002_RJCT_AC06_BlockedAccount.xml',
      description: 'Conta bloqueada'
    },
    {
      code: 'AM04',
      info: ['Saldo insuficiente na conta PI do participante'],
      filename: 'pacs002_RJCT_AM04_InsufficientFunds.xml',
      description: 'Saldo insuficiente'
    },
    {
      code: 'BE01',
      info: ['CPF/CNPJ não corresponde ao titular da conta'],
      filename: 'pacs002_RJCT_BE01_InvalidCreditor.xml',
      description: 'CPF/CNPJ inválido'
    },
    {
      code: 'FRAD',
      info: ['Transação suspeita de fraude'],
      filename: 'pacs002_RJCT_FRAD_Fraud.xml',
      description: 'Suspeita de fraude'
    },
    {
      code: 'DS04',
      info: ['Ordem rejeitada pelo participante do recebedor'],
      filename: 'pacs002_RJCT_DS04_OrderRejected.xml',
      description: 'Ordem rejeitada'
    }
  ];
  
  for (const scenario of rejectionScenarios) {
    console.log(`\n  → ${scenario.description} (${scenario.code})`);
    
    const rjctMessage = createRJCTMessage({
      fromISPB: PSP_RECEBEDOR,
      toISPB: PSP_PAGADOR,
      orgnlInstrId: originalInstrId,
      orgnlEndToEndId: originalEndToEndId,
      statusReasonInfo: {
        code: scenario.code,
        additionalInfo: scenario.info
      },
      creationDate: now
    });
    
    saveMessage(scenario.filename, rjctMessage);
    await validateAndDisplay(scenario.filename, rjctMessage, validatePacs002);
    totalMessages++;
  }
  
  // ============================================
  // PACS004 - Payment Return
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('PACS004 - Payment Return');
  console.log('='.repeat(60));
  
  const returnScenarios = [
    {
      code: 'BE08',
      description: 'Devolução por erro bancário',
      filename: 'pacs004_BE08_BankError.xml',
      additionalInfo: ['Falha operacional do PSP do pagador']
    },
    {
      code: 'FR01',
      description: 'Devolução por fraude',
      filename: 'pacs004_FR01_Fraud.xml',
      additionalInfo: ['Fundada suspeita de fraude']
    },
    {
      code: 'MD06',
      description: 'Devolução solicitada pelo usuário',
      filename: 'pacs004_MD06_RefundRequest.xml',
      additionalInfo: ['Devolução solicitada pelo usuário recebedor']
    },
    {
      code: 'SL02',
      description: 'Devolução por erro no Pix Saque/Troco',
      filename: 'pacs004_SL02_PixSaqueTroco.xml',
      additionalInfo: ['Erro na transação relacionada ao Pix Saque']
    }
  ];
  
  for (const scenario of returnScenarios) {
    console.log(`\n  → ${scenario.description} (${scenario.code})`);
    
    const returnMessage = createPacs004({
      fromISPB: PSP_RECEBEDOR,
      toISPB: SPI_ISPB,
      transactions: [{
        orgnlEndToEndId: originalEndToEndId,
        amount: 1000.00,
        settlementPriority: 'HIGH',
        returnReasonCode: scenario.code,
        additionalInfo: scenario.additionalInfo,
        debtorAgentISPB: PSP_PAGADOR,
        creditorAgentISPB: PSP_RECEBEDOR,
        remittanceInfo: 'Devolução de pagamento'
      }],
      creationDate: now
    });
    
    saveMessage(scenario.filename, returnMessage);
    await validateAndDisplay(scenario.filename, returnMessage, validatePacs004);
    totalMessages++;
  }
  
  // Multiple returns in one message
  console.log('\n  → Múltiplas devoluções em uma mensagem');
  const multipleReturnsMessage = createPacs004({
    fromISPB: PSP_RECEBEDOR,
    toISPB: SPI_ISPB,
    transactions: [
      {
        orgnlEndToEndId: originalEndToEndId,
        amount: 1000.00,
        settlementPriority: 'HIGH',
        returnReasonCode: 'BE08',
        additionalInfo: ['Erro operacional'],
        debtorAgentISPB: PSP_PAGADOR,
        creditorAgentISPB: PSP_RECEBEDOR
      },
      {
        orgnlEndToEndId: generateEndToEndId(PSP_PAGADOR),
        amount: 500.00,
        settlementPriority: 'NORM',
        returnReasonCode: 'MD06',
        additionalInfo: ['Solicitado pelo usuário'],
        debtorAgentISPB: PSP_PAGADOR,
        creditorAgentISPB: PSP_RECEBEDOR
      }
    ],
    creationDate: now
  });
  
  saveMessage('pacs004_MultipleReturns.xml', multipleReturnsMessage);
  await validateAndDisplay('pacs004_MultipleReturns.xml', multipleReturnsMessage, validatePacs004);
  totalMessages++;
  
  // ============================================
  // PACS008 - Customer Credit Transfer
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('PACS008 - Customer Credit Transfer');
  console.log('='.repeat(60));
  
  // Common transaction data
  const commonTxData = {
    amount: 1000.00,
    acceptanceDateTime: new Date(now.getTime() - 12000), // 12 seconds before
    debtor: {
      name: 'Fulano da Silva',
      cpfCnpj: '70000000000'
    },
    debtorAccount: {
      accountNumber: '500000',
      agency: '3000',
      type: 'CACC'
    },
    debtorAgentISPB: PSP_PAGADOR,
    creditorAgentISPB: PSP_RECEBEDOR,
    creditor: {
      cpfCnpj: '80000000000'
    },
    creditorAccount: {
      accountNumber: '600000',
      agency: '4000',
      type: 'SVGS'
    },
    purpose: 'IPAY',
    remittanceInfo: 'Pagamento de teste'
  };
  
  // Manual payment
  console.log('\n  → Pagamento manual (MANU)');
  const manualPayment = createPacs008({
    fromISPB: PSP_PAGADOR,
    toISPB: SPI_ISPB,
    instructionPriority: 'HIGH',
    serviceLevel: 'PAGPRI',
    transactions: [{
      ...commonTxData,
      initiationForm: 'MANU'
    }],
    creationDate: now
  });
  
  saveMessage('pacs008_MANU_Manual.xml', manualPayment);
  await validateAndDisplay('pacs008_MANU_Manual.xml', manualPayment, validatePacs008);
  totalMessages++;
  
  // QR Code Dynamic
  console.log('\n  → Pagamento via QR Code dinâmico (QRDN)');
  const qrdnPayment = createPacs008({
    fromISPB: PSP_PAGADOR,
    toISPB: SPI_ISPB,
    instructionPriority: 'HIGH',
    serviceLevel: 'PAGPRI',
    transactions: [{
      ...commonTxData,
      initiationForm: 'QRDN',
      txId: 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQq',
      creditorAccount: {
        ...commonTxData.creditorAccount,
        pixKey: 'b6cdf262-4c58-4698-9517-f694e81893d4'
      }
    }],
    creationDate: now
  });
  
  saveMessage('pacs008_QRDN_QRCodeDynamic.xml', qrdnPayment);
  await validateAndDisplay('pacs008_QRDN_QRCodeDynamic.xml', qrdnPayment, validatePacs008);
  totalMessages++;
  
  // QR Code Static
  console.log('\n  → Pagamento via QR Code estático (QRES)');
  const qresPayment = createPacs008({
    fromISPB: PSP_PAGADOR,
    toISPB: SPI_ISPB,
    instructionPriority: 'HIGH',
    serviceLevel: 'PAGPRI',
    transactions: [{
      ...commonTxData,
      initiationForm: 'QRES',
      txId: 'QRES123456789012345',
      creditorAccount: {
        ...commonTxData.creditorAccount,
        pixKey: 'email@example.com'
      }
    }],
    creationDate: now
  });
  
  saveMessage('pacs008_QRES_QRCodeStatic.xml', qresPayment);
  await validateAndDisplay('pacs008_QRES_QRCodeStatic.xml', qresPayment, validatePacs008);
  totalMessages++;
  
  // Pix Saque (OTHR)
  console.log('\n  → Pix Saque (OTHR)');
  const pixSaquePayment = createPacs008({
    fromISPB: PSP_PAGADOR,
    toISPB: SPI_ISPB,
    instructionPriority: 'HIGH',
    serviceLevel: 'PAGPRI',
    transactions: [{
      ...commonTxData,
      initiationForm: 'QRDN',
      txId: 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQq',
      amount: 500.00,
      purpose: 'OTHR',
      creditorAccount: {
        ...commonTxData.creditorAccount,
        pixKey: 'b6cdf262-4c58-4698-9517-f694e81893d4'
      },
      structuredRemittance: {
        agentModality: 'AGTEC',
        facilitatorISPB: '01234567',
        amounts: [
          {
            amount: 500.00,
            reason: 'VLDN'
          }
        ]
      },
      remittanceInfo: 'Pix Saque'
    }],
    creationDate: now
  });
  
  saveMessage('pacs008_OTHR_PixSaque.xml', pixSaquePayment);
  await validateAndDisplay('pacs008_OTHR_PixSaque.xml', pixSaquePayment, validatePacs008);
  totalMessages++;
  
  // Pix Troco (GSCB)
  console.log('\n  → Pix Troco (GSCB)');
  const pixTrocoPayment = createPacs008({
    fromISPB: PSP_PAGADOR,
    toISPB: SPI_ISPB,
    instructionPriority: 'HIGH',
    serviceLevel: 'PAGPRI',
    transactions: [{
      ...commonTxData,
      initiationForm: 'QRDN',
      txId: 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQq',
      amount: 1500.00,
      purpose: 'GSCB',
      creditorAccount: {
        ...commonTxData.creditorAccount,
        pixKey: 'b6cdf262-4c58-4698-9517-f694e81893d4'
      },
      structuredRemittance: {
        agentModality: 'AGTEC',
        facilitatorISPB: '01234567',
        amounts: [
          {
            amount: 1000.00,
            reason: 'VLCP'
          },
          {
            amount: 500.00,
            reason: 'VLDN'
          }
        ]
      },
      remittanceInfo: 'Pix Troco'
    }],
    creationDate: now
  });
  
  saveMessage('pacs008_GSCB_PixTroco.xml', pixTrocoPayment);
  await validateAndDisplay('pacs008_GSCB_PixTroco.xml', pixTrocoPayment, validatePacs008);
  totalMessages++;
  
  // Pix Agendado (PAGAGD)
  console.log('\n  → Pix Agendado (PAGAGD)');
  const pixAgendadoPayment = createPacs008({
    fromISPB: PSP_PAGADOR,
    toISPB: SPI_ISPB,
    instructionPriority: 'NORM',
    serviceLevel: 'PAGAGD',
    transactions: [{
      ...commonTxData,
      initiationForm: 'MANU'
    }],
    creationDate: now
  });
  
  saveMessage('pacs008_PAGAGD_Scheduled.xml', pixAgendadoPayment);
  await validateAndDisplay('pacs008_PAGAGD_Scheduled.xml', pixAgendadoPayment, validatePacs008);
  totalMessages++;
  
  // Pix Automático (AUTO)
  console.log('\n  → Pix Automático (AUTO)');
  const pixAutomaticoPayment = createPacs008({
    fromISPB: PSP_PAGADOR,
    toISPB: SPI_ISPB,
    instructionPriority: 'HIGH',
    serviceLevel: 'PAGPRI',
    transactions: [{
      ...commonTxData,
      initiationForm: 'AUTO',
      txId: 'Auto123456789012345678901234567',
      purpose: 'IPAY'
    }],
    creationDate: now
  });
  
  saveMessage('pacs008_AUTO_Automatic.xml', pixAutomaticoPayment);
  await validateAndDisplay('pacs008_AUTO_Automatic.xml', pixAutomaticoPayment, validatePacs008);
  totalMessages++;
  
  // Multiple transactions
  console.log('\n  → Múltiplas transações em uma mensagem');
  const multipleTransactions = createPacs008({
    fromISPB: PSP_PAGADOR,
    toISPB: SPI_ISPB,
    instructionPriority: 'HIGH',
    serviceLevel: 'PAGPRI',
    transactions: [
      {
        ...commonTxData,
        initiationForm: 'MANU',
        amount: 1000.00
      },
      {
        ...commonTxData,
        initiationForm: 'MANU',
        amount: 2000.00,
        endToEndId: generateEndToEndId(PSP_PAGADOR)
      },
      {
        ...commonTxData,
        initiationForm: 'MANU',
        amount: 3000.00,
        endToEndId: generateEndToEndId(PSP_PAGADOR)
      }
    ],
    creationDate: now
  });
  
  saveMessage('pacs008_MultipleTransactions.xml', multipleTransactions);
  await validateAndDisplay('pacs008_MultipleTransactions.xml', multipleTransactions, validatePacs008);
  totalMessages++;
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total messages generated: ${totalMessages}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log('\nMessage types:');
  console.log(`  - PACS002: ${3 + rejectionScenarios.length} messages`);
  console.log(`  - PACS004: ${returnScenarios.length + 1} messages`);
  console.log(`  - PACS008: ${8} messages`);
  console.log('\n✓ All messages generated and validated successfully!');
  console.log('='.repeat(60));
}

// Run main function using top-level await
try {
  await main();
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}

