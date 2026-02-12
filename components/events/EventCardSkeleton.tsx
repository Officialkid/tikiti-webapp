export default function EventCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 bg-gray-300 dark:bg-gray-700" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
        </div>

        {/* Details */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-1">
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-12" />
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-gray-300 dark:bg-gray-700 rounded-full" />
            <div className="h-9 w-20 bg-gray-300 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
