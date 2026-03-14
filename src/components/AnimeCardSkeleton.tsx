export default function AnimeCardSkeleton() {
    return (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div className="aspect-[2/3] skeleton" />
            <div className="p-3 space-y-2">
                <div className="h-4 skeleton w-3/4" />
                <div className="h-3 skeleton w-1/3" />
            </div>
        </div>
    );
}
