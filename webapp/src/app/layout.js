import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata = {
  title: "AetherFlow Supply Intelligence",
  description: "Enterprise Supply Chain Neural Grid and Digital Twin",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body suppressHydrationWarning className={inter.className}>{children}</body>
    </html>
  );
}
