import { useI18n } from "@/lib/i18n";
import { Globe, Menu, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUnifiedAuth } from "@/lib/unified-auth";
import { NetworkStatusBanner } from "@/components/ui/NetworkStatusBanner";
import { EmergencyButton } from "@/components/ui/EmergencyButton";
import { FontSizeToggler } from "@/components/ui/FontSizeToggler";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative">
      <NetworkStatusBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <EmergencyButton />
    </div>
  );
}

function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { user } = useUnifiedAuth();
  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-2 font-extrabold tracking-tight"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            className="text-primary"
            aria-hidden
          >
            <path
              fill="currentColor"
              d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m4.9 7.1l-5.66 5.66a1 1 0 0 1-1.41 0l-2.12-2.12a1 1 0 1 1 1.41-1.41l1.41 1.41l4.95-4.95a1 1 0 1 1 1.41 1.41"
            />
          </svg>
          <span className="text-xl">{t("appName")}</span>
        </a>
        <nav className="hidden xl:flex items-center gap-4 text-sm">
          <a href="#features" className="hover:text-primary transition-colors">
            {t("nav_features")}
          </a>
          <a
            href="#architecture"
            className="hover:text-primary transition-colors"
          >
            {t("nav_architecture")}
          </a>
          <a href="/awareness" className="hover:text-primary transition-colors">
            {t("nav_awareness")}
          </a>
          <a href="/#symptom" className="hover:text-primary transition-colors">
            {t("nav_symptom")}
          </a>
          <a href="/#records" className="hover:text-primary transition-colors">
            {t("nav_records")}
          </a>

        </nav>
        <div className="flex items-center gap-2">
          <FontSizeToggler />
          <LanguageSwitcher />
          <AuthButtons />
          <Button variant="default" asChild>
            <a href="#symptom">{t("cta_assess")}</a>
          </Button>
          <button
            className="xl:hidden p-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="xl:hidden border-t">
          <div className="container py-3 space-y-3">
            <a
              href="#features"
              className="block"
              onClick={() => setOpen(false)}
            >
              {t("nav_features")}
            </a>
            <a
              href="#architecture"
              className="block"
              onClick={() => setOpen(false)}
            >
              {t("nav_architecture")}
            </a>
            <a
              href="/awareness"
              className="block"
              onClick={() => setOpen(false)}
            >
              {t("nav_awareness")}
            </a>
            <a
              href="/#symptom"
              className="block"
              onClick={() => setOpen(false)}
            >
              {t("nav_symptom")}
            </a>
            <a
              href="/#records"
              className="block"
              onClick={() => setOpen(false)}
            >
              {t("nav_records")}
            </a>

          </div>
        </div>
      )}
    </header>
  );
}

function AuthButtons() {
  const { user, logout, isPatient, isDoctor, isGuest } = useUnifiedAuth();
  const { t } = useI18n();
  
  if (user) {
    const roleText = isPatient ? t("role_patient") : isDoctor ? t("role_doctor") : isGuest ? t("role_guest") : t("role_user");
    const initials = user.name ? user.name.charAt(0).toUpperCase() : "U";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name || t("role_user")}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {t("role")} {roleText}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isGuest && (
            <DropdownMenuItem asChild>
              <a href="/login" className="cursor-pointer">
                <UserPlus className="h-4 w-4 mr-2" />
                {t("nav_signup")}
              </a>
            </DropdownMenuItem>
          )}
          {isPatient && (
            <DropdownMenuItem asChild>
              <a href="/patient/dashboard" className="cursor-pointer">{t("nav_dashboard")}</a>
            </DropdownMenuItem>
          )}
          {isDoctor && (
            <DropdownMenuItem asChild>
              <a href="/doctor/dashboard" className="cursor-pointer">{t("nav_dashboard")}</a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="cursor-pointer">
            {isGuest ? t("nav_exit_guest") : t("nav_logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  return (
    <Button asChild variant="outline">
      <a href="/login">{t("nav_login")}</a>
    </Button>
  );
}

function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={lang} onValueChange={(v) => setLang(v as any)}>
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder="EN" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="pa">ਪੰਜਾਬੀ</SelectItem>
          <SelectItem value="hi">हिंदी</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t bg-white/60 dark:bg-background/80">
      <div className="container py-8 grid gap-6 md:grid-cols-3 text-sm">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              className="text-primary"
              aria-hidden
            >
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m4.9 7.1l-5.66 5.66a1 1 0 0 1-1.41 0l-2.12-2.12a1 1 0 1 1 1.41-1.41l1.41 1.41l4.95-4.95a1 1 0 1 1 1.41 1.41"
              />
            </svg>
            {t("appName")}
          </div>
          <p className="mt-3 text-muted-foreground max-w-sm">{t("tagline")}</p>
        </div>
        <div className="space-y-2">
          <div className="font-semibold">{t("features_title")}</div>
          <a href="#features" className="block">
            {t("f1_title")}
          </a>
          <a href="#features" className="block">
            {t("f2_title")}
          </a>
          <a href="#features" className="block">
            {t("f3_title")}
          </a>
          <a href="#features" className="block">
            {t("f4_title")}
          </a>
        </div>
        <div className="space-y-2">
          <div className="font-semibold">{t("footer_resources")}</div>
          <a href="#architecture" className="block">
            {t("architecture_title")}
          </a>
          <a href="#about" className="block">
            {t("nav_about")}
          </a>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {t("appName")} · {t("footer_made_for")}
      </div>
    </footer>
  );
}
