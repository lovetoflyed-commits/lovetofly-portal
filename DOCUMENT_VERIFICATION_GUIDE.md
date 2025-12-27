# 📋 Guia de Verificação Anti-Fraude de Documentos

**Status**: Sistema básico implementado. Requer integração com serviço de IA para verificação completa.

---

## 🔍 Camadas de Segurança Implementadas

### 1️⃣ **Pré-preenchimento de Dados (Anti-Fraude L1)**
- ✅ Dados do usuário carregados automaticamente do banco
- ✅ CPF, país, nome vêm da tabela `users`
- ✅ Campos pré-preenchidos em **modo read-only** (não editável)
- ✅ Usuário só preenche dados novos (empresa, banco, etc)

**Benefício**: Evita inconsistências e tentativas de fornecer dados falsos

### 2️⃣ **Validação de Imagem (Anti-Fraude L2)**
Endpoint: `/api/hangarshare/owner/validate-documents`

**Verificações implementadas:**
- ✅ Validação de legibilidade (tamanho do arquivo, resolução)
- ✅ Validação de autenticidade (nome suspeito, formato)
- ✅ Score de qualidade geral (0-100)
- ✅ Sugestões para melhoria

**Issues detectados:**
- Imagem muito pequena/comprimida
- Formato inválido (não PNG/JPG)
- Nome de arquivo suspeito

### 3️⃣ **Detecção Facial (Anti-Fraude L3)** ⚠️ REQUER INTEGRAÇÃO
Implementação recomendada com **AWS Rekognition** ou similar

**O que será verificado:**
- ✅ Presença de rosto na selfie
- ✅ Correspondência facial (selfie vs documento)
- ✅ Detecção de "liveness" (foto real, não impressa)
- ✅ Posição/ângulo correto do documento

---

## 🚀 Implementação: AWS Rekognition

### Passo 1: Configurar AWS
```bash
# 1. Instalar SDK AWS
npm install @aws-sdk/client-rekognition

# 2. Configurar credenciais em `.env.local`
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
AWS_S3_BUCKET=lovetofly-documents  # Para armazenar imagens
```

### Passo 2: Criar o Serviço de Validação
```typescript
// src/lib/documentVerification.ts

import { RekognitionClient, CompareFacesCommand } from '@aws-sdk/client-rekognition';

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION,
});

export async function validateFaceMatch(
  idDocumentBuffer: Buffer,
  selfieBuffer: Buffer
): Promise<{
  match: boolean;
  confidence: number;
  issues: string[];
}> {
  try {
    const result = await rekognitionClient.send(
      new CompareFacesCommand({
        SourceImage: { Bytes: idDocumentBuffer },
        TargetImage: { Bytes: selfieBuffer },
        SimilarityThreshold: 80, // 80% de similaridade mínima
      })
    );

    const match = result.FaceMatches && result.FaceMatches.length > 0;
    const confidence = match ? result.FaceMatches[0].Similarity || 0 : 0;

    const issues: string[] = [];
    if (!match) {
      issues.push('Rosto na selfie não corresponde ao documento');
    } else if (confidence < 85) {
      issues.push(`Correspondência facial baixa (${confidence.toFixed(1)}%)`);
    }

    return {
      match,
      confidence,
      issues,
    };
  } catch (error) {
    console.error('Erro na comparação facial:', error);
    throw error;
  }
}
```

### Passo 3: Integrar ao Endpoint
```typescript
// src/app/api/hangarshare/owner/validate-documents/route.ts (ATUALIZAR)

import { validateFaceMatch } from '@/lib/documentVerification';

// Dentro do POST...
const faceMatch = await validateFaceMatch(
  Buffer.from(idFrontBuffer),
  Buffer.from(selfieBuffer)
);

// Usar resultado na validação...
```

---

## 🔐 Alternativas de Verificação Facial

### 1. **AWS Rekognition** (Recomendado)
- ✅ Muito preciso (95%+ de acurácia)
- ✅ Detecção de liveness built-in
- ✅ API bem documentada
- ✅ Escalável
- ❌ $0.001-0.125 por imagem (custo)

**Documentação**: https://docs.aws.amazon.com/rekognition/

### 2. **Azure Face API**
- ✅ Alternativa de qualidade similar ao AWS
- ✅ Integração com outras ferramentas Microsoft
- ❌ Custo similar

**Documentação**: https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/overview

### 3. **Google Cloud Vision**
- ✅ Excelente detecção de faces
- ✅ API bem integrada
- ❌ Requer análise separada para liveness

**Documentação**: https://cloud.google.com/vision/docs/detecting-faces

### 4. **FaceTech / LivenessAI** (Específico)
- ✅ Especializado em liveness detection
- ✅ Previne fotos/vídeos falsificados
- ✅ Integração SDK
- ❌ Custo mais alto

---

## 📊 Fluxo de Validação Completo

```
┌─────────────────────────────────────────────┐
│ Usuário envia documentos                     │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ L1: Pré-preenchimento (Dados do usuário)    │
│ ✓ CPF, País já no banco → read-only         │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ L2: Validação de Imagem                     │
│ ✓ Legibilidade, Autenticidade               │
│ ✓ Score >= 70%                              │
└──────────────────┬──────────────────────────┘
                   ↓ (SE SCORE >= 70)
┌─────────────────────────────────────────────┐
│ L3: Análise Facial (AWS Rekognition)        │
│ ✓ Presença de rosto                         │
│ ✓ Correspondência facial (80%+)             │
│ ✓ Liveness detection                        │
└──────────────────┬──────────────────────────┘
                   ↓ (SE TODAS VALIDAÇÕES OK)
┌─────────────────────────────────────────────┐
│ ✅ APROVADO                                 │
│ Marcar como verified=true na tabela         │
└─────────────────────────────────────────────┘
                   ↓ (SE ALGUMA VALIDAÇÃO FALHAR)
┌─────────────────────────────────────────────┐
│ ❌ REJEITADO                                │
│ Mostrar issues específicas + sugestões      │
│ Permitir re-upload                          │
└─────────────────────────────────────────────┘
```

---

## 🛡️ Detecção de Fraudes Comuns

### Documentos Falsos
- ✅ Detectado por: Análise de metadados, qualidade de impressão, caracteres
- 🔧 Implementar: AWS Rekognition detect documento falso
- 📊 Confiança: 90%+

### Fotos de Terceiros
- ✅ Detectado por: Correspondência facial (Selfie vs ID)
- 🔧 Implementar: AWS Rekognition CompareFaces
- 📊 Confiança: 95%+

### Fotos/Vídeos Falsificados
- ✅ Detectado por: Liveness detection (movimento, padrões)
- 🔧 Implementar: FaceTech SDK ou AWS Rekognition
- 📊 Confiança: 85%+

### Documento de Outra Pessoa com Selfie Falsa
- ✅ Detectado por: Combinação (Face Match + Liveness)
- 🔧 Implementar: Verificação em múltiplas camadas
- 📊 Confiança: 98%+

---

## 💰 Custo Estimado

**Mensal (100 novos proprietários)**:

| Serviço | Por Imagem | Mensal |
|---------|-----------|---------|
| AWS Rekognition | $0.001 | $0.30 |
| AWS Face Compare | $0.05 | $5.00 |
| **Total** | - | **~$6-10** |

**Anual**: ~$72-120 (muito viável)

---

## 📋 Checklist de Implementação

- [ ] Configurar AWS Rekognition (ou alternativa)
- [ ] Criar serviço de comparação facial
- [ ] Atualizar endpoint `/api/hangarshare/owner/validate-documents`
- [ ] Integrar ao formulário de registro
- [ ] Testar com documentos reais
- [ ] Criar banco de dados de documentos rejeitados
- [ ] Implementar dashboard de análise de verificações
- [ ] Configurar alertas para tentativas de fraude
- [ ] Documentar processo para equipe de suporte

---

## 🧪 Teste Local

```bash
# 1. Obter chaves AWS
# https://console.aws.amazon.com/

# 2. Adicionar ao .env.local
echo "AWS_REGION=us-east-1" >> .env.local
echo "AWS_ACCESS_KEY_ID=xxx" >> .env.local
echo "AWS_SECRET_ACCESS_KEY=yyy" >> .env.local

# 3. Testar endpoint
curl -X POST http://localhost:3000/api/hangarshare/owner/validate-documents \
  -F "idFront=@/path/to/id.jpg" \
  -F "selfie=@/path/to/selfie.jpg"
```

---

## 📚 Referências

- [AWS Rekognition Docs](https://docs.aws.amazon.com/rekognition/)
- [Face Verification Best Practices](https://www.nist.gov/publications/overview-face-recognition-technology)
- [Anti-Fraud Detection Strategies](https://medium.com/identity-verification/document-liveness-detection)

---

**Próximos passos**: Escolher provedor, configurar credenciais, implementar integração.
