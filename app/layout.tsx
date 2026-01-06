import type { Metadata } from "next";
import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";

export const metadata: Metadata = {
  metadataBase: new URL("https://gg.qz-l.com"),
  title: "Gemini Guess",
  description:
    "an open-ended game where players challenge Gemini 3 to guess any idea via text, voice, or video, replaying its deep, multi-turn reasoning and thought process.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "Gemini Guess",
    description:
      "an open-ended game where players challenge Gemini 3 to guess any idea via text, voice, or video, replaying its deep, multi-turn reasoning and thought process.",
    images: [
      {
        url: "/gemini_guess.jpg",
        width: 480,
        height: 360,
      },
    ],
    siteName: "Gemini Guess",
    type: "website",
    url: "https://gg.qz-l.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gemini Guess",
    description: "Smart short links with safety preview and AI analysis.",
    images: ["/gemini_guess.jpg"],
  },
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-slate-900 text-slate-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
