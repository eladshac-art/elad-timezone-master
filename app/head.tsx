import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Time Zone Planner',
  description: 'Schedule meetings across time zones effortlessly.',
};

export default function Head() {
  return (
    <>
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
    </>
  );
}