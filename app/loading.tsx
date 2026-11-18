"use client";

import { Card, Spinner } from "@qzlcorp/react";

export default function Loading() {
  return (
    <main className="route-loading">
      <Card elevated={false}>
        <Spinner size="md" />
        <span>Loading Gemini Guess</span>
      </Card>
    </main>
  );
}
