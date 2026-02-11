# Regras Obrigatórias de Atualização — 2026-01-29 (Updated 2026-02-11)

## Leitura inicial obrigatória (em ordem de prioridade!)

### 🎯 PRIORITY #1
1. **CURRENT_TASK_STATUS.md** (root) ← ⚠️ **LER PRIMEIRO!** Ver o que o último agente estava fazendo

### 📚 Depois ler para contexto:
2. logbook/AGENT_ACTIONS_LOG.md
3. .github/copilot-instructions.md
4. docs/records/active/PROJECT_ROUTE_INVENTORY_2026-01-29.md
5. docs/records/active/DB_REORG_TASKS_2026-01-29.md
6. docs/records/active/PROJECT_STATUS_TODO_AND_FLIGHTTOOLS_ANALYSIS_2026-01-28.md
7. docs/records/active/FUNCTIONALITY_REPORT_2026-01-28.md
8. docs/records/active/PROJECT_SNAPSHOT_2026-01-29.md
9. logbook/AGENT_LOGBOOK_2026-01-29.md

## Regra máxima

### Após cada ação concluída:
1. **Atualizar CURRENT_TASK_STATUS.md** com:
   - Marcar subtarefas completadas com [x]
   - Atualizar status da tarefa atual
   - Definir "Next Action" para próximo agente
   
2. **Atualizar logbook/AGENT_ACTIONS_LOG.md** com:
   - O que foi feito
   - Resultado
   - Erros encontrados (ou "Sem erros")
   - Como investigou
   - Como corrigiu
   - Como confirmar que foi resolvido

### Antes de finalizar sessão (Handoff):
1. **Atualizar CURRENT_TASK_STATUS.md** completamente:
   - Todas tarefas completas marcadas [x]
   - Status atual da tarefa atualizado
   - "Next Action" definido
   - Timestamp atualizado
   - Bloqueios anotados
   
2. **Fazer commit final** com mensagem clara
3. **Push para branch remoto**

## Observações
- Não iniciar novas ações sem registrar o passo anterior.
- Caso não tenha erro, registrar “Sem erros”.
