export default function SkeletonHome() {
  const heights = ['h-64', 'h-96', 'h-80', 'h-72', 'h-[22rem]', 'h-60'];

  return (
    <div className="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3">
      {heights.map((heightClass, index) => (
        <div key={index} className="mb-6 break-inside-avoid">
          <div className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200 dark:bg-slate-700" />
                <div className="min-w-0">
                  <div className="h-3 w-28 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="mt-1.5 h-2.5 w-16 rounded bg-gray-100 dark:bg-slate-800" />
                </div>
              </div>
              <div className="h-3 w-16 rounded bg-gray-100 dark:bg-slate-800" />
            </div>

            <div className={`w-full bg-gray-200 dark:bg-slate-700 ${heightClass}`} />

            <div className="border-t border-gray-100 px-4 py-3 dark:border-slate-800">
              <div className="h-2.5 w-14 rounded bg-gray-100 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
