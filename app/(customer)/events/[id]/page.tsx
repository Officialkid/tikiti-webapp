export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main>
      <h1 className="text-2xl font-bold text-primary-600">Event Detail</h1>
      <p>Event ID: {id}</p>
    </main>
  );
}
