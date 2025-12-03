import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Seattle Puzzle Hunt</h1>
      <p className="text-lg mb-8 text-center max-w-md">
        Explore Seattle neighborhoods through interactive puzzle hunts
      </p>
      <Link
        href="/hunts"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
      >
        View Hunts
      </Link>
    </div>
  );
}
