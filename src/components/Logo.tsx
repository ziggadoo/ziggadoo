import Link from "next/link";
export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <Link href="/" aria-label="ziggadoo home" className="inline-flex items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Ziggadoo" className={className + " w-auto"} />
    </Link>
  );
}
