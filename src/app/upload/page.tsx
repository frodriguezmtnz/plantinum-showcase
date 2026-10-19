import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { UploadForm } from './upload-form';

export const metadata = {
  title: 'Upload a Platinum | Platinum Showcase',
  robots: { index: false, follow: false },
};

export default async function UploadPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/upload');
  }

  return <UploadForm />;
}
