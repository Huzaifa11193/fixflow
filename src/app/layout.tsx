import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FixFlow",
  description: "One-click smart error and bug resolver.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/fixflow-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
