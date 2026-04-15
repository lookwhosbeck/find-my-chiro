import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionContainer({
  children,
  id,
  className,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={cn("pb-20 sm:pb-32", className)}>
      <div className="container">{children}</div>
    </section>
  );
}

export function SectionHeader({
  title,
  subTitle,
  description,
  className,
}: {
  title: ReactNode;
  subTitle?: string;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn("mx-auto mb-6 max-w-sm text-center lg:mb-12", className)}
    >
      {subTitle ? (
        <div className="mb-4 bg-gradient-to-b from-primary/60 to-primary bg-clip-text font-semibold tracking-wider text-transparent uppercase">
          {subTitle}
        </div>
      ) : null}
      <h2 className="mb-4 text-3xl font-bold md:text-4xl">{title}</h2>
      {description ? (
        <p className="text-muted-foreground mb-8 text-lg">{description}</p>
      ) : null}
    </header>
  );
}
