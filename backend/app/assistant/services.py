from .intent_parser import parse_intent


def handle_intent(text: str):
    result = parse_intent(text)
    # Aqui poderás ligar os intents aos serviços correspondentes
    if result["intent"] == "unknown":
        return "Desculpe, não entendi a intenção."
    return f"Intenção reconhecida: {result['intent']}"
