#!/bin/bash
# Script para gerar certificados de teste para assinatura XML
# Gera certificado auto-assinado e chave privada RSA para uso com --sign

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="${SCRIPT_DIR}/cert"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Gerador de Certificados para Assinatura XML"
echo "=========================================="
echo ""

# Criar diretório cert/ se não existir
if [ ! -d "$CERT_DIR" ]; then
  echo -e "${YELLOW}Criando diretório cert/...${NC}"
  mkdir -p "$CERT_DIR"
fi

# Verificar se OpenSSL está disponível
if ! command -v openssl &> /dev/null; then
  echo -e "${RED}Erro: OpenSSL não está instalado${NC}"
  echo "Instale OpenSSL para continuar:"
  echo "  Ubuntu/Debian: sudo apt-get install openssl"
  echo "  CentOS/RHEL: sudo yum install openssl"
  exit 1
fi

# Verificar se os certificados já existem
if [ -f "${CERT_DIR}/private-key.pem" ] || [ -f "${CERT_DIR}/certificate.pem" ]; then
  echo -e "${YELLOW}Aviso: Certificados já existem em ${CERT_DIR}/${NC}"
  read -p "Deseja sobrescrever? (s/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operação cancelada."
    exit 0
  fi
fi

echo -e "${GREEN}Gerando chave privada RSA (2048 bits)...${NC}"
openssl genrsa -out "${CERT_DIR}/private-key.pem" 2048

echo -e "${GREEN}Gerando certificado auto-assinado (válido por 365 dias)...${NC}"

# Criar arquivo de configuração temporário para o certificado
CONFIG_FILE=$(mktemp)
cat > "$CONFIG_FILE" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C=BR
ST=Brasil
L=Brasilia
O=Teste SPI
OU=Desenvolvimento
CN=Teste Assinatura XML SPI
emailAddress=teste@example.com

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
EOF

# Gerar certificado auto-assinado
openssl req -new -x509 -key "${CERT_DIR}/private-key.pem" \
  -out "${CERT_DIR}/certificate.pem" \
  -days 365 \
  -config "$CONFIG_FILE" \
  -extensions v3_req

# Remover arquivo temporário
rm "$CONFIG_FILE"

# Configurar permissões apropriadas
chmod 600 "${CERT_DIR}/private-key.pem"
chmod 644 "${CERT_DIR}/certificate.pem"

echo ""
echo -e "${GREEN}✓ Certificados gerados com sucesso!${NC}"
echo ""
echo "Arquivos criados:"
echo "  - ${CERT_DIR}/private-key.pem"
echo "  - ${CERT_DIR}/certificate.pem"
echo ""
echo "Informações do certificado:"
openssl x509 -in "${CERT_DIR}/certificate.pem" -text -noout | grep -E "(Subject:|Issuer:|Not Before|Not After)" | head -4
echo ""
echo -e "${YELLOW}Nota: Estes são certificados de teste (auto-assinados).${NC}"
echo -e "${YELLOW}Para produção, use certificados ICP-Brasil válidos.${NC}"
echo ""
echo "Uso:"
echo "  node main.js --sign"
echo ""

