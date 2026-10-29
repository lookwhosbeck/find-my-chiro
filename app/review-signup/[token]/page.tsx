import { notFound } from "next/navigation";
import { ChiropractorSignupFlow } from "@/app/components/ChiropractorSignupFlow";
import { reviewSignupTokenMatches } from "@/app/lib/review-signup.server";

export const dynamic = "force-dynamic";

export default function ReviewSignupPage({ params }: { params: { token: string } }) {
  if (!reviewSignupTokenMatches(params.token)) {
    notFound();
  }

  return <ChiropractorSignupFlow mode="review" />;
}
