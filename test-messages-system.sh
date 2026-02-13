#!/bin/bash

# ============================================================================
# SISTEMA DE MENSAGENS UNIVERSAL - TESTES E2E
# ============================================================================
# Testa todas as funcionalidades do sistema de mensagens implementado na Fase 1
#
# Uso: ./test-messages-system.sh
# ============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_URL="${BASE_URL}/api"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test users (assuming these exist in DB)
USER1_EMAIL="${TEST_USER1_EMAIL:-test1@lovetofly.com}"
USER1_PASS="${TEST_USER1_PASS:-123456}"
USER2_EMAIL="${TEST_USER2_EMAIL:-test2@lovetofly.com}"
USER2_PASS="${TEST_USER2_PASS:-123456}"

# Tokens
USER1_TOKEN=""
USER2_TOKEN=""

# Message IDs for testing
MESSAGE_ID=""
THREAD_ID=""

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}[TEST $TOTAL_TESTS]${NC} $1"
}

print_success() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓ PASSED:${NC} $1\n"
}

print_failure() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "${RED}✗ FAILED:${NC} $1\n"
}

print_info() {
    echo -e "${BLUE}ℹ INFO:${NC} $1"
}

# ============================================================================
# AUTHENTICATION
# ============================================================================

authenticate_users() {
    print_header "AUTENTICAÇÃO"
    
    print_test "Autenticar User 1"
    RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${USER1_EMAIL}\",\"password\":\"${USER1_PASS}\"}")
    
    USER1_TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$USER1_TOKEN" ]; then
        print_success "User 1 autenticado"
        print_info "Token: ${USER1_TOKEN:0:20}..."
    else
        print_failure "Falha ao autenticar User 1"
        echo "Response: $RESPONSE"
        exit 1
    fi
    
    print_test "Autenticar User 2"
    RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${USER2_EMAIL}\",\"password\":\"${USER2_PASS}\"}")
    
    USER2_TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$USER2_TOKEN" ]; then
        print_success "User 2 autenticado"
        print_info "Token: ${USER2_TOKEN:0:20}..."
    else
        print_failure "Falha ao autenticar User 2"
        echo "Response: $RESPONSE"
        exit 1
    fi
}

# ============================================================================
# TEST 1: ENVIO DE MENSAGEM
# ============================================================================

test_send_message() {
    print_header "TESTE 1: ENVIO DE MENSAGEM"
    
    print_test "Enviar mensagem de User 1 para User 2"
    RESPONSE=$(curl -s -X POST "${API_URL}/messages/send" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${USER1_TOKEN}" \
        -d '{
            "recipientUserId": 2,
            "module": "portal",
            "subject": "Teste E2E - Mensagem inicial",
            "message": "Esta é uma mensagem de teste do sistema E2E",
            "priority": "normal"
        }')
    
    MESSAGE_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    THREAD_ID=$(echo "$RESPONSE" | grep -o '"threadId":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$MESSAGE_ID" ]; then
        print_success "Mensagem enviada com sucesso"
        print_info "Message ID: $MESSAGE_ID"
        print_info "Thread ID: ${THREAD_ID:0:20}..."
    else
        print_failure "Falha ao enviar mensagem"
        echo "Response: $RESPONSE"
    fi
}

# ============================================================================
# TEST 2: BUSCAR MENSAGENS (INBOX)
# ============================================================================

test_fetch_inbox() {
    print_header "TESTE 2: BUSCAR MENSAGENS (INBOX)"
    
    print_test "Buscar inbox do User 2"
    RESPONSE=$(curl -s -X GET "${API_URL}/messages/inbox" \
        -H "Authorization: Bearer ${USER2_TOKEN}")
    
    MESSAGE_COUNT=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | wc -l)
    
    if [ "$MESSAGE_COUNT" -gt 0 ]; then
        print_success "Inbox recuperado com $MESSAGE_COUNT mensagens"
    else
        print_failure "Nenhuma mensagem encontrada no inbox"
        echo "Response: $RESPONSE"
    fi
}

# ============================================================================
# TEST 3: MARCAR COMO LIDA
# ============================================================================

test_mark_as_read() {
    print_header "TESTE 3: MARCAR COMO LIDA"
    
    if [ -z "$MESSAGE_ID" ]; then
        print_failure "MESSAGE_ID não definido, pulando teste"
        return
    fi
    
    print_test "Marcar mensagem $MESSAGE_ID como lida"
    RESPONSE=$(curl -s -X PATCH "${API_URL}/messages/${MESSAGE_ID}/read" \
        -H "Authorization: Bearer ${USER2_TOKEN}")
    
    if echo "$RESPONSE" | grep -q '"is_read":true'; then
        print_success "Mensagem marcada como lida"
    else
        print_failure "Falha ao marcar mensagem como lida"
        echo "Response: $RESPONSE"
    fi
}

# ============================================================================
# TEST 4: RESPONDER MENSAGEM
# ============================================================================

test_reply_message() {
    print_header "TESTE 4: RESPONDER MENSAGEM"
    
    if [ -z "$MESSAGE_ID" ]; then
        print_failure "MESSAGE_ID não definido, pulando teste"
        return
    fi
    
    print_test "User 2 responde a mensagem $MESSAGE_ID"
    RESPONSE=$(curl -s -X POST "${API_URL}/messages/${MESSAGE_ID}/reply" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${USER2_TOKEN}" \
        -d '{
            "message": "Esta é uma resposta de teste ao sistema E2E"
        }')
    
    REPLY_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    
    if [ -n "$REPLY_ID" ]; then
        print_success "Resposta enviada com sucesso"
        print_info "Reply ID: $REPLY_ID"
    else
        print_failure "Falha ao responder mensagem"
        echo "Response: $RESPONSE"
    fi
    
    # Test single-reply enforcement
    print_test "Tentar responder novamente (deve falhar)"
    RESPONSE=$(curl -s -X POST "${API_URL}/messages/${MESSAGE_ID}/reply" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${USER2_TOKEN}" \
        -d '{
            "message": "Segunda resposta (não permitida)"
        }')
    
    if echo "$RESPONSE" | grep -q "já foi respondida"; then
        print_success "Single-reply enforcement funcionando"
    else
        print_failure "Single-reply enforcement não funcionou"
        echo "Response: $RESPONSE"
    fi
}

# ============================================================================
# TEST 5: RATE LIMITING
# ============================================================================

test_rate_limiting() {
    print_header "TESTE 5: RATE LIMITING (5 msg/hora)"
    
    print_test "Enviar 5 mensagens rapidamente"
    
    SUCCESS_COUNT=0
    for i in {1..5}; do
        RESPONSE=$(curl -s -X POST "${API_URL}/messages/send" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${USER1_TOKEN}" \
            -d "{
                \"recipientUserId\": 2,
                \"module\": \"portal\",
                \"subject\": \"Rate limit test $i\",
                \"message\": \"Mensagem $i para testar rate limiting\",
                \"priority\": \"low\"
            }")
        
        if echo "$RESPONSE" | grep -q '"id":[0-9]*'; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        fi
        
        sleep 0.5
    done
    
    print_info "Mensagens enviadas com sucesso: $SUCCESS_COUNT/5"
    
    # Tentar enviar 6ª mensagem
    print_test "Enviar 6ª mensagem (deve ser bloqueada)"
    RESPONSE=$(curl -s -X POST "${API_URL}/messages/send" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${USER1_TOKEN}" \
        -d '{
            "recipientUserId": 2,
            "module": "portal",
            "subject": "Rate limit test 6",
            "message": "Esta mensagem deve ser bloqueada",
            "priority": "low"
        }')
    
    if echo "$RESPONSE" | grep -q "limite de taxa"; then
        print_success "Rate limiting funcionando (6ª mensagem bloqueada)"
    else
        print_failure "Rate limiting não funcionou"
        echo "Response: $RESPONSE"
    fi
}

# ============================================================================
# TEST 6: SANITIZAÇÃO DE CONTEÚDO
# ============================================================================

test_content_sanitization() {
    print_header "TESTE 6: SANITIZAÇÃO DE CONTEÚDO"
    
    print_test "Enviar mensagem com email e telefone"
    RESPONSE=$(curl -s -X POST "${API_URL}/messages/send" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${USER1_TOKEN}" \
        -d '{
            "recipientUserId": 2,
            "module": "portal",
            "subject": "Teste de sanitização",
            "message": "Meu email é test@example.com e telefone (11) 99999-9999",
            "priority": "low"
        }')
    
    if echo "$RESPONSE" | grep -q '"contentModified":true'; then
        print_success "Sanitização detectou conteúdo proibido"
        
        VIOLATIONS=$(echo "$RESPONSE" | grep -o '"violations":\[[^]]*\]')
        print_info "Violações: $VIOLATIONS"
    else
        print_failure "Sanitização não detectou conteúdo proibido"
        echo "Response: $RESPONSE"
    fi
}

# ============================================================================
# TEST 7: SISTEMA DE DENÚNCIA
# ============================================================================

test_report_system() {
    print_header "TESTE 7: SISTEMA DE DENÚNCIA"
    
    if [ -z "$MESSAGE_ID" ]; then
        print_failure "MESSAGE_ID não definido, pulando teste"
        return
    fi
    
    print_test "Denunciar mensagem $MESSAGE_ID"
    RESPONSE=$(curl -s -X POST "${API_URL}/messages/${MESSAGE_ID}/report" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${USER2_TOKEN}" \
        -d '{
            "reason": "spam",
            "details": "Teste de denúncia E2E"
        }')
    
    if echo "$RESPONSE" | grep -q '"status":"pending"'; then
        print_success "Denúncia registrada com sucesso"
    else
        print_failure "Falha ao registrar denúncia"
        echo "Response: $RESPONSE"
    fi
    
    # Test duplicate report prevention
    print_test "Tentar denunciar novamente (deve falhar)"
    RESPONSE=$(curl -s -X POST "${API_URL}/messages/${MESSAGE_ID}/report" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${USER2_TOKEN}" \
        -d '{
            "reason": "spam",
            "details": "Denúncia duplicada"
        }')
    
    if echo "$RESPONSE" | grep -q "já denunciou"; then
        print_success "Prevenção de denúncia duplicada funcionando"
    else
        print_failure "Prevenção de denúncia duplicada não funcionou"
        echo "Response: $RESPONSE"
    fi
}

# ============================================================================
# TEST 8: FILTROS E PAGINAÇÃO
# ============================================================================

test_filters_pagination() {
    print_header "TESTE 8: FILTROS E PAGINAÇÃO"
    
    print_test "Filtrar por módulo 'portal'"
    RESPONSE=$(curl -s -X GET "${API_URL}/messages/inbox?module=portal" \
        -H "Authorization: Bearer ${USER2_TOKEN}")
    
    if echo "$RESPONSE" | grep -q '"module":"portal"'; then
        print_success "Filtro por módulo funcionando"
    else
        print_failure "Filtro por módulo não funcionou"
    fi
    
    print_test "Filtrar por status 'unread'"
    RESPONSE=$(curl -s -X GET "${API_URL}/messages/inbox?status=unread" \
        -H "Authorization: Bearer ${USER2_TOKEN}")
    
    if echo "$RESPONSE" | grep -q '"is_read":false'; then
        print_success "Filtro por status funcionando"
    else
        print_info "Sem mensagens não lidas (normal após testes anteriores)"
    fi
    
    print_test "Testar paginação (page=1, limit=5)"
    RESPONSE=$(curl -s -X GET "${API_URL}/messages/inbox?page=1&limit=5" \
        -H "Authorization: Bearer ${USER2_TOKEN}")
    
    if echo "$RESPONSE" | grep -q '"pagination"'; then
        print_success "Paginação funcionando"
        
        PAGE=$(echo "$RESPONSE" | grep -o '"page":[0-9]*' | cut -d':' -f2)
        LIMIT=$(echo "$RESPONSE" | grep -o '"limit":[0-9]*' | cut -d':' -f2)
        print_info "Page: $PAGE, Limit: $LIMIT"
    else
        print_failure "Paginação não funcionou"
    fi
}

# ============================================================================
# TEST 9: CONTADOR DE NÃO LIDAS
# ============================================================================

test_unread_counter() {
    print_header "TESTE 9: CONTADOR DE NÃO LIDAS"
    
    print_test "Buscar contador de mensagens não lidas"
    RESPONSE=$(curl -s -X GET "${API_URL}/messages/unread-count" \
        -H "Authorization: Bearer ${USER1_TOKEN}")
    
    UNREAD_COUNT=$(echo "$RESPONSE" | grep -o '"unreadCount":[0-9]*' | cut -d':' -f2)
    HAS_URGENT=$(echo "$RESPONSE" | grep -o '"hasUrgent":(true|false)' | cut -d':' -f2)
    
    if [ -n "$UNREAD_COUNT" ]; then
        print_success "Contador de não lidas funcionando"
        print_info "Mensagens não lidas: $UNREAD_COUNT"
        print_info "Tem urgentes: $HAS_URGENT"
    else
        print_failure "Contador não funcionou"
        echo "Response: $RESPONSE"
    fi
}

# ============================================================================
# FINAL REPORT
# ============================================================================

print_final_report() {
    print_header "RELATÓRIO FINAL"
    
    echo -e "${BLUE}Total de testes:${NC} $TOTAL_TESTS"
    echo -e "${GREEN}Testes passados:${NC} $PASSED_TESTS"
    echo -e "${RED}Testes falhados:${NC} $FAILED_TESTS"
    
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "\n${BLUE}Taxa de sucesso:${NC} ${PASS_RATE}%\n"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}✓✓✓ TODOS OS TESTES PASSARAM ✓✓✓${NC}\n"
        exit 0
    else
        echo -e "${RED}✗✗✗ ALGUNS TESTES FALHARAM ✗✗✗${NC}\n"
        exit 1
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    print_header "INICIANDO TESTES DO SISTEMA DE MENSAGENS"
    
    echo -e "${BLUE}Base URL:${NC} $BASE_URL"
    echo -e "${BLUE}API URL:${NC} $API_URL"
    echo -e "${BLUE}User 1:${NC} $USER1_EMAIL"
    echo -e "${BLUE}User 2:${NC} $USER2_EMAIL"
    
    # Run tests
    authenticate_users
    test_send_message
    test_fetch_inbox
    test_mark_as_read
    test_reply_message
    test_rate_limiting
    test_content_sanitization
    test_report_system
    test_filters_pagination
    test_unread_counter
    
    # Print report
    print_final_report
}

# Run main
main
