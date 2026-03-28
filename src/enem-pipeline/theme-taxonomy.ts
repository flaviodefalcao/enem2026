export type ThemeTaxonomy = {
  areaSlug: string;
  areaLabel: string;
  themes: Array<{
    theme: string;
    subthemes: string[];
  }>;
};

export const AREA_THEME_TAXONOMY: Record<string, ThemeTaxonomy> = {
  linguagens: {
    areaSlug: "linguagens",
    areaLabel: "Linguagens",
    themes: [
      { theme: "Leitura e interpretação textual", subthemes: ["Compreensão global", "Inferência e informação implícita", "Relações entre textos"] },
      { theme: "Argumentação e gêneros", subthemes: ["Estratégias argumentativas", "Gêneros discursivos", "Propósito comunicativo"] },
      { theme: "Língua portuguesa e variação", subthemes: ["Variação linguística", "Norma e uso", "Coesão e progressão textual"] },
      { theme: "Literatura", subthemes: ["Leitura literária", "Contexto histórico-literário", "Recursos expressivos"] },
      { theme: "Artes e produção cultural", subthemes: ["Artes visuais", "Música, dança e teatro", "Multiculturalismo e identidade"] },
      { theme: "Língua estrangeira", subthemes: ["Vocabulário e tema", "Função social do texto", "Diversidade cultural em LEM"] },
      { theme: "Tecnologias da comunicação", subthemes: ["Mídias e linguagens", "Tecnologia e sociedade", "Gêneros digitais"] },
      { theme: "Linguagem corporal", subthemes: ["Práticas corporais", "Identidade e corpo", "Saúde e movimento"] },
    ],
  },
  "ciencias-humanas": {
    areaSlug: "ciencias-humanas",
    areaLabel: "Ciências Humanas",
    themes: [
      { theme: "Cultura e identidade", subthemes: ["Patrimônio cultural", "Memória e representações", "Diversidade cultural"] },
      { theme: "Espaço geográfico e território", subthemes: ["Cartografia e representação", "Relações de poder", "Dinâmicas populacionais"] },
      { theme: "Instituições, poder e movimentos sociais", subthemes: ["Instituições sociais e políticas", "Conflitos e movimentos sociais", "Disputa pelo poder"] },
      { theme: "Trabalho, técnica e produção", subthemes: ["Tecnologia e trabalho", "Industrialização e urbanização", "Circulação de riquezas"] },
      { theme: "Cidadania e democracia", subthemes: ["Direitos e participação social", "Ética e política", "Inclusão social"] },
      { theme: "Sociedade e natureza", subthemes: ["Ocupação do espaço", "Impactos socioambientais", "Recursos naturais e sustentabilidade"] },
      { theme: "Geopolítica e processos históricos", subthemes: ["Estado e formação territorial", "Conflitos internacionais", "Processos históricos comparados"] },
    ],
  },
  "ciencias-natureza": {
    areaSlug: "ciencias-natureza",
    areaLabel: "Ciências da Natureza",
    themes: [
      { theme: "Métodos e representação científica", subthemes: ["Leitura de gráficos e tabelas", "Linguagens e modelos científicos", "Interpretação experimental"] },
      { theme: "Física", subthemes: ["Mecânica e energia", "Ondas, óptica e radiação", "Eletricidade e magnetismo", "Termologia e termodinâmica"] },
      { theme: "Química", subthemes: ["Transformações químicas", "Estequiometria e soluções", "Equilíbrio e cinética", "Química orgânica"] },
      { theme: "Biologia", subthemes: ["Ecologia e ambiente", "Genética e hereditariedade", "Fisiologia e saúde", "Evolução e biodiversidade"] },
      { theme: "Tecnologia aplicada às ciências naturais", subthemes: ["Dispositivos e circuitos", "Materiais e processos tecnológicos", "Biotecnologia"] },
      { theme: "Ambiente e sustentabilidade", subthemes: ["Impactos ambientais", "Ciclos e recursos naturais", "Conservação e uso sustentável"] },
    ],
  },
  matematica: {
    areaSlug: "matematica",
    areaLabel: "Matemática",
    themes: [
      { theme: "Conhecimentos numéricos", subthemes: ["Números, operações e contagem", "Números racionais e equivalência", "Combinatória e contagem"] },
      { theme: "Conhecimentos geométricos", subthemes: ["Geometria plana e espacial"] },
      { theme: "Grandezas e medidas", subthemes: ["Medidas, escalas e unidades", "Escalas, medidas e proporcionalidade geométrica"] },
      { theme: "Variação de grandezas", subthemes: ["Relações de proporcionalidade", "Relações de dependência e proporcionalidade"] },
      { theme: "Conhecimentos algébricos", subthemes: ["Funções, equações e modelagem algébrica", "Funções e interpretação de gráficos", "Modelagem algébrica"] },
      { theme: "Gráficos e tabelas", subthemes: ["Leitura, interpretação e inferência com dados"] },
      { theme: "Estatística e probabilidade", subthemes: ["Medidas estatísticas, amostragem e chance"] },
    ],
  },
};

export function getThemeTaxonomy(areaSlug: string) {
  return AREA_THEME_TAXONOMY[areaSlug];
}
