'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const icons = { chart: true, home: true, user: true, calendar: true, users: true, bot: true, mobile: true, analytics: true };

// Animated Counter Component
function AnimatedCounter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  return (
    <div ref={ref} className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
      {count.toLocaleString()}{suffix}
    </div>
  );
}

// Scroll Animation Hook
function useScrollAnimation() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.scroll-animate').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function Page() {
  const { t } = useLanguage();
  useScrollAnimation();
  
  const features = [
    { label: t.features.smartDashboard.label, icon: "chart", description: t.features.smartDashboard.description },
    { label: t.features.propertyManagement.label, icon: "home", description: t.features.propertyManagement.description },
    { label: t.features.leadTracking.label, icon: "user", description: t.features.leadTracking.description },
    { label: t.features.calendar.label, icon: "calendar", description: t.features.calendar.description },
    { label: t.features.teamCollaboration.label, icon: "users", description: t.features.teamCollaboration.description },
    { label: t.features.aiAssistant.label, icon: "bot", description: t.features.aiAssistant.description, comingSoon: true },
    { label: t.features.mobileApp.label, icon: "mobile", description: t.features.mobileApp.description, comingSoon: true },
    { label: t.features.analytics.label, icon: "analytics", description: t.features.analytics.description, comingSoon: true },
  ];
  
  const stats = [
    { value: 500, suffix: "+", label: t.stats.agencies },
    { value: 10000, suffix: "+", label: t.stats.properties },
    { value: 98, suffix: "%", label: t.stats.satisfaction },
    { value: 40, suffix: "%", label: t.stats.boost },
  ];
  
  const blogPosts = [
    { title: t.blog.post1.title, excerpt: t.blog.post1.excerpt, date: "Dec 10, 2025", slug: "close-more-deals-2025" },
    { title: t.blog.post2.title, excerpt: t.blog.post2.excerpt, date: "Dec 5, 2025", slug: "ai-real-estate-crm" },
    { title: t.blog.post3.title, excerpt: t.blog.post3.excerpt, date: "Nov 28, 2025", slug: "real-estate-automation-guide" },
  ];
  
  const testimonials = [
    { name: "Ana Silva", role: t.testimonials.ana.role, company: "ImobiNova", quote: t.testimonials.ana.quote, avatar: "AS" },
    { name: "Carlos Mendes", role: t.testimonials.carlos.role, company: "ReMax Premium", quote: t.testimonials.carlos.quote, avatar: "CM" },
    { name: "Rita Costa", role: t.testimonials.rita.role, company: "Century 21", quote: t.testimonials.rita.quote, avatar: "RC" },
  ];
  
  const faqs = [
    { q: t.faq.q1.question, a: t.faq.q1.answer },
    { q: t.faq.q2.question, a: t.faq.q2.answer },
    { q: t.faq.q3.question, a: t.faq.q3.answer },
    { q: t.faq.q4.question, a: t.faq.q4.answer },
    { q: t.faq.q5.question, a: t.faq.q5.answer },
  ];
  
  return (
    <main className="relative overflow-hidden bg-black text-white selection:bg-pink-500/30 selection:text-white">
      <LanguageSwitcher />
      
      {/* Background glows + effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,0,128,0.4),transparent_50%),radial-gradient(circle_at_80%_60%,rgba(192,38,211,0.35),transparent_45%),radial-gradient(circle_at_20%_80%,rgba(124,58,237,0.3),transparent_50%)]" />
        <div className="absolute left-1/4 top-20 h-96 w-96 opacity-60 [background:radial-gradient(circle,rgba(255,0,128,0.6),transparent_70%)] blur-3xl" />
        <div className="absolute right-1/4 top-40 h-80 w-80 opacity-50 [background:radial-gradient(circle,rgba(192,38,211,0.5),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center px-4 sm:px-6 lg:px-8 pb-20 pt-12 text-center md:pt-20">
        <div className="mb-8 sm:mb-10 flex flex-col items-center gap-3">
          <Image 
            src="/logo-crm-plus.svg" 
            alt="CRM PLUS Logo - Advanced CRM for Real Estate" 
            width={300} 
            height={300}
            priority
            className="w-[200px] sm:w-[250px] md:w-[300px] h-auto drop-shadow-[0_0_25px_rgba(255,0,128,0.6)] transition-transform duration-500 hover:scale-105"
          />
        </div>

        <h1 className="mb-6 max-w-4xl text-[clamp(2.5rem,8vw,4.5rem)] font-bold leading-[1.1] tracking-tight whitespace-pre-line">
          {t.hero.tagline}
        </h1>
        <p className="mb-10 max-w-2xl text-[clamp(1.125rem,3vw,1.375rem)] leading-relaxed text-gray-300">{t.hero.subtitle}</p>

        <Link
          href="/comecar"
          className="group mb-16 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#FF0080] to-[#C026D3] px-10 py-4 text-lg font-semibold text-white shadow-[0_0_40px_rgba(255,0,128,0.6)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(255,0,128,0.9)] active:scale-95"
        >
          {t.hero.cta}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:translate-x-1">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        {/* 4 Mobile Mockups - reproduzindo design do anexo */}
        <div className="relative mb-20 w-full max-w-6xl scroll-animate opacity-0">
          <div className="relative overflow-visible rounded-[32px] border border-pink-500/30 bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-black p-8 md:p-12 shadow-[0_0_80px_rgba(255,0,128,0.4)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {/* Phone 1 - Dashboard do Agente */}
              <div className="relative h-[400px] md:h-[500px] overflow-hidden rounded-[36px] border-2 border-pink-500/50 bg-gradient-to-b from-gray-900 via-black to-purple-950 shadow-[0_20px_50px_rgba(255,0,128,0.6)]">
                <div className="absolute inset-0 bg-gradient-to-b from-pink-500/10 to-transparent" />
                <div className="relative p-4 text-white text-xs">
                  <div className="mb-3 h-1 w-12 mx-auto rounded-full bg-gray-600" />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500" />
                    <div>
                      <div className="font-bold text-sm">Tiago V.</div>
                      <div className="text-[10px] text-gray-400">Senior Agent</div>
                    </div>
                  </div>
                  <div className="mb-3 text-lg font-bold">Boa tarde, Tiago!</div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 rounded-lg border border-pink-500/30 bg-black/40">
                      <div className="text-xl font-bold">6</div>
                      <div className="text-[9px] text-gray-400">Visitas hoje</div>
                    </div>
                    <div className="text-center p-2 rounded-lg border border-blue-500/30 bg-black/40">
                      <div className="text-xl font-bold">12</div>
                      <div className="text-[9px] text-gray-400">Propostas</div>
                    </div>
                    <div className="text-center p-2 rounded-lg border border-purple-500/30 bg-black/40">
                      <div className="text-xl font-bold">4</div>
                      <div className="text-[9px] text-gray-400">Fechados</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold mb-2">Propriedades em Destaque</div>
                    <div className="rounded-lg border border-pink-500/40 bg-black/60 p-2">
                      <div className="h-16 rounded bg-gradient-to-br from-amber-900/40 via-orange-800/30 to-pink-900/40 mb-2 relative overflow-hidden">
                        {/* Simulação de interior moderno com janela */}
                        <div className="absolute inset-0">
                          {/* Chão/parede */}
                          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-950/60 to-transparent" />
                          {/* Janela com luz */}
                          <div className="absolute top-2 right-2 w-8 h-10 bg-gradient-to-br from-amber-200/40 via-orange-100/20 to-pink-100/10 border border-amber-300/30 rounded-sm">
                            <div className="absolute inset-0 bg-gradient-to-b from-sky-200/20 to-transparent" />
                          </div>
                          {/* Sofá/mobilia */}
                          <div className="absolute bottom-1 left-2 w-6 h-3 bg-gradient-to-t from-pink-900/50 to-pink-800/30 rounded-sm" />
                          {/* Luz ambiente */}
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-300/10 via-transparent to-pink-500/5" />
                        </div>
                      </div>
                      <div className="text-[10px] font-bold">Ponente Visage</div>
                      <div className="text-[9px] text-pink-400">€ 325,000</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone 2 - Lista de Propriedades */}
              <div className="relative h-[400px] md:h-[500px] overflow-hidden rounded-[36px] border-2 border-blue-500/50 bg-gradient-to-b from-gray-900 via-black to-blue-950 shadow-[0_20px_50px_rgba(59,130,246,0.6)]">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent" />
                <div className="relative p-4 text-white text-xs">
                  <div className="mb-3 h-1 w-12 mx-auto rounded-full bg-gray-600" />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                    <div className="font-bold text-sm">Tiago V.</div>
                  </div>
                  <div className="mb-3 text-lg font-bold">Propriedades (83)</div>
                  <div className="flex gap-2 mb-3 text-[9px]">
                    <div className="px-2 py-1 rounded-full bg-blue-500/30 border border-blue-500/50">Vender</div>
                    <div className="px-2 py-1 rounded-full bg-black/40 border border-gray-600">Alugar</div>
                    <div className="px-2 py-1 rounded-full bg-black/40 border border-gray-600">Favoritos</div>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg border border-blue-500/40 bg-black/60 p-2">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {/* Foto 1: Sala moderna */}
                        <div className="h-20 rounded bg-gradient-to-br from-slate-700/60 via-blue-900/40 to-cyan-900/30 relative overflow-hidden">
                          <div className="absolute inset-0">
                            {/* Janela grande com vista */}
                            <div className="absolute top-1 left-1 right-1 h-10 bg-gradient-to-b from-sky-300/30 via-blue-200/20 to-transparent border-t border-l border-r border-blue-300/40 rounded-t-sm" />
                            {/* Chão */}
                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-amber-950/40 to-transparent" />
                            {/* Mobilia */}
                            <div className="absolute bottom-2 left-2 w-4 h-3 bg-slate-600/60 rounded-sm" />
                            <div className="absolute bottom-2 right-2 w-3 h-4 bg-slate-700/50 rounded-sm" />
                          </div>
                        </div>
                        {/* Foto 2: Cozinha moderna */}
                        <div className="h-20 rounded bg-gradient-to-br from-gray-800/60 via-slate-700/40 to-blue-800/30 relative overflow-hidden">
                          <div className="absolute inset-0">
                            {/* Armários */}
                            <div className="absolute top-1 left-1 right-1 h-6 bg-gradient-to-b from-slate-600/50 to-slate-700/40 border border-slate-500/30">
                              <div className="grid grid-cols-3 gap-0.5 p-0.5 h-full">
                                <div className="bg-slate-500/20 rounded-[1px]" />
                                <div className="bg-slate-500/20 rounded-[1px]" />
                                <div className="bg-slate-500/20 rounded-[1px]" />
                              </div>
                            </div>
                            {/* Bancada */}
                            <div className="absolute bottom-4 left-1 right-1 h-4 bg-gradient-to-b from-slate-400/30 to-slate-600/40" />
                            {/* Chão */}
                            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-amber-900/30 to-transparent" />
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] font-bold">ApartestAmo T2</div>
                      <div className="text-[10px] text-blue-400">7.990 €/3</div>
                      <div className="text-[9px] text-gray-400">R. R. Sousa, Portugal</div>
                    </div>
                    <div className="rounded-lg border border-blue-500/40 bg-black/60 p-2">
                      {/* Foto: Quarto moderno */}
                      <div className="h-16 rounded bg-gradient-to-br from-indigo-900/50 via-blue-800/40 to-slate-700/30 mb-2 relative overflow-hidden">
                        <div className="absolute inset-0">
                          {/* Janela com cortinas */}
                          <div className="absolute top-1 right-1 w-8 h-12 bg-gradient-to-br from-sky-200/30 via-blue-100/20 to-transparent border border-blue-300/30 rounded-sm" />
                          {/* Cama */}
                          <div className="absolute bottom-2 left-2 right-10 h-6 bg-gradient-to-t from-indigo-800/60 to-indigo-700/40 rounded-sm" />
                          {/* Almofadas */}
                          <div className="absolute bottom-6 left-3 w-4 h-2 bg-indigo-600/50 rounded-sm" />
                          <div className="absolute bottom-6 left-8 w-4 h-2 bg-indigo-600/50 rounded-sm" />
                        </div>
                      </div>
                      <div className="text-[10px] font-bold">6.915,00 €</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone 3 - Detalhes da Propriedade */}
              <div className="relative h-[400px] md:h-[500px] overflow-hidden rounded-[36px] border-2 border-purple-500/50 bg-gradient-to-b from-gray-900 via-black to-purple-950 shadow-[0_20px_50px_rgba(168,85,247,0.6)]">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent" />
                <div className="relative p-4 text-white text-xs">
                  <div className="mb-3 h-1 w-12 mx-auto rounded-full bg-gray-600" />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    <div className="font-bold text-sm">Moderno T2</div>
                  </div>
                  <div className="mb-3 rounded-lg overflow-hidden">
                    <div className="h-32 bg-gradient-to-br from-slate-600/60 via-gray-700/50 to-indigo-900/40 relative">
                      <div className="absolute inset-0">
                        {/* Janelas grandes com vista (2 lado a lado) */}
                        <div className="absolute top-2 left-2 right-2 h-16 flex gap-1">
                          <div className="flex-1 bg-gradient-to-b from-sky-300/40 via-blue-200/30 to-sky-100/20 border border-blue-300/40 rounded-sm relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
                            {/* Moldura da janela */}
                            <div className="absolute inset-x-1/2 top-0 bottom-0 w-0.5 bg-slate-400/30" />
                          </div>
                          <div className="flex-1 bg-gradient-to-b from-sky-300/40 via-blue-200/30 to-sky-100/20 border border-blue-300/40 rounded-sm relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
                            <div className="absolute inset-x-1/2 top-0 bottom-0 w-0.5 bg-slate-400/30" />
                          </div>
                        </div>
                        
                        {/* Chão e sofá */}
                        <div className="absolute bottom-0 left-0 right-0 h-14">
                          {/* Chão de madeira */}
                          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-amber-900/50 via-amber-800/30 to-transparent">
                            <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(139, 69, 19, 0.3) 8px, rgba(139, 69, 19, 0.3) 9px)'}} />
                          </div>
                          {/* Sofá moderno */}
                          <div className="absolute bottom-3 left-4 right-4 h-6 bg-gradient-to-t from-slate-700/70 to-slate-600/60 rounded-t-sm">
                            {/* Almofadas */}
                            <div className="absolute top-1 left-2 w-3 h-3 bg-indigo-500/40 rounded-sm" />
                            <div className="absolute top-1 left-6 w-3 h-3 bg-purple-500/40 rounded-sm" />
                            <div className="absolute top-1 right-6 w-3 h-3 bg-pink-500/40 rounded-sm" />
                          </div>
                          {/* Mesa de centro */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-amber-800/40 rounded-sm" />
                        </div>
                        
                        {/* Lighting e atmosfera */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-200/10 via-transparent to-indigo-500/10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-bold mb-1">300,000 €</div>
                  <div className="text-[11px] font-semibold mb-2">Moderno T2 em Lisboa</div>
                  <div className="text-[9px] text-gray-400 mb-3">T+2 • 85m² • 2 WCs</div>
                  <div className="space-y-1 mb-3">
                    <div className="text-[10px] font-semibold">Entrada</div>
                    <div className="flex items-center gap-2 text-[9px] text-gray-400">
                      <span>📍</span>
                      <span>Virgínia Matioilo (m</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-gray-400">
                      <span>🔑</span>
                      <span>Acumilha 116 Chaves</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-gray-400">
                      <span>📋</span>
                      <span>Próximo Gaudirim</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone 4 - Assistente IA */}
              <div className="relative h-[400px] md:h-[500px] overflow-hidden rounded-[36px] border-2 border-cyan-500/50 bg-gradient-to-b from-gray-900 via-black to-cyan-950 shadow-[0_20px_50px_rgba(6,182,212,0.6)]">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent" />
                <div className="relative p-4 text-white text-xs">
                  <div className="mb-3 h-1 w-12 mx-auto rounded-full bg-gray-600" />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500" />
                    <div className="font-bold text-sm">Assistente IA</div>
                  </div>
                  <div className="mb-3 text-lg font-bold">Bom dia, Tiago!</div>
                  <div className="text-[10px] text-gray-400 mb-4">08:55, Tiago da Assunção</div>
                  <div className="space-y-2">
                    <div className="rounded-lg border border-cyan-500/40 bg-black/60 p-2">
                      <div className="flex items-start gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-500/40 to-blue-500/40 flex items-center justify-center text-[10px]">🤖</div>
                        <div className="flex-1">
                          <div className="text-[10px] font-bold mb-1">Sunrise Labs</div>
                          <div className="text-[9px] text-gray-300">Notícias e actualizações para sua lista de propriedades...</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-purple-500/40 bg-black/60 p-2">
                      <div className="flex items-start gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500/40 to-pink-500/40 flex items-center justify-center text-[10px]">📊</div>
                        <div className="flex-1">
                          <div className="text-[10px] font-bold mb-1">Care Peations ascent</div>
                          <div className="text-[9px] text-gray-300">Novo cliente a reunião marcada...</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-pink-500/40 bg-black/60 p-2">
                      <div className="flex items-start gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-pink-500/40 to-purple-500/40 flex items-center justify-center text-[10px]">🏠</div>
                        <div className="flex-1">
                          <div className="text-[10px] font-bold mb-1">Casa Karl Encounters</div>
                          <div className="text-[9px] text-gray-300">Notícias da propriedade disponível...</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-blue-500/40 bg-black/60 p-2">
                      <div className="flex items-start gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500/40 to-cyan-500/40 flex items-center justify-center text-[10px]">📍</div>
                        <div className="flex-1">
                          <div className="text-[10px] font-bold mb-1">ID Tiago 3: 2005</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section with Animated Counters */}
        <section className="w-full max-w-6xl mb-20 scroll-animate opacity-0">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                <p className="mt-2 text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Core Features - 3 principais do design */}
        <section className="w-full max-w-5xl mb-20 scroll-animate opacity-0">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-950/20 to-black p-6 text-center transition-all hover:border-pink-500/60 hover:scale-105">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-500/20 text-4xl">🎯</div>
              <h3 className="mb-2 text-xl font-bold">{t.coreFeatures.leadManagement.title}</h3>
              <p className="text-sm text-gray-400">{t.coreFeatures.leadManagement.description}</p>
            </div>
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-black p-6 text-center transition-all hover:border-purple-500/60 hover:scale-105">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/20 text-4xl">⚡</div>
              <h3 className="mb-2 text-xl font-bold">{t.coreFeatures.automation.title}</h3>
              <p className="text-sm text-gray-400">{t.coreFeatures.automation.description}</p>
            </div>
            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-black p-6 text-center transition-all hover:border-blue-500/60 hover:scale-105">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 text-4xl">🤝</div>
              <h3 className="mb-2 text-xl font-bold">{t.coreFeatures.collaboration.title}</h3>
              <p className="text-sm text-gray-400">{t.coreFeatures.collaboration.description}</p>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <div id="features" className="grid w-full max-w-5xl gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 scroll-mt-20 mb-20 scroll-animate opacity-0">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="group relative overflow-hidden rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-950/20 via-black to-purple-950/20 p-6 min-h-[180px] shadow-[0_0_30px_rgba(255,0,128,0.2)] transition-all duration-300 hover:border-pink-500/60 hover:shadow-[0_0_50px_rgba(255,0,128,0.4)] hover:-translate-y-1 active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5 opacity-0 transition group-hover:opacity-100" />
              {feature.comingSoon && (
                <div className="absolute top-4 right-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                  {t.features.comingSoon}
                </div>
              )}
              <div className="relative flex flex-col items-center gap-4 text-center">
                <span
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border border-pink-500/40 bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-400 shadow-[0_0_20px_rgba(255,0,128,0.3)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  aria-hidden="true"
                >
                  {feature.icon === "chart" && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3v18h18" strokeLinecap="round" />
                      <path d="M18 17V9M13 17V5M8 17v-3" strokeLinecap="round" />
                    </svg>
                  )}
                  {feature.icon === "home" && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <path d="M9 22V12h6v10" />
                    </svg>
                  )}
                  {feature.icon === "user" && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="5" />
                      <path d="M3 21c2-4 6-6 9-6s7 2 9 6" strokeLinecap="round" />
                    </svg>
                  )}
                  {feature.icon === "calendar" && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                    </svg>
                  )}
                  {feature.icon === "users" && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="7" r="4" />
                      <circle cx="17" cy="10" r="3" />
                      <path d="M2 21c1-3 4-5 7-5s6 2 7 5M15 21c1-2 3-4 5-4" strokeLinecap="round" />
                    </svg>
                  )}
                  {feature.icon === "bot" && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="8" width="12" height="12" rx="2" />
                      <path d="M12 2v4M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" />
                      <circle cx="9" cy="13" r="1" fill="currentColor" />
                      <circle cx="15" cy="13" r="1" fill="currentColor" />
                      <path d="M9 17h6" strokeLinecap="round" />
                    </svg>
                  )}
                  {feature.icon === "mobile" && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="7" y="2" width="10" height="20" rx="2" />
                      <path d="M12 18h.01" strokeLinecap="round" />
                    </svg>
                  )}
                  {feature.icon === "analytics" && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 21H4.6a.6.6 0 01-.6-.6V3M7 16l5-5 4 4 5-5" strokeLinecap="round" />
                      <circle cx="7" cy="16" r="2" fill="currentColor" />
                      <circle cx="12" cy="11" r="2" fill="currentColor" />
                      <circle cx="16" cy="15" r="2" fill="currentColor" />
                      <circle cx="21" cy="10" r="2" fill="currentColor" />
                    </svg>
                  )}
                </span>
                <div>
                  <h3 className="mb-1 text-lg font-bold text-white">{feature.label}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-animate opacity-0">
        <h2 className="text-4xl font-bold mb-4 text-center">{t.testimonials.title}</h2>
        <p className="text-gray-400 text-center mb-12">{t.testimonials.subtitle}</p>
        
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="group rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-950/20 to-purple-950/20 p-6 transition-all hover:border-pink-500/60 hover:-translate-y-1">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-sm font-bold text-white">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-bold">{testimonial.name}</div>
                  <div className="text-xs text-gray-400">{testimonial.role}</div>
                  <div className="text-xs text-pink-400">{testimonial.company}</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-300">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Blog/News Section for SEO */}
      <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-animate opacity-0">
        <h2 className="text-4xl font-bold mb-4 text-center">{t.blog.title}</h2>
        <p className="text-gray-400 text-center mb-12">{t.blog.subtitle}</p>
        
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {blogPosts.map((post) => (
            <article key={post.slug} className="group rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-purple-950/20 p-6 transition-all hover:border-blue-500/60 hover:-translate-y-1">
              <div className="mb-3 text-xs text-blue-400">{post.date}</div>
              <h3 className="mb-3 text-xl font-bold leading-tight group-hover:text-blue-400 transition">{post.title}</h3>
              <p className="mb-4 text-sm text-gray-400 leading-relaxed">{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`} className="text-sm font-semibold text-blue-400 hover:text-blue-300">
                {t.blog.readMore} →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Whitepaper Download Section */}
      <section className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-animate opacity-0">
        <div className="rounded-3xl border border-pink-500/30 bg-gradient-to-br from-pink-950/30 via-purple-950/30 to-black p-8 md:p-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-pink-500/20 text-5xl">📊</div>
          <h2 className="text-3xl font-bold mb-4">{t.whitepaper.title}</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">{t.whitepaper.description}</p>
          <a
            href="/downloads/crm-plus-whitepaper-2025.pdf"
            download
            className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-4 font-semibold text-white shadow-[0_0_40px_rgba(255,0,128,0.6)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(255,0,128,0.9)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.whitepaper.cta}
          </a>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-animate opacity-0">
        <h2 className="text-4xl font-bold mb-4 text-center">{t.faq.title}</h2>
        <p className="text-gray-400 text-center mb-12">{t.faq.subtitle}</p>
        
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/10 to-black p-6 transition-all hover:border-purple-500/60">
              <summary className="cursor-pointer list-none font-semibold text-white">
                <div className="flex items-center justify-between">
                  <span>{faq.q}</span>
                  <svg className="h-5 w-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Integration Section */}
      <section className="relative overflow-hidden border-t border-pink-500/10 bg-gradient-to-b from-black via-purple-950/20 to-black py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-20 h-96 w-96 opacity-40 [background:radial-gradient(circle,rgba(124,58,237,0.6),transparent_70%)] blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="text-left">
              <h2 className="mb-6 text-5xl font-bold leading-tight whitespace-pre-line">
                {t.integration.title}
              </h2>
              <p className="text-xl text-gray-300">{t.integration.subtitle}</p>
            </div>

            <div className="relative flex items-center justify-center gap-8">
              {/* Robot mascot SVG */}
              <div className="relative">
                <div className="absolute inset-0 -z-10 scale-110 [background:radial-gradient(circle,rgba(59,130,246,0.4),transparent_60%)] blur-2xl" />
                <svg width="200" height="240" viewBox="0 0 200 240" fill="none" className="drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                  {/* Body */}
                  <ellipse cx="100" cy="160" rx="70" ry="65" fill="url(#robotBody)" />
                  <ellipse cx="100" cy="160" rx="60" ry="55" fill="url(#robotBodyInner)" />
                  
                  {/* Head */}
                  <ellipse cx="100" cy="80" rx="55" ry="50" fill="url(#robotHead)" />
                  
                  {/* Eyes */}
                  <circle cx="80" cy="75" r="18" fill="#1E293B" />
                  <circle cx="120" cy="75" r="18" fill="#1E293B" />
                  <circle cx="82" cy="73" r="12" fill="#3B82F6" className="animate-pulse" />
                  <circle cx="122" cy="73" r="12" fill="#3B82F6" className="animate-pulse" />
                  <circle cx="86" cy="70" r="4" fill="white" />
                  <circle cx="126" cy="70" r="4" fill="white" />
                  
                  {/* Antenna */}
                  <line x1="100" y1="30" x2="100" y2="45" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="100" cy="25" r="8" fill="#C026D3" className="animate-pulse" />
                  
                  {/* Smile */}
                  <path d="M75 95 Q100 105 125 95" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
                  
                  {/* Arms */}
                  <ellipse cx="35" cy="150" rx="15" ry="35" fill="url(#robotArm)" transform="rotate(-20 35 150)" />
                  <ellipse cx="165" cy="150" rx="15" ry="35" fill="url(#robotArm)" transform="rotate(20 165 150)" />
                  
                  {/* Bottom accent */}
                  <ellipse cx="100" cy="200" rx="45" ry="20" fill="url(#robotBottom)" />
                  
                  <defs>
                    <linearGradient id="robotBody" x1="100" y1="95" x2="100" y2="225" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#7C3AED" />
                      <stop offset="0.5" stopColor="#6366F1" />
                      <stop offset="1" stopColor="#3B82F6" />
                    </linearGradient>
                    <linearGradient id="robotBodyInner" x1="100" y1="105" x2="100" y2="215">
                      <stop stopColor="#4C1D95" />
                      <stop offset="1" stopColor="#1E3A8A" />
                    </linearGradient>
                    <linearGradient id="robotHead" x1="100" y1="30" x2="100" y2="130">
                      <stop stopColor="#A78BFA" />
                      <stop offset="1" stopColor="#818CF8" />
                    </linearGradient>
                    <linearGradient id="robotArm" x1="0" y1="0" x2="0" y2="70">
                      <stop stopColor="#6366F1" />
                      <stop offset="1" stopColor="#3B82F6" />
                    </linearGradient>
                    <radialGradient id="robotBottom">
                      <stop stopColor="#3B82F6" stopOpacity="0.6" />
                      <stop offset="1" stopColor="#1E3A8A" stopOpacity="0.3" />
                    </radialGradient>
                  </defs>
                </svg>
              </div>

              {/* Properties mockup */}
              <div className="relative h-80 w-80 overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-br from-gray-900 via-black to-purple-950 shadow-[0_20px_60px_rgba(124,58,237,0.5)]">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
                <div className="relative p-6">
                  <div className="mb-4 text-xs font-bold tracking-wider text-gray-400">CPD ACCOUNTS</div>
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="overflow-hidden rounded-lg border border-purple-500/30 bg-black/60">
                        <div className="aspect-video bg-gradient-to-br from-purple-900/40 to-pink-900/40" />
                        <div className="p-2">
                          <div className="mb-1 h-2 w-full rounded bg-purple-500/30" />
                          <div className="h-1.5 w-2/3 rounded bg-purple-500/20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Contacts */}
      <footer className="relative border-t border-pink-500/10 bg-gradient-to-b from-purple-950/20 to-black py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-3">
            <div>
              <Image src="/logo-crm-plus.svg" alt="CRM PLUS" width={120} height={120} className="mb-4" />
              <p className="text-sm text-gray-400">{t.footer.description}</p>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-bold">{t.footer.contact}</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>📧 {t.footer.email}</p>
                <p>📞 {t.footer.phone}</p>
                <p>📍 {t.footer.location}</p>
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-bold">{t.footer.followUs}</h3>
              <div className="flex gap-4">
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 transition hover:border-pink-500/60 hover:bg-pink-500/20">𝕏</a>
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 transition hover:border-blue-500/60 hover:bg-blue-500/20">in</a>
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 transition hover:border-purple-500/60 hover:bg-purple-500/20">IG</a>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-pink-500/10 pt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} {t.footer.copyright}</p>
            <a href="https://admin.crmplus.trioto.tech/login" className="mt-2 inline-block text-gray-600 hover:text-gray-500 transition text-xs" target="_blank" rel="noopener noreferrer">
              Platform Support
            </a>
          </div>
        </div>
      </footer>

      {/* Sticky CTA for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-pink-500/20 bg-black/80 backdrop-blur-xl p-4 safe-area-inset-bottom">
        <Link
          href="#features"
          className="group flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#FF0080] to-[#C026D3] px-8 py-4 text-base font-semibold text-white shadow-[0_0_40px_rgba(255,0,128,0.7)] transition-all duration-300 active:scale-95"
        >
          {t.mobileCta}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-active:translate-x-1">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </main>
  );
}
