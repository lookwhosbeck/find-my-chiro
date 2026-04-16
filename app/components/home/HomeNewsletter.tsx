"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionContainer, SectionHeader } from "@/app/components/home/section-layout";

export function HomeNewsletter() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <SectionContainer>
      <SectionHeader
        title={
          <>
            Get the{" "}
            <span className="bg-gradient-to-b from-primary/60 to-primary bg-clip-text text-transparent">
              Movyn newsletter
            </span>
          </>
        }
        description="Occasional updates on new features, network growth, and what we're learning from chiropractors and patients. No spam—unsubscribe in one click."
      />
      <form
        className="mx-auto flex w-full flex-col gap-4 md:w-8/12 md:flex-row md:gap-2 lg:w-5/12"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <Input
          type="email"
          name="email"
          placeholder="you@example.com"
          className="bg-muted/50 dark:bg-muted/80"
          aria-label="Email for newsletter"
          required
          disabled={submitted}
        />
        <Button type="submit" disabled={submitted}>
          {submitted ? "You're in — check your inbox" : "Keep me posted"}
        </Button>
      </form>
    </SectionContainer>
  );
}
