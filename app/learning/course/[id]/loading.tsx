import { InlineLoader } from "@/components/ui/page-loader";

export default function Loading() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <InlineLoader text="Loading course..." variant="spinner" size="lg" />
    </div>
  );
}
