# PACS004 ISO20022 Implementation

Implementação completa de geração e validação de mensagens pacs.004 (Payment Return) seguindo o padrão ISO 20022 do SPI (Sistema de Pagamentos Instantâneos do Banco Central do Brasil).

## Estrutura do Projeto

```
ISO20022/
├── lib/
│   └── pacs004/
│       ├── generator.js    # Gerador de mensagens pacs004
│       ├── validator.js    # Validador de mensagens
│       ├── types.js        # Tipos e constantes (códigos de devolução)
│       └── utils.js        # Funções utilitárias (RtrId, etc.)
├── examples/
│   └── pacs004/
│       └── pacs.004.spi.1.5.xsd  # Schema XSD
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

Isso irá gerar mensagens de exemplo no diretório `/out`:

- **BE08** - Devolução por erro bancário
- **FR01** - Devolução por fraude
- **MD06** - Devolução solicitada pelo usuário
- **SL02** - Devolução por erro no Pix Saque/Troco
- **Múltiplas devoluções** - Mensagem com várias transações

### Usar a Biblioteca Programaticamente

#### Importar os Módulos

```javascript
import { createPacs004, validatePacs004 } from './lib/pacs004/index.js';
```

#### Exemplo 1: Criar Mensagem de Devolução Simples

```javascript
const returnMessage = createPacs004({
  fromISPB: '99999010',      // ISPB do PSP emissor
  toISPB: '00038166',        // ISPB do SPI
  transactions: [{
    orgnlEndToEndId: 'E99999010202510301212ibBkMlN4xAr',
    amount: 1000.00,
    settlementPriority: 'HIGH',
    returnReasonCode: 'BE08',
    additionalInfo: ['Falha operacional do PSP'],
    debtorAgentISPB: '99999010',
    creditorAgentISPB: '00038166',
    remittanceInfo: 'Devolução de pagamento'
  }]
});

console.log(returnMessage);
```

#### Exemplo 2: Criar Mensagem com Múltiplas Devoluções

```javascript
const multipleReturns = createPacs004({
  fromISPB: '99999010',
  toISPB: '00038166',
  transactions: [
    {
      orgnlEndToEndId: 'E99999010202510301212ibBkMlN4xAr',
      amount: 1000.00,
      settlementPriority: 'HIGH',
      returnReasonCode: 'FR01',
      debtorAgentISPB: '99999010',
      creditorAgentISPB: '00038166'
    },
    {
      orgnlEndToEndId: 'E99999010202510301212ibBkMlN4xBr',
      amount: 500.00,
      settlementPriority: 'NORM',
      returnReasonCode: 'MD06',
      debtorAgentISPB: '99999010',
      creditorAgentISPB: '00038166'
    }
  ]
});
```

#### Exemplo 3: Validar uma Mensagem

```javascript
import { validatePacs004 } from './lib/pacs004/validator.js';

const validation = await validatePacs004(xmlMessage);

if (validation.valid) {
  console.log('✓ Mensagem válida!');
} else {
  console.log('✗ Erros encontrados:');
  validation.errors.forEach(err => console.log(`  - ${err}`));
}
```

## Códigos de Devolução

| Código | Nome | Descrição | Uso |
|--------|------|-----------|-----|
| **BE08** | BankError | Devolução por erro bancário | Falha operacional do PSP |
| **FR01** | Fraud | Devolução por fraude | Fundada suspeita de fraude |
| **MD06** | RefundRequestByEndCustomer | Devolução solicitada pelo usuário | Solicitação do usuário recebedor |
| **SL02** | SpecificServiceOfferedByCreditorAgent | Devolução por erro no Pix Saque/Troco | Erro relacionado ao Pix Saque/Troco |

## Prioridades de Liquidação

| Código | Nome | Descrição |
|--------|------|-----------|
| **HIGH** | High | Liquidação prioritária - envio imediato |
| **NORM** | Normal | Liquidação não prioritária - envio postergado |

## Validações Implementadas

### Validações de Formato

- ✅ ISPB: 8 caracteres alfanuméricos `[0-9A-Z]{8}`
- ✅ MsgId: Formato `Mxxxxxxxxkkkkkkkkkkkkkkkkkkkkkkk` (32 caracteres)
- ✅ RtrId: Formato `DxxxxxxxxyyyyMMddHHmmkkkkkkkkkkk` (32 caracteres)
- ✅ OrgnlEndToEndId: Formato `Exxxxxxxxyyyymmddhhmmkkkkkkkkkkk` (32 caracteres)
- ✅ Datas UTC: Formato `YYYY-MM-DDTHH:mm:ss.sssZ`

### Validações de Regras de Negócio

- ✅ Códigos de devolução válidos (BE08, FR01, MD06, SL02)
- ✅ Prioridades de liquidação válidas (HIGH, NORM)
- ✅ NbOfTxs corresponde ao número de transações
- ✅ Campos obrigatórios presentes
- ✅ Informações adicionais limitadas a 105 caracteres
- ✅ Informações de remessa limitadas a 140 caracteres

## Funcionalidades

### Generator (`lib/pacs004/generator.js`)

- ✅ Função principal `createPacs004()` com validação de parâmetros
- ✅ Suporte a múltiplas transações na mesma mensagem
- ✅ Geração automática de RtrId único
- ✅ Formatação automática de datas UTC
- ✅ Validação de formatos de entrada

### Validator (`lib/pacs004/validator.js`)

- ✅ Validação XSD contra schema (opcional)
- ✅ Validação de regras de negócio
- ✅ Parsing de campos XML
- ✅ Mensagens de erro detalhadas
- ✅ Suporte a validação de arquivo ou string

### Utils (`lib/pacs004/utils.js`)

- ✅ `generateRtrId(ispb, date)` - Gera RtrId único
- ✅ `validateRtrId(rtrId)` - Valida formato RtrId
- ✅ Reutiliza funções comuns de utils do pacs002

## Conformidade

Esta implementação segue:
- ✅ ISO 20022 pacs.004.001.09
- ✅ Especificação SPI pacs.004.spi.1.5
- ✅ Padrões do Pix (Banco Central do Brasil)

## Referências

- [ISO 20022](https://www.iso20022.org/)
- [Banco Central do Brasil - Pix](https://www.bcb.gov.br/estabilidadefinanceira/pix)
- [Especificações Técnicas do SPI](https://www.bcb.gov.br/estabilidadefinanceira/comunicacaodados)

## Licença

ISC

