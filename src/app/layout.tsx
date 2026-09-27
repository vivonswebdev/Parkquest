import type { ReactNode } from "react";
import "./globals.css";

// La mise en page réelle (html/body) est dans app/[locale]/layout.tsx.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
