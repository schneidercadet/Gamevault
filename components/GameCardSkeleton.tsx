export default function GameCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-primary-dark/10 bg-gradient-to-b from-background to-background-lighter p-4 shadow-xl">
      {/* Image skeleton */}
      <div className="relative mb-4 aspect-video w-full animate-pulse overflow-hidden rounded-lg bg-background-lighter" />

      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-3/4 animate-pulse rounded-md bg-background-lighter" />

        {/* Platform icons skeleton */}
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-pulse rounded-full bg-background-lighter" />
          <div className="h-4 w-4 animate-pulse rounded-full bg-background-lighter" />
          <div className="h-4 w-4 animate-pulse rounded-full bg-background-lighter" />
        </div>

        {/* Rating skeleton */}
        <div className="flex items-center space-x-1">
          <div className="h-4 w-4 animate-pulse rounded-full bg-background-lighter" />
          <div className="h-4 w-8 animate-pulse rounded-md bg-background-lighter" />
        </div>
      </div>
    </div>
  );
}
