import type { Metadata } from "next";
import "./globals.css";
import "@qzlcorp/react/styles.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://gemini-guess.qz-l.com"),
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
        url: "/gemini-guess.png",
        width: 480,
        height: 360,
      },
    ],
    siteName: "Gemini Guess",
    type: "website",
    url: "https://gemini-guess.qz-l.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gemini Guess",
    description:
      "Challenge Gemini to guess any idea through text, voice, or video.",
    images: ["/gemini-guess.png"],
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
      <head>
        {/* Monetag in-page push tag */}
        <Script id="monetag-in-page-push" strategy="afterInteractive">
          {`(function(s){s.dataset.zone='12172421',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`}
        </Script>
        {/* Adsterra social bar */}
        <Script
          src="https://bauval.org/14/6ea03aae32b109158dee52a286058c02"
          strategy="afterInteractive"
          data-cfasync="false"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
