"use client";

import { Building2, Clock, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionContainer, SectionHeader } from "@/app/components/home/section-layout";

/** Cosmic `ContactSection` layout — Movyn copy; form opens mailto with field contents. */
export function HomeContact() {
  return (
    <SectionContainer id="contact">
      <SectionHeader
        subTitle="Contact"
        title="Connect with Movyn"
        description="Placeholder — keep this section once your support email, hours, and intake form are finalized."
      />
      <section className="mx-auto grid max-w-screen-lg grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="flex flex-col gap-6 *:rounded-lg *:border *:p-6">
            <div className="bg-muted">
              <div className="mb-4 flex items-center gap-3">
                <Building2 className="size-4" />
                <div className="font-bold">Location (placeholder)</div>
              </div>
              <div className="text-muted-foreground">123 Example Ave, Suite 100, Your City, ST 00000</div>
            </div>
            <div className="bg-muted">
              <div className="mb-4 flex items-center gap-3">
                <Phone className="size-4" />
                <div className="font-bold">Call us (placeholder)</div>
              </div>
              <div className="text-muted-foreground">+1 (555) 000-0000</div>
            </div>
            <div className="bg-muted">
              <div className="mb-4 flex items-center gap-3">
                <Mail className="size-4" />
                <div className="font-bold">Email</div>
              </div>
              <div className="text-muted-foreground">hello@movyn.com</div>
            </div>
            <div className="bg-muted">
              <div className="mb-4 flex items-center gap-3">
                <Clock className="size-4" />
                <div className="font-bold">Hours (placeholder)</div>
              </div>
              <div className="text-muted-foreground">Monday–Friday, 9am–5pm</div>
            </div>
          </div>
        </div>
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>Send a message</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid w-full gap-6"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const first = String(fd.get("first") ?? "");
                const last = String(fd.get("last") ?? "");
                const email = String(fd.get("email") ?? "");
                const message = String(fd.get("message") ?? "");
                const body = encodeURIComponent(
                  `From: ${first} ${last}\nEmail: ${email}\n\n${message}`,
                );
                window.location.href = `mailto:hello@movyn.com?subject=${encodeURIComponent("Movyn website inquiry")}&body=${body}`;
              }}
            >
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="flex w-full flex-col gap-2">
                  <label className="text-sm font-semibold" htmlFor="contact-first">
                    First name
                  </label>
                  <Input id="contact-first" name="first" placeholder="Jordan" required />
                </div>
                <div className="flex w-full flex-col gap-2">
                  <label className="text-sm font-semibold" htmlFor="contact-last">
                    Last name
                  </label>
                  <Input id="contact-last" name="last" placeholder="Lee" required />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="contact-email">
                  Email
                </label>
                <Input id="contact-email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="contact-message">
                  Message
                </label>
                <Textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  placeholder="How can we help?"
                  className="resize-none"
                  required
                />
              </div>
              <Button size="lg" type="submit">
                Send message
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </SectionContainer>
  );
}
