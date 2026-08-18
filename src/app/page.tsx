export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">LeetTrack</h1>
        <p className="mt-2 text-sm text-content-muted">
          Local tracker for completed programming problems
        </p>
      </div>
    </main>
  );
}
