# ISO20022 SPI - Gerador e API de Mensagens

Implementação completa de geração e validação de mensagens ISO 20022 para o Sistema de Pagamentos Instantâneos (SPI) do Banco Central do Brasil, com API REST e suporte a idempotência.

## Visão Geral

Esta biblioteca fornece:

✅ **Geradores de mensagens ISO 20022** (PACS002, PACS004, PACS008)  
✅ **Validadores de regras de negócio** do SPI  
✅ **API REST** com idempotência obrigatória  
✅ **Banco de dados SQLite** para persistência  
✅ **23 exemplos** de mensagens pré-geradas  

## Mensagens Implementadas

### PACS002 - Payment Status Report

Relatório de status de transações de pagamento.

**Status:**
- `ACSP` - Accepted Settlement in Process
- `ACCC` - Accepted Settlement Completed (Creditor)
- `ACSC` - Accepted Settlement Completed (Debtor)
- `RJCT` - Rejected (40+ códigos de erro)

### PACS004 - Payment Return

Mensagem de devolução de pagamento.

**Códigos de Devolução:**
- `BE08` - Erro bancário
- `FR01` - Fraude
- `MD06` - Solicitado pelo usuário
- `SL02` - Erro no Pix Saque/Troco

### PACS008 - Customer Credit Transfer

Mensagem de transferência de crédito (pagamento instantâneo).

**Formas de Iniciação:**
- `MANU` - Manual (dados da conta)
- `DICT` - Chave Pix
- `QRDN` - QR Code dinâmico
- `QRES` - QR Code estático
- `APDN` - Pix por aproximação
- `INIC` - Serviço de iniciação
- `AUTO` - Pix Automático

**Finalidades:**
- `IPAY` - Compra/transferência
- `REFU` - Reembolso
- `GSCB` - Pix Troco
- `OTHR` - Pix Saque

## Instalação

```bash
npm install
```

**Dependências:**
- `xmlbuilder2` - Geração de XML
- `better-sqlite3` - Banco de dados
- `express` - Servidor HTTP
- `cors` - CORS middleware
- `xml-crypto` - Assinatura e validação de assinaturas XMLDSig
- `@xmldom/xmldom` - Parsing XML
- `xmldom` - Parsing XML (compatibilidade)

## API REST

### Iniciar Servidor

```bash
npm start
```

Ou em modo desenvolvimento:

```bash
npm run dev
```

Servidor inicia em `http://localhost:3000`

### Endpoints

#### Health Check
**GET** `/health`

```bash
curl http://localhost:3000/health
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2025-10-31T00:00:00.000Z",
  "service": "ISO20022 API"
}
```

#### Gerar PACS002
**POST** `/api/pacs002`

**Headers obrigatórios:**
- `Idempotency-Key`: Chave única de idempotência

**Body:**
```json
{
  "fromISPB": "99999010",
  "toISPB": "00038166",
  "transactionStatus": "ACSP",
  "originalEndToEndId": "E99999010202510301212ibBkMlN4xAr"
}
```

**Parâmetros:**
- `fromISPB` (obrigatório): ISPB do remetente (8 caracteres)
- `toISPB` (obrigatório): ISPB do destinatário (8 caracteres)
- `transactionStatus` (obrigatório): `ACSP`, `ACCC`, `ACSC`, `RJCT`
- `originalEndToEndId` (obrigatório): ID fim-a-fim (32 caracteres)
- `statusReasonCode` (obrigatório para RJCT): Código de erro
- `additionalInfo` (opcional): Array de strings (máx 105 chars cada)
- `settlementDate` (opcional): Data de liquidação (ISO 8601)
- `accountingDate` (opcional): Data contábil (ISO 8601)

**Resposta:**
```json
{
  "success": true,
  "message": {
    "id": 1,
    "idempotencyKey": "abc123",
    "messageType": "PACS002",
    "msgId": "M99999010...",
    "status": "generated",
    "xml": "<?xml version=\"1.0\"..."
  },
  "isNew": true
}
```

#### Gerar PACS004
**POST** `/api/pacs004`

**Headers obrigatórios:**
- `Idempotency-Key`: Chave única

**Body:**
```json
{
  "fromISPB": "99999010",
  "toISPB": "00038166",
  "transactions": [{
    "originalEndToEndId": "E99999010202510301212ibBkMlN4xAr",
    "amount": 1000.00,
    "settlementPriority": "HIGH",
    "returnReasonCode": "BE08",
    "debtorAgentISPB": "99999010",
    "creditorAgentISPB": "00038166"
  }]
}
```

#### Gerar PACS008
**POST** `/api/pacs008`

**Headers obrigatórios:**
- `Idempotency-Key`: Chave única

**Body:**
```json
{
  "fromISPB": "99999010",
  "toISPB": "00038166",
  "instructionPriority": "HIGH",
  "serviceLevel": "PAGPRI",
  "transactions": [{
    "amount": 1000.00,
    "initiationForm": "MANU",
    "debtor": {
      "name": "João Silva",
      "cpfCnpj": "12345678901"
    },
    "debtorAccount": {
      "accountNumber": "12345",
      "type": "CACC"
    },
    "debtorAgentISPB": "99999010",
    "creditorAgentISPB": "00038166",
    "creditor": {
      "cpfCnpj": "98765432100"
    },
    "creditorAccount": {
      "accountNumber": "67890",
      "type": "SVGS"
    },
    "purpose": "IPAY"
  }]
}
```

#### Listar Mensagens
**GET** `/api/messages?limit=10&offset=0&messageType=PACS008`

#### Buscar por ID
**GET** `/api/messages/:id`

#### Estatísticas
**GET** `/api/stats`

#### Validar Mensagem XML
**POST** `/api/validate`

Valida uma mensagem XML contra XSDs do SPI e verifica assinatura XMLDSig (quando presente).

**Body:**
```json
{
  "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
  "options": {
    "xsd": true,
    "signature": true,
    "businessRules": true,
    "preprocess": true
  }
}
```

**Parâmetros options (opcionais):**
- `xsd` (boolean, padrão: true): Valida contra XSDs do SPI
- `signature` (boolean, padrão: true): Valida assinatura XMLDSig
- `businessRules` (boolean, padrão: true): Valida regras de negócio
- `preprocess` (boolean, padrão: true): Pré-processa XML (remove padding #x0000, BOM)

**Resposta:**
```json
{
  "success": true,
  "valid": true,
  "validation": {
    "xsd": {
      "ok": true,
      "errors": [],
      "detected": {
        "message": "pacs.002",
        "spiVersion": "1.14",
        "namespace": "https://www.bcb.gov.br/pi/pacs.002/1.14",
        "msgDefIdr": "pacs.002.spi.1.14"
      }
    },
    "signature": {
      "ok": true,
      "errors": [],
      "details": {
        "signaturePresent": true,
        "location": "AppHdr.Sgntr",
        "algorithms": {
          "canonicalization": "http://www.w3.org/2001/10/xml-exc-c14n#",
          "signature": "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"
        },
        "references": {
          "keyInfo": { "present": true, "valid": true },
          "appHdr": { "present": true, "valid": true },
          "document": { "present": true, "valid": true }
        }
      }
    },
    "businessRules": {
      "ok": true,
      "errors": []
    }
  },
  "errors": []
}
```

### Idempotência

**Obrigatório:** Toda requisição POST deve incluir `Idempotency-Key` no header ou `idempotencyKey` no body.

**Comportamento:**
- Sem chave → **400 Bad Request**
- Com chave nova → **201 Created** (nova mensagem)
- Com chave existente → **200 OK** (retorna mensagem anterior)

**Exemplo:**
```bash
# Primeira chamada
curl -X POST http://localhost:3000/api/pacs002 \
  -H "Idempotency-Key: my-unique-key" \
  -H "Content-Type: application/json" \
  -d '{"fromISPB":"99999010",...}'
# Retorna: 201 Created

# Segunda chamada (mesma chave)
curl -X POST http://localhost:3000/api/pacs002 \
  -H "Idempotency-Key: my-unique-key" \
  -H "Content-Type: application/json" \
  -d '{"fromISPB":"99999010",...}'
# Retorna: 200 OK (mesma mensagem, não cria duplicata)
```

### Banco de Dados

SQLite criado automaticamente em `data/iso20022.db`

**Tabela messages:**
- `id` - ID auto-incremento
- `idempotency_key` - Chave única (índice)
- `message_type` - PACS002/PACS004/PACS008
- `request_data` - JSON da requisição
- `xml_content` - XML gerado
- `msg_id` - ID da mensagem extraído
- `end_to_end_id` - EndToEndId extraído
- `status` - generated/sent/failed
- `created_at` - Timestamp de criação
- `updated_at` - Timestamp de atualização

## Uso Programático

### Gerar Mensagem PACS002

```javascript
import { createACSPMessage } from './src/pacs002/generator.js';

const message = createACSPMessage({
  fromISPB: '99999010',
  toISPB: '00038166',
  orgnlInstrId: 'E99999010202510301212ibBkMlN4xAr',
  orgnlEndToEndId: 'E99999010202510301212ibBkMlN4xAr'
});

console.log(message);
```

### Gerar Mensagem PACS004

```javascript
import { createPacs004 } from './src/pacs004/generator.js';

const returnMessage = createPacs004({
  fromISPB: '99999010',
  toISPB: '00038166',
  transactions: [{
    orgnlEndToEndId: 'E99999010202510301212ibBkMlN4xAr',
    amount: 1000.00,
    settlementPriority: 'HIGH',
    returnReasonCode: 'BE08',
    debtorAgentISPB: '99999010',
    creditorAgentISPB: '00038166'
  }]
});
```

### Gerar Mensagem PACS008

```javascript
import { createPacs008 } from './src/pacs008/generator.js';

const payment = createPacs008({
  fromISPB: '99999010',
  toISPB: '00038166',
  instructionPriority: 'HIGH',
  serviceLevel: 'PAGPRI',
  transactions: [{
    amount: 1000.00,
    acceptanceDateTime: new Date(),
    initiationForm: 'MANU',
    debtor: {
      name: 'Fulano da Silva',
      cpfCnpj: '70000000000'
    },
    debtorAccount: {
      accountNumber: '500000',
      type: 'CACC'
    },
    debtorAgentISPB: '99999010',
    creditorAgentISPB: '00038166',
    creditor: {
      cpfCnpj: '80000000000'
    },
    creditorAccount: {
      accountNumber: '600000',
      type: 'SVGS'
    },
    purpose: 'IPAY'
  }]
});
```

### Validar Mensagem

```javascript
import { validatePacs002 } from './src/pacs002/validator.js';

// Validação apenas com regras de negócio (padrão)
const validation = await validatePacs002(xmlMessage);

// Validação com XSD habilitado
const validationWithXsd = await validatePacs002(xmlMessage, {
  xsd: true,
  signature: false,
  businessRules: true,
  preprocess: true
});

if (validationWithXsd.valid) {
  console.log('✓ Mensagem válida!');
  console.log(`Tipo detectado: ${validationWithXsd.detected?.message} v${validationWithXsd.detected?.spiVersion}`);
} else {
  console.log('✗ Erros:');
  validationWithXsd.errors.forEach(err => console.log(`  - ${err}`));
  
  // Erros detalhados do XSD
  if (validationWithXsd.xsd && !validationWithXsd.xsd.ok) {
    console.log('\nErros XSD:');
    validationWithXsd.xsd.errors.forEach(err => {
      const location = err.line ? ` (linha ${err.line}, col ${err.column})` : '';
      console.log(`  - ${err.message}${location}`);
    });
  }
}
```

### Gerar Exemplos

```bash
# Gerar mensagens com validação apenas de regras de negócio (padrão)
node main.js

# Gerar mensagens com validação XSD habilitada
node main.js --xsd

# Gerar mensagens assinadas digitalmente (requer certificados)
node main.js --sign

# Gerar mensagens com validação XSD e assinatura digital
node main.js --xsd --sign
```

Gera 23 mensagens em `/out`:
- 10 mensagens PACS002
- 5 mensagens PACS004
- 8 mensagens PACS008

**Com a flag `--xsd`:**
- Valida todas as mensagens contra os XSDs do Catálogo do SPI
- Detecta automaticamente versão e tipo de mensagem (namespace + MsgDefIdr)
- Pré-processa XML (remove padding #x0000, BOM, caracteres inválidos)
- Exibe detalhes da validação XSD incluindo linha/coluna dos erros
- Ignora elementos XMLDSig dentro de `<Sgntr>` durante validação XSD (o XSD define `<Sgntr>` como `<xs:any namespace="http://www.w3.org/2000/09/xmldsig#"/>`, permitindo qualquer estrutura XMLDSig válida. A validação estrutural e criptográfica da assinatura é feita separadamente pelo módulo de validação XMLDSig)

**Com a flag `--sign`:**
- Assina todas as mensagens usando XMLDSig conforme Manual de Segurança do Pix
- Requer certificados em `cert/private-key.pem` e `cert/certificate.pem`
- Pode usar variáveis de ambiente: `PRIVATE_KEY_PATH` e `CERTIFICATE_PATH`
- Assinatura é inserida em `<AppHdr><Sgntr><ds:Signature>...</ds:Signature></Sgntr>`
- Valida assinatura após geração (quando `--xsd` também está habilitado)

**Gerar Certificados de Teste:**

Para usar a flag `--sign`, você precisa de certificados. Use o script incluído:

```bash
# Gerar certificados de teste (auto-assinados, válidos por 365 dias)
./generate-certs.sh

# Ou criar manualmente:
mkdir -p cert
openssl genrsa -out cert/private-key.pem 2048
openssl req -new -x509 -key cert/private-key.pem -out cert/certificate.pem -days 365 \
  -subj "/C=BR/ST=Brasil/L=Brasilia/O=Teste SPI/OU=Desenvolvimento/CN=Teste Assinatura XML SPI"
```

> **Nota:** Certificados auto-assinados são apenas para testes. Em produção, use certificados ICP-Brasil válidos.

## Estrutura do Projeto

```
ISO20022/
├── api/                      # API REST
│   ├── server.js            # Servidor Express
│   ├── database.js          # Operações de banco
│   ├── services/            # Lógica de negócio
│   │   └── messageService.js
│   ├── controllers/         # Controllers HTTP
│   │   └── messages.js
│   ├── middleware/          # Middlewares
│   │   └── idempotency.js
│   ├── routes/              # Rotas
│   │   └── index.js
│   └── utils/               # Utilitários da API
│       └── validation.js
├── src/                     # Geradores e validadores
│   ├── pacs002/
│   │   ├── generator.js     # Geração PACS002
│   │   ├── validator.js     # Validação PACS002
│   │   ├── types.js         # Constantes e códigos
│   │   ├── utils.js         # Utilitários
│   │   └── index.js         # Exportações
│   ├── pacs004/
│   │   ├── generator.js
│   │   ├── validator.js
│   │   ├── types.js
│   │   ├── utils.js
│   │   └── index.js
│   ├── pacs008/
│   │   ├── generator.js
│   │   ├── validator.js
│   │   ├── types.js
│   │   ├── utils.js
│   │   └── index.js
│   └── validation/         # Módulos de validação
│       ├── xmlPreprocessor.js    # Pré-sanitização XML
│       ├── xsdValidator.js       # Validação XSD manual
│       ├── xmldsigValidator.js  # Validação assinatura XMLDSig
│       ├── xmlSigner.js          # Geração de assinatura XMLDSig
│       ├── validator.js           # Validador consolidado
│       ├── commonParsers.js       # Parsers comuns
│       ├── commonValidators.js    # Validadores comuns
│       └── index.js               # Exportações
├── data/                    # Banco de dados SQLite
│   └── iso20022.db
├── docs/                    # Schemas XSD do Catálogo SPI
│   ├── pacs002/
│   │   └── pacs.002.spi.1.14.xsd
│   ├── pacs004/
│   │   └── pacs.004.spi.1.5.xsd
│   └── pacs008/
│       └── pacs.008.spi.1.13.xsd
├── cert/                   # Certificados para assinatura (gitignored)
│   ├── private-key.pem     # Chave privada (gerar com generate-certs.sh)
│   └── certificate.pem    # Certificado (gerar com generate-certs.sh)
├── examples/                # Exemplos de referência
├── out/                     # Mensagens geradas
├── main.js                  # Script de exemplos
├── generate-certs.sh        # Script para gerar certificados de teste
└── package.json
```

## Validações

### Validação XSD

A biblioteca implementa validação completa contra os XSDs do Catálogo do SPI, conforme especificações do Banco Central.

#### Características

- ✅ **Detecção automática de versão/mensagem**: Analisa namespace do `<Envelope>` e `AppHdr.MsgDefIdr` para identificar tipo e versão SPI
- ✅ **Cache de XSDs compilados**: XSDs são carregados e compilados uma vez para melhor performance
- ✅ **Pré-sanitização conforme Volume VI**: Remove padding `#x0000`, BOM e caracteres inválidos antes da validação
- ✅ **Erros detalhados**: Retorna linha, coluna e xpath dos erros encontrados
- ✅ **Tratamento de XMLDSig**: Ignora elementos XMLDSig dentro de `<Sgntr>` durante validação XSD. O XSD define `<Sgntr>` como `<xs:any namespace="http://www.w3.org/2000/09/xmldsig#"/>`, permitindo qualquer estrutura XMLDSig válida sem especificar elementos ou ordem específicos. A validação estrutural e criptográfica da assinatura é realizada separadamente pelo módulo de validação XMLDSig (`xmldsigValidator.js`)

#### Tipos de Mensagem Suportados

- **PACS002** v1.14: `docs/pacs002/pacs.002.spi.1.14.xsd`
- **PACS004** v1.5: `docs/pacs004/pacs.004.spi.1.5.xsd`
- **PACS008** v1.13: `docs/pacs008/pacs.008.spi.1.13.xsd`

#### Uso Programático

```javascript
import { validateXsd, detect } from './src/validation/xsdValidator.js';

// Detectar tipo/versão sem validar
const detected = detect(xml);
console.log(`Mensagem: ${detected.message}, Versão: ${detected.spiVersion}`);

// Validar contra XSD
const result = await validateXsd(xml);
if (result.ok) {
  console.log('✓ XML válido contra XSD');
  console.log(`Tipo detectado: ${result.detected.message} v${result.detected.spiVersion}`);
} else {
  console.log('✗ Erros de validação XSD:');
  result.errors.forEach(err => {
    const location = err.line ? ` (linha ${err.line}, col ${err.column})` : '';
    console.log(`  - ${err.message}${location}`);
  });
}
```

#### Validação de Assinatura XMLDSig

A biblioteca também valida e gera assinaturas XMLDSig conforme Manual de Segurança do Pix:

**Estrutura Correta da Assinatura:**
```xml
<AppHdr>
  <Sgntr>
    <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
      <ds:SignedInfo>
        <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
        <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
        <!-- 3 referências obrigatórias -->
        <ds:Reference URI="#key-info-id">...</ds:Reference>
        <ds:Reference URI="#_0">...</ds:Reference>
        <ds:Reference URI="#document-id">...</ds:Reference>
      </ds:SignedInfo>
      <ds:SignatureValue>...</ds:SignatureValue>
      <ds:KeyInfo Id="key-info-id">
        <ds:X509Data>
          <ds:X509Certificate>...</ds:X509Certificate>
          <ds:X509IssuerSerial>
            <ds:X509IssuerName>...</ds:X509IssuerName>
            <ds:X509SerialNumber>...</ds:X509SerialNumber>
          </ds:X509IssuerSerial>
        </ds:X509Data>
      </ds:KeyInfo>
    </ds:Signature>
  </Sgntr>
</AppHdr>
```

**Requisitos do BC:**
- ✅ **Localização**: Assinatura deve estar em `<AppHdr><Sgntr><ds:Signature>`
- ✅ **3 referências obrigatórias**: 
  1. KeyInfo (com Id, apenas C14N exclusiva)
  2. AppHdr (com `enveloped-signature` + Exclusive C14N)
  3. Document (com Exclusive C14N)
- ✅ **Algoritmos exatos**:
  - Canonicalização: `http://www.w3.org/2001/10/xml-exc-c14n#`
  - Assinatura: `http://www.w3.org/2001/04/xmldsig-more#rsa-sha256`
  - Digest: `http://www.w3.org/2001/04/xmlenc#sha256`
  - Transform AppHdr: `http://www.w3.org/2000/09/xmldsig#enveloped-signature`
- ✅ **KeyInfo com X509IssuerSerial**: Issuer DN + Serial Number (ICP-Brasil)

**Assinatura de XML:**

```javascript
import { signXml } from './src/validation/xmlSigner.js';

const signedXml = signXml(xml, {
  privateKeyPEM: fs.readFileSync('cert/private-key.pem', 'utf8'),
  certificatePEM: fs.readFileSync('cert/certificate.pem', 'utf8'),
  keyInfoId: 'key-info-id' // opcional, padrão: 'key-info-id'
});
```

```javascript
import { validateSignature } from './src/validation/xmldsigValidator.js';

const result = await validateSignature(xml, {
  resolveCertificateByIssuerSerial: async (issuerDN, serialNumber) => {
    // Resolver certificado ICP-Brasil pelo Issuer/Serial
    return certPem; // Retorna certificado em formato PEM
  }
});

if (result.ok) {
  console.log('✓ Assinatura válida');
  console.log(`Algoritmos: ${result.details.algorithms.signature}`);
} else {
  console.log('✗ Erros na assinatura:');
  result.errors.forEach(err => console.log(`  - ${err.message}`));
}
```

#### Validação Completa (XSD + Assinatura + Regras de Negócio)

```javascript
import { validateAll } from './src/validation/validator.js';

const result = await validateAll(xml, {
  xsd: true,
  signature: true,
  businessRules: true,
  preprocess: true
});

if (result.valid) {
  console.log('✓ Todas as validações passaram');
} else {
  // Erros consolidados de todas as validações
  console.log('✗ Erros encontrados:');
  // Verificar result.xsd.errors, result.signature.errors, result.businessRules.errors
}
```

### Formatos Validados

**PACS002:**
- ISPB: `[0-9A-Z]{8}`
- MsgId: `M[0-9A-Z]{8}[a-zA-Z0-9]{23}` (32 chars)
- EndToEndId: `E[0-9A-Z]{8}[0-9]{12}[a-zA-Z0-9]{11}` (32 chars)
- OrgnlInstrId: `[ED][0-9A-Z]{8}[0-9]{12}[a-zA-Z0-9]{11}` (32 chars)

**PACS004:**
- RtrId: `D[0-9A-Z]{8}[0-9]{12}[a-zA-Z0-9]{11}` (32 chars)
- Settlement Priority: HIGH ou NORM

**PACS008:**
- CPF: 11 dígitos
- CNPJ: 14 dígitos
- Conta: máximo 20 dígitos
- Agência: máximo 4 dígitos
- Chave Pix: CPF, CNPJ, Email, Telefone (+55...) ou UUID
- TxId: 25 chars (QRES/INIC) ou 26-35 chars (QRDN/AUTO)

### Regras de Negócio

- ✅ Campos obrigatórios presentes
- ✅ Códigos válidos conforme SPI
- ✅ Consistência entre campos (BizMsgIdr = GrpHdr.MsgId)
- ✅ PACS002: RJCT requer código de erro
- ✅ PACS004: NbOfTxs = número de transações
- ✅ PACS008: Prxy obrigatório para QRDN/QRES/APDN/INIC
- ✅ PACS008: GSCB requer 2 valores (VLCP + VLDN)
- ✅ PACS008: OTHR requer 1 valor (VLDN)
- ✅ PACS008: Limites de transações (1-10 ou 1-500)

## Códigos de Status HTTP

- `200` - Sucesso (idempotente - mensagem já existe)
- `201` - Created (nova mensagem)
- `400` - Erro de validação ou idempotency key ausente
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

## Testes

### Testes de Geração de Mensagens

```bash
# Gerar mensagens com validação básica
node main.js

# Gerar mensagens com validação XSD habilitada
node main.js --xsd

# Gerar mensagens assinadas digitalmente (requer certificados)
node main.js --sign

# Gerar mensagens com validação XSD e assinatura digital
node main.js --xsd --sign
```

**Com a flag `--xsd`:**
- Valida todas as mensagens contra os XSDs do Catálogo do SPI
- Detecta automaticamente versão e tipo de mensagem (namespace + MsgDefIdr)
- Pré-processa XML (remove padding #x0000, BOM, caracteres inválidos)
- Exibe detalhes da validação XSD incluindo linha/coluna dos erros
- Ignora elementos XMLDSig dentro de `<Sgntr>` durante validação XSD (o XSD define `<Sgntr>` como `<xs:any namespace="http://www.w3.org/2000/09/xmldsig#"/>`, permitindo qualquer estrutura XMLDSig válida. A validação estrutural e criptográfica da assinatura é feita separadamente pelo módulo de validação XMLDSig)

**Com a flag `--sign`:**
- Assina todas as mensagens usando XMLDSig conforme Manual de Segurança do Pix
- Requer certificados em `cert/private-key.pem` e `cert/certificate.pem`
- Pode usar variáveis de ambiente: `PRIVATE_KEY_PATH` e `CERTIFICATE_PATH`
- Assinatura é inserida em `<AppHdr><Sgntr><ds:Signature>...</ds:Signature></Sgntr>`
- Valida assinatura após geração (quando `--xsd` também está habilitado)

Gera 23 mensagens em `/out`:
- 10 mensagens PACS002
- 5 mensagens PACS004
- 8 mensagens PACS008

### Testes da API REST

A API inclui uma suíte completa de testes automatizados que valida todos os endpoints e funcionalidades.

#### Executar Testes

```bash
# Certifique-se de que a API está rodando em http://localhost:3000
npm run dev

# Em outro terminal, execute os testes
npm test
# ou
npm run test:api
# ou diretamente
node api/test-api.js
```

#### Cobertura de Testes

A suíte de testes executa **13 testes** cobrindo:

**1. Health Check**
- Verifica se o servidor está respondendo corretamente

**2. Geração de Mensagens**
- ✅ PACS002 (ACSP - Accepted Settlement in Process)
- ✅ PACS002 (RJCT - Rejected com código de erro)
- ✅ PACS004 (Payment Return)
- ✅ PACS008 (Customer Credit Transfer)

**3. Idempotência**
- ✅ Testa criação de mensagem com chave única
- ✅ Verifica retorno de mensagem existente com mesma chave
- ✅ Valida status codes (201 para nova, 200 para existente)

**4. Consultas**
- ✅ Buscar mensagem por ID
- ✅ Listar mensagens com paginação
- ✅ Filtrar por tipo de mensagem
- ✅ Estatísticas gerais

**5. Validação**
- ✅ Endpoint de validação de XML

**6. Tratamento de Erros**
- ✅ Rejeição de requisição sem Idempotency-Key
- ✅ Validação de tipo de mensagem inválido
- ✅ Validação de parâmetros de paginação inválidos

#### Detalhes dos Testes

**Testes de Geração:**
- Gera IDs válidos no formato correto (EndToEndId, OrgnlInstrId)
- Valida formato de ISPB (8 caracteres alfanuméricos)
- Testa diferentes status de transação (ACSP, RJCT)
- Verifica códigos de devolução (BE08, AM04, etc.)
- Valida diferentes formas de iniciação (MANU, QRES, QRDN)

**Testes de Idempotência:**
- Primeira requisição retorna 201 Created
- Segunda requisição com mesma chave retorna 200 OK
- Verifica que `isNew: false` na segunda requisição
- Garante que não há duplicatas no banco de dados

**Testes de Validação:**
- Validação de parâmetros de entrada
- Validação de tipos de mensagem
- Validação de paginação (limit/offset)
- Validação de IDs numéricos

**Testes de Erros:**
- Verifica mensagens de erro apropriadas
- Valida status codes HTTP corretos
- Testa casos de borda e valores inválidos

## Notas Importantes

- **Datas**: Formato ISO 8601
- **Valores monetários**: Números decimais
- **CPF/CNPJ**: Sem formatação (apenas dígitos)
- **Assinatura**: `<Sgntr>` vazio por padrão (use `--sign` para assinar ou adicione assinatura manualmente em produção)
- **Validação XSD**: Utiliza validação manual baseada em parsing DOM dos XSDs, compatível com todas as versões do Node.js (sem dependências nativas)
- **Assinatura XMLDSig**: Gerada conforme especificações exatas do BC, com KeyInfo dentro do Signature e 3 referências obrigatórias
