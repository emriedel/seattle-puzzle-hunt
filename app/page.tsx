import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Seattle Puzzle Hunt</h1>
      <p className="text-lg mb-8 text-center max-w-md text-muted-foreground">
        Explore Seattle neighborhoods through interactive puzzle hunts
      </p>
      <Button asChild size="lg">
        <Link href="/hunts">
          View Hunts
        </Link>
      </Button>
    </div>
  );
}
