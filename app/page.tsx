import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Image
        src="/gemini_guess.png"
        alt="Gemini Guess Logo"
        width={500}
        height={500}
        priority
      />
    </main>
  );
}
