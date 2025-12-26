import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Platinum Showcase',
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <div className="prose prose-invert mx-auto">
        <h1 className="text-4xl font-bold font-headline mb-8">Privacy Policy</h1>
        <p className="text-lg text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <p>This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.</p>
        
        <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Information Collection and Use</h2>
        <p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>

        <h3 className="text-xl font-bold font-headline mt-8 mb-2">Personal Data</h3>
        <p>While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to:</p>
        <ul className="list-disc pl-5 space-y-2">
            <li>Email address</li>
            <li>Username</li>
            <li>Cookies and Usage Data</li>
        </ul>

        <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Use of Data</h2>
        <p>Platinum Showcase uses the collected data for various purposes:</p>
        <ul className="list-disc pl-5 space-y-2">
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information so that we can improve our Service</li>
            <li>To monitor the usage of our Service</li>
            <li>To detect, prevent and address technical issues</li>
        </ul>

        <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Security of Data</h2>
        <p>The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>
        
        <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Changes to This Privacy Policy</h2>
        <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

        <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us.</p>
      </div>
    </div>
  );
}
