from typing import Dict, Any

INTENTS = [
    {"name": "create_lead", "keywords": ["novo lead", "adicionar lead"]},
    {"name": "agendar_evento", "keywords": ["agendar reunião", "novo evento", "agenda"]},
    {"name": "consultar_propriedades", "keywords": ["listar imóveis", "procurar imóvel", "disponíveis"]},
    # expande conforme módulos
]


def parse_intent(text: str) -> Dict[str, Any]:
    for intent in INTENTS:
        for keyword in intent["keywords"]:
            if keyword.lower() in text.lower():
                return {"intent": intent["name"]}
    return {"intent": "unknown"}
