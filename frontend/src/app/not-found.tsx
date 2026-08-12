import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 font-ui py-12">
      <div className="w-12 h-12 bg-charcoal border border-rule rounded-md flex items-center justify-center text-oxide shadow-card">
        <BookOpen className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <span className="label-sm text-oxide">404 — Page Not Found</span>
        <h2 className="text-3xl font-display font-bold text-paper">
          Manuscript Route Missing
        </h2>
        <p className="text-sm font-body text-muted max-w-sm mx-auto leading-relaxed">
          The project page or manuscript route you are looking for does not exist or has been relocated.
        </p>
      </div>

      <Link
        href="/projects"
        className="inline-flex items-center space-x-2 px-5 py-2.5 bg-oxide hover:bg-oxide-hover text-paper font-semibold text-xs uppercase tracking-wider rounded-sm shadow-card transition duration-fast"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Book Catalog</span>
      </Link>
    </div>
  );
}
