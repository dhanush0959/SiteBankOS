export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-72 sm:h-96 w-full bg-gray-300" />
      <div className="max-w-3xl mx-auto px-4 -mt-32 sm:-mt-40 relative z-10 pb-6">
        <div className="h-8 w-64 bg-white/20 rounded mb-3" />
        <div className="h-4 w-48 bg-white/20 rounded" />
      </div>

      <div className="max-w-3xl mx-auto px-4 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-5">
          {/* Price card */}
          <div className="rounded-lg border bg-white p-5 space-y-3">
            <div className="h-4 w-12 bg-gray-200 rounded" />
            <div className="h-9 w-48 bg-gray-200 rounded" />
          </div>
          {/* Description skeleton */}
          <div className="rounded-lg border bg-white p-5 space-y-2">
            <div className="h-5 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
            <div className="h-4 w-2/3 bg-gray-100 rounded" />
          </div>
          {/* Specs skeleton */}
          <div className="rounded-lg border bg-white p-5">
            <div className="h-5 w-32 bg-gray-200 rounded mb-3" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <div className="h-3 w-12 bg-gray-200 rounded mb-1" />
                  <div className="h-4 w-16 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar skeleton */}
        <aside className="space-y-4">
          <div className="rounded-lg border bg-white p-5 space-y-3">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded mt-1" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-5 space-y-3">
            <div className="h-5 w-48 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-100 rounded" />
            <div className="h-10 w-full bg-gray-100 rounded" />
            <div className="h-24 w-full bg-gray-100 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
        </aside>
      </div>
    </div>
  );
}
