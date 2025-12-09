export default function NotificationsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="h-4 w-64 bg-pale-stone rounded-md animate-pulse mt-2"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-28 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="h-10 w-28 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="h-10 w-32 bg-pale-stone rounded-md animate-pulse"></div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-earth-beige px-4">
          <div className="flex space-x-4 overflow-x-auto py-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-6 w-24 bg-pale-stone rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Notifications list skeleton */}
        <div className="divide-y divide-earth-beige">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4">
              <div className="flex items-start">
                <div className="h-10 w-10 bg-pale-stone rounded-full animate-pulse mr-3"></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div className="h-5 w-48 bg-pale-stone rounded-md animate-pulse"></div>
                    <div className="h-4 w-16 bg-pale-stone rounded-md animate-pulse"></div>
                  </div>
                  <div className="h-4 w-full bg-pale-stone rounded-md animate-pulse mt-2"></div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="h-5 w-20 bg-pale-stone rounded-full animate-pulse"></div>
                    <div className="flex space-x-2">
                      <div className="h-5 w-24 bg-pale-stone rounded-md animate-pulse"></div>
                      <div className="h-5 w-16 bg-pale-stone rounded-md animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-earth-beige">
          <div className="h-4 w-48 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="flex space-x-1">
            <div className="h-8 w-24 bg-pale-stone rounded-md animate-pulse"></div>
            <div className="h-8 w-24 bg-pale-stone rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
