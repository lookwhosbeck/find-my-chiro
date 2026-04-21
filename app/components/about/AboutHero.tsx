import { Badge } from "@/components/ui/badge";

const heroStats = [
  { num: "16%", label: "Utilization goal" },
  { num: "28M+", label: "Americans move yearly" },
  { num: "1 in 5", label: "Are chiropractic patients" },
] as const;

/**
 * About hero — mirrors the cosmic `HeroSection` shape (badge → title → lede)
 * but swaps the CTA row for a stats strip, matching the About mock's layout.
 */
export function AboutHero() {
  return (
    <section className="app-container w-full">
      <div className="mx-auto grid max-w-screen-xl place-items-center py-12 pb-8 sm:py-16 md:py-24 md:pb-14">
        <div className="relative flex w-full items-center justify-center">
          <div className="relative z-10 w-full space-y-6 pb-4 text-center sm:space-y-8 lg:pb-12">
            <Badge
              variant="outline"
              className="bg-muted mx-auto max-w-full whitespace-normal px-3 py-2 text-center text-xs leading-tight sm:text-sm"
            >
              <span className="text-primary mr-2">
                <Badge className="bg-background text-foreground hover:bg-background">
                  About Movyn
                </Badge>
              </span>
              <span>A referral network for the chiropractic profession</span>
            </Badge>

            <div className="mx-auto max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl">
              <h1 className="text-balance">
                Keeping patients{" "}
                <span className="bg-gradient-to-b from-primary/60 to-primary bg-clip-text text-transparent">
                  moving
                </span>{" "}
                — even when they move.
              </h1>
            </div>

            <p className="text-muted-foreground mx-auto max-w-2xl text-base text-pretty sm:text-lg md:text-xl">
              Movyn is a doctor-to-doctor referral network built for the chiropractic profession
              — connecting providers by philosophy, specialty, and patient fit so care never gets
              interrupted when a patient relocates.
            </p>

            <dl className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0">
              {heroStats.map((stat, idx) => (
                <div
                  key={stat.label}
                  className={
                    idx > 0
                      ? "flex flex-col items-center gap-1 sm:border-l sm:pl-6"
                      : "flex flex-col items-center gap-1 sm:pr-6"
                  }
                >
                  <dt className="text-primary text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {stat.num}
                  </dt>
                  <dd className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
