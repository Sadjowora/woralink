import Navbar from '../../components/layout/Navbar';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <div className="h-8 w-72 animate-pulse rounded-md bg-gray-200" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-100" />
        </div>

        <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start">
          <aside className="hidden w-64 shrink-0 rounded-xl border border-gray-200 bg-white p-4 md:block">
            <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            <div className="mt-4 h-10 animate-pulse rounded-lg bg-gray-100" />
            <div className="mt-3 h-10 animate-pulse rounded-lg bg-gray-100" />
            <div className="mt-3 h-10 animate-pulse rounded-lg bg-gray-100" />
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 sm:mb-5 sm:p-4">
              <div className="h-11 animate-pulse rounded-lg bg-gray-100" />
              <div className="mt-3 h-4 w-36 animate-pulse rounded bg-gray-100" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_240px] lg:gap-6">
              <div className="space-y-3 sm:space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
                  >
                    <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
                    <div className="mt-3 h-3 w-64 animate-pulse rounded bg-gray-100" />
                    <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-100" />
                    <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-gray-100" />
                  </div>
                ))}
              </div>

              <aside className="hidden rounded-xl border border-gray-200 bg-white p-4 lg:block">
                <div className="h-5 w-44 animate-pulse rounded bg-gray-200" />
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
                      <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-100" />
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
