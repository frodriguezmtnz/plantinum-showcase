import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Platinum Showcase',
};

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <div className="prose prose-invert mx-auto">
        <h1 className="text-4xl font-bold font-headline mb-8">Terms of Service</h1>
        <p className="text-lg text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Platinum Showcase website (the "Service") operated by us.</p>
        
        <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Accounts</h2>
        <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>

        <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Content</h2>
        <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.</p>
        <p>By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service. You retain any and all of your rights to any Content you submit, post or display on or through the Service and you are responsible for protecting those rights.</p>
        <p>You represent and warrant that: (i) the Content is yours (you own it) or you have the right to use it and grant us the rights and license as provided in these Terms, and (ii) the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person.</p>

        <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Prohibited Uses</h2>
        <p>You may use the Service only for lawful purposes. You agree not to use the Service:</p>
        <ul className="list-disc pl-5 space-y-2">
            <li>In any way that violates any applicable national or international law or regulation.</li>
            <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.</li>
            <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
        </ul>

        <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Termination</h2>
        <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
        
        <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Changes To Service</h2>
        <p>We reserve the right to withdraw or amend our Service, and any service or material we provide via the Service, in our sole discretion without notice.</p>

        <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Contact Us</h2>
        <p>If you have any questions about these Terms, please contact us.</p>
      </div>
    </div>
  );
}
