import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // 🚫 SITE EM TESTES - BLOQUEIO TOTAL PARA MOTORES DE BUSCA
  // Remover este bloqueio quando pronto para lançamento público
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',  // ❌ BLOQUEIA TUDO
      },
    ],
    // sitemap: 'https://imoveismais-site.vercel.app/sitemap.xml',  // Desativado durante testes
  };
}
