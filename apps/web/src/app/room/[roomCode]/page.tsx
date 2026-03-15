interface RoomPageProps {
  params: {
    roomCode: string;
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <h1 className="text-3xl font-bold">Room: {params.roomCode}</h1>
      <p className="mt-2 text-slate-600">Real-time lobby and match screen will be implemented in upcoming days.</p>
    </main>
  );
}
