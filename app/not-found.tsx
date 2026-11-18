"use client";

import { Badge, Card } from "@qzlcorp/react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <Card className="not-found-card" elevated>
        <Badge variant="neutral">404</Badge>
        <h1>This clue leads nowhere.</h1>
        <p>The page you requested is not part of this challenge.</p>
        <Link
          href="/"
          className="qzl-button qzl-button--md qzl-button--primary"
        >
          Return to Gemini Guess
        </Link>
      </Card>
    </main>
  );
}
