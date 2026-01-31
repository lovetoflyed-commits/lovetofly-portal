# Plano de implementação — Traslados de Aeronaves (Brasil → Global)

## 1) Objetivo
Estruturar o serviço de Traslados de Aeronaves com foco inicial no Brasil, com arquitetura operacional e regulatória escalável para operação global.

## 2) Escopo do serviço
- **Tipos de traslado:** entrega pós-compra, reposicionamento, manutenção, devolução de leasing, ferry pós-reparo, ferry internacional.
- **Cobertura inicial:** Brasil (rotas domésticas e regiões com maior demanda).
- **Expansão:** América do Sul → América do Norte/Europa → Global.

### 2.1) Escopo inicial detalhado (Brasil)
- **Regiões prioritárias:** Sudeste, Sul e Centro-Oeste (primeira fase), com expansão gradual para Norte e Nordeste.
- **Aeronaves foco (fase 1):** monomotores a pistão, multimotores a pistão, turboélices leves e jatos leves.
- **Perfis de missão:** voos domésticos, reposicionamentos entre hangares, entrega pós-compra, ida/volta para manutenção.
- **Aeroportos-chave (prioridade):** capitais e polos de aviação executiva/geral.
- **SLA alvo:** triagem e proposta em até 48–72h úteis após recebimento completo dos dados.
- **Exclusões iniciais:** aeronaves sem documentação essencial regularizada e operações que exijam autorização especial específica não disponível no prazo.

### 2.2) Critérios de entrada (fase 1)
- Dados mínimos da aeronave (modelo, prefixo, status de manutenção, origem/destino, janela de prazo).
- Contato do responsável técnico/operador e autorização do proprietário.
- Disponibilidade de hangar/handling no destino ou indicação para contratação.

## 3) Proposta de valor (mensagens principais)
- Segurança operacional e conformidade regulatória.
- Previsibilidade de prazo e custos com transparência.
- Gestão completa: documentação, planejamento, operação e pós‑voo.

## 4) Estrutura operacional (fluxo ponta a ponta)
1. **Triagem comercial**
   - Tipo de aeronave, estado atual, origem/destino, prazo.
2. **Validação documental**
   - Registro, aeronavegabilidade, cadernetas e situação de manutenção.
3. **Enquadramento regulatório**
   - Definir operação privada vs. operação remunerada/terceiros.
4. **Planejamento técnico**
   - Performance, combustível, alternados, equipamentos e limitações.
5. **Coordenação aeroportuária**
   - Slots, handling, abastecimento e requisitos locais.
6. **Permissões e autorizações**
   - Overflight/landing e autorizações especiais quando aplicável.
7. **Execução e monitoramento**
   - Briefing, acompanhamento em tempo real e comunicação com o cliente.
8. **Pós‑voo**
   - Relatório operacional e fechamento financeiro.

### 4.1) Responsabilidades internas (fase 1)
- **Comercial/Atendimento:** triagem, proposta, coleta de dados e alinhamento de prazos.
- **Operações:** planejamento, coordenação aeroportuária, slots e handling.
- **Conformidade:** verificação documental e enquadramento regulatório.
- **Tripulação:** escala, disponibilidade, briefings e execução.
- **Financeiro:** orçamento, adiantamentos, reconciliação e fechamento.

### 4.2) Pontos de controle do fluxo
- **Gate 1 — Dados mínimos recebidos:** habilita análise técnica.
- **Gate 2 — Conformidade validada:** habilita proposta final.
- **Gate 3 — Acordo e taxa do portal:** proprietário e piloto confirmam acordo e efetuam pagamento da taxa de serviço.
- **Gate 4 — Pagamento/contrato:** libera execução.
- **Gate 5 — Pós‑voo entregue:** encerra operação e ativa feedback.

## 5) Requisitos de conformidade (Brasil)
- **Base normativa ANAC:** RBAC/RBHA + IS/IAC.
- **Operação remunerada:** requer operador certificado.
- **Aeronavegabilidade:** documentação válida e manutenção em dia.
- **Tripulação:** habilitações e exames médicos compatíveis.
- **Coordenação ATC:** plano de voo e procedimentos do DECEA.
- **Seguros:** casco e responsabilidade civil adequados ao trecho.

### 5.1) Checklist de conformidade (fase 1)
- **Documentação da aeronave:** registro atualizado, situação de aeronavegabilidade válida, cadernetas/diários em dia.
- **Manutenção:** inspeções obrigatórias válidas e ADs cumpridas.
- **Tripulação:** licenças e habilitações compatíveis; exames médicos vigentes.
- **Operação:** enquadramento correto (privada x remunerada) e documentação correspondente.
- **Plano de voo:** conforme procedimentos do DECEA e exigências do aeródromo.
- **Seguros:** apólices vigentes com cobertura adequada ao perfil da operação.

### 5.2) Fontes regulatórias para consulta contínua
- Portal RBAC/RBHA (ANAC).
- Pesquisa RBAC (ANAC).
- IS e IAC (ANAC).

**Referências ANAC (base normativa):**
- RBAC/RBHA: https://www.anac.gov.br/assuntos/legislacao/legislacao-1/rbha-e-rbac
- Pesquisa RBAC: https://www.anac.gov.br/assuntos/legislacao/legislacao-1/rbha-e-rbac/pesquisa-RBAC
- IS/IAC: https://www.anac.gov.br/assuntos/legislacao/legislacao-1/iac-e-is

## 6) Expansão global (diretrizes)
- Aderência a padrões ICAO e regras específicas por país.
- Permissões internacionais (overflight/landing), alfândega e imigração.
- Seguros globais e restrições geopolíticas.
- Rede de parceiros locais (handling, manutenção e despacho).

## 7) Conteúdos para a página “Traslados”
- Visão geral + proposta de valor.
- Tipos de traslado.
- Processo passo a passo.
- Compliance e segurança.
- SLA e prazos.
- Estrutura de custos (itens típicos, sem valores).
- FAQ.
- Formulário de cotação.

### 7.3) Rascunho de conteúdo (PT‑BR)
**Hero**
- Título: “Traslados de Aeronaves com segurança e conformidade”
- Subtítulo: “Planejamento completo, equipe experiente e acompanhamento ponta a ponta no Brasil.”

**Seção: Como funciona**
1. Envio dos dados
2. Análise técnica e regulatória
3. Proposta e cronograma
4. Execução e acompanhamento
5. Relatório final

**Seção: O que fazemos**
- Entrega pós‑compra e reposicionamento
- Traslado para manutenção (ida/volta)
- Ferry pós‑reparo
- Traslado internacional (em fase de expansão)

**Seção: Segurança e compliance**
- Checklists operacionais e documentação válida
- Tripulação habilitada e compatível
- Coordenação ATC e planejamento de rotas

**Seção: Custos típicos (informativo)**
- Combustível
- Taxas aeroportuárias
- Handling e estacionamento
- Seguro e despesas de tripulação

**Seção: FAQ (resumo)**
- Quanto tempo leva um traslado?
- Quais documentos são necessários?
- Posso acompanhar o voo?
- O que acontece se a aeronave não estiver apta?

### 7.1) Dados necessários para cotação (formulário)
- **Aeronave:** modelo, prefixo, categoria (pistão/turboélice/jato), status de manutenção.
- **Origem e destino:** aeródromos preferidos, cidade/UF, janela de datas.
- **Condição operacional:** aeronave voável, restrições conhecidas, necessidade de autorização especial.
- **Responsável técnico/operador:** nome, contato, disponibilidade.
- **Proprietário/representante legal:** contato e autorização para traslado.
- **Observações:** requisitos especiais de combustível, hangar/handling, escalas.

### 7.2) Validações mínimas
- Campos obrigatórios preenchidos e contatos válidos.
- Origem e destino dentro do Brasil (fase 1).
- Prazo mínimo para análise técnica (SLA).

## 8) Checklist operacional (resumo)
- Documentos da aeronave.
- Habilitação e escala da tripulação.
- Plano de voo e alternados.
- Coordenação aeroportuária e combustível.
- Seguros e autorização do proprietário.

## 9) Próximos passos recomendados
- Checklist detalhado por categoria de aeronave.
- Matriz de risco operacional.
- Modelo de contrato e termos de responsabilidade.
- Questionário de cotação com validações mínimas.
- Política de atendimento e comunicação de status.
- Política de comunicação via mensagens com bloqueio de contatos externos.
- Política de cobrança da taxa de serviço após confirmação de acordo.

## 10) Termos e responsabilidade (rascunho)
- O traslado está sujeito à verificação de documentação e conformidade regulatória.
- Prazos podem variar conforme condições meteorológicas, disponibilidade operacional e autorizações.
- O cliente confirma autorização do proprietário para o traslado.
- Custos informados são estimativas e podem variar conforme necessidades operacionais.
- A execução depende de condições de aeronavegabilidade válidas.
- Toda comunicação deve ocorrer no portal. Contatos externos podem ser bloqueados ou removidos automaticamente.
- A taxa de serviço do portal é devida após a confirmação de acordo entre as partes.

## 10.1) Pilotos — cadastro e elegibilidade
- Formulário dedicado para pilotos com dados pessoais, licenças, habilitações e disponibilidade.
- Upload de documentos obrigatórios (licença e certificado médico).
- Aprovação administrativa antes da publicação para contratantes.
- Portal atua como intermediário de informações; operação é de responsabilidade das partes.

## 10.2) Comunicação e mensagens (antifraude)
- Conversa entre proprietário e piloto ocorre dentro do portal.
- Sistema remove automaticamente e‑mails, telefones e perfis de redes sociais das mensagens.
- Alertas exibidos quando conteúdo é bloqueado.

## 10.3) Acordo e pagamento da taxa do portal
- Proprietário e piloto confirmam o acordo no portal.
- Após dupla confirmação, o pagamento da taxa de serviço é liberado.
- Pagamento deve ser feito antes da execução do traslado.

## 11) Checklist de testes (validação)
- Acessar /traslados, /traslados/owners e /traslados/pilots.
- Acessar /traslados/messages e /traslados/status.
- Validar layout responsivo (desktop e mobile).
- Verificar CTA de cotação e rolagem para formulário.
- Submeter formulário com campos obrigatórios vazios e confirmar mensagens.
- Enviar formulário completo e confirmar resposta de sucesso.
- Confirmar evento de analytics do envio.
- Enviar mensagem com telefone/email e confirmar redação automática.
- Confirmar acordo como proprietário e como piloto.
- Gerar pagamento da taxa do portal e confirmar status como pago.

## 12) Expansão global (matriz inicial)
- **Fase 1 — América do Sul:** países limítrofes com rotas frequentes e menor complexidade de overflight.
- **Fase 2 — América do Norte/Europa:** priorizar hubs de aviação geral, MROs e entregas internacionais.
- **Fase 3 — Global:** integração com parceiros de handling e despacho em regiões-chave.

### 12.1) Checklist de prontidão por país
- Regras de overflight/landing e prazos de autorização.
- Documentação exigida e validação de aeronavegabilidade.
- Requisitos de seguro e cobertura mínima local.
- Infraestrutura de handling e fuel disponível.
- Procedimentos alfandegários e imigração.

### 12.2) Operação e parceiros
- Lista de parceiros locais (handling, manutenção, despacho).
- SLA de resposta local e janela de operação.
- Custos padrão e taxas aeroportuárias.
