'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

const blogPosts = [
  {
    slug: 'close-more-deals-2025',
    title: { en: '10 Strategies to Close More Deals in 2025', pt: '10 Estratégias para Fechar Mais Negócios em 2025' },
    excerpt: { 
      en: 'Discover proven techniques to boost your sales performance and close more real estate deals.', 
      pt: 'Descubra técnicas comprovadas para aumentar o seu desempenho de vendas e fechar mais negócios imobiliários.' 
    },
    date: '2025-12-10',
    readTime: '8 min',
    category: 'Sales',
    image: '🏆'
  },
  {
    slug: 'ai-real-estate-crm',
    title: { en: 'How AI is Transforming Real Estate CRM', pt: 'Como a IA está a Transformar o CRM Imobiliário' },
    excerpt: { 
      en: 'Learn how artificial intelligence is revolutionizing customer relationship management in real estate.', 
      pt: 'Saiba como a inteligência artificial está a revolucionar a gestão de relacionamento com clientes no setor imobiliário.' 
    },
    date: '2025-12-05',
    readTime: '6 min',
    category: 'Technology',
    image: '🤖'
  },
  {
    slug: 'real-estate-automation-guide',
    title: { en: 'Complete Guide to Real Estate Automation', pt: 'Guia Completo de Automação Imobiliária' },
    excerpt: { 
      en: 'Everything you need to know about automating your real estate business for maximum efficiency.', 
      pt: 'Tudo o que precisa saber sobre automatizar o seu negócio imobiliário para máxima eficiência.' 
    },
    date: '2025-11-28',
    readTime: '10 min',
    category: 'Automation',
    image: '⚡'
  },
];

export default function BlogPage() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,0,128,0.2),transparent_50%)]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Link href="/" className="inline-block mb-8">
            <span className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              CRM Plus
            </span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            {isEn 
              ? 'Insights, tips and strategies to grow your real estate business' 
              : 'Insights, dicas e estratégias para fazer crescer o seu negócio imobiliário'}
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link 
              key={post.slug} 
              href={`/blog/${post.slug}`}
              className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-pink-500/50 transition-all hover:shadow-[0_0_30px_rgba(255,0,128,0.2)]"
            >
              <div className="h-48 bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-6xl">
                {post.image}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs px-2 py-1 bg-pink-500/20 text-pink-400 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-white/40">{post.readTime}</span>
                </div>
                <h2 className="text-xl font-bold mb-2 group-hover:text-pink-400 transition">
                  {isEn ? post.title.en : post.title.pt}
                </h2>
                <p className="text-white/60 text-sm mb-4 line-clamp-2">
                  {isEn ? post.excerpt.en : post.excerpt.pt}
                </p>
                <div className="text-xs text-white/40">
                  {new Date(post.date).toLocaleDateString(isEn ? 'en-US' : 'pt-PT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/comecar"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full font-semibold hover:opacity-90 transition"
          >
            {isEn ? 'Start Your Free Trial' : 'Começar Grátis'} →
          </Link>
        </div>
      </div>
    </main>
  );
}
