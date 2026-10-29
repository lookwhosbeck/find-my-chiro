import { notFound } from "next/navigation";

/** Bare path is not a signup. The real page lives under the secret token. */
export default function ReviewSignupIndexPage() {
  notFound();
}
