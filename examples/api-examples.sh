#!/bin/bash

# ISO20022 API Examples
# Exemplos de uso da API REST

BASE_URL="http://localhost:3000/api"

echo "=========================================="
echo "ISO20022 API - Exemplos de Uso"
echo "=========================================="
echo ""

# Health Check
echo "1. Health Check"
echo "GET $BASE_URL/../health"
curl -s "$BASE_URL/../health" | jq .
echo ""
echo ""

# PACS002 - ACSP
echo "2. Gerar PACS002 - ACSP (Pagamento Aceito)"
echo "POST $BASE_URL/pacs002"
curl -s -X POST "$BASE_URL/pacs002" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: example-acsp-001" \
  -d '{
    "fromISPB": "99999010",
    "toISPB": "00038166",
    "transactionStatus": "ACSP",
    "originalEndToEndId": "E99999010202510301212ibBkMlN4xAr"
  }' | jq .
echo ""
echo ""

# PACS002 - RJCT
echo "3. Gerar PACS002 - RJCT (Pagamento Rejeitado)"
echo "POST $BASE_URL/pacs002"
curl -s -X POST "$BASE_URL/pacs002" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: example-rjct-001" \
  -d '{
    "fromISPB": "99999010",
    "toISPB": "00038166",
    "transactionStatus": "RJCT",
    "originalEndToEndId": "E99999010202510301212ibBkMlN4xAr",
    "statusReasonCode": "FRAD",
    "additionalInfo": ["Transação suspeita de fraude"]
  }' | jq .
echo ""
echo ""

# PACS004 - Devolução
echo "4. Gerar PACS004 - Devolução"
echo "POST $BASE_URL/pacs004"
curl -s -X POST "$BASE_URL/pacs004" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: example-pacs004-001" \
  -d '{
    "fromISPB": "99999010",
    "toISPB": "00038166",
    "transactions": [{
      "originalEndToEndId": "E99999010202510301212ibBkMlN4xAr",
      "amount": 1000.00,
      "settlementPriority": "HIGH",
      "returnReasonCode": "BE08",
      "additionalInfo": ["Falha operacional do PSP"],
      "debtorAgentISPB": "99999010",
      "creditorAgentISPB": "00038166"
    }]
  }' | jq .
echo ""
echo ""

# PACS008 - Pagamento Manual
echo "5. Gerar PACS008 - Pagamento Manual"
echo "POST $BASE_URL/pacs008"
curl -s -X POST "$BASE_URL/pacs008" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: example-pacs008-001" \
  -d '{
    "fromISPB": "99999010",
    "toISPB": "00038166",
    "instructionPriority": "HIGH",
    "serviceLevel": "PAGPRI",
    "transactions": [{
      "amount": 1000.00,
      "acceptanceDateTime": "2025-10-30T12:00:00.000Z",
      "initiationForm": "MANU",
      "debtor": {
        "name": "Fulano da Silva",
        "cpfCnpj": "70000000000"
      },
      "debtorAccount": {
        "accountNumber": "500000",
        "agency": "3000",
        "type": "CACC"
      },
      "debtorAgentISPB": "99999010",
      "creditorAgentISPB": "00038166",
      "creditor": {
        "cpfCnpj": "80000000000"
      },
      "creditorAccount": {
        "accountNumber": "600000",
        "agency": "4000",
        "type": "SVGS"
      },
      "purpose": "IPAY",
      "remittanceInfo": "Pagamento de teste"
    }]
  }' | jq .
echo ""
echo ""

# Listar mensagens
echo "6. Listar Mensagens"
echo "GET $BASE_URL/messages"
curl -s "$BASE_URL/messages?limit=5" | jq .
echo ""
echo ""

# Estatísticas
echo "7. Estatísticas"
echo "GET $BASE_URL/stats"
curl -s "$BASE_URL/stats" | jq .
echo ""
echo ""

echo "=========================================="
echo "Exemplos concluídos!"
echo "=========================================="

