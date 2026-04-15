import { Button } from '@/components/ui/button';

export const HeroSection = () => (
  <div className="flex flex-col items-center gap-4">
    <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
      Find a Chiropractor
    </h2>
    <p className="text-lg text-muted-foreground">Search by zip code or modality.</p>

    <div className="flex gap-3">
      <Button size="lg">Search Now</Button>
      <Button size="lg" variant="outline">
        Learn More
      </Button>
    </div>
  </div>
);
