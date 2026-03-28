# 📊 ENEM Item Analysis Pipeline

Pipeline completo para processamento dos microdados do ENEM e geração de análises avançadas por questão.

---

# 🎯 Objetivo

Transformar os microdados brutos do ENEM em uma base estruturada para análise de itens, permitindo:

- entender dificuldade real das questões  
- comparar TRI vs comportamento empírico  
- analisar distratores  
- estudar comportamento de alunos de alta performance (800+)  
- gerar base pronta para frontend / produto  

---

# 🧠 Estrutura do Pipeline

## 1. Seleção de provas (majority logic)

- Seleciona apenas provas válidas (exclui adaptadas)
- Para cada área:
  - Top 4 provas por volume → P1
  - Próximas → P2

---

## 2. Mapping de questões (canonicalização)

- Usa prova azul como referência
- Cria:
  questao_canonica = Q01 ... Q45

---

## 3. Gold A (nível aluno)

Contém:
- respostas (Q01_resp)
- acertos (Q01_acc)
- notas (CN, CH, LC, MT, RED)

Features:
- média geral
- total de acertos
- bucket de nota
- theta (z-score)

---

## 4. Wide → Long

Transforma para:
(aluno, questão)

---

## 5. Curvas empíricas

- taxa de acerto por nível de habilidade

---

## 6. Distratores

- distribuição A–E + branco
- identifica distrator dominante

---

## 7. Gold B (nível questão)

Métricas:
- taxa_acerto
- discriminação empírica
- parâmetros TRI (A, B, C)
- métricas por alunos 800+

---

## 8. Classificações

- dificuldade
- discriminação
- qualidade
- prioridade

---

## 9. Output final

Inclui:
- métricas completas
- classificação
- summary automático
- caminhos para gráficos/imagens

---

# 📁 Outputs

- gold_a_student.parquet
- gold_item_stats.parquet
- gold_item_distractors.parquet
- gold_item_empirical_curve.parquet
- final_question_cards.parquet

---

# ⚙️ Execução

```python
config = PipelineConfig(
    input_dir=Path("..."),
    output_dir=Path("..."),
    year=2024,
    areas=("CN", "CH", "LC", "MT"),
)

pipeline = EnemAllAreasMajorityPipeline(config)

pipeline.run()
```

---

# ⚠️ Erros comuns

KeyError TX_COR:
- adicionar coluna fallback

NA boolean:
- usar pd.notna()

NaN para int:
- filtrar antes de converter

---

# 🚀 Próximos passos

- multi-ano
- comparação P1 vs P2
- clustering de questões
- recomendação adaptativa
