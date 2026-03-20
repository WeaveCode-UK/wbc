// ISR landing page — regenerates when consultant updates profile
export default function ConsultantLandingPage({ params }: { params: { slug: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">Landing page: {params.slug}</h1>
    </main>
  );
}

// ISR: regenerate every 60 seconds
export const revalidate = 60;
