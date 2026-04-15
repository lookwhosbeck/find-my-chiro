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
            Join our{" "}
            <span className="bg-gradient-to-b from-primary/60 to-primary bg-clip-text text-transparent">
              newsletter
            </span>
          </>
        }
        description="Placeholder — connect this field to your ESP (e.g. Resend, Mailchimp, Brevo) when you are ready."
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
          {submitted ? "Thanks — check your inbox" : "Subscribe"}
        </Button>
      </form>
    </SectionContainer>
  );
}
