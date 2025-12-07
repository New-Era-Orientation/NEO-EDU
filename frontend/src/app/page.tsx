"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Users, Trophy } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/assets/logo.png"
                alt="NEO EDU Logo"
                width={40}
                height={40}
                className="rounded-lg"
                priority
              />
              <span className="text-xl font-bold gradient-text">NEO EDU</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/courses"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("courses.title")}
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
              >
                {t("auth.signIn")}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Simple & Education Focused */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 gradient-primary opacity-5" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Main Message */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 animate-fade-in">
              {t("landing.heroTitle")}{" "}
              <span className="gradient-text">{t("landing.heroTitleHighlight")}</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
              {t("landing.heroDesc")}
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
              <Link
                href="/dashboard/courses"
                className="flex items-center gap-2 px-8 py-4 rounded-xl gradient-primary text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                {t("dashboard.browseCourses")}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-card border border-border font-semibold hover:bg-muted transition-colors"
              >
                {t("auth.createAccount")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Benefits - Education Focused */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t("landing.features.offline")}
              </h3>
              <p className="text-muted-foreground">
                {t("landing.features.offlineDesc")}
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t("landing.features.progress")}
              </h3>
              <p className="text-muted-foreground">
                {t("landing.features.progressDesc")}
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t("landing.features.certificate")}
              </h3>
              <p className="text-muted-foreground">
                {t("landing.features.certificateDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/assets/logo.png"
                alt="NEO EDU"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="font-semibold">NEO EDU</span>
            </div>

            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NEO EDU
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
