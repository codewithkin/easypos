import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      {/* CTA band */}
      <div className="bg-primary/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6 lg:px-8">
          <h3 className="text-xl font-bold text-foreground sm:text-2xl">
            Ready to simplify your sales?
          </h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Download EasyPOS and start managing your business in minutes.
          </p>
          <Button size="lg" render={<a href={downloadUrl} />}>
            <Download className="mr-2 h-4 w-4" />
            Download App
          </Button>
        </div>
      </div>

      {/* Links grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">E</span>
              </div>
              <span className="text-lg font-bold text-foreground">EasyPOS</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Modern point-of-sale for small and growing businesses. Fast, reliable, and easy to use.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex flex-wrap gap-12 sm:gap-16">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Product</h4>
              <ul className="mt-3 space-y-2">
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
              <ul className="mt-3 space-y-2">
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
              <h4 className="text-sm font-semibold text-foreground">Legal</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} EasyPOS. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ for small businesses
          </p>
        </div>
      </div>
    </footer>
  );
}
