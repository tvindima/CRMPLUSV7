// Distritos, Concelhos e Freguesias de Portugal
export const DISTRICTS = [
  "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra",
  "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre",
  "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"
];

export const MUNICIPALITIES: Record<string, string[]> = {
  "Leiria": [
    "Leiria", "Alcobaça", "Alvaiázere", "Ansião", "Batalha", "Bombarral",
    "Caldas da Rainha", "Castanheira de Pêra", "Figueiró dos Vinhos",
    "Marinha Grande", "Nazaré", "Óbidos", "Pedrógão Grande", "Peniche",
    "Pombal", "Porto de Mós"
  ],
  "Lisboa": [
    "Lisboa", "Almada", "Amadora", "Cascais", "Loures", "Mafra",
    "Oeiras", "Odivelas", "Sintra", "Vila Franca de Xira"
  ],
  "Porto": [
    "Porto", "Amarante", "Baião", "Felgueiras", "Gondomar", "Lousada",
    "Maia", "Marco de Canaveses", "Matosinhos", "Paços de Ferreira",
    "Paredes", "Penafiel", "Póvoa de Varzim", "Santo Tirso", "Trofa",
    "Valongo", "Vila do Conde", "Vila Nova de Gaia"
  ],
  "Aveiro": [
    "Aveiro", "Águeda", "Albergaria-a-Velha", "Anadia", "Arouca",
    "Estarreja", "Ílhavo", "Mealhada", "Murtosa", "Oliveira de Azeméis",
    "Oliveira do Bairro", "Ovar", "Santa Maria da Feira", "São João da Madeira",
    "Sever do Vouga", "Vagos", "Vale de Cambra"
  ],
  "Coimbra": [
    "Coimbra", "Arganil", "Cantanhede", "Condeixa-a-Nova", "Figueira da Foz",
    "Góis", "Lousã", "Mira", "Miranda do Corvo", "Montemor-o-Velho",
    "Oliveira do Hospital", "Pampilhosa da Serra", "Penacova", "Penela",
    "Soure", "Tábua", "Vila Nova de Poiares"
  ]
};

export const PARISHES: Record<string, string[]> = {
  "Leiria": [
    "Leiria (Barreira e Cortes)", "Leiria (Marrazes e Barosa)", "Leiria (Pousos)",
    "Leiria (Coimbrão)", "Leiria (Monte Real e Carvide)", "Amor", "Arrabal",
    "Azoia", "Bajouca", "Barreira", "Boa Vista", "Caranguejeira", "Carvide",
    "Coimbrão", "Colmeias", "Cortes", "Maceira", "Marrazes", "Milagres",
    "Monte Real", "Monte Redondo", "Ortigosa", "Parceiros", "Pousos",
    "Regueira de Pontes", "Santa Catarina da Serra", "Santa Eufémia",
    "Souto da Carpalhosa", "Vieira de Leiria"
  ],
  "Batalha": [
    "Batalha", "São Mamede", "Reguengo do Fetal", "Golpilheira"
  ],
  "Marinha Grande": [
    "Marinha Grande", "Moita", "Vieira de Leiria"
  ],
  "Pombal": [
    "Pombal", "Abiul", "Albergaria dos Doze", "Carnide", "Carriço",
    "Ilha", "Louriçal", "Meirinhas", "Pelariga", "Redinha", "Santiago de Litém",
    "São Simão de Litém", "Vermoil", "Vila Cã"
  ]
};

export const CONDITIONS = [
  "Novo", "Usado", "Em construção", "Para recuperar", "Renovado"
];

export const ENERGY_CERTIFICATES = [
  "A+", "A", "B", "B-", "C", "D", "E", "F", "Isento", "Em curso"
];
