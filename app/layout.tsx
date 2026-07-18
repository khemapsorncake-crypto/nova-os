import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "NOVA OS v3.1", description: "Free AI Campaign Studio" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="th"><body>{children}</body></html>;
}
