import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Git & GitHub Basics Test",
  description: "Timed quiz for students",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
