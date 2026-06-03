import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to HireTrain AI</h1>
      <p className="mb-8 text-lg">Select your portal:</p>
      
      <div className="flex gap-4">
        <Link href="/login" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">
          HR Login
        </Link>
        <Link href="/candidate" className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition">
          Candidate Portal
        </Link>
      </div>
    </main>
  );
}
