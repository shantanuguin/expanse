"use client";

import "./landing.css";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ──────────────────────────────────────────────
   Infinite Scroll Ribbon (text marquee)
   ────────────────────────────────────────────── */
function MarqueeRibbon({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
    const doubled = [...items, ...items];
    return (
        <div className="landing-marquee-wrap" aria-hidden>
            <div className={`landing-marquee ${reverse ? "landing-marquee--reverse" : ""}`}>
                {doubled.map((t, i) => (
                    <span key={i} className="landing-marquee-item">{t}</span>
                ))}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Feature Card
   ────────────────────────────────────────────── */
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="landing-feature-card">
            <span className="landing-feature-icon">{icon}</span>
            <h3 className="landing-feature-title">{title}</h3>
            <p className="landing-feature-desc">{description}</p>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Stat Pill
   ────────────────────────────────────────────── */
function StatPill({ value, label }: { value: string; label: string }) {
    return (
        <div className="landing-stat">
            <span className="landing-stat-value">{value}</span>
            <span className="landing-stat-label">{label}</span>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Parallax Floating Elements
   ────────────────────────────────────────────── */
function FloatingElements() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouse = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            const els = containerRef.current.querySelectorAll<HTMLElement>(".landing-float-el");
            els.forEach((el, i) => {
                const speed = (i + 1) * 12;
                el.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
            });
        };

        window.addEventListener("mousemove", handleMouse);
        return () => window.removeEventListener("mousemove", handleMouse);
    }, []);

    return (
        <div ref={containerRef} className="landing-float-container">
            {/* Floating UI blobs */}
            <div className="landing-float-el landing-float-1">
                <div className="landing-float-card">
                    <span className="landing-float-card-icon">📊</span>
                    <span className="landing-float-card-text">Reports</span>
                </div>
            </div>
            <div className="landing-float-el landing-float-2">
                <div className="landing-float-card landing-float-card--red">
                    <span className="landing-float-card-icon">💰</span>
                    <span className="landing-float-card-text">Budget</span>
                </div>
            </div>
            <div className="landing-float-el landing-float-3">
                <div className="landing-float-card">
                    <span className="landing-float-card-icon">🔒</span>
                    <span className="landing-float-card-text">Secure</span>
                </div>
            </div>
            <div className="landing-float-el landing-float-4">
                <div className="landing-float-card landing-float-card--red">
                    <span className="landing-float-card-icon">⚡</span>
                    <span className="landing-float-card-text">Fast</span>
                </div>
            </div>
            <div className="landing-float-el landing-float-5">
                <div className="landing-float-card landing-float-card--dark">
                    <span className="landing-float-card-icon">🌍</span>
                    <span className="landing-float-card-text">Multi‑Currency</span>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Main Landing Page
   ────────────────────────────────────────────── */
export default function LandingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        if (!loading && user) {
            router.replace("/dashboard");
        }
    }, [user, loading, router]);

    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", onScroll, { passive: true });

        // Register ScrollTrigger
        gsap.registerPlugin(ScrollTrigger);

        // GSAP Animations
        const ctx = gsap.context(() => {
            // Hero section reveal
            gsap.from(".landing-hero-text > *", {
                y: 30,
                opacity: 0,
                duration: 1,
                stagger: 0.1,
                ease: "power4.out",
            });

            gsap.from(".landing-hero-visual", {
                scale: 0.9,
                opacity: 0,
                duration: 1.2,
                ease: "power4.out",
                delay: 0.4,
            });

            // Feature cards reveal
            gsap.from(".landing-feature-card", {
                scrollTrigger: {
                    trigger: ".landing-features-grid",
                    start: "top 80%",
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.08,
                ease: "power3.out",
            });

            // Stats reveal
            gsap.from(".landing-stat", {
                scrollTrigger: {
                    trigger: ".landing-stats-section",
                    start: "top 85%",
                },
                scale: 0.8,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "back.out(1.7)",
            });

            // CTA reveal
            gsap.from(".landing-cta-card", {
                scrollTrigger: {
                    trigger: ".landing-cta-section",
                    start: "top 85%",
                },
                y: 30,
                opacity: 0,
                duration: 1,
                ease: "power3.out",
            });
        });

        return () => {
            window.removeEventListener("scroll", onScroll);
            ctx.revert();
        };
    }, []);

    if (loading || user) {
        return (
            <div className="landing-loader">
                <div className="landing-loader-dot" />
            </div>
        );
    }

    const features = [
        { icon: "📈", title: "Smart Analytics", description: "See where your money goes with interactive charts, weekly trends, and AI‑ready insights." },
        { icon: "🏦", title: "Multi‑Account", description: "Track multiple accounts, wallets, and credit cards in one unified dashboard." },
        { icon: "🎯", title: "Budgets & Goals", description: "Set spending limits by category and track progress toward your savings goals." },
        { icon: "🌐", title: "Multi‑Currency", description: "Real‑time exchange rates. Record expenses in any currency and convert instantly." },
        { icon: "🤝", title: "Debt & IOU", description: "Track who owes you and who you owe. Settle up with a single tap." },
        { icon: "🔐", title: "Private & Secure", description: "Your data lives in your own Firebase project. Zero ads, zero tracking, zero compromise." },
    ];

    const marqueeItems = [
        "Track Expenses", "Set Budgets", "View Reports", "Split Bills", "Multi Currency",
        "Manage Debts", "Save Goals", "Recurring Payments", "Export CSV", "Dark Mode",
    ];

    return (
        <SmoothScrollProvider>
            <div className="landing-root">
                {/* ─── NAVBAR ─── */}
                <nav className="landing-nav" style={{ backdropFilter: scrollY > 40 ? "blur(16px)" : "none", background: scrollY > 40 ? "rgba(255,255,255,0.85)" : "transparent" }}>
                    <div className="landing-nav-inner">
                        <Link href="/" className="landing-logo">
                            <span className="landing-logo-dot" />
                            Expanse
                        </Link>
                        <div className="landing-nav-actions">
                            <Link href="/login" className="landing-nav-link">Log in</Link>
                            <Link href="/signup" className="landing-btn landing-btn--sm">Get Started</Link>
                        </div>
                    </div>
                </nav>

                {/* ─── HERO ─── */}
                <section className="landing-hero">
                    <div className="landing-hero-bg" />
                    <div className="landing-hero-content">
                        <div className="landing-hero-text">
                            <div className="landing-badge">✨ Personal Finance, Reimagined</div>
                            <h1 className="landing-h1">
                                Take control of<br />
                                <span className="landing-h1-accent">every penny.</span>
                            </h1>
                            <p className="landing-hero-sub">
                                Expanse is the beautiful, privacy‑first expense tracker that helps you
                                understand your spending, hit your goals, and build real wealth.
                            </p>
                            <div className="landing-hero-cta">
                                <Link href="/signup" className="landing-btn landing-btn--lg">
                                    Start Free →
                                </Link>
                                <Link href="/login" className="landing-btn landing-btn--ghost landing-btn--lg">
                                    I have an account
                                </Link>
                            </div>
                        </div>
                        <div className="landing-hero-visual">
                            <div className="landing-phone-wrap" style={{ transform: `perspective(1200px) rotateY(-4deg) rotateX(${Math.min(scrollY * 0.02, 6)}deg)` }}>
                                <Image
                                    src="/hero-phone.png"
                                    alt="Expanse app on phone"
                                    width={380}
                                    height={700}
                                    className="landing-phone-img"
                                    priority
                                />
                            </div>
                            <FloatingElements />
                        </div>
                    </div>
                </section>

                {/* ─── MARQUEE RIBBON ─── */}
                <section className="landing-ribbon-section">
                    <MarqueeRibbon items={marqueeItems} />
                    <MarqueeRibbon items={marqueeItems} reverse />
                </section>

                {/* ─── STATS ─── */}
                <section className="landing-stats-section">
                    <StatPill value="100%" label="Free & Open" />
                    <StatPill value="∞" label="Transactions" />
                    <StatPill value="30+" label="Currencies" />
                    <StatPill value="0" label="Ads Ever" />
                </section>

                {/* ─── FEATURES ─── */}
                <section className="landing-features-section">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">Features</span>
                        <h2 className="landing-h2">Everything you need,<br />nothing you don&apos;t.</h2>
                        <p className="landing-section-sub">No bloated subscriptions. Just the tools that matter.</p>
                    </div>
                    <div className="landing-features-grid">
                        {features.map((f, i) => (
                            <FeatureCard key={i} index={i} {...f} />
                        ))}
                    </div>
                </section>

                {/* ─── CTA ─── */}
                <section className="landing-cta-section">
                    <div className="landing-cta-card">
                        <h2 className="landing-cta-title">Ready to master your money?</h2>
                        <p className="landing-cta-sub">Join Expanse today — it&apos;s completely free. No credit card needed.</p>
                        <Link href="/signup" className="landing-btn landing-btn--lg landing-btn--white">Create Free Account →</Link>
                    </div>
                </section>

                {/* ─── FOOTER ─── */}
                <footer className="landing-footer">
                    <div className="landing-footer-inner">
                        <div className="landing-footer-brand">
                            <span className="landing-logo-dot" />
                            <span className="landing-footer-name">Expanse</span>
                        </div>
                        <p className="landing-footer-copy">© 2026 Expanse. Built with love.</p>
                    </div>
                </footer>
            </div>
        </SmoothScrollProvider>
    );
}
