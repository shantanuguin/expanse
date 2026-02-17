import type { Metadata } from "next";
import { Onest } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";

/* ── Onest — body text (clean, readable, geometric sans-serif) ── */
const onest = Onest({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

/* ── Cal Sans — headings (bold, geometric display font) ── */
const calSans = localFont({
  src: "../public/fonts/CalSans-SemiBold.woff2",
  variable: "--font-heading",
  display: "swap",
  weight: "600",
});

export const metadata: Metadata = {
  title: "Expanse",
  description: "Personal Expense Management",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${onest.variable} ${calSans.variable} ${onest.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CurrencyProvider>
              {children}
              <Toaster />
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
