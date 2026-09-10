import Link from "next/link";
import { getViewer } from "@/lib/supabase/viewer";

export default async function Footer() {
  const { isAdmin } = await getViewer();
  return (
    <footer className="mx-auto mt-16 max-w-2xl px-4 pb-10 text-xs text-ink/55 sm:px-6">
      <p>Venue details, prices and hours are collected from public sources and parents, and can change without notice. Always double check with the venue before you go.</p>
      <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
        <Link href="/suggest">Tip us about a place</Link>
        <Link href="/for-venues">List your venue</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/contact">Contact</Link>
        {isAdmin && <Link href="/admin" className="text-cobalt">Admin</Link>}
      </nav>
      <p className="mt-3">© {new Date().getFullYear()} Ziggadoo, a Nordic Bridge Global FZ-LLC brand, Dubai.</p>
    </footer>
  );
}
