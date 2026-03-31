import { redirect } from 'next/navigation';

/** Marketing entry: same flow as /signup (chiropractor premium-first). */
export default function JoinPage() {
  redirect('/signup');
}
