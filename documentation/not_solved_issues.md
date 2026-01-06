# Not Solved Issues - Terminal Output Log

Data de criação: 30/12/2025

---

## Saídas recentes do terminal

- yarn dev (OK, código de saída 0)
- kill 19956 (OK, código de saída 0)
- npm run dev (OK, código de saída 0)
- kill 21302 (OK, código de saída 0)
- rm src/app/api/user/profile/route.tsx (ERRO, código de saída 1)
- tail -n 60 .next/trace (OK, código de saída 0)
- kill 23898 (OK, código de saída 0)
- kill 25327 (OK, código de saída 0)
- sudo rm -rf .next (OK, código de saída 0)
- npm run migrate:up (ERRO, código de saída 1, diretório: src/migrations/backup)
- cd (OK, código de saída 0, diretório: src/migrations/backup)

---

## Observações
- A maioria dos comandos executou com sucesso (código de saída 0).
- Dois comandos apresentaram erro:
  - `rm src/app/api/user/profile/route.tsx` (arquivo não encontrado ou permissão negada)
  - `npm run migrate:up` (erro de migração, contexto: src/migrations/backup)
- Não há outros erros críticos registrados nas últimas execuções.

---

Se desejar registrar mais saídas ou detalhes de erros, adicione abaixo.
