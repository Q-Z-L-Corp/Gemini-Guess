import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={"en"}>
      <head></head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
