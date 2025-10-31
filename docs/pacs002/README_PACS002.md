# PACS002 ISO20022 Implementation

Implementação completa de geração e validação de mensagens pacs.002 (Payment Status Report) seguindo o padrão ISO 20022 do SPI (Sistema de Pagamentos Instantâneos do Banco Central do Brasil).

## Estrutura do Projeto

```
ISO20022/
├── lib/
│   └── pacs002/
│       ├── generator.js    # Gerador de mensagens pacs002
│       ├── validator.js    # Validador de mensagens
│       ├── types.js        # Tipos e constantes (códigos de status e erro)
│       └── utils.js        # Funções utilitárias
├── examples/
│   └── pacs002/
│       └── pacs.002.spi.1.14.xsd  # Schema XSD
├── out/                    # Mensagens geradas
└── main.js                 # Script principal de exemplo
```

## Instalação

```bash
npm install
```

## Uso

### Gerar Exemplos de Todas as Mensagens

Execute o script principal para gerar exemplos de todos os cenários:

```bash
node main.js
```

Isso irá gerar 10 mensagens de exemplo no diretório `/out`:

- **1 mensagem ACSP** - Pagamento aceito para processamento
- **1 mensagem ACCC** - Liquidação concluída (notificação ao recebedor)
- **1 mensagem ACSC** - Liquidação concluída (notificação ao pagador)
- **7 mensagens RJCT** - Pagamentos rejeitados com diferentes códigos de erro

### Usar a Biblioteca Programaticamente

#### Importar os Módulos

```javascript
import {
  createPacs002,
  createACSPMessage,
  createACCCMessage,
  createACSCMessage,
  createRJCTMessage
} from './lib/pacs002/generator.js';
import { validatePacs002 } from './lib/pacs002/validator.js';
```

#### Exemplo 1: Criar Mensagem ACSP (Aceito para Processamento)

```javascript
const acspMessage = createACSPMessage({
  fromISPB: '99999010',      // ISPB do PSP pagador
  toISPB: '00038166',        // ISPB do SPI
  orgnlInstrId: 'E99999010202510301212ibBkMlN4xAr',
  orgnlEndToEndId: 'E99999010202510301212ibBkMlN4xAr'
});

console.log(acspMessage);
```

#### Exemplo 2: Criar Mensagem ACCC (Liquidação Concluída - Recebedor)

```javascript
const acccMessage = createACCCMessage({
  fromISPB: '00038166',      // ISPB do SPI
  toISPB: '00038166',        // ISPB do PSP recebedor
  orgnlInstrId: 'E99999010202510301212ibBkMlN4xAr',
  orgnlEndToEndId: 'E99999010202510301212ibBkMlN4xAr',
  settlementDate: new Date(),
  accountingDate: new Date()
});
```

#### Exemplo 3: Criar Mensagem RJCT (Rejeitada)

```javascript
const rjctMessage = createRJCTMessage({
  fromISPB: '00038166',      // ISPB do PSP recebedor
  toISPB: '99999010',        // ISPB do PSP pagador
  orgnlInstrId: 'E99999010202510301212ibBkMlN4xAr',
  orgnlEndToEndId: 'E99999010202510301212ibBkMlN4xAr',
  statusReasonInfo: {
    code: 'AC03',            // Código de erro
    additionalInfo: [
      'Conta transacional do recebedor inexistente ou inválida'
    ]
  }
});
```

#### Exemplo 4: Validar uma Mensagem

```javascript
import { validatePacs002 } from './lib/pacs002/validator.js';

const validation = await validatePacs002(xmlMessage);

if (validation.valid) {
  console.log('✓ Mensagem válida!');
} else {
  console.log('✗ Erros encontrados:');
  validation.errors.forEach(err => console.log(`  - ${err}`));
}

if (validation.warnings.length > 0) {
  console.log('⚠ Avisos:');
  validation.warnings.forEach(warn => console.log(`  - ${warn}`));
}
```

## Tipos de Status de Transação

| Código | Nome | Descrição | Uso |
|--------|------|-----------|-----|
| **ACSP** | AcceptedSettlementInProcess | Instrução aceita para processamento | PSP pagador aceita a instrução |
| **ACCC** | AcceptedSettlementCompleted | Liquidação concluída (recebedor) | SPI notifica conclusão ao PSP recebedor |
| **ACSC** | AcceptedSettlementCompletedDebitor | Liquidação concluída (pagador) | SPI notifica conclusão ao PSP pagador |
| **RJCT** | Rejected | Instrução rejeitada | PSP rejeita a instrução |

## Códigos de Erro (Status RJCT)

### Erros Comuns

| Código | Nome | Descrição |
|--------|------|-----------|
| **AB03** | AbortedSettlementTimeout | Timeout durante liquidação |
| **AC03** | InvalidCreditorAccountNumber | Conta do recebedor inválida |
| **AC06** | BlockedAccount | Conta bloqueada |
| **AM04** | InsufficientFunds | Saldo insuficiente |
| **BE01** | InconsistenWithEndCustomer | CPF/CNPJ inconsistente |
| **FRAD** | FraudulentOrigin | Suspeita de fraude |
| **DS04** | OrderRejected | Ordem rejeitada |

Veja o arquivo `lib/pacs002/types.js` para a lista completa de 40+ códigos de erro.

## Validações Implementadas

### Validações de Formato

- ✅ ISPB: 8 caracteres alfanuméricos `[0-9A-Z]{8}`
- ✅ MsgId: Formato `Mxxxxxxxxkkkkkkkkkkkkkkkkkkkkkkk` (32 caracteres)
- ✅ EndToEndId: Formato `Exxxxxxxxyyyymmddhhmmkkkkkkkkkkk` (32 caracteres)
- ✅ OrgnlInstrId: Formato `[E|D]xxxxxxxxyyyymmddhhmmkkkkkkkkkkk` (32 caracteres)
- ✅ Datas UTC: Formato `YYYY-MM-DDTHH:mm:ss.sssZ`
- ✅ Datas ISO: Formato `YYYY-MM-DD`

### Validações de Regras de Negócio

- ✅ Códigos de status válidos (ACSP, ACCC, ACSC, RJCT)
- ✅ Códigos de erro válidos para status RJCT
- ✅ Status RJCT deve ter código de erro
- ✅ BizMsgIdr e GrpHdr MsgId devem ser iguais
- ✅ CreDt e CreDtTm devem ser iguais
- ✅ Campos obrigatórios presentes

## Funcionalidades

### Generator (`lib/pacs002/generator.js`)

- ✅ Função principal `createPacs002()` com validação de parâmetros
- ✅ Funções especializadas para cada tipo de mensagem
- ✅ Geração automática de MsgId único
- ✅ Formatação automática de datas UTC
- ✅ Validação de formatos de entrada
- ✅ Suporte a múltiplas informações adicionais de erro

### Validator (`lib/pacs002/validator.js`)

- ✅ Validação XSD contra schema (opcional)
- ✅ Validação de regras de negócio
- ✅ Parsing de campos XML
- ✅ Mensagens de erro detalhadas
- ✅ Suporte a validação de arquivo ou string

### Utils (`lib/pacs002/utils.js`)

- ✅ `generateMsgId(ispb)` - Gera MsgId único
- ✅ `generateEndToEndId(ispb, date)` - Gera EndToEndId
- ✅ `formatUTCDateTime(date)` - Formata data em UTC
- ✅ `formatISODate(date)` - Formata data ISO
- ✅ `validateISPB(ispb)` - Valida formato ISPB
- ✅ `validateMsgId(msgId)` - Valida formato MsgId
- ✅ `validateEndToEndId(id)` - Valida formato EndToEndId
- ✅ `validateOrgnlInstrId(id)` - Valida formato OrgnlInstrId

## Exemplos de Mensagens Geradas

### Mensagem ACSP

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Envelope xmlns="https://www.bcb.gov.br/pi/pacs.002/1.14">
    <AppHdr>
        <Fr>
            <FIId>
                <FinInstnId>
                    <Othr>
                        <Id>99999010</Id>
                    </Othr>
                </FinInstnId>
            </FIId>
        </Fr>
        <To>
            <FIId>
                <FinInstnId>
                    <Othr>
                        <Id>00038166</Id>
                    </Othr>
                </FinInstnId>
            </FIId>
        </To>
        <BizMsgIdr>M999990105CGpYsX9tnqS47uGWAyQdw7</BizMsgIdr>
        <MsgDefIdr>pacs.002.spi.1.14</MsgDefIdr>
        <CreDt>2025-10-30T15:07:57.777Z</CreDt>
        <Sgntr/>
    </AppHdr>
    <Document>
        <FIToFIPmtStsRpt>
            <GrpHdr>
                <MsgId>M999990105CGpYsX9tnqS47uGWAyQdw7</MsgId>
                <CreDtTm>2025-10-30T15:07:57.777Z</CreDtTm>
            </GrpHdr>
            <TxInfAndSts>
                <OrgnlInstrId>E99999010202510301207UGPWwvKoTOO</OrgnlInstrId>
                <OrgnlEndToEndId>E99999010202510301207UGPWwvKoTOO</OrgnlEndToEndId>
                <TxSts>ACSP</TxSts>
            </TxInfAndSts>
        </FIToFIPmtStsRpt>
    </Document>
</Envelope>
```

## Notas

### Assinatura Digital

Em ambiente de produção, o elemento `<Sgntr>` deve conter uma assinatura digital válida seguindo o padrão XMLDSig. Em ambiente de testes, é comum usar o elemento vazio `<Sgntr/>`.

### XSD Validation

A validação XSD está disponível mas é opcional. Para ativar, edite o arquivo `main.js` e defina o caminho do XSD:

```javascript
const XSD_PATH = join(__dirname, 'examples', 'pacs002', 'pacs.002.spi.1.14.xsd');
```

### Conformidade

Esta implementação segue:
- ✅ ISO 20022 pacs.002.001.10
- ✅ Especificação SPI pacs.002.spi.1.14
- ✅ Padrões do Pix (Banco Central do Brasil)

## Referências

- [ISO 20022](https://www.iso20022.org/)
- [Banco Central do Brasil - Pix](https://www.bcb.gov.br/estabilidadefinanceira/pix)
- [Especificações Técnicas do SPI](https://www.bcb.gov.br/estabilidadefinanceira/comunicacaodados)

## Licença

ISC

