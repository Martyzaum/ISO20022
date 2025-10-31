import http from 'http';

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testHealthCheck() {
  log('\n📋 Test 1: Health Check', 'cyan');
  try {
    const response = await makeRequest('GET', '/health');
    if (response.status === 200 && response.body.status === 'ok') {
      log('✓ Health check passed', 'green');
      return true;
    } else {
      log(`✗ Health check failed: ${JSON.stringify(response.body)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Health check error: ${error.message}`, 'red');
    return false;
  }
}

function generateEndToEndId(ispb) {
  const prefix = 'E';
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timestamp = year + month + day + hours + minutes;
  const randomPart = Math.random().toString(36).substring(2, 13).padEnd(11, '0');
  return prefix + ispb + timestamp + randomPart;
}

function generateOrgnlInstrId(ispb, prefix = 'D') {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timestamp = year + month + day + hours + minutes;
  const randomPart = Math.random().toString(36).substring(2, 13).padEnd(11, '0');
  return prefix + ispb + timestamp + randomPart;
}

async function testGeneratePacs002() {
  log('\n📋 Test 2: Generate PACS002 (ACSP)', 'cyan');
  const idempotencyKey = `test-pacs002-${Date.now()}`;
  const fromISPB = '12345678';
  const toISPB = '87654321';
  const endToEndId = generateEndToEndId(fromISPB);
  const instrId = generateOrgnlInstrId(fromISPB);
  
  const body = {
    fromISPB,
    toISPB,
    transactionStatus: 'ACSP',
    originalEndToEndId: endToEndId,
    originalInstructionId: instrId,
    settlementDate: new Date().toISOString(),
    accountingDate: new Date().toISOString()
  };

  try {
    const response = await makeRequest('POST', `${API_BASE}/pacs002`, body, {
      'Idempotency-Key': idempotencyKey
    });

    if (response.status === 201 && response.body.success) {
      log('✓ PACS002 generated successfully', 'green');
      log(`  Message ID: ${response.body.message.id}`, 'blue');
      log(`  MsgId: ${response.body.message.msgId}`, 'blue');
      return response.body.message.id;
    } else {
      log(`✗ PACS002 generation failed: ${JSON.stringify(response.body)}`, 'red');
      return null;
    }
  } catch (error) {
    log(`✗ PACS002 generation error: ${error.message}`, 'red');
    return null;
  }
}

async function testGeneratePacs002Rejected() {
  log('\n📋 Test 3: Generate PACS002 (RJCT)', 'cyan');
  const idempotencyKey = `test-pacs002-rjct-${Date.now()}`;
  const fromISPB = '12345678';
  const toISPB = '87654321';
  const endToEndId = generateEndToEndId(fromISPB);
  
  const body = {
    fromISPB,
    toISPB,
    transactionStatus: 'RJCT',
    originalEndToEndId: endToEndId,
    statusReasonCode: 'AM04',
    additionalInfo: ['Saldo insuficiente']
  };

  try {
    const response = await makeRequest('POST', `${API_BASE}/pacs002`, body, {
      'Idempotency-Key': idempotencyKey
    });

    if (response.status === 201 && response.body.success) {
      log('✓ PACS002 (RJCT) generated successfully', 'green');
      return true;
    } else {
      log(`✗ PACS002 (RJCT) generation failed: ${JSON.stringify(response.body)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ PACS002 (RJCT) generation error: ${error.message}`, 'red');
    return false;
  }
}

async function testGeneratePacs004() {
  log('\n📋 Test 4: Generate PACS004', 'cyan');
  const idempotencyKey = `test-pacs004-${Date.now()}`;
  const fromISPB = '12345678';
  const toISPB = '87654321';
  const endToEndId = generateEndToEndId(fromISPB);
  
  const body = {
    fromISPB,
    toISPB,
    transactions: [
      {
        originalEndToEndId: endToEndId,
        amount: 100.50,
        returnReasonCode: 'BE08',
        additionalInfo: ['Erro bancário'],
        debtorAgentISPB: '12345678',
        creditorAgentISPB: '87654321',
        remittanceInfo: 'Devolução por erro'
      }
    ]
  };

  try {
    const response = await makeRequest('POST', `${API_BASE}/pacs004`, body, {
      'Idempotency-Key': idempotencyKey
    });

    if (response.status === 201 && response.body.success) {
      log('✓ PACS004 generated successfully', 'green');
      return true;
    } else {
      log(`✗ PACS004 generation failed: ${JSON.stringify(response.body)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ PACS004 generation error: ${error.message}`, 'red');
    return false;
  }
}

async function testGeneratePacs008() {
  log('\n📋 Test 5: Generate PACS008', 'cyan');
  const idempotencyKey = `test-pacs008-${Date.now()}`;
  const fromISPB = '12345678';
  const toISPB = '87654321';
  const endToEndId = generateEndToEndId(fromISPB);
  
  const body = {
    fromISPB,
    toISPB,
    instructionPriority: 'HIGH',
    serviceLevel: 'PAGPRI',
    transactions: [
      {
        amount: 150.75,
        txId: endToEndId.substring(0, 25), // TxId válido para QRES
        initiationForm: 'QRES', // Usando QRES que permite pixKey
        initiatorCNPJ: '12345678000190',
        debtor: {
          name: 'João Silva',
          cpfCnpj: '12345678901'
        },
        debtorAccount: {
          accountNumber: '12345',
          agency: '0001',
          type: 'CACC'
        },
        debtorAgentISPB: '12345678',
        creditorAgentISPB: '87654321',
        creditor: {
          cpfCnpj: '98765432100'
        },
        creditorAccount: {
          accountNumber: '67890',
          agency: '0002',
          type: 'CACC',
          pixKey: 'test@example.com'
        },
        purpose: 'IPAY',
        remittanceInfo: 'Pagamento de teste'
      }
    ]
  };

  try {
    const response = await makeRequest('POST', `${API_BASE}/pacs008`, body, {
      'Idempotency-Key': idempotencyKey
    });

    if (response.status === 201 && response.body.success) {
      log('✓ PACS008 generated successfully', 'green');
      return true;
    } else {
      log(`✗ PACS008 generation failed: ${JSON.stringify(response.body)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ PACS008 generation error: ${error.message}`, 'red');
    return false;
  }
}

async function testIdempotency() {
  log('\n📋 Test 6: Idempotency Key', 'cyan');
  const idempotencyKey = `test-idempotency-${Date.now()}`;
  const fromISPB = '12345678';
  const toISPB = '87654321';
  const endToEndId = generateEndToEndId(fromISPB);
  
  const body = {
    fromISPB,
    toISPB,
    transactionStatus: 'ACSP',
    originalEndToEndId: endToEndId
  };

  try {
    // First request
    const response1 = await makeRequest('POST', `${API_BASE}/pacs002`, body, {
      'Idempotency-Key': idempotencyKey
    });

    if (response1.status !== 201 || !response1.body.success) {
      log(`✗ First request failed: ${JSON.stringify(response1.body)}`, 'red');
      return false;
    }

    // Second request with same idempotency key
    const response2 = await makeRequest('POST', `${API_BASE}/pacs002`, body, {
      'Idempotency-Key': idempotencyKey
    });

    if (response2.status === 200 && response2.body.success && !response2.body.isNew) {
      log('✓ Idempotency working correctly', 'green');
      log(`  First request: ${response1.body.message.id} (isNew: ${response1.body.isNew})`, 'blue');
      log(`  Second request: ${response2.body.message.id} (isNew: ${response2.body.isNew})`, 'blue');
      return response1.body.message.id;
    } else {
      log(`✗ Idempotency failed: ${JSON.stringify(response2.body)}`, 'red');
      return null;
    }
  } catch (error) {
    log(`✗ Idempotency error: ${error.message}`, 'red');
    return null;
  }
}

async function testGetMessage(messageId) {
  log('\n📋 Test 7: Get Message by ID', 'cyan');
  if (!messageId) {
    log('⚠ Skipping - no message ID available', 'yellow');
    return false;
  }

  try {
    const response = await makeRequest('GET', `${API_BASE}/messages/${messageId}`);

    if (response.status === 200 && response.body.success) {
      log('✓ Message retrieved successfully', 'green');
      log(`  Type: ${response.body.message.messageType}`, 'blue');
      log(`  Status: ${response.body.message.status}`, 'blue');
      return true;
    } else {
      log(`✗ Get message failed: ${JSON.stringify(response.body)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Get message error: ${error.message}`, 'red');
    return false;
  }
}

async function testListMessages() {
  log('\n📋 Test 8: List Messages', 'cyan');
  try {
    const response = await makeRequest('GET', `${API_BASE}/messages?limit=10`);

    if (response.status === 200 && response.body.success && Array.isArray(response.body.messages)) {
      log('✓ Messages listed successfully', 'green');
      log(`  Found ${response.body.messages.length} messages`, 'blue');
      return true;
    } else {
      log(`✗ List messages failed: ${JSON.stringify(response.body)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ List messages error: ${error.message}`, 'red');
    return false;
  }
}

async function testGetStats() {
  log('\n📋 Test 9: Get Statistics', 'cyan');
  try {
    const response = await makeRequest('GET', `${API_BASE}/stats`);

    if (response.status === 200 && response.body.success && response.body.statistics) {
      log('✓ Statistics retrieved successfully', 'green');
      log(`  Total messages: ${response.body.statistics.total}`, 'blue');
      return true;
    } else {
      log(`✗ Get stats failed: ${JSON.stringify(response.body)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Get stats error: ${error.message}`, 'red');
    return false;
  }
}

async function testValidateMessage() {
  log('\n📋 Test 10: Validate XML Message', 'cyan');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Envelope xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.002.001.14">
  <AppHdr>
    <Fr>
      <FIId>
        <FinInstnId>
          <Othr>
            <Id>12345678</Id>
          </Othr>
        </FinInstnId>
      </FIId>
    </Fr>
    <To>
      <FIId>
        <FinInstnId>
          <Othr>
            <Id>87654321</Id>
          </Othr>
        </FinInstnId>
      </FIId>
    </To>
    <BizMsgIdr>MSG12345678</BizMsgIdr>
    <MsgDefIdr>pacs.002.001.14</MsgDefIdr>
    <CreDt>2024-12-25T10:00:00Z</CreDt>
    <Sgntr></Sgntr>
  </AppHdr>
  <Document>
    <FIToFIPmtStsRpt>
      <GrpHdr>
        <MsgId>MSG12345678</MsgId>
        <CreDtTm>2024-12-25T10:00:00Z</CreDtTm>
      </GrpHdr>
    </FIToFIPmtStsRpt>
  </Document>
</Envelope>`;

  try {
    const response = await makeRequest('POST', `${API_BASE}/validate`, {
      xml,
      options: {
        xsd: true,
        signature: false,
        businessRules: false
      }
    });

    if (response.status === 200 && response.body.success !== undefined) {
      log('✓ Validation endpoint working', 'green');
      log(`  Valid: ${response.body.valid}`, 'blue');
      return true;
    } else {
      log(`✗ Validation failed: ${JSON.stringify(response.body)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Validation error: ${error.message}`, 'red');
    return false;
  }
}

async function testMissingIdempotencyKey() {
  log('\n📋 Test 11: Missing Idempotency Key', 'cyan');
  const fromISPB = '12345678';
  const toISPB = '87654321';
  const endToEndId = generateEndToEndId(fromISPB);
  
  const body = {
    fromISPB,
    toISPB,
    transactionStatus: 'ACSP',
    originalEndToEndId: endToEndId
  };

  try {
    const response = await makeRequest('POST', `${API_BASE}/pacs002`, body);

    if (response.status === 400 && !response.body.success) {
      log('✓ Missing idempotency key correctly rejected', 'green');
      return true;
    } else {
      log(`✗ Missing idempotency key not rejected: ${JSON.stringify(response.body)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Test error: ${error.message}`, 'red');
    return false;
  }
}

async function testInvalidMessageType() {
  log('\n📋 Test 12: Invalid Message Type Filter', 'cyan');
  try {
    const response = await makeRequest('GET', `${API_BASE}/messages?messageType=INVALID`);

    if (response.status === 400 && !response.body.success) {
      log('✓ Invalid message type correctly rejected', 'green');
      return true;
    } else {
      log(`✗ Invalid message type not rejected: ${JSON.stringify(response.body)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Test error: ${error.message}`, 'red');
    return false;
  }
}

async function testInvalidPagination() {
  log('\n📋 Test 13: Invalid Pagination', 'cyan');
  try {
    const response = await makeRequest('GET', `${API_BASE}/messages?limit=-1`);

    if (response.status === 400 && !response.body.success) {
      log('✓ Invalid pagination correctly rejected', 'green');
      return true;
    } else {
      log(`✗ Invalid pagination not rejected: ${JSON.stringify(response.body)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Test error: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('ISO20022 API Test Suite', 'cyan');
  log('='.repeat(60), 'cyan');

  const results = [];

  // Basic tests
  results.push(await testHealthCheck());
  const messageId1 = await testGeneratePacs002();
  results.push(messageId1 !== null);
  results.push(await testGeneratePacs002Rejected());
  results.push(await testGeneratePacs004());
  results.push(await testGeneratePacs008());

  // Idempotency test
  const messageId2 = await testIdempotency();
  results.push(messageId2 !== null);

  // Query tests
  results.push(await testGetMessage(messageId1 || messageId2));
  results.push(await testListMessages());
  results.push(await testGetStats());
  results.push(await testValidateMessage());

  // Error handling tests
  results.push(await testMissingIdempotencyKey());
  results.push(await testInvalidMessageType());
  results.push(await testInvalidPagination());

  // Summary
  const passed = results.filter(r => r === true).length;
  const total = results.length;

  log('\n' + '='.repeat(60), 'cyan');
  log('Test Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Total tests: ${total}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${total - passed}`, total - passed > 0 ? 'red' : 'green');
  log('='.repeat(60), 'cyan');

  if (passed === total) {
    log('\n✓ All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n✗ Some tests failed', 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

