"""
Email Service - Resend Integration

Serviço de envio de emails usando Resend.
https://resend.com/docs/send-with-python

Funcionalidades:
- Email de verificação de conta
- Email de boas-vindas
- Email de reset de password
- Templates HTML modernos
"""

import os
from typing import Optional, Dict, Any
from datetime import datetime

# Resend SDK
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    print("[EMAIL] ⚠️ Resend não instalado. Executar: pip install resend")


# ===========================================
# CONFIGURAÇÃO
# ===========================================

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
FROM_EMAIL = os.environ.get("EMAIL_FROM", "CRM Plus <noreply@crmplus.trioto.tech>")
PLATFORM_NAME = "CRM Plus"
PLATFORM_URL = os.environ.get("PLATFORM_URL", "https://crmplus.trioto.tech")
SUPPORT_EMAIL = os.environ.get("SUPPORT_EMAIL", "suporte@crmplus.pt")

# Inicializar Resend
if RESEND_AVAILABLE and RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
    print(f"[EMAIL] ✅ Resend configurado com sucesso")
else:
    print(f"[EMAIL] ⚠️ Resend não configurado. RESEND_API_KEY: {'✓' if RESEND_API_KEY else '✗'}")


# ===========================================
# TEMPLATES HTML
# ===========================================

def get_base_template(content: str, title: str = "CRM Plus") -> str:
    """Template base para todos os emails"""
    return f"""
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }}
        .logo {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .logo img {{
            height: 50px;
        }}
        .logo-text {{
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(135deg, #FF0080, #C026D3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        h1 {{
            color: #111;
            font-size: 24px;
            margin-bottom: 20px;
        }}
        p {{
            color: #555;
            margin-bottom: 15px;
        }}
        .button {{
            display: inline-block;
            background: linear-gradient(135deg, #FF0080, #C026D3);
            color: white !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }}
        .button:hover {{
            opacity: 0.9;
        }}
        .code-box {{
            background: #f8f9fa;
            border: 2px dashed #ddd;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }}
        .code {{
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #FF0080;
            font-family: monospace;
        }}
        .credentials {{
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }}
        .credentials p {{
            margin: 5px 0;
            color: #0c4a6e;
        }}
        .footer {{
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #888;
            font-size: 12px;
        }}
        .footer a {{
            color: #FF0080;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <span class="logo-text">CRM Plus</span>
        </div>
        {content}
        <div class="footer">
            <p>© {datetime.now().year} {PLATFORM_NAME}. Todos os direitos reservados.</p>
            <p>
                <a href="{PLATFORM_URL}">Website</a> · 
                <a href="mailto:{SUPPORT_EMAIL}">Suporte</a>
            </p>
        </div>
    </div>
</body>
</html>
"""


def get_verification_email_template(
    name: str,
    verification_code: str,
    verification_url: str
) -> str:
    """Template para email de verificação"""
    content = f"""
        <h1>Olá {name}! 👋</h1>
        <p>Obrigado por te registares no <strong>{PLATFORM_NAME}</strong>!</p>
        <p>Para ativar a tua conta e começar a usar a plataforma, por favor verifica o teu email clicando no botão abaixo:</p>
        
        <div style="text-align: center;">
            <a href="{verification_url}" class="button">✓ Verificar Email</a>
        </div>
        
        <p>Ou usa este código de verificação:</p>
        <div class="code-box">
            <span class="code">{verification_code}</span>
        </div>
        
        <p style="color: #888; font-size: 13px;">
            Este código expira em <strong>24 horas</strong>.<br>
            Se não criaste esta conta, podes ignorar este email.
        </p>
    """
    return get_base_template(content, "Verifica o teu email - CRM Plus")


def get_welcome_email_template(
    name: str,
    company_name: str,
    email: str,
    backoffice_url: str,
    trial_days: int = 14
) -> str:
    """Template para email de boas-vindas após verificação"""
    content = f"""
        <h1>Bem-vindo ao {PLATFORM_NAME}! 🎉</h1>
        <p>Olá <strong>{name}</strong>,</p>
        <p>A tua conta para <strong>{company_name}</strong> está ativa e pronta a usar!</p>
        
        <div class="credentials">
            <p><strong>📧 Email:</strong> {email}</p>
            <p><strong>🔗 Backoffice:</strong> <a href="{backoffice_url}">{backoffice_url}</a></p>
            <p><strong>⏰ Trial:</strong> {trial_days} dias gratuitos</p>
        </div>
        
        <div style="text-align: center;">
            <a href="{backoffice_url}" class="button">🚀 Aceder ao Backoffice</a>
        </div>
        
        <h2 style="font-size: 18px; margin-top: 30px;">Próximos passos:</h2>
        <ol style="color: #555;">
            <li>Personaliza o branding da tua imobiliária</li>
            <li>Adiciona os teus agentes</li>
            <li>Importa ou cria os teus imóveis</li>
            <li>Configura o site público</li>
        </ol>
        
        <p>Precisas de ajuda? Responde a este email ou contacta <a href="mailto:{SUPPORT_EMAIL}">{SUPPORT_EMAIL}</a></p>
    """
    return get_base_template(content, f"Bem-vindo ao {PLATFORM_NAME}!")


def get_password_reset_template(
    name: str,
    reset_code: str,
    reset_url: str
) -> str:
    """Template para reset de password"""
    content = f"""
        <h1>Reset de Password 🔐</h1>
        <p>Olá <strong>{name}</strong>,</p>
        <p>Recebemos um pedido para redefinir a password da tua conta.</p>
        
        <div style="text-align: center;">
            <a href="{reset_url}" class="button">Redefinir Password</a>
        </div>
        
        <p>Ou usa este código:</p>
        <div class="code-box">
            <span class="code">{reset_code}</span>
        </div>
        
        <p style="color: #888; font-size: 13px;">
            Este código expira em <strong>1 hora</strong>.<br>
            Se não pediste esta alteração, podes ignorar este email. A tua password permanece inalterada.
        </p>
    """
    return get_base_template(content, "Reset de Password - CRM Plus")


# ===========================================
# FUNÇÕES DE ENVIO
# ===========================================

class EmailService:
    """Serviço de envio de emails"""
    
    def __init__(self):
        self.is_configured = RESEND_AVAILABLE and bool(RESEND_API_KEY)
        if not self.is_configured:
            print("[EMAIL] ⚠️ Serviço de email não configurado - emails serão simulados")
    
    def _send(
        self,
        to: str,
        subject: str,
        html: str,
        from_email: str = None
    ) -> Dict[str, Any]:
        """Envia um email via Resend"""
        
        if not self.is_configured:
            # Modo simulação para desenvolvimento
            print(f"[EMAIL] 📧 SIMULADO para {to}: {subject}")
            return {
                "success": True,
                "simulated": True,
                "to": to,
                "subject": subject
            }
        
        try:
            params = {
                "from": from_email or FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html,
            }
            
            response = resend.Emails.send(params)
            
            print(f"[EMAIL] ✅ Enviado para {to}: {subject}")
            return {
                "success": True,
                "id": response.get("id"),
                "to": to,
                "subject": subject
            }
            
        except Exception as e:
            print(f"[EMAIL] ❌ Erro ao enviar para {to}: {e}")
            return {
                "success": False,
                "error": str(e),
                "to": to,
                "subject": subject
            }
    
    def send_verification_email(
        self,
        to: str,
        name: str,
        verification_code: str,
        verification_url: str
    ) -> Dict[str, Any]:
        """Envia email de verificação de conta"""
        
        html = get_verification_email_template(
            name=name,
            verification_code=verification_code,
            verification_url=verification_url
        )
        
        return self._send(
            to=to,
            subject=f"🔐 Verifica o teu email - {PLATFORM_NAME}",
            html=html
        )
    
    def send_welcome_email(
        self,
        to: str,
        name: str,
        company_name: str,
        backoffice_url: str,
        trial_days: int = 14
    ) -> Dict[str, Any]:
        """Envia email de boas-vindas após verificação"""
        
        html = get_welcome_email_template(
            name=name,
            company_name=company_name,
            email=to,
            backoffice_url=backoffice_url,
            trial_days=trial_days
        )
        
        return self._send(
            to=to,
            subject=f"🎉 Bem-vindo ao {PLATFORM_NAME}!",
            html=html
        )
    
    def send_password_reset_email(
        self,
        to: str,
        name: str,
        reset_code: str,
        reset_url: str
    ) -> Dict[str, Any]:
        """Envia email de reset de password"""
        
        html = get_password_reset_template(
            name=name,
            reset_code=reset_code,
            reset_url=reset_url
        )
        
        return self._send(
            to=to,
            subject=f"🔐 Reset de Password - {PLATFORM_NAME}",
            html=html
        )
    
    def send_custom_email(
        self,
        to: str,
        subject: str,
        content_html: str,
        title: str = "CRM Plus"
    ) -> Dict[str, Any]:
        """Envia email com conteúdo personalizado"""
        
        html = get_base_template(content_html, title)
        
        return self._send(
            to=to,
            subject=subject,
            html=html
        )


# Instância global do serviço
email_service = EmailService()


# ===========================================
# FUNÇÕES DE CONVENIÊNCIA
# ===========================================

def send_verification_email(to: str, name: str, code: str, url: str) -> Dict[str, Any]:
    """Função de conveniência para enviar email de verificação"""
    return email_service.send_verification_email(to, name, code, url)

def send_welcome_email(to: str, name: str, company: str, url: str, trial_days: int = 14) -> Dict[str, Any]:
    """Função de conveniência para enviar email de boas-vindas"""
    return email_service.send_welcome_email(to, name, company, url, trial_days)

def send_password_reset(to: str, name: str, code: str, url: str) -> Dict[str, Any]:
    """Função de conveniência para enviar email de reset"""
    return email_service.send_password_reset_email(to, name, code, url)
