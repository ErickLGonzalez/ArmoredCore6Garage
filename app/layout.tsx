import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import type { CSSProperties } from "react";

import { resolveTheme } from "@/lib/auth/themes";
import { THEME_COOKIE } from "@/lib/auth/session";
import { loadThemeTokens, tokensToCssVars } from "@/lib/themes/theme-loader";
import { SiteNav } from "@/components/SiteNav";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "MasterofArena";
const description =
  "Armored Core VI build lab: stats, analysis, and garage tools (next milestones).";

export const metadata: Metadata = {
  title: {
    default: title,
    template: `%s · ${title}`,
  },
  description,
  applicationName: title,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = resolveTheme(cookies().get(THEME_COOKIE)?.value);
  const themeVars = tokensToCssVars(await loadThemeTokens(theme));
  return (
    <html lang="en" data-ui-theme={theme} style={themeVars as CSSProperties}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50`}
      >
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
