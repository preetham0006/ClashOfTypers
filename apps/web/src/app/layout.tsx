import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ClashOfTypers",
  description: "Real-time typing battles with your friends"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="coc-page">
        <div className="coc-character coc-character-archer" aria-hidden="true" />
        <div className="coc-character coc-character-barbarian" aria-hidden="true" />
        <div className="coc-keyfield" aria-hidden="true">
          <span className="coc-key" style={{ ["--x" as string]: "6%", ["--d" as string]: "15s", ["--s" as string]: "0s" }}>q</span>
          <span className="coc-key" style={{ ["--x" as string]: "14%", ["--d" as string]: "18s", ["--s" as string]: "-2s" }}>w</span>
          <span className="coc-key" style={{ ["--x" as string]: "23%", ["--d" as string]: "17s", ["--s" as string]: "-6s" }}>e</span>
          <span className="coc-key" style={{ ["--x" as string]: "31%", ["--d" as string]: "21s", ["--s" as string]: "-9s" }}>r</span>
          <span className="coc-key" style={{ ["--x" as string]: "39%", ["--d" as string]: "19s", ["--s" as string]: "-4s" }}>t</span>
          <span className="coc-key" style={{ ["--x" as string]: "47%", ["--d" as string]: "16s", ["--s" as string]: "-11s" }}>y</span>
          <span className="coc-key" style={{ ["--x" as string]: "56%", ["--d" as string]: "20s", ["--s" as string]: "-8s" }}>u</span>
          <span className="coc-key" style={{ ["--x" as string]: "64%", ["--d" as string]: "22s", ["--s" as string]: "-3s" }}>i</span>
          <span className="coc-key" style={{ ["--x" as string]: "73%", ["--d" as string]: "18s", ["--s" as string]: "-12s" }}>o</span>
          <span className="coc-key" style={{ ["--x" as string]: "81%", ["--d" as string]: "17s", ["--s" as string]: "-7s" }}>p</span>
          <span className="coc-key" style={{ ["--x" as string]: "90%", ["--d" as string]: "21s", ["--s" as string]: "-14s" }}>a</span>
        </div>
        {children}
      </body>
    </html>
  );
}
