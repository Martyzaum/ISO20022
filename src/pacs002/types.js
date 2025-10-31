export const TransactionStatus = {
  ACCC: {
    code: 'ACCC',
    name: 'AcceptedSettlementCompleted',
    description: 'Settlement on the creditor\'s account has been completed.',
    comment: 'Notificação do SPI da conclusão da transação ao participante do usuário recebedor.'
  },
  ACSC: {
    code: 'ACSC',
    name: 'AcceptedSettlementCompletedDebitorAccount',
    description: 'Settlement completed.',
    comment: 'Notificação do SPI da conclusão da transação ao participante do usuário pagador.'
  },
  ACSP: {
    code: 'ACSP',
    name: 'AcceptedSettlementInProcess',
    description: 'All preceding checks such as technical validation and customer profile were successful and therefore the payment instruction has been accepted for execution.',
    comment: 'Instrução de pagamento aceita após as validações realizadas pelo participante do usuário pagador.'
  },
  RJCT: {
    code: 'RJCT',
    name: 'Rejected',
    description: 'Payment instruction has been rejected.',
    comment: 'Instrução de pagamento rejeitada pelo participante do usuário pagador.'
  }
};

// Status Reason Codes (Error Codes)
export const StatusReasonCode = {
  AB03: {
    code: 'AB03',
    name: 'AbortedSettlementTimeout',
    description: 'Settlement aborted due to timeout.',
    comment: 'Liquidação da transação interrompida devido a timeout no SPI.',
    generatedBy: 'SPI'
  },
  AB09: {
    code: 'AB09',
    name: 'ErrorCreditorAgent',
    description: 'Transaction stopped due to error at the Creditor Agent.',
    comment: 'Transação interrompida devido a erro no participante do usuário recebedor.',
    generatedBy: 'Participante do usuário recebedor'
  },
  AB11: {
    code: 'AB11',
    name: 'TimeoutDebtorAgent',
    description: 'Transaction stopped due to timeout at the Debtor Agent.',
    comment: 'Timeout do participante emissor da ordem de pagamento.',
    generatedBy: 'SPI'
  },
  AC03: {
    code: 'AC03',
    name: 'InvalidCreditorAccountNumber',
    description: 'Creditor account number invalid or missing',
    comment: 'Número da agência e/ou conta transacional do usuário recebedor inexistente ou inválido.',
    generatedBy: 'Participante do usuário recebedor'
  },
  AC06: {
    code: 'AC06',
    name: 'BlockedAccount',
    description: 'Account specified is blocked, prohibiting posting of transactions against it.',
    comment: 'Conta transacional do usuário recebedor encontra-se bloqueada.',
    generatedBy: 'Participante do usuário recebedor'
  },
  AC07: {
    code: 'AC07',
    name: 'ClosedCreditorAccountNumber',
    description: 'Creditor account number closed',
    comment: 'Número da conta transacional do usuário recebedor encerrada.',
    generatedBy: 'Participante do usuário recebedor'
  },
  AC14: {
    code: 'AC14',
    name: 'InvalidCreditorAccountType',
    description: 'Creditor account type missing or invalid',
    comment: 'Tipo incorreto para a conta transacional do usuário recebedor.',
    generatedBy: 'Participante do usuário recebedor'
  },
  AG03: {
    code: 'AG03',
    name: 'TransactionNotSupported',
    description: 'Transaction type not supported/authorized on this account',
    comment: 'Tipo de transação não é suportado/autorizado na conta transacional do usuário recebedor.',
    generatedBy: 'Participante do usuário recebedor'
  },
  AG12: {
    code: 'AG12',
    name: 'NotAllowedBookTransfer',
    description: 'Payment orders made by transferring funds from one account to another at the same financial institution are not allowed.',
    comment: 'Não é permitida ordem de pagamento/devolução no SPI cujos recursos sejam transferidos de uma conta transacional para outra em uma mesma instituição participante.',
    generatedBy: 'SPI'
  },
  AG13: {
    code: 'AG13',
    name: 'ForbiddenReturnPayment',
    description: 'Returned payments derived from previously returned transactions are not allowed.',
    comment: 'Não é permitido devolver a devolução de um pagamento instantâneo.',
    generatedBy: 'SPI'
  },
  AGNT: {
    code: 'AGNT',
    name: 'IncorrectAgent',
    description: 'Agent in the payment workflow is incorrect',
    comment: 'Participante direto não é liquidante do participante do usuário pagador.',
    generatedBy: 'SPI'
  },
  AM01: {
    code: 'AM01',
    name: 'ZeroAmount',
    description: 'Specified message amount is equal to zero',
    comment: 'Ordem de pagamento instantâneo com valor zero.',
    generatedBy: 'SPI'
  },
  AM02: {
    code: 'AM02',
    name: 'NotAllowedAmount',
    description: 'Specific transaction/message amount is greater than allowed maximum',
    comment: 'Ordem de pagamento/devolução em valor que faz superar o limite permitido para o tipo de conta transacional creditada.',
    generatedBy: 'Participante do usuário recebedor'
  },
  AM04: {
    code: 'AM04',
    name: 'InsufficientFunds',
    description: 'Amount of funds available to cover specified message amount is insufficient.',
    comment: 'Saldo insuficiente na conta PI do participante do usuário pagador.',
    generatedBy: 'SPI'
  },
  AM09: {
    code: 'AM09',
    name: 'WrongAmount',
    description: 'Amount received is not the amount agreed or expected',
    comment: 'Devolução de pagamento em valor que faz superar o valor da ordem de pagamento instantâneo correspondente.',
    generatedBy: 'Participante do usuário recebedor'
  },
  AM12: {
    code: 'AM12',
    name: 'InvalidAmount',
    description: 'Amount is invalid or missing',
    comment: 'Divergência entre a somatória dos valores do bloco valorDoDinheiroOuCompra e o campo valor.',
    generatedBy: 'SPI'
  },
  AM18: {
    code: 'AM18',
    name: 'InvalidNumberOfTransactions',
    description: 'Number of transactions is invalid or missing.',
    comment: 'Quantidade de transações inválida.',
    generatedBy: 'SPI'
  },
  BE01: {
    code: 'BE01',
    name: 'InconsistenWithEndCustomer',
    description: 'Identification of end customer is not consistent with associated account number.',
    comment: 'CPF/CNPJ do usuário recebedor não é consistente com o titular da conta transacional especificada.',
    generatedBy: 'Participante do usuário recebedor'
  },
  BE05: {
    code: 'BE05',
    name: 'UnrecognisedInitiatingParty',
    description: 'Party who initiated the message is not recognised by the end customer',
    comment: 'CNPJ do iniciador de pagamento não se encontra cadastrado no arranjo Pix.',
    generatedBy: 'SPI'
  },
  BE15: {
    code: 'BE15',
    name: 'InvalidIdentificationCode',
    description: 'Identification code missing or invalid.',
    comment: 'Preenchimento incorreto do campo idConciliacaoRecebedor.',
    generatedBy: 'Participante do usuário recebedor'
  },
  BE17: {
    code: 'BE17',
    name: 'InvalidCreditorIdentificationCode',
    description: 'Creditor or Ultimate Creditor identification code missing or invalid',
    comment: 'QR Code rejeitado pelo participante do usuário recebedor.',
    generatedBy: 'Participante do usuário recebedor'
  },
  CH11: {
    code: 'CH11',
    name: 'CreditorIdentifierIncorrect',
    description: 'Value in Creditor Identifier is incorrect',
    comment: 'CPF/CNPJ do usuário recebedor incorreto.',
    generatedBy: 'Participante do usuário recebedor'
  },
  CH16: {
    code: 'CH16',
    name: 'ElementContentFormallyIncorrect',
    description: 'Content is incorrect',
    comment: 'Preenchimento do conteúdo da mensagem incorreto ou incompatível com as regras de negócio.',
    generatedBy: 'SPI'
  },
  CN01: {
    code: 'CN01',
    name: 'AuthorisationCancelled',
    description: 'Authorisation is cancelled.',
    comment: 'Agendamento de pagamento recorrente cancelado com statusDoCancelamento igual a "ACCR (confirmado)".',
    generatedBy: 'Participante do usuário recebedor'
  },
  DS04: {
    code: 'DS04',
    name: 'OrderRejected',
    description: 'The order was rejected by the bank side (for reasons concerning content)',
    comment: 'Ordem rejeitada pelo participante do usuário recebedor.',
    generatedBy: 'Participante do usuário recebedor'
  },
  DS0G: {
    code: 'DS0G',
    name: 'NotAllowedPayment',
    description: 'Signer is not allowed to sign this operation type.',
    comment: 'Participante que assinou a mensagem não é autorizado a realizar a operação na conta PI debitada.',
    generatedBy: 'SPI'
  },
  DS27: {
    code: 'DS27',
    name: 'UserNotYetActivated',
    description: 'The user is not yet activated',
    comment: 'Participante não se encontra cadastrado ou ainda não iniciou a operação no SPI.',
    generatedBy: 'SPI'
  },
  DT02: {
    code: 'DT02',
    name: 'InvalidCreationDate',
    description: 'Invalid creation date and time in Group Header',
    comment: 'Data e Hora do envio da mensagem inválida',
    generatedBy: 'SPI'
  },
  DT05: {
    code: 'DT05',
    name: 'InvalidCutOffDate',
    description: 'Associated message was received after agreed processing cut-off date',
    comment: 'Transação extrapola o prazo máximo para devolução de pagamento instantâneo regulamentado pelo arranjo Pix.',
    generatedBy: 'SPI'
  },
  DUPL: {
    code: 'DUPL',
    name: 'DuplicatePayment',
    description: 'Payment is a duplicate of another payment',
    comment: 'Pagamento efetuado em duplicidade nos casos em que as ordens de pagamento possuem IdConciliacaoDoRecebedor iguais para um mesmo usuário recebedor.',
    generatedBy: 'Participante do usuário recebedor'
  },
  ED05: {
    code: 'ED05',
    name: 'SettlementFailed',
    description: 'Settlement of the transaction has failed',
    comment: 'Erro no processamento do pagamento instantâneo (erro genérico).',
    generatedBy: 'SPI / Participante do usuário recebedor'
  },
  FF07: {
    code: 'FF07',
    name: 'InvalidPurpose',
    description: 'Purpose is missing or invalid.',
    comment: 'Inconsistência entre a finalidade da transação e o preenchimento do bloco elementos Structured.',
    generatedBy: 'SPI'
  },
  FF08: {
    code: 'FF08',
    name: 'InvalidEndToEndId',
    description: 'End to End Id missing or invalid',
    comment: 'Identificador da operação mal formatado.',
    generatedBy: 'SPI'
  },
  FRAD: {
    code: 'FRAD',
    name: 'FraudulentOrigin',
    description: 'Cancellation requested following a transaction that was originated fraudulently.',
    comment: 'Ordem de pagamento rejeitada por fundada suspeita de fraude.',
    generatedBy: 'Participante do usuário recebedor'
  },
  MD01: {
    code: 'MD01',
    name: 'NoMandate',
    description: 'No Mandate',
    comment: 'ISPB do participante facilitador de serviço Pix Saque ou Pix Troco inexistente.',
    generatedBy: 'SPI'
  },
  RC09: {
    code: 'RC09',
    name: 'InvalidDebtorClearingSystemMemberIdentifier',
    description: 'Debtor ClearingSystemMember identifier is invalid or missing',
    comment: 'ISPB do participante do usuário pagador inválido ou inexistente.',
    generatedBy: 'SPI'
  },
  RC10: {
    code: 'RC10',
    name: 'InvalidCreditorClearingSystemMemberIdentifier',
    description: 'Creditor ClearingSystemMember identifier is invalid or missing',
    comment: 'ISPB do participante do usuário recebedor inválido ou inexistente.',
    generatedBy: 'SPI'
  },
  RR04: {
    code: 'RR04',
    name: 'RegulatoryReason',
    description: 'Regulatory Reason',
    comment: 'Ordem de pagamento em que o usuário pagador é sancionado por resolução do Conselho de Segurança das Nações Unidas (CSNU).',
    generatedBy: 'Participante do usuário recebedor'
  },
  SL02: {
    code: 'SL02',
    name: 'SpecificServiceOfferedByCreditorAgent',
    description: 'Due to specific service offered by the Creditor Agent',
    comment: 'A transação referenciada na mensagem de devolução (pacs.004) original não está relacionada aos serviços de Pix Saque ou Pix Troco.',
    generatedBy: 'Participante do usuário recebedor'
  },
  UPAY: {
    code: 'UPAY',
    name: 'UnduePayment',
    description: 'Payment is not justified',
    comment: 'Pagamento é indevido por ausência de recorrência válida/ativa.',
    generatedBy: 'Participante do usuário recebedor'
  }
};

export const NAMESPACE = 'https://www.bcb.gov.br/pi/pacs.002/1.14';

// Message definition identifier
export const MSG_DEF_IDR = 'pacs.002.spi.1.14';

// Validation helper functions
export function isValidTransactionStatus(code) {
  return Object.keys(TransactionStatus).includes(code);
}

export function isValidStatusReasonCode(code) {
  return Object.keys(StatusReasonCode).includes(code);
}

export function getTransactionStatus(code) {
  return TransactionStatus[code];
}

export function getStatusReasonCode(code) {
  return StatusReasonCode[code];
}
