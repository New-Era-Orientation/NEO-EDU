import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Wifi,
  WifiOff,
  Users,
  Code,
  FileText,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Rich Course Content",
    description: "Create interactive courses with video, text, quizzes, and code exercises.",
  },
  {
    icon: WifiOff,
    title: "Offline First",
    description: "Learn anywhere, anytime. All content syncs automatically when back online.",
  },
  {
    icon: Code,
    title: "Code Playground",
    description: "Practice Python and SQL directly in the browser with instant feedback.",
  },
  {
    icon: FileText,
    title: "PDF Viewer",
    description: "Read and annotate PDF materials without leaving the platform.",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description: "Connect with instructors and peers through live chat and discussions.",
  },
  {
    icon: GraduationCap,
    title: "Progress Tracking",
    description: "Track your learning journey with detailed analytics and certificates.",
  },
];

const stats = [
  { value: "100%", label: "Free Forever" },
  { value: "Offline", label: "First Design" },
  { value: "1GB", label: "Server Friendly" },
  { value: "PWA", label: "Installable" },
];

export default function Home() {
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

            <div className="hidden md:flex items-center gap-6">
              <Link href="/courses" className="text-muted-foreground hover:text-foreground transition-colors">
                Courses
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">100% Free & Self-Hosted</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slide-up">
              Learn Without Limits,{" "}
              <span className="gradient-text">Even Offline</span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up">
              A powerful Learning Management System that works offline-first,
              runs on minimal resources, and costs nothing.
              Your education, your way.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
              <Link
                href="/courses"
                className="flex items-center gap-2 px-8 py-4 rounded-xl gradient-primary text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
              >
                Explore Courses
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-card border border-border font-semibold hover:bg-muted transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Hero Image / Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="glass rounded-2xl p-6 text-center card-hover"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-3xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Learn
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with modern technologies optimized for minimal resource usage
              while delivering a premium learning experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card rounded-2xl p-8 border border-border card-hover"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Why Choose <span className="gradient-text">NEO EDU?</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Designed for educators who want control over their platform
                without breaking the bank or needing a data center.
              </p>

              <ul className="space-y-4">
                {[
                  "Runs on a $5/month server (1GB RAM)",
                  "No Docker required - bare metal optimized",
                  "Works offline with automatic sync",
                  "Install as a native app (PWA)",
                  "PostgreSQL Full-Text Search built-in",
                  "Real-time WebSocket collaboration",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl gradient-primary opacity-10 absolute inset-0" />
              <div className="relative glass rounded-3xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <Image
                    src="/assets/logo.png"
                    alt="NEO EDU"
                    width={64}
                    height={64}
                    className="rounded-xl"
                  />
                  <div>
                    <h3 className="font-bold text-xl">NEO EDU</h3>
                    <p className="text-sm text-muted-foreground">Learning Management System</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">Memory Usage</span>
                    <span className="font-mono text-sm">384 MB</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">Database</span>
                    <span className="font-mono text-sm">PostgreSQL</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">Cache</span>
                    <span className="font-mono text-sm">Redis 64MB</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <span className="text-sm text-green-600 dark:text-green-400">Status</span>
                    <span className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                      <Wifi className="w-4 h-4" />
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join thousands of learners who chose freedom and accessibility.
            No credit card required, no strings attached.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl gradient-primary text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
          >
            Get Started for Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/assets/logo.png"
                alt="NEO EDU"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="font-semibold">NEO EDU</span>
            </div>

            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NEO EDU. Open source and free forever.
            </p>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="https://github.com" className="hover:text-foreground transition-colors">
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
