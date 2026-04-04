from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path("/Users/flaviodefalcao/Desktop/project_enem")
OVERRIDES_PATH = ROOT / "src" / "data" / "generated" / "enem-2023-ocr-overrides.json"
TMP = Path("/tmp")


def ensure_question_dir(area: str, exam_question_number: int) -> Path:
    question_dir = ROOT / "public" / "generated" / "enem-2023" / area / f"question-{exam_question_number}"
    question_dir.mkdir(parents=True, exist_ok=True)
    return question_dir


def crop(src: Path, dest: Path, box: tuple[int, int, int, int]) -> None:
    image = Image.open(src)
    cropped = image.crop(box)
    cropped.save(dest)


def update_override(
    payload: dict,
    *,
    area: str,
    id_: int,
    statement: str,
    options: list[tuple[str, str]],
    confidence: str = "pdf_text_manual",
) -> None:
    year_bucket = payload.setdefault("2023", {})
    area_bucket = year_bucket.setdefault(area, {})
    area_bucket[str(id_)] = {
        "statement": statement.strip(),
        "options": [{"option": option, "text": text.strip()} for option, text in options],
        "ocrText": statement.strip()
        + "\n"
        + "\n".join(f"{option} {text}".strip() for option, text in options),
        "confidence": confidence,
    }


def main() -> None:
    with OVERRIDES_PATH.open() as handle:
        payload = json.load(handle)

    # Textual fixes from original 2023 PDFs/OCR.
    update_override(
        payload,
        area="linguagens",
        id_=8,
        statement="""De quem é esta língua?
Uma pequena editora brasileira, a Urutau, acaba de lançar em Lisboa uma “antologia antirracista de poetas estrangeiros em Portugal”, com o título Volta para a tua terra.
O livro denuncia as diversas formas de racismo a que os imigrantes estão sujeitos. Alguns dos poetas brasileiros antologiados queixam-se do desdém com que um grande número de portugueses acolhe o português brasileiro. É uma queixa frequente.
“Aqui em Portugal eles dizem - eles dizem - / que nosso português é errado, que nós não falamos português”, escreve a poetisa paulista Maria Giulia Pinheiro, para concluir: “Se a sua linguagem, a lusitana, / ainda conserva a palavra da opressão / ela não é a mais bonita do mundo. / Ela é uma das mais violentas”.
Fonte: AGUALUSA, J. E. Disponível em: https://oglobo.globo.com. Acesso em: 22 nov. 2021 (adaptado).
O texto de Agualusa tematiza o preconceito em relação ao português brasileiro. Com base no trecho citado pelo autor, infere-se que esse preconceito se deve""",
        options=[
            ("A", "à dificuldade de consolidação da literatura brasileira em outros países."),
            ("B", "aos diferentes graus de instrução formal entre os falantes de língua portuguesa."),
            ("C", "à existência de uma língua ideal que alguns falantes lusitanos creem ser a falada em Portugal."),
            ("D", "ao intercâmbio cultural que ocorre entre os povos dos diferentes países de língua portuguesa."),
            ("E", "à distância territorial entre os falantes do português que vivem em Portugal e no Brasil."),
        ],
    )

    update_override(
        payload,
        area="linguagens",
        id_=39,
        statement="""A petição on-line criada por um cidadão paulista surtiu efeito: casado há três anos com seu companheiro, ele pedia a alteração da definição de “casamento” no tradicional dicionário Michaelis em português. Na definição anterior, casamento aparecia como “união legítima entre homem e mulher” e “união legal entre homem e mulher, para constituir família”.
O novo verbete não traz em nenhum momento as palavras homem ou mulher - agora a definição de casamento se refere a “pessoas”.
Para o diretor de comunicação do site onde a petição foi publicada, a iniciativa mostra a “eficiência da mobilização”. “Em dois dias, mudou-se uma definição que permanecia a mesma há décadas”, afirma. E conclui: “A plataforma serve para todos os tipos de causas, para as mudanças que importam para as pessoas.”.
Fonte: SENRA, R. Disponível em: www.bbc.com. Acesso em: 29 out. 2015.
A notícia trata da mudança ocorrida em um dicionário da língua portuguesa. Segundo o texto, essa mudança foi impulsionada pela""",
        options=[
            ("A", "inclusão de informações no verbete."),
            ("B", "relevância social da instituição casamento."),
            ("C", "utilização pública da petição pelos cidadãos."),
            ("D", "rapidez na disseminação digital do verbete."),
            ("E", "divulgação de plataformas para a criação de petição."),
        ],
    )

    update_override(
        payload,
        area="ciencias-humanas",
        id_=2,
        statement="""Felizes tempos eram esses! As moças iam à missa de madrugada. De dia ninguém as via e se alguma, em dia de festa, queria passear com a avó ou a tia, havia de ir de cadeirinhas. Bem razão têm os nossos velhos de chorar por esses tempos, em que as filhas não sabiam escrever, e por isso não mandavam nem recebiam bilhetinhos.
Fonte: Novo Correio de Modas, 1853, apud DONEGÁ, A. L. Publicar ficção em meados do século XIX: um estudo das revistas femininas editadas pelos irmãos Laemmert. Campinas: Unicamp, 2013 (adaptado).
Na perspectiva do autor, as tradições e os costumes sociofamiliares sofreram alterações, no século XIX, decorrentes de quais fatores?""",
        options=[
            ("A", "Hábitos de leitura e mobilidade regional."),
            ("B", "Circulação de impressos e trânsito religioso."),
            ("C", "Valorização da língua e imigração estrangeira."),
            ("D", "Práticas de letramento e transformação cultural."),
            ("E", "Flexibilização do ensino e reformismo pedagógico."),
        ],
    )

    update_override(
        payload,
        area="ciencias-humanas",
        id_=7,
        statement="""TEXTO I
Como presença consciente no mundo não posso escapar à responsabilidade ética no meu mover-me no mundo. Se sou puro produto da determinação genética ou cultural ou de classe, sou irresponsável pelo que faço no meu mover-me no mundo e, se careço de responsabilidade, não posso falar em ética.
FREIRE, P. Pedagogia da autonomia: saberes necessários à prática educativa. São Paulo: Paz e Terra, 1996.

TEXTO II
Paulo Freire construiu uma pedagogia da esperança. Na sua concepção, a história não é algo pronto e acabado. As estruturas de opressão e as desigualdades, apesar de serem naturalizadas, são sócio e historicamente construídas. Daí a importância de os educandos tomarem consciência da sua realidade para, assim, transformá-la.
Fonte: DEMARCHI, J. L. Paulo Freire. Disponível em: https://diplomatique.org.br. Acesso em: 6 out. 2021 (adaptado).
Com base no conceito de ética pedagógica presente nos textos, os educandos tornam-se responsáveis pela""",
        options=[
            ("A", "participação sociopolítica."),
            ("B", "definição estético-cultural."),
            ("C", "competição econômica local."),
            ("D", "manutenção do sistema escolar."),
            ("E", "capacitação de mobilidade individual."),
        ],
    )

    update_override(
        payload,
        area="ciencias-humanas",
        id_=19,
        statement="""Txai Suruí, liderança da Juventude Indígena, profere seu discurso na abertura da COP-26:
“O clima está esquentando, os animais estão desaparecendo, os rios estão morrendo e nossas plantações não florescem como no passado. A Terra está falando: ela nos diz que não temos mais tempo.”
Fonte: VICK, M. Quais são as conquistas do movimento indígena na COP-26. Disponível em: www.nexojornal.com.br. Acesso em: 10 nov. 2021 (adaptado).
O discurso da líder indígena explicita um problema global relacionado ao(à)""",
        options=[
            ("A", "manejo tradicional."),
            ("B", "reciclagem residual."),
            ("C", "consumo consciente."),
            ("D", "exploração predatória."),
            ("E", "reaproveitamento energético."),
        ],
    )

    update_override(
        payload,
        area="ciencias-natureza",
        id_=1,
        statement="""Na tirinha de Mauricio de Sousa, os personagens Cebolinha e Cascão fazem uma brincadeira utilizando duas latas e um barbante. Ao perceberem que o som pode ser transmitido através do barbante, resolvem alterar o comprimento do barbante para ficar cada vez mais extenso. As demais condições permaneceram inalteradas durante a brincadeira.
Fonte: SOUSA, M. Disponível em: www.monica.com.br. Acesso em: 2 out. 2012 (adaptado).
Na prática, à medida que se aumenta o comprimento do barbante, ocorre a redução de qual característica da onda sonora?""",
        options=[
            ("A", "Altura."),
            ("B", "Período."),
            ("C", "Amplitude."),
            ("D", "Velocidade."),
            ("E", "Comprimento de onda."),
        ],
    )

    update_override(
        payload,
        area="matematica",
        id_=12,
        statement="""Num certo momento de um jogo digital, a tela apresenta a imagem representada na figura. O ponto Q1 representa a posição de um jogador que está com a bola, os pontos Q2, Q3, Q4, Q5 e Q6 também indicam posições de jogadores da mesma equipe, e os pontos A e B indicam os dois pés da trave mais próxima deles. No momento da partida retratado, o jogador Q1 tem a posse da bola, que será passada para um dos outros jogadores das posições Qn, n ∈ {2, 3, 4, 5, 6}, cujo ângulo AQnB tenha a mesma medida do ângulo AQ1B.
Qual é o jogador que receberá a bola?""",
        options=[
            ("A", "Q2."),
            ("B", "Q3."),
            ("C", "Q4."),
            ("D", "Q5."),
            ("E", "Q6."),
        ],
    )

    update_override(
        payload,
        area="matematica",
        id_=17,
        statement="""Os números figurados pentagonais provavelmente foram introduzidos pelos pitagóricos por volta do século V a.C. As figuras ilustram como obter os seis primeiros deles, sendo os demais obtidos seguindo o mesmo padrão geométrico.
O oitavo número pentagonal é""",
        options=[
            ("A", "59."),
            ("B", "83."),
            ("C", "86."),
            ("D", "89."),
            ("E", "92."),
        ],
    )

    update_override(
        payload,
        area="matematica",
        id_=18,
        statement="""A figura ilustra uma roda-gigante no exato instante em que a cadeira onde se encontra a pessoa P está no ponto mais alto dessa roda-gigante.
Com o passar do tempo, à medida que a roda-gigante gira, com velocidade angular constante e no sentido horário, a altura da cadeira onde se encontra a pessoa P, em relação ao solo, vai se alterando.
O gráfico que melhor representa a variação dessa altura, em função do tempo, contado a partir do instante em que a cadeira da pessoa P se encontra na posição mais alta da roda-gigante, é""",
        options=[
            ("A", ""),
            ("B", ""),
            ("C", ""),
            ("D", ""),
            ("E", ""),
        ],
    )

    update_override(
        payload,
        area="matematica",
        id_=37,
        statement="""Uma empresa de segurança domiciliar oferece o serviço de patrulha noturna, no qual vigilantes em motocicletas fazem o monitoramento periódico de residências. A empresa conta com uma base, de onde acompanha o trajeto realizado pelos vigilantes durante as patrulhas e orienta o deslocamento de equipes de reforço quando necessário. Numa patrulha rotineira, sem ocorrências, um vigilante conduziu sua motocicleta a uma velocidade constante durante todo o itinerário estabelecido, levando 30 minutos para conclusão. De acordo com os registros do GPS alocado na motocicleta, a distância da posição do vigilante à base, ao longo do tempo de realização do trajeto, é descrita pelo gráfico.
A vista superior da trajetória realizada pelo vigilante durante a patrulha registrada no gráfico é descrita pela representação""",
        options=[
            ("A", ""),
            ("B", ""),
            ("C", ""),
            ("D", ""),
            ("E", ""),
        ],
    )

    update_override(
        payload,
        area="matematica",
        id_=12,
        statement="""Num certo momento de um jogo digital, a tela apresenta a imagem representada na figura. O ponto Q1 representa a posição de um jogador que está com a bola, os pontos Q2, Q3, Q4, Q5 e Q6 também indicam posições de jogadores da mesma equipe, e os pontos A e B indicam os dois pés da trave mais próxima deles. No momento da partida retratado, o jogador Q1 tem a posse da bola, que será passada para um dos outros jogadores das posições Qn, n ∈ {2, 3, 4, 5, 6}, cujo ângulo AQnB tenha a mesma medida do ângulo AQ1B.
Qual é o jogador que receberá a bola?""",
        options=[
            ("A", "Q2."),
            ("B", "Q3."),
            ("C", "Q4."),
            ("D", "Q5."),
            ("E", "Q6."),
        ],
    )

    update_override(
        payload,
        area="matematica",
        id_=17,
        statement="""Os números figurados pentagonais provavelmente foram introduzidos pelos pitagóricos por volta do século V a.C. As figuras ilustram como obter os seis primeiros deles, sendo os demais obtidos seguindo o mesmo padrão geométrico.
O oitavo número pentagonal é""",
        options=[
            ("A", "59."),
            ("B", "83."),
            ("C", "86."),
            ("D", "89."),
            ("E", "92."),
        ],
    )

    update_override(
        payload,
        area="matematica",
        id_=18,
        statement="""A figura ilustra uma roda-gigante no exato instante em que a cadeira onde se encontra a pessoa P está no ponto mais alto dessa roda-gigante.
Com o passar do tempo, à medida que a roda-gigante gira, com velocidade angular constante e no sentido horário, a altura da cadeira onde se encontra a pessoa P, em relação ao solo, vai se alterando.
O gráfico que melhor representa a variação dessa altura, em função do tempo, contado a partir do instante em que a cadeira da pessoa P se encontra na posição mais alta da roda-gigante, é""",
        options=[
            ("A", ""),
            ("B", ""),
            ("C", ""),
            ("D", ""),
            ("E", ""),
        ],
    )

    update_override(
        payload,
        area="matematica",
        id_=24,
        statement="""O esquema mostra como a intensidade luminosa decresce com o aumento da profundidade em um rio, sendo L0 a intensidade na sua superfície.
0 m
L0
1 m
2/3 L0
2 m
4/9 L0
3 m
8/27 L0
Intensidade luminosa
Profundidade
Considere que a intensidade luminosa diminui, a cada metro acrescido na profundidade, segundo o mesmo padrão do esquema.
A intensidade luminosa correspondente à profundidade de 6 m é igual a""",
        options=[
            ("A", "1/9 L0"),
            ("B", "16/27 L0"),
            ("C", "32/243 L0"),
            ("D", "64/729 L0"),
            ("E", "128/2187 L0"),
        ],
    )

    # Asset crops for visual questions.
    day2_p20 = TMP / "enem2023day2p20.png"
    day2_p22 = TMP / "enem2023day2p22.png"
    day2_p28 = TMP / "enem2023day2p28.png"

    day1_p6 = TMP / "enem2023day1p6.png"
    day1_p17 = TMP / "enem2023day1p17.png"
    day1_p20 = TMP / "enem2023day1p20.png"
    day1_p21 = TMP / "enem2023day1p21.png"
    day1_p24 = TMP / "enem2023day1p24.png"

    question_147_dir = ensure_question_dir("matematica", 147)
    crop(day2_p20, question_147_dir / "statement-01.png", (560, 110, 1085, 560))
    for option, box in {
        "a": (520, 355, 1095, 500),
        "b": (520, 495, 1095, 625),
        "c": (520, 615, 1095, 745),
        "d": (520, 740, 1095, 870),
        "e": (520, 855, 1095, 995),
    }.items():
        crop(day2_p20, question_147_dir / f"option-{option}-01.png", box)

    question_152_dir = ensure_question_dir("matematica", 152)
    crop(day2_p22, question_152_dir / "statement-01.png", (0, 0, 540, 1160))
    for option, box in {
        "a": (545, 100, 1095, 210),
        "b": (545, 215, 1095, 330),
        "c": (545, 335, 1095, 450),
        "d": (545, 455, 1095, 570),
        "e": (545, 575, 1095, 690),
    }.items():
        crop(day2_p22, question_152_dir / f"option-{option}-01.png", box)

    question_153_dir = ensure_question_dir("matematica", 153)
    crop(day2_p22, question_153_dir / "statement-01.png", (20, 810, 560, 1450))
    for option, box in {
        "a": (560, 90, 1095, 330),
        "b": (560, 300, 1095, 545),
        "c": (560, 515, 1095, 760),
        "d": (560, 740, 1095, 995),
        "e": (560, 970, 1095, 1245),
    }.items():
        crop(day2_p22, question_153_dir / f"option-{option}-01.png", box)

    question_172_dir = ensure_question_dir("matematica", 172)
    for option, box in {
        "a": (695, 760, 1095, 905),
        "b": (695, 880, 1095, 1025),
        "c": (695, 1000, 1095, 1145),
        "d": (695, 1120, 1095, 1295),
        "e": (695, 1260, 1095, 1505),
    }.items():
        crop(day2_p28, question_172_dir / f"option-{option}-01.png", box)

    question_91_dir = ensure_question_dir("ciencias-natureza", 91)
    crop(TMP / "enem2023day2p22.png", question_91_dir / "statement-01.png", (0, 0, 1, 1))

    with OVERRIDES_PATH.open("w") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
