export const NAMESPACE = 'https://www.bcb.gov.br/pi/pacs.004/1.5';
export const MSG_DEF_IDR = 'pacs.004.spi.1.5';

export const ReturnReasonCode = {
  BE08: {
    code: 'BE08',
    name: 'BankError',
    description: 'Returned as a result of a bank error.',
    comment: 'Devolução de pagamento iniciada pelo participante do usuário recebedor no âmbito do Mecanismo Especial de Devolução. Deve ser preenchido sempre que uma solicitação de devolução for iniciada pelo participante do usuário pagador com o motivo falha operacional do PSP do pagador ou sempre que a devolução for iniciada pelo participante do usuário recebedor por falha operacional em seus próprios sistemas.'
  },
  FR01: {
    code: 'FR01',
    name: 'Fraud',
    description: 'Returned as a result of fraud.',
    comment: 'Devolução de pagamento, iniciada pelo participante do usuário recebedor no âmbito do Mecanismo Especial de Devolução, motivada por fundada suspeita de fraude. Deve ser preenchido sempre que uma solicitação de devolução for iniciada pelo participante do usuário pagador com o motivo fundada suspeita de fraude ou sempre que a devolução for iniciada pelo participante do usuário recebedor por fundada suspeita de fraude.'
  },
  MD06: {
    code: 'MD06',
    name: 'RefundRequestByEndCustomer',
    description: 'Return of funds requested by end customer',
    comment: 'Devolução de pagamento solicitado pelo usuário recebedor.'
  },
  SL02: {
    code: 'SL02',
    name: 'SpecificServiceOfferedByCreditorAgent',
    description: 'Due to specific service offered by the Creditor Agent',
    comment: 'Devolução de pagamento solicitada pelo usuário recebedor motivada por um erro na transação ou desacordo entre as partes relacionados ao Pix Saque ou ao Pix Troco.'
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

export const SettlementPriority = {
  HIGH: {
    code: 'HIGH',
    name: 'High',
    description: 'Priority level is high.',
    comment: 'Liquidação Prioritária. Deve ser utilizado quando o usuário recebedor do pagamento original solicita o envio imediato da devolução.'
  },
  NORM: {
    code: 'NORM',
    name: 'Normal',
    description: 'Priority level is normal.',
    comment: 'Liquidação Não Prioritária. Deve ser utilizado quando o usuário recebedor do pagamento original solicita que o envio da devolução seja postergado ou quando o PSP emissor da ordem de devolução necessita, justificadamente, atrasar a devolução dos valores do pagamento devido aos processos internos de prevenção à fraude.'
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

export function isValidReturnReasonCode(code) {
  return code && ReturnReasonCode[code] !== undefined;
}

export function isValidSettlementPriority(code) {
  return code && SettlementPriority[code] !== undefined;
}

export function getReturnReasonCode(code) {
  return ReturnReasonCode[code] || null;
}

export function getSettlementPriority(code) {
  return SettlementPriority[code] || null;
}
