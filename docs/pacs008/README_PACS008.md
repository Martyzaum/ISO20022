# PACS008 ISO20022 Implementation

Implementação completa de geração e validação de mensagens pacs.008 (Customer Credit Transfer) seguindo o padrão ISO 20022 do SPI (Sistema de Pagamentos Instantâneos do Banco Central do Brasil).

## Estrutura do Projeto

```
ISO20022/
├── lib/
│   └── pacs008/
│       ├── generator.js    # Gerador de mensagens pacs008
│       ├── validator.js    # Validador de mensagens
│       ├── types.js        # Tipos e constantes (formas de iniciação, finalidades, etc.)
│       └── utils.js        # Funções utilitárias (CPF/CNPJ, Pix key, etc.)
├── examples/
│   └── pacs008/
│       └── pacs.008.spi.1.13.xsd  # Schema XSD
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

Isso irá gerar mensagens de exemplo no diretório `/out` para diferentes cenários:

- **MANU** - Pagamento manual
- **QRDN** - QR Code dinâmico
- **QRES** - QR Code estático
- **OTHR** - Pix Saque
- **GSCB** - Pix Troco
- **PAGAGD** - Pix Agendado
- **AUTO** - Pix Automático
- **Múltiplas transações** - Mensagem com várias transações

### Usar a Biblioteca Programaticamente

#### Importar os Módulos

```javascript
import { createPacs008, validatePacs008 } from './lib/pacs008/index.js';
```

#### Exemplo 1: Criar Pagamento Manual

```javascript
const paymentMessage = createPacs008({
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
      agency: '3000',
      type: 'CACC'
    },
    debtorAgentISPB: '99999010',
    creditorAgentISPB: '00038166',
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
  }]
});
```

#### Exemplo 2: Criar Pagamento com QR Code Dinâmico

```javascript
const qrCodePayment = createPacs008({
  fromISPB: '99999010',
  toISPB: '00038166',
  instructionPriority: 'HIGH',
  serviceLevel: 'PAGPRI',
  transactions: [{
    txId: 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRr',
    amount: 1000.00,
    acceptanceDateTime: new Date(),
    initiationForm: 'QRDN',
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
      type: 'SVGS',
      pixKey: 'b6cdf262-4c58-4698-9517-f694e81893d4'
    },
    purpose: 'IPAY'
  }]
});
```

#### Exemplo 3: Criar Pix Troco (GSCB)

```javascript
const pixTroco = createPacs008({
  fromISPB: '99999010',
  toISPB: '00038166',
  instructionPriority: 'HIGH',
  serviceLevel: 'PAGPRI',
  transactions: [{
    txId: 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRr',
    amount: 1500.00,
    acceptanceDateTime: new Date(),
    initiationForm: 'QRDN',
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
      type: 'SVGS',
      pixKey: 'b6cdf262-4c58-4698-9517-f694e81893d4'
    },
    purpose: 'GSCB',
    structuredRemittance: {
      agentModality: 'AGTEC',
      facilitatorISPB: '01234567',
      amounts: [
        { amount: 1000.00, reason: 'VLCP' },
        { amount: 500.00, reason: 'VLDN' }
      ]
    }
  }]
});
```

## Formas de Iniciação do Pagamento

| Código | Nome | Descrição |
|--------|------|-----------|
| **MANU** | Inserção manual de dados da conta | Dados inseridos manualmente |
| **DICT** | Inserção manual de chave Pix | Chave Pix inserida manualmente |
| **INIC** | Iniciado por serviço de iniciação | Serviço de iniciação de transação |
| **AUTO** | Pix Automático | Pagamento automático recorrente |
| **QRDN** | QR code dinâmico | QR Code dinâmico lido |
| **QRES** | QR code estático | QR Code estático lido |
| **APDN** | Pix por aproximação dinâmico | Aproximação com QR Code dinâmico |

## Finalidades de Pagamento

| Código | Nome | Descrição |
|--------|------|-----------|
| **IPAY** | InstantPayments | Compra ou transferência |
| **REFU** | Refund | Reembolso (MED) |
| **GSCB** | PurchaseSaleOfGoodsAndServicesWithCashBack | Pix Troco |
| **OTHR** | Other | Pix Saque |

## Tipos de Conta

| Código | Nome | Descrição |
|--------|------|-----------|
| **CACC** | Current | Conta corrente |
| **SVGS** | Savings | Conta poupança |
| **TRAN** | TransactingAccount | Conta de pagamento |
| **SLRY** | Salary | Conta salário (apenas para recebedor) |

## Prioridades e Níveis de Serviço

| Prioridade | Nível de Serviço | Descrição |
|------------|------------------|-----------|
| **HIGH** | PAGPRI | Pagamento prioritário |
| **NORM** | PAGFRD | Pagamento com suspeita de fraude |
| **NORM** | PAGAGD | Pagamento agendado |

## Validações Implementadas

### Validações de Formato

- ✅ ISPB: 8 caracteres alfanuméricos `[0-9A-Z]{8}`
- ✅ CPF: 11 dígitos
- ✅ CNPJ: 14 dígitos
- ✅ Conta: máximo 20 dígitos
- ✅ Agência: máximo 4 dígitos
- ✅ Chave Pix: CPF, CNPJ, Email, Telefone ou UUID
- ✅ TxId: 25 chars (QRES/INIC) ou 26-35 chars (QRDN/AUTO)
- ✅ EndToEndId: Formato `Exxxxxxxxyyyymmddhhmmkkkkkkkkkkk` (32 caracteres)

### Validações de Regras de Negócio

- ✅ Formas de iniciação válidas
- ✅ Finalidades válidas
- ✅ Tipos de conta válidos
- ✅ PAGPRI requer HIGH priority
- ✅ NORM requer PAGFRD ou PAGAGD
- ✅ GSCB requer 2 valores (VLCP e VLDN)
- ✅ OTHR requer 1 valor (VLDN)
- ✅ Prxy obrigatório para QRDN, QRES, APDN, INIC
- ✅ Prxy não permitido para MANU, AUTO
- ✅ Limites de transações por mensagem (1-10 para PAGPRI/PAGFRD, 1-500 para PAGAGD)

## Funcionalidades

### Generator (`lib/pacs008/generator.js`)

- ✅ Função principal `createPacs008()` com validação completa
- ✅ Suporte a múltiplas transações (1-10 ou 1-500 conforme nível de serviço)
- ✅ Geração automática de EndToEndId e TxId quando necessário
- ✅ Suporte a Pix Saque e Pix Troco com remessa estruturada
- ✅ Validação de consistência entre prioridade e nível de serviço

### Validator (`lib/pacs008/validator.js`)

- ✅ Validação XSD contra schema (opcional)
- ✅ Validação de regras de negócio complexas
- ✅ Parsing de campos XML
- ✅ Validação de formatos específicos (CPF/CNPJ, chave Pix, etc.)
- ✅ Mensagens de erro detalhadas

### Utils (`lib/pacs008/utils.js`)

- ✅ `validateCPF(cpf)` - Valida CPF
- ✅ `validateCNPJ(cnpj)` - Valida CNPJ
- ✅ `validatePixKey(key)` - Valida chave Pix
- ✅ `validateAccountNumber(account)` - Valida número de conta
- ✅ `validateAgency(agency)` - Valida agência
- ✅ `generateTxId(length)` - Gera TxId
- ✅ `formatCPFOrCNPJ(document)` - Formata documento
- ✅ `formatAccountNumber(account)` - Formata conta

## Conformidade

Esta implementação segue:
- ✅ ISO 20022 pacs.008.001.10
- ✅ Especificação SPI pacs.008.spi.1.13
- ✅ Padrões do Pix (Banco Central do Brasil)

## Referências

- [ISO 20022](https://www.iso20022.org/)
- [Banco Central do Brasil - Pix](https://www.bcb.gov.br/estabilidadefinanceira/pix)
- [Especificações Técnicas do SPI](https://www.bcb.gov.br/estabilidadefinanceira/comunicacaodados)

## Licença

ISC

