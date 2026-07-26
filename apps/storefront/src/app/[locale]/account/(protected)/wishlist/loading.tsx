import { Skeleton } from '@/components/ui/skeleton';

export default function WishlistLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="space-y-4 rounded-xl border p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex gap-4">
                        <Skeleton className="size-[120px] rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-2/3" />
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
