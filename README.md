# ENEM Analytics MVP

MVP de uma página de questão do ENEM com foco em visualização de dados, interpretação pedagógica e navegação inteligente.

## Estrutura recomendada do repositório

Este repositório foi enxugado para GitHub. O que importa para o produto atual é:

- `src/`: aplicação Next.js e pipeline TypeScript
- `public/generated/enem-2024/math/`: assets visuais usados nas questões
- `src/data/generated/`: base consolidada usada pelo app
- `data/output-enem-2024-latex/`: resoluções finais geradas e lidas pelo site
- `scripts/`: scripts de extração e preparação de dados

Ficam fora do GitHub por padrão:

- caches (`node_modules/`, `.next/`)
- notebooks e checkpoints
- datasets brutos e tabelas pesadas em `data/external/`
- saídas de teste temporárias do pipeline

## Stack

- `Next.js` com `App Router`
- `Tailwind CSS`
- `Recharts`
- `TypeScript`

## Rodando localmente

1. Instale as dependências:

```bash
npm install
```

2. Inicie o servidor:

```bash
npm run dev
```

3. Abra:

```text
http://localhost:3000
```

## Rotas principais

- `/prova/2024/matematica`
- `/questoes/12`

## Arquivos que o app usa em runtime

- `src/data/generated/enem-2024-math-content.json`
- `src/data/generated/enem-2024-math-enriched.json`
- `src/data/generated/enem-2024-math-frontend-analytics.json`
- `data/output-enem-2024-latex/`
- `public/generated/enem-2024/math/`

## Gerando conteúdo real do PDF

O projeto agora inclui um extrator que lê o PDF oficial, monta as 45 questões finais de matemática, extrai o texto e salva os assets visuais recortados.

Quando o nome do PDF contém algo como `CD7`, o script também salva esse número do caderno no JSON para que o enriquecimento escolha a prova correta nos microdados.

Exemplo:

```bash
npm run extract:enem2024 -- \
  --pdf /Users/flaviodefalcao/Desktop/2024_PV_impresso_D2_CD7.pdf \
  --output src/data/generated/enem-2024-math-content.json \
  --assets-dir public/generated/enem-2024/math
```

Arquivos gerados:

- `src/data/generated/enem-2024-math-content.json`
- `public/generated/enem-2024/math/...`

## Enriquecendo com itens + matriz + dicionário

Depois da extração do PDF, você pode juntar o conteúdo da prova com:

- `ITENS_PROVA_2024.csv`
- `Dicionário_Microdados_Enem_2024.xlsx`
- `matriz_referencia.pdf`

Exemplo:

```bash
npm run enrich:enem2024 -- \
  --content-json src/data/generated/enem-2024-math-content.json \
  --items-csv "/Volumes/ELEMENTS/microdados_enem_2024/DADOS/ITENS_PROVA_2024.csv" \
  --matrix-pdf /Users/flaviodefalcao/Desktop/matriz_referencia.pdf \
  --dictionary-xlsx "/Volumes/ELEMENTS/microdados_enem_2024/DICIONÁRIO/Dicionário_Microdados_Enem_2024.xlsx" \
  --output src/data/generated/enem-2024-math-enriched.json
```

Esse arquivo enriquecido passa a concentrar, por questão:

- posição na prova
- código do item
- prova/cor
- gabarito
- habilidade
- competência
- tema e subtema
- texto e assets extraídos do PDF

Se quiser forçar manualmente uma prova específica, passe `--proof`, por exemplo `--proof 1407`.

Pontos principais da integração:

- O script de extração fica em `scripts/extract_enem_math_2024.py`
- O script de enriquecimento fica em `scripts/build_enem_2024_math_enriched.py`
- O consumo do arquivo enriquecido acontece em `src/data/mock-question.ts`
- O preview da questão renderiza texto, imagens da questão e assets das alternativas em `src/components/question/question-image-preview.tsx`

Observação:

- os datasets brutos usados para gerar analytics foram removidos do repositório para deixá-lo leve
- o app não precisa desses arquivos para rodar
- se você quiser regenerar `src/data/generated/enem-2024-math-frontend-analytics.json`, será preciso recolocar localmente os CSVs/parquets em `data/external/`

## Build de produção

```bash
npm run build
npm run start
```

## Pipeline multimodal com OpenAI

O projeto agora inclui um pipeline em TypeScript para analisar questões com texto e imagem usando a API da OpenAI.

Estrutura:

- `src/enem-pipeline/prompts`
- `src/enem-pipeline/schemas`
- `src/enem-pipeline/services`
- `src/enem-pipeline/pipelines`
- `src/enem-pipeline/types`

Entrada de exemplo:

- `data/questions.json`

Saídas:

- `data/output/<question-id>/01-solver.json`
- `data/output/<question-id>/02-explainer.json`
- `data/output/<question-id>/03-reviewer.json`
- `data/output/<question-id>/final.json`

Execução:

```bash
OPENAI_API_KEY=... npm run pipeline:enem
```

Padrão econômico para testes:

- `solver`: `gpt-4.1-nano`
- `explainer`: `gpt-4.1-nano`
- `reviewer`: `gpt-4.1-nano`
- teto local de orçamento: `US$ 2.00`

O runner interrompe novas chamadas quando o custo estimado acumulado atinge o teto local.

Modelos podem ser trocados por variável de ambiente:

```bash
OPENAI_ENEM_MODEL_SOLVER=gpt-4.1-nano
OPENAI_ENEM_MODEL_EXPLAINER=gpt-4.1-nano
OPENAI_ENEM_MODEL_REVIEWER=gpt-4.1-nano
```

Também é possível ajustar o teto e o tamanho máximo de saída:

```bash
OPENAI_ENEM_BUDGET_USD=2
OPENAI_ENEM_SOLVER_MAX_OUTPUT=1000
OPENAI_ENEM_EXPLAINER_MAX_OUTPUT=900
OPENAI_ENEM_REVIEWER_MAX_OUTPUT=1200
```

## GitHub e tamanho do repositório

Mesmo com a pasta atual enxuta, o histórico Git local ainda pode estar grande se arquivos pesados já tiverem sido versionados antes. Se o objetivo for publicar no GitHub com um histórico leve, o caminho mais simples costuma ser:

1. deixar esta pasta limpa
2. criar um repositório novo
3. fazer um commit novo só com a versão enxuta atual
