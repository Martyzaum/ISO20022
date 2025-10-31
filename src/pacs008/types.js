export const NAMESPACE = 'https://www.bcb.gov.br/pi/pacs.008/1.13';
export const MSG_DEF_IDR = 'pacs.008.spi.1.13';

export const PaymentInitiationForm = {
  APDN: {
    code: 'APDN',
    name: 'Pix por aproximação dinâmico',
    description: 'Utilizado quando o pagamento for iniciado por aproximação a partir de informações geradas para um QR Code dinâmico.'
  },
  AUTO: {
    code: 'AUTO',
    name: 'Pix Automático',
    description: 'Utilizado quando o pagamento for iniciado no âmbito do Pix Automático.'
  },
  DICT: {
    code: 'DICT',
    name: 'Inserção manual de chave Pix',
    description: 'Utilizado quando o pagamento for iniciado por meio de inserção manual de chave Pix.'
  },
  INIC: {
    code: 'INIC',
    name: 'Iniciado por meio de serviço de iniciação de transação de pagamento',
    description: 'Pix iniciado por meio de serviço de iniciação de transação de pagamento, nos casos em que o participante possui todas as informações do usuário recebedor'
  },
  MANU: {
    code: 'MANU',
    name: 'Inserção manual de dados da conta transacional',
    description: 'Utilizado quando o pagamento for iniciado por meio de inserção manual dos dados da conta.'
  },
  QRDN: {
    code: 'QRDN',
    name: 'QR code dinâmico',
    description: 'Utilizado quando o pagamento for iniciado por meio de leitura de QR code dinâmico.'
  },
  QRES: {
    code: 'QRES',
    name: 'QR code estático',
    description: 'Utilizado quando o pagamento for iniciado por meio de leitura de QR code estático.'
  }
};

export const PaymentPurpose = {
  GSCB: {
    code: 'GSCB',
    name: 'PurchaseSaleOfGoodsAndServicesWithCashBack',
    description: 'Transaction is related to purchase and sale of goods and services with cash back.',
    comment: 'Pix Troco'
  },
  IPAY: {
    code: 'IPAY',
    name: 'InstantPayments',
    description: 'Transaction in which the amount is available to the payee immediately.',
    comment: 'Compra ou transferência'
  },
  OTHR: {
    code: 'OTHR',
    name: 'Other',
    description: 'Other payment purpose.',
    comment: 'Pix Saque'
  },
  REFU: {
    code: 'REFU',
    name: 'Refund',
    description: 'Transaction is the payment of a refund',
    comment: 'Reembolso total ou parcial ao participante do usuário pagador no âmbito do MED (Mecanismo Especial de Devolução) para o Pix Automático pela utilização de recursos próprios para ressarcimento do usuário pagador'
  }
};

export const AccountType = {
  CACC: {
    code: 'CACC',
    name: 'Current',
    description: 'Account used to post debits and credits when no specific account has been nominated.',
    comment: 'Conta corrente de cliente ou conta de instituição participante direto do SPI para liquidação de obrigações e direitos próprios.'
  },
  SLRY: {
    code: 'SLRY',
    name: 'Salary',
    description: 'Accounts used for salary payments.',
    comment: 'Conta-Salário. Para uso exclusivo da Secretaria do Tesouro Nacional (STN) e apenas quando se tratar de <CdtrAcct>.'
  },
  SVGS: {
    code: 'SVGS',
    name: 'Savings',
    description: 'Account used for savings.',
    comment: 'Conta de Poupança'
  },
  TRAN: {
    code: 'TRAN',
    name: 'TransactingAccount',
    description: 'A transacting account is the most basic type of bank account that you can get.',
    comment: 'Conta de Pagamento'
  }
};

export const InstructionPriority = {
  HIGH: {
    code: 'HIGH',
    name: 'High',
    description: 'Priority level is high.',
    comment: 'Liquidação Prioritária. Deve ser utilizado quando o usuário pagador solicita o envio imediato do pagamento.'
  },
  NORM: {
    code: 'NORM',
    name: 'Normal',
    description: 'Priority level is normal.',
    comment: 'Liquidação Não Prioritária. Deve ser utilizado quando o usuário pagador faz um Pix Agendado ou quando o tempo máximo para autorização de iniciação da transação pelo participante do usuário pagador é ampliado, nos casos de transações com suspeita de fraude.'
  }
};

export const ServiceLevel = {
  PAGAGD: {
    code: 'PAGAGD',
    name: 'Pagamento Agendado',
    description: 'Pagamento agendado.'
  },
  PAGFRD: {
    code: 'PAGFRD',
    name: 'Pagamento com Suspeita de Fraude',
    description: 'Pagamento sob análise antifraude.'
  },
  PAGPRI: {
    code: 'PAGPRI',
    name: 'Pagamento Prioritário',
    description: 'Pagamento prioritário.'
  }
};

export const SettlementMethod = {
  CLRG: {
    code: 'CLRG',
    name: 'ClearingSystem',
    description: 'Settlement is done through a payment clearing system.',
    comment: 'Método de liquidação por intermédio do sistema de pagamentos instantâneos (SPI)'
  }
};

export const ChargeBearer = {
  SLEV: {
    code: 'SLEV',
    name: 'FollowingServiceLevel',
    description: 'Charges are to be applied following the rules agreed in the service level and/or scheme.',
    comment: 'As cobranças devem ser aplicadas de acordo com as regras acordadas no nível de serviço.'
  }
};

export const AgentModality = {
  AGFSS: {
    code: 'AGFSS',
    name: 'Agente Facilitador de Serviço de Saque',
    description: 'Pix Saque ou Pix Troco com ressarcimento de custos operacionais (RCO) de participante facilitador de serviço de saque (FSS) que facilita diretamente o serviço de saque.'
  },
  AGTEC: {
    code: 'AGTEC',
    name: 'Agente Estabelecimento Comercial',
    description: 'Pix Saque ou Pix Troco com ressarcimento de custos operacionais (RCO) de agente de saque que é um estabelecimento comercial.'
  },
  AGTOT: {
    code: 'AGTOT',
    name: 'Agente Outra Espécie de Pessoa Jurídica ou Correspondente no País',
    description: 'Pix Saque ou Pix Troco com ressarcimento de custos operacionais (RCO) de agente de saque que é outra espécie de pessoa jurídica ou correspondente no País'
  }
};

export const AmountReason = {
  VLCP: {
    code: 'VLCP',
    name: 'Valor da compra',
    description: 'Valor da compra nas transações do tipo Pix Troco.'
  },
  VLDN: {
    code: 'VLDN',
    name: 'Valor do recurso em espécie disponibilizado',
    description: 'Recurso em espécie disponibilizado ao usuário pagador.'
  }
};

export function isValidPaymentInitiationForm(code) {
  return code && PaymentInitiationForm[code] !== undefined;
}

export function isValidPaymentPurpose(code) {
  return code && PaymentPurpose[code] !== undefined;
}

export function isValidAccountType(code) {
  return code && AccountType[code] !== undefined;
}

export function isValidInstructionPriority(code) {
  return code && InstructionPriority[code] !== undefined;
}

export function isValidServiceLevel(code) {
  return code && ServiceLevel[code] !== undefined;
}

export function getPaymentInitiationForm(code) {
  return PaymentInitiationForm[code] || null;
}

export function getPaymentPurpose(code) {
  return PaymentPurpose[code] || null;
}
