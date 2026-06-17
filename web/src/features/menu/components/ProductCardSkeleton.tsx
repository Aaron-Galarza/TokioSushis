export const ProductCardSkeleton = () => {
  return (
    <div className="flex h-full animate-pulse flex-col overflow-hidden rounded-3xl border border-white/10 bg-background/85">
      <div className="aspect-[4/3] w-full bg-white/10" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="h-6 w-2/3 rounded-md bg-white/15" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded-md bg-white/10" />
          <div className="h-3 w-5/6 rounded-md bg-white/10" />
        </div>
        <div className="flex-1" />
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div className="h-6 w-1/3 rounded-md bg-white/15" />
          <div className="h-10 w-24 rounded-2xl bg-secondary/35" />
        </div>
      </div>
    </div>
  );
};
