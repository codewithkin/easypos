import Link from "next/link";
import { Smartphone } from "lucide-react";

const downloadUrl =
  process.env.NEXT_PUBLIC_EXPO_PRODUCTION_BUILD_URL ?? "#";

const productLinks = [
  { href: "/features" as const, label: "Features" },
  { href: "/pricing" as const, label: "Pricing" },
];

const companyLinks = [
  { href: "/about" as const, label: "About" },
  { href: "/contact" as const, label: "Contact" },
];

const helpLinks = [
  { href: "#" as const, label: "FAQ" },
  { href: "#" as const, label: "Privacy Policy" },
  { href: "#" as const, label: "Terms of Service" },
];

const socialLinks = [
  { label: "FB", href: "#", title: "Facebook" },
  { label: "TW", href: "#", title: "Twitter / X" },
  { label: "IG", href: "#", title: "Instagram" },
  { label: "LI", href: "#", title: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer>
      {/* ── CTA Band ── */}
      <div className="bg-primary">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-14 text-center sm:px-6 lg:px-8">
          <h3 className="text-2xl font-extrabold text-white sm:text-3xl">
            Ready to simplify your sales?
          </h3>
          <p className="max-w-md text-sm leading-relaxed text-white/80">
            Download EasyPOS and start managing your business in minutes.
            3-day free trial — no credit card required.
          </p>
          <a
            href={downloadUrl}
            className="inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-foreground shadow-lg transition hover:bg-white/90"
          >
            <Smartphone className="h-5 w-5" />
            <div className="text-left">
              <div className="text-[10px] font-normal leading-none opacity-60">Download on</div>
              <div className="text-sm font-bold leading-none">Android</div>
            </div>
          </a>
        </div>
      </div>

      {/* ── Links grid ── */}
      <div className="bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10 md:flex-row md:justify-between">
            {/* Brand */}
            <div className="max-w-xs">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
                  <span className="text-sm font-extrabold text-primary-foreground">E</span>
                </div>
                <span className="text-base font-extrabold tracking-tight text-foreground">EasyPOS</span>
              </Link>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Modern point-of-sale for small and growing businesses. Fast,
                reliable, and easy to use.
              </p>
              {/* Social links */}
              <div className="mt-5 flex gap-2">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    title={s.title}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            <div className="flex flex-wrap gap-10 sm:gap-14">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Product</h4>
                <ul className="mt-3 space-y-2.5">
                  {productLinks.map(({ href, label }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <a
                      href={downloadUrl}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Download App
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Company</h4>
                <ul className="mt-3 space-y-2.5">
                  {companyLinks.map(({ href, label }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Help</h4>
                <ul className="mt-3 space-y-2.5">
                  {helpLinks.map(({ href, label }) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Christus Veritas Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
