"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { ModeToggle } from "./mode-toggle";

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">E</span>
          </div>
          <span className="text-lg font-bold text-foreground">EasyPOS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <ModeToggle />
          <Button size="lg" render={<a href={downloadUrl} />}>
            <Download className="mr-2 h-4 w-4" />
            Download App
          </Button>
        </div>

        {/* Mobile: toggle + sheet */}
        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" />}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </SheetTrigger>
            <SheetContent side="right" showCloseButton={false}>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle>
                    <span className="text-base font-bold">EasyPOS</span>
                  </SheetTitle>
                  <SheetClose
                    render={<Button variant="ghost" size="icon-sm" />}
                  >
                    <X className="h-4 w-4" />
                  </SheetClose>
                </div>
              </SheetHeader>

              <nav className="flex flex-col gap-1 px-4 pt-2">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto p-4">
                <Button
                  size="lg"
                  className="w-full"
                  render={<a href={downloadUrl} />}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download App
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
