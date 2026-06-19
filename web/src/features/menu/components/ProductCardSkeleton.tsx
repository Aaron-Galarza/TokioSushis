export const ProductCardSkeleton = () => {
  return (
    <div className="flex h-full animate-pulse flex-col overflow-hidden rounded-2xl border border-white/10 bg-card">
      <div className="aspect-[16/9] w-full bg-white/5" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="h-5 w-2/3 rounded-md bg-white/10" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded-md bg-white/5" />
          <div className="h-3 w-5/6 rounded-md bg-white/5" />
        </div>
        <div className="flex-1" />
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <div className="h-6 w-1/3 rounded-md bg-white/10" />
          <div className="h-9 w-20 rounded-xl bg-primary/20" />
        </div>
      </div>
    </div>
  );
};
