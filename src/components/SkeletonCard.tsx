export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-gray-200 rounded-full" />
        <div className="w-24 h-3 bg-gray-200 rounded" />
        <div className="ml-auto w-12 h-3 bg-gray-200 rounded" />
      </div>
      <div className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
      <div className="w-full h-3 bg-gray-200 rounded mb-1" />
      <div className="w-5/6 h-3 bg-gray-200 rounded mb-1" />
      <div className="w-2/3 h-3 bg-gray-200 rounded" />
      <div className="flex gap-2 mt-4 pt-2 border-t border-gray-50">
        <div className="w-20 h-6 bg-gray-200 rounded" />
        <div className="w-6 h-6 bg-gray-200 rounded" />
        <div className="w-6 h-6 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
