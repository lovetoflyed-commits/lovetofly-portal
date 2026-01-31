# Preparação para Reunião com Suporte Legal
Data da Reunião: [PREENCHER]  
Horário: [PREENCHER]  
Local/Plataforma: [PREENCHER]  
Advogado(a): [NOME]  
Telefone: [TELEFONE]

---
## Objetivo da Reunião
Resolver requisitos legais para registrar a patente, marca, privacidade (LGPD), termos de serviço, e estruturar juridicamente a operação do Love to Fly Portal antes do lançamento (9 de fevereiro de 2026).

---
## 1. Documentos a Levar

### Já Preparados (levar em cópia)
- [ ] Acordo de Confidencialidade (NDA) - versão atual
- [ ] Termos do Programa Beta - versão atual
- [ ] Carta de Convite aos Beta Testers - versão atual
- [ ] Manual de Lançamento Seguro - versão atual
- [ ] Análise de Competidores - versão atual
- [ ] Estratégia de Parceria, Proteção Legal & Lançamento - versão atual

### A Solicitar/Preparar antes da Reunião
- [ ] Documento de constituição da empresa/CNPJ
- [ ] Estrutura societária atual (sócios, % participação)
- [ ] Código-fonte ou exemplos de features principais (para análise de IP)
- [ ] Lista de dependências open-source (npm packages)
- [ ] Planilha de contatos de beta testers (nomes, emails, segmento)
- [ ] Screenshots da plataforma (interfaces principais)
- [ ] Cronograma de lançamento (timeline oficial)

---
## 2. Tópicos a Discutir

### A. Propriedade Intelectual (IP) e Patente
1. **Registro de Marca**
   - [ ] Qual é o processo no INPI para "Love to Fly"?
   - [ ] Quanto custa? Prazo?
   - [ ] Protege em que categorias? (plataforma SaaS, serviços, software)
   - [ ] Precisa registrar em outras jurisdições (Mercosul, etc.)?

2. **Copyright do Software**
   - [ ] Como registrar código no INPI?
   - [ ] Que documentação é necessária (bill of materials, commitment de desenvolvimento)?
   - [ ] Prazo e custo?

3. **Inovações Proprietárias**
   - [ ] E6B customizado e algoritmos - valem patente?
   - [ ] Marketplace integrado com booking/escrow - vale patente de processo?
   - [ ] Qual é o custo/prazo de patente no INPI?
   - [ ] Convém patentear antes do lançamento público ou depois?

4. **Dependências Open-Source**
   - [ ] Auditoria de licenças (MIT, Apache, GPL) - temos compliance?
   - [ ] Precisamos listar em LICENSE file?
   - [ ] Risco de GPL "copyleft" obrigar release de nosso código?

### B. LGPD e Privacidade (Lei Geral de Proteção de Dados)
1. **Conformidade Básica**
   - [ ] Precisamos designar DPO (Data Protection Officer) ou pode ser função interna?
   - [ ] Precisa ser pessoa física ou pode ser cargo da empresa?
   - [ ] Qual é o custo/complexidade?

2. **Consentimento e Base Legal**
   - [ ] Consent form no signup - está adequado para LGPD?
   - [ ] Qual base legal para processar dados de usuários (consent, contrato, obrigação legal)?
   - [ ] Precisamos de consent separado para marketing/analytics?

3. **Direitos do Titular**
   - [ ] Como implementar direito de acesso (export dados em JSON)?
   - [ ] Direito de deleção (como garantir limpeza completa)?
   - [ ] Direito de portabilidade - que formato usar?
   - [ ] Revogação de consentimento - como processar?

4. **Privacy Policy e Terms of Service**
   - [ ] Templates que você recomenda?
   - [ ] Precisa registrar em cartório ou vale versão digital?
   - [ ] Quanto custa fazer uma boa Privacy Policy?

5. **Data Retention e Segurança**
   - [ ] Quanto tempo guardar dados após conta deletada?
   - [ ] Backups - precisam de política de retenção?
   - [ ] Criptografia em repouso - obrigatória ou recomendada?
   - [ ] Auditoria de LGPD - quando contratar?

6. **Notificação de Breaches**
   - [ ] Se dados vazarem, prazo para notificar usuários e ANPD?
   - [ ] Que informação incluir na notificação?
   - [ ] Precisa de seguro (cyber insurance)?

### C. Estrutura de Negócio e Compliance Fiscal
1. **Modelo de Empresa**
   - [ ] Qual é a melhor estrutura (PJ, Startup, etc.)?
   - [ ] Benefícios fiscais para startup/inovação (PADIS, Lei 11.196)?
   - [ ] Pode pedir enquadramento de startup?

2. **Transações e Pagamentos**
   - [ ] Stripe PCI compliant - precisamos de compliance adicional?
   - [ ] Registro de transações - quanto tempo guardar?
   - [ ] Emissão de recibos/notas fiscais - como estruturar?
   - [ ] Retenção de impostos (se houver comissão de transações)?

3. **Responsabilidade Civil**
   - [ ] Limite de responsabilidade da plataforma - está adequado?
   - [ ] Indenização por erro/fraude - como proteger?
   - [ ] Seguro de responsabilidade civil é recomendado?

### D. Termos de Serviço e Políticas
1. **ToS General**
   - [ ] Proibições (atividades ilegais, spam, hate speech) - está claro?
   - [ ] Limitação de liability - está adequada?
   - [ ] Jurisdição e foro (São Paulo/SP) - está OK?
   - [ ] Direito de modificar termos - com quanto tempo de aviso?

2. **Política de Conteúdo**
   - [ ] Posso remover conteúdo ilegal? (Preciso notificar antes ou depois?)
   - [ ] Processo de apelação para remoção?
   - [ ] SLA de moderação (48h) - é viável?

3. **Cancelamento e Reembolso**
   - [ ] Política de cancelamento - está clara e justa?
   - [ ] Reembolso automático via Stripe - riscos legais?
   - [ ] Chargeback - como lidar?

### E. Relacionamento com Beta Testers (NDA/Contratos)
1. **NDA**
   - [ ] Está adequado para Brasil (lei brasileira, foro SP)?
   - [ ] Cláusula de indenização - está razoável?
   - [ ] Prazo de confidencialidade (2 anos) - está OK?

2. **Termos Beta**
   - [ ] Disclaimers de beta ("no warranty", "data loss risk") - estão suficientes?
   - [ ] Feedback ownership - está claro?
   - [ ] Direito de encerrar acesso - está balanceado?

### F. ANAC (Aviação Civil) - Se Aplicável
1. **Regulamentação de Aviação**
   - [ ] Plataforma de marketplace precisa de aprovação ANAC?
   - [ ] E6B, METAR/NOTAM - precisam de verificação?
   - [ ] Dados de aeródromos/rotas - usamos fonte oficial?

### G. Força Maior e Contingência
1. **Plano de Incidente**
   - [ ] Política de resposta a vazamento de dados - adequada?
   - [ ] SLA de uptime - legal impor?
   - [ ] Plano de continuidade - precisa documentar?

---
## 3. Perguntas-Chave a Fazer

1. **Timeline**: Qual é o prazo realista para registrar marca + copyright + privacidade antes de 9 fev?
2. **Custo**: Quanto custa todo o pacote (marca, copyright, LGPD, termos, NDA)?
3. **Sequência**: O que fazer primeiro? (Marca antes do lançamento? Patente depois?)
4. **Seguradoras**: Recomenda cyber insurance?
5. **Auditoria**: Precisa de auditoria LGPD antes do lançamento?
6. **Parceria**: Vocês podem ser DPO e responsáveis por LGPD?
7. **Atualizações**: Qual é o custo de atualizar documentos após lançamento?
8. **Escalabilidade**: Se crescermos (múltiplos países, tokens, cripto), o que muda legalmente?

---
## 4. Ações Imediatas (antes da reunião)

- [ ] Compilar lista de npm packages (para auditoria de licenças)
- [ ] Preparar documento técnico do E6B (algoritmo, inovação)
- [ ] Separar CNPJ e documentos de constituição
- [ ] Listar todos os dados que processamos (usuários, transações, fotos)
- [ ] Screenshot/demo da plataforma (para advogado entender melhor)
- [ ] Cronograma oficial de lançamento (com datas-chave)
- [ ] Lista preliminar de beta testers (quantos, segmentos)

---
## 5. Checklist Pós-Reunião

Após a reunião, já pedindo timeline do advogado:

- [ ] Contrato de serviços jurídicos assinado
- [ ] Roadmap de registros (marca, copyright, LGPD)
- [ ] Draft de Privacy Policy + ToS revisado
- [ ] Orientação sobre DPO (interno ou externo)
- [ ] Checklist de LGPD (ações, responsáveis, deadlines)
- [ ] Se necessário: contato com ANAC para esclarecer regulamentação
- [ ] Seguro de responsabilidade civil (cotação)

---
## 6. Documentos Já Preparados para Levar

Levar impressos ou em PDF:

1. **MANUAL_LANCAMENTO_SEGURO_PT.pdf** - mostra estrutura de controles legais
2. **ESTRATEGIA_PARCERIA_PROTECAO_LEGAL_LANÇAMENTO_2026.pdf** - detalha NDA, privacy, LGPD
3. **CONVITE_BETA_LOVE_TO_FLY.pdf** - modelo de convite aos testers
4. **NDA_BETA_LOVE_TO_FLY.pdf** - versão atual (para revisar)
5. **TERMOS_BETA_LOVE_TO_FLY.pdf** - versão atual (para revisar)
6. **ANALISE_COMPETIDORES_AVIACAO_BRASIL_2026.pdf** - contexto de mercado

---
## 7. Notas Adicionais

- Trazer caderno/laptop para anotar feedback e prazos.
- Gravar reunião (se autorizado) para documentação.
- Perguntar sobre follow-up calls (quinzenal? mensal?).
- Combinar canal de comunicação preferido (email, WhatsApp, Slack).
- Solicitar relatório resumido pós-reunião com action items.

---
## Contato do Advogado

Nome: ____________________________  
Firma: ____________________________  
Email: ____________________________  
Telefone: __________________________  
Especialidades: _____________________

---
*Última atualização: 9 de janeiro de 2026*  
*Responsável pela preparação: [NOME]*
