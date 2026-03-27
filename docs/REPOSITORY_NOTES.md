# Repository Notes

## O que deve ficar no repositório

- Código da aplicação em `src/`
- Scripts de geração em `scripts/`
- Assets necessários em `public/generated/enem-2024/math/`
- Bases finais usadas pelo app em `src/data/generated/`
- Saídas finais do pipeline usadas pela UI em `data/output-enem-2024-latex/`

## O que deve ficar fora

- `node_modules/`
- `.next/`
- datasets brutos em `data/external/`
- notebooks exploratórios
- saídas temporárias de teste do pipeline

## Regra prática

Se um arquivo puder ser regenerado facilmente e não for usado pela aplicação em runtime, ele não precisa estar no GitHub.
