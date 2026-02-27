import { useState, useEffect, useCallback } from "react";
import type { Bucket } from "../models";
import { bucketService } from "../services/bucketService";

export const useBuckets = (projectId: number) => {
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBuckets = useCallback(async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const data = await bucketService.getBuckets(projectId);
            // Sort buckets by order_idx
            const sorted = data.sort((a, b) => (a.order_idx || 0) - (b.order_idx || 0));
            setBuckets(sorted);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch buckets");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchBuckets();
    }, [fetchBuckets]);

    const createBucket = useCallback(
        async (stateName: string) => {
            try {
                const newBucket = await bucketService.createBucket({
                    project_id: Number(projectId),
                    state: stateName
                });
                setBuckets(prev => [...prev, newBucket]);
                return newBucket;
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        [projectId]
    );

    const reorderBuckets = useCallback(
        async (bucketIds: number[]) => {
            try {
                // Optimistic UI update
                const reordered = bucketIds.map((id, index) => {
                    const bucket = buckets.find(b => b.id === id);
                    return { ...bucket!, order_idx: index };
                });
                setBuckets(reordered);

                // API call
                await bucketService.reorderBuckets(projectId, bucketIds);
            } catch (err) {
                console.error("Failed to reorder buckets", err);
                // Revert on error
                fetchBuckets();
                throw err;
            }
        },
        [projectId, buckets, fetchBuckets]
    );

    const deleteBucket = useCallback(
        async (bucketId: number) => {
            try {
                // Optimistic UI update
                setBuckets(prev => prev.filter(b => String(b.id) !== String(bucketId)));

                // API call
                await bucketService.deleteBucket(projectId, bucketId);
            } catch (err) {
                console.error("Failed to delete bucket", err);
                // Revert on error
                fetchBuckets();
                throw err;
            }
        },
        [projectId, fetchBuckets]
    );

    return {
        buckets,
        loading,
        error,
        createBucket,
        reorderBuckets,
        deleteBucket,
        refreshBuckets: fetchBuckets
    };
};
