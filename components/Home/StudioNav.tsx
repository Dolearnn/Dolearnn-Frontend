"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { subscribeNewsletter } from "@/lib/api/public";
import s from "@/app/studio.module.css";

const navigation = [
  { href: "#loop", label: "The loop" },
  { href: "#modules", label: "Inside the product" },
  { href: "#pricing", label: "Pricing" },
  { href: "#proof", label: "Traction" },
  { href: "#team", label: "Team" },
];

export function StudioNav() {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  return (
    <header className={`${s.header} ${stuck ? s.headerStuck : ""}`}>
      <div className={`${s.container} ${s.navBar}`}>
        <Link href="/" aria-label="DoLearnn home" className={s.wordmark}>
          Do<span>Learnn</span>
        </Link>
        <nav aria-label="Main navigation" className={s.desktopNav}>
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className={s.navActions}>
          <Link href="/login" className={s.loginLink}>
            Log in
          </Link>
          <Link href="/practice" className={s.navCta}>
            Try practice <ArrowUpRight size={15} />
          </Link>
          <button
            ref={toggle}
            type="button"
            className={s.menuToggle}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        className={s.mobileNav}
        hidden={!open}
      >
        {navigation.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
            {item.label}
            <ArrowUpRight size={16} />
          </a>
        ))}
        <Link href="/login" onClick={() => setOpen(false)}>
          Log in <ArrowUpRight size={16} />
        </Link>
      </nav>
    </header>
  );
}

export function StudioNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");

  return (
    <div className={s.newsletter}>
      <strong>Study tips and product updates</strong>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (status === "pending" || !email.trim()) return;
          setStatus("pending");
          try {
            await subscribeNewsletter({ email: email.trim() });
            setEmail("");
            setStatus("success");
          } catch {
            setStatus("error");
          }
        }}
      >
        <label htmlFor="newsletter-email" className={s.srOnly}>
          Email address for learning updates
        </label>
        <div className={s.newsletterField}>
          <input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            required
            placeholder="Your email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={status === "pending"}
          />
          <button
            type="submit"
            disabled={status === "pending"}
            aria-label={
              status === "pending" ? "Subscribing" : "Subscribe to updates"
            }
          >
            {status === "pending" ? "…" : <ArrowRight size={18} />}
          </button>
        </div>
        <p className={s.formStatus} role="status">
          {status === "success"
            ? "You’re subscribed. Thanks for joining us."
            : status === "error"
              ? "We couldn’t subscribe you. Please try again."
              : ""}
        </p>
      </form>
    </div>
  );
}
