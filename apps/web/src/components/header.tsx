"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Smartphone } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

const downloadUrl =
  process.env.NEXT_PUBLIC_EXPO_PRODUCTION_BUILD_URL ?? "#";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
            <span className="text-sm font-extrabold text-primary-foreground">E</span>
          </div>
          <span className="text-base font-extrabold tracking-tight text-foreground">EasyPOS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center md:flex">
          <a
            href={downloadUrl}
            className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <div className="text-left">
              <div className="text-[9px] font-normal leading-none opacity-80">Download on</div>
              <div className="text-xs font-bold leading-none">Android</div>
            </div>
          </a>
        </div>

        {/* Mobile: toggle + sheet */}
        <div className="flex items-center gap-2 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" />}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </SheetTrigger>
            <SheetContent side="right" showCloseButton={false}>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle>
                    <Link
                      href="/"
                      className="flex items-center gap-2"
                      onClick={() => setOpen(false)}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                        <span className="text-xs font-extrabold text-primary-foreground">E</span>
                      </div>
                      <span className="text-sm font-extrabold">EasyPOS</span>
                    </Link>
                  </SheetTitle>
                  <SheetClose render={<Button variant="ghost" size="icon-sm" />}>
                    <X className="h-4 w-4" />
                  </SheetClose>
                </div>
              </SheetHeader>

              <nav className="flex flex-col gap-1 px-4 pt-4">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto p-4">
                <a
                  href={downloadUrl}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm"
                >
                  <Smartphone className="h-4 w-4" />
                  Download EasyPOS
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
