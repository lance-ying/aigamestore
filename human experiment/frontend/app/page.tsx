import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to experiment consent page
  redirect('/experiment/consent');
}
