export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      {/* Hero */}
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          🌾 Field Shift
        </h1>
        <p className="text-lg text-gray-600">
          Explore crop-rotation strategies for your farm using NASA satellite
          climate data and local soil information.
        </p>
        <p className="text-sm text-gray-500 max-w-lg mx-auto">
          Compare rotation scenarios side-by-side, see how weather patterns and
          soil health interact, and make more informed decisions — with full
          transparency about what the data does and does not tell you.
        </p>

        {/* Placeholder — will become the interactive app in Phase 2+ */}
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 p-10 text-gray-400 text-sm">
          Interactive map, charts, and rotation analysis coming in Phase 2.
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-12 max-w-xl rounded-lg bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-800">
        <p className="font-semibold">⚠️ Important</p>
        <p className="mt-1">
          This tool is a decision-support aid. It does <strong>not</strong>{" "}
          replace the expertise of farmers or local agricultural advisors.
          NASA POWER climate data is at approximately 0.5° resolution (~55 km)
          and does not represent field-level conditions. All crop data should be
          verified against local sources before making farming decisions.
        </p>
      </div>
    </main>
  );
}
