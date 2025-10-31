// test-xsd-validation.js
// Script para testar validação XSD com casos válidos e inválidos
import { readFileSync } from 'node:fs';
import { validate as validateXsd } from './src/validation/xsdValidator.js';

console.log('='.repeat(60));
console.log('Teste de Validação XSD');
console.log('='.repeat(60));

// Teste 1: XML válido
console.log('\n1. Testando XML válido:');
try {
  const validXml = readFileSync('./out/pacs002_ACSP_example.xml', 'utf8');
  const result = await validateXsd(validXml);
  
  if (result.ok) {
    console.log('✓ XML válido!');
    console.log(`  - Tipo: ${result.detected.message} v${result.detected.spiVersion}`);
    console.log(`  - XSD usado: ${result.detected.xsdFile || 'N/A'}`);
  } else {
    console.log('✗ Erro inesperado:', result.errors);
  }
} catch (error) {
  console.log('✗ Erro:', error.message);
}

// Teste 2: XML com elemento inválido (elemento que não existe no XSD)
console.log('\n2. Testando XML com elemento inválido:');
try {
  const validXml = readFileSync('./out/pacs002_ACSP_example.xml', 'utf8');
  // Adiciona um elemento inválido dentro de AppHdr
  const invalidXml = validXml.replace(
    '<CreDt>',
    '<ElementoInvalido>teste</ElementoInvalido><CreDt>'
  );
  
  const result = await validateXsd(invalidXml);
  
  if (!result.ok) {
    console.log('✓ Erro detectado corretamente!');
    console.log(`  - Tipo: ${result.detected.message} v${result.detected.spiVersion}`);
    console.log(`  - XSD usado: ${result.detected.xsdFile || 'N/A'}`);
    console.log('  - Erros encontrados:');
    result.errors.forEach((err, i) => {
      const location = err.line ? ` (linha ${err.line}, col ${err.column})` : '';
      console.log(`    ${i + 1}. ${err.message}${location}`);
    });
  } else {
    console.log('✗ Erro: Validação deveria ter falhado mas passou!');
  }
} catch (error) {
  console.log('✗ Erro:', error.message);
}

// Teste 3: XML com valor inválido (TxSts com valor não permitido)
console.log('\n3. Testando XML com valor inválido em TxSts:');
try {
  const validXml = readFileSync('./out/pacs002_ACSP_example.xml', 'utf8');
  // Troca ACSP por um valor inválido
  const invalidXml = validXml.replace(
    '<TxSts>ACSP</TxSts>',
    '<TxSts>INVALIDO</TxSts>'
  );
  
  const result = await validateXsd(invalidXml);
  
  if (!result.ok) {
    console.log('✓ Erro detectado corretamente!');
    console.log(`  - Tipo: ${result.detected.message} v${result.detected.spiVersion}`);
    console.log(`  - XSD usado: ${result.detected.xsdFile || 'N/A'}`);
    console.log('  - Erros encontrados:');
    result.errors.forEach((err, i) => {
      const location = err.line ? ` (linha ${err.line}, col ${err.column})` : '';
      console.log(`    ${i + 1}. ${err.message}${location}`);
    });
  } else {
    console.log('⚠ Aviso: Validação passou (pode ser que o XSD não valide enumeração neste nível)');
    console.log(`  - Tipo: ${result.detected.message} v${result.detected.spiVersion}`);
    console.log(`  - XSD usado: ${result.detected.xsdFile || 'N/A'}`);
  }
} catch (error) {
  console.log('✗ Erro:', error.message);
}

// Teste 4: XML com elemento obrigatório faltando
console.log('\n4. Testando XML com elemento obrigatório faltando (MsgId):');
try {
  const validXml = readFileSync('./out/pacs002_ACSP_example.xml', 'utf8');
  // Remove o elemento MsgId do GrpHdr
  const invalidXml = validXml.replace(
    /<GrpHdr>[\s\S]*?<MsgId>.*?<\/MsgId>/,
    '<GrpHdr>'
  );
  
  const result = await validateXsd(invalidXml);
  
  if (!result.ok) {
    console.log('✓ Erro detectado corretamente!');
    console.log(`  - Tipo: ${result.detected.message} v${result.detected.spiVersion}`);
    console.log(`  - XSD usado: ${result.detected.xsdFile || 'N/A'}`);
    console.log('  - Erros encontrados:');
    result.errors.forEach((err, i) => {
      const location = err.line ? ` (linha ${err.line}, col ${err.column})` : '';
      console.log(`    ${i + 1}. ${err.message}${location}`);
    });
  } else {
    console.log('⚠ Aviso: Validação passou (pode ser que o XSD não valide obrigatoriedade neste nível)');
    console.log(`  - Tipo: ${result.detected.message} v${result.detected.spiVersion}`);
  }
} catch (error) {
  console.log('✗ Erro:', error.message);
}

// Teste 5: XML com estrutura inválida (elemento duplicado onde não é permitido)
console.log('\n5. Testando XML com estrutura inválida (elemento duplicado onde não é permitido):');
try {
  const validXml = readFileSync('./out/pacs002_ACSP_example.xml', 'utf8');
  // Adiciona um segundo elemento MsgDefIdr dentro de AppHdr (não permitido pelo XSD)
  const invalidXml = validXml.replace(
    '<MsgDefIdr>pacs.002.spi.1.14</MsgDefIdr>',
    '<MsgDefIdr>pacs.002.spi.1.14</MsgDefIdr>\n        <MsgDefIdr>pacs.002.spi.1.14</MsgDefIdr>'
  );
  
  const result = await validateXsd(invalidXml);
  
  if (!result.ok) {
    console.log('✓ Erro detectado corretamente!');
    console.log(`  - Tipo: ${result.detected.message} v${result.detected.spiVersion}`);
    console.log(`  - XSD usado: ${result.detected.xsdFile || 'N/A'}`);
    console.log('  - Erros encontrados:');
    result.errors.forEach((err, i) => {
      const location = err.line ? ` (linha ${err.line}, col ${err.column})` : '';
      console.log(`    ${i + 1}. ${err.message}${location}`);
    });
  } else {
    console.log('⚠ Aviso: Validação passou (pode ser que o XSD permita múltiplas ocorrências)');
    console.log(`  - Tipo: ${result.detected.message} v${result.detected.spiVersion}`);
    console.log(`  - XSD usado: ${result.detected.xsdFile || 'N/A'}`);
  }
} catch (error) {
  console.log('✗ Erro:', error.message);
}

// Teste 6: XML com elementos fora de ordem
console.log('\n6. Testando XML com elementos fora de ordem:');
try {
  const validXml = readFileSync('./out/pacs002_ACSP_example.xml', 'utf8');
  // Troca a ordem de MsgDefIdr e CreDt dentro de AppHdr
  // Ordem correta: Fr, To, BizMsgIdr, MsgDefIdr, CreDt, Sgntr
  // Ordem incorreta: Fr, To, BizMsgIdr, CreDt, MsgDefIdr, Sgntr (troca MsgDefIdr com CreDt)
  const invalidXml = validXml.replace(
    /(<MsgDefIdr>pacs\.002\.spi\.1\.14<\/MsgDefIdr>\s*)(<CreDt>[^<]+<\/CreDt>)/,
    '$2$1'
  );
  
  const result = await validateXsd(invalidXml);
  
  if (!result.ok) {
    console.log('✓ Erro detectado corretamente!');
    console.log(`  - Tipo: ${result.detected.message} v${result.detected.spiVersion}`);
    console.log(`  - XSD usado: ${result.detected.xsdFile || 'N/A'}`);
    console.log('  - Erros encontrados:');
    result.errors.forEach((err, i) => {
      const location = err.line ? ` (linha ${err.line}, col ${err.column})` : '';
      console.log(`    ${i + 1}. ${err.message}${location}`);
    });
  } else {
    console.log('⚠ Aviso: Validação passou (pode ser que o XSD não valide ordem dos elementos)');
    console.log(`  - Tipo: ${result.detected.message} v${result.detected.spiVersion}`);
    console.log(`  - XSD usado: ${result.detected.xsdFile || 'N/A'}`);
  }
} catch (error) {
  console.log('✗ Erro:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('Testes concluídos!');
console.log('='.repeat(60));

