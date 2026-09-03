import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Lock,
  MessageCircle,
  Eye,
  Zap,
  ArrowRight,
  Shield,
  Check,
  Share2,
  Smartphone,
  Globe,
} from "lucide-react";
import { Button } from "../components/common/Button";

/* ------------------------------------------------------------------ */
/*  Navigation                                                         */
/* ------------------------------------------------------------------ */
function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 z-50 flex h-[72px] w-full items-center border-b transition-colors duration-300 ${
        scrolled
          ? "border-white/5 bg-ink-950/80 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <MessageCircle className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-lg font-semibold tracking-tight">Nexus</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-slate-400 transition hover:text-white">
            Features
          </a>
          <a href="#security" className="text-sm text-slate-400 transition hover:text-white">
            Security
          </a>
          <a href="#how-it-works" className="text-sm text-slate-400 transition hover:text-white">
            How it works
          </a>
          <a href="#whatsapp" className="text-sm text-slate-400 transition hover:text-white">
            WhatsApp
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden text-sm text-slate-300 transition hover:text-white md:block"
          >
            Sign in
          </Link>
          <Link to="/register">
            <Button variant="primary" className="px-4 py-2 text-sm">
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden pt-20">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        {/* Left: content */}
        <div className="relative z-10">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
              <Lock className="h-3 w-3" />
              End-to-end encrypted
            </div>

            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
              Private conversations,{" "}
              <span className="text-accent">nothing hidden</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400">
              Two-person chat built for people who care about who reads their
              messages. Real-time, encrypted, no metadata collection.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register">
                <Button variant="primary" className="px-6 py-3 text-sm">
                  Start chatting
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:text-white"
              >
                See how it works
              </a>
            </div>
          </motion.div>
        </div>

        {/* Right: visual - chat mockup */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden lg:block"
        >
          <div className="relative rounded-2xl border border-white/10 bg-ink-900 p-1">
            <div className="overflow-hidden rounded-xl">
              <img
                src="https://picsum.photos/seed/nexus-chat-mockup/800/520"
                alt="Nexus chat interface preview"
                className="h-auto w-full object-cover"
                loading="eager"
              />
            </div>
            {/* Floating status badges */}
            <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 shadow-lg">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-slate-300">
                2 users online
              </span>
            </div>
            <div className="absolute -top-3 -right-3 flex items-center gap-1.5 rounded-xl border border-white/10 bg-ink-900 px-3 py-2 shadow-lg">
              <Lock className="h-3 w-3 text-emerald-400" />
              <span className="text-[11px] font-medium text-slate-300">
                Encrypted
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features - Bento Grid                                              */
/* ------------------------------------------------------------------ */
function Features() {
  const reduce = useReducedMotion();

  const features = [
    {
      icon: Lock,
      title: "End-to-end encryption",
      description:
        "Every message is encrypted on your device. Not even our servers can read what you send.",
      span: "lg:col-span-2",
      bg: "bg-ink-800",
    },
    {
      icon: Zap,
      title: "Instant delivery",
      description:
        "WebSocket-powered real-time messaging. No polling, no delays.",
      span: "lg:col-span-1",
      bg: "bg-ink-900",
    },
    {
      icon: Eye,
      title: "Read receipts",
      description:
        "Know when your message was delivered and when it was read. No ambiguity.",
      span: "lg:col-span-1",
      bg: "bg-ink-900",
    },
    {
      icon: MessageCircle,
      title: "Media sharing",
      description:
        "Send images, videos, and files directly in chat. Preview everything before you download.",
      span: "lg:col-span-1",
      bg: "bg-ink-800",
    },
    {
      icon: Shield,
      title: "No metadata collection",
      description:
        "We don't store who you talk to, when, or how often. Your social graph stays yours.",
      span: "lg:col-span-2",
      bg: "bg-ink-900",
    },
  ];

  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Built for two people
          </h2>
          <p className="mt-3 text-base text-slate-400">
            No group chats, no channels, no distractions. One conversation,
            done right.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.5,
                delay: i * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`rounded-2xl border border-white/5 p-6 transition-colors hover:border-white/10 ${feature.bg} ${feature.span}`}
            >
              <feature.icon className="mb-4 h-5 w-5 text-accent" strokeWidth={1.5} />
              <h3 className="mb-2 text-base font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How it works                                                       */
/* ------------------------------------------------------------------ */
function HowItWorks() {
  const reduce = useReducedMotion();

  const steps = [
    {
      step: "01",
      title: "Create an account",
      description:
        "Sign up with your email. No phone number, no social login, no tracking.",
    },
    {
      step: "02",
      title: "Start a conversation",
      description:
        "Invite someone by email. They get a notification and join instantly.",
    },
    {
      step: "03",
      title: "Chat freely",
      description:
        "Real-time messages, media sharing, read receipts. Everything encrypted.",
    },
  ];

  return (
    <section id="how-it-works" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Three steps. That's it.
          </h2>
          <p className="mt-3 text-base text-slate-400">
            No configuration, no settings to tweak, no onboarding flow that
            takes twenty minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative"
            >
              <span className="mb-4 block text-5xl font-bold text-white/[0.06]">
                {step.step}
              </span>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  WhatsApp Integration                                               */
/* ------------------------------------------------------------------ */
function WhatsAppIntegration() {
  const reduce = useReducedMotion();

  const handleShare = () => {
    const text = encodeURIComponent(
      "Check out Nexus - a private, encrypted chat app. Real-time messaging with no metadata collection. Try it here:",
    );
    const url = encodeURIComponent(window.location.origin);
    window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
  };

  const handleShareGroup = () => {
    const text = encodeURIComponent(
      "I'm using Nexus for private, encrypted chat. Join me! Real-time messaging, file sharing, and read receipts. No tracking, no metadata collection.",
    );
    const url = encodeURIComponent(window.location.origin);
    window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
  };

  return (
    <section id="whatsapp" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-emerald-400">
              <Smartphone className="h-3 w-3" />
              Share on WhatsApp
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Invite friends via WhatsApp
            </h2>
            <p className="mt-3 max-w-lg text-base text-slate-400">
              Share Nexus with your contacts on WhatsApp. One tap to send an
              invitation link. They can create an account and start chatting
              privately in seconds.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#20BD5A] active:scale-[0.98]"
              >
                <Share2 className="h-4 w-4" />
                Share on WhatsApp
              </button>
              <button
                type="button"
                onClick={handleShareGroup}
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-[0.98]"
              >
                <Globe className="h-4 w-4" />
                Share in Group
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="rounded-2xl border border-white/5 bg-ink-900 p-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#25D366]/20">
                    <MessageCircle className="h-5 w-5 text-[#25D366]" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-white/[0.07] p-3">
                    <p className="text-sm text-slate-200">
                      Hey! I found this amazing private chat app. No tracking, fully encrypted. You should try it!
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {window.location.origin}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/20">
                    <MessageCircle className="h-5 w-5 text-accent" />
                  </div>
                  <div className="rounded-2xl rounded-tr-md bg-accent/20 p-3">
                    <p className="text-sm text-slate-200">
                      Sounds great! I hate how other apps read my messages. Signing up now.
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Just now
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5">
                <p className="text-xs text-slate-500 text-center">
                  Share Nexus with friends on WhatsApp
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Security                                                           */
/* ------------------------------------------------------------------ */
function Security() {
  const reduce = useReducedMotion();

  const points = [
    "AES-256 encryption for all messages at rest",
    "TLS 1.3 for data in transit",
    "Zero-knowledge architecture",
    "No message content stored on our servers",
    "Automatic session expiry after 15 minutes",
    "Open-source backend available for audit",
  ];

  return (
    <section id="security" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Security is the product
            </h2>
            <p className="mt-3 max-w-lg text-base text-slate-400">
              Not a feature checkbox. Not a marketing line. The entire
              application is built around the principle that your conversations
              belong to you.
            </p>
          </div>

          <motion.ul
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
          >
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  strokeWidth={2}
                />
                <span className="text-sm text-slate-300">{point}</span>
              </li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA                                                                */
/* ------------------------------------------------------------------ */
function CTA() {
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-white/10 bg-ink-800 px-8 py-16 text-center md:px-16"
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Your conversations deserve better
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-slate-400">
            Stop wondering who can read your messages. Start chatting with
            confidence.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button variant="primary" className="px-8 py-3 text-sm">
                Create your account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => {
                const text = encodeURIComponent("Check out Nexus - a private, encrypted chat app:");
                const url = encodeURIComponent(window.location.origin);
                window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 px-5 py-3 text-sm font-medium text-[#25D366] transition hover:bg-[#25D366]/20"
            >
              <Share2 className="h-4 w-4" />
              Share on WhatsApp
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-xs text-slate-500 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/20">
            <MessageCircle className="h-3 w-3 text-accent" strokeWidth={2} />
          </div>
          <span>Nexus</span>
        </div>

        <div className="flex gap-6">
          <a href="#features" className="transition hover:text-slate-300">
            Features
          </a>
          <a href="#security" className="transition hover:text-slate-300">
            Security
          </a>
          <a href="#how-it-works" className="transition hover:text-slate-300">
            How it works
          </a>
          <a href="#whatsapp" className="transition hover:text-slate-300">
            Share
          </a>
        </div>

        <span>Private chat, built with care.</span>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing Page                                                       */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  return (
    <div className="min-h-[100dvh]">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <WhatsAppIntegration />
      <Security />
      <CTA />
      <Footer />
    </div>
  );
}
