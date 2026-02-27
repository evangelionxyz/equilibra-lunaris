import { apiFetch } from "./apiClient";
import type { Bucket } from "../models";

export const bucketService = {
    getBuckets: async (projectId: number): Promise<Bucket[]> => {
        return await apiFetch<Bucket[]>(`/projects/${projectId}/buckets`);
    },

    getBucketById: async (projectId: number, bucketId: number): Promise<Bucket> => {
        return await apiFetch<Bucket>(`/projects/${projectId}/buckets/${bucketId}`);
    },

    createBucket: async (data: Partial<Bucket>): Promise<Bucket> => {
        return await apiFetch<Bucket>("/buckets", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    reorderBuckets: async (projectId: number, bucketIds: number[]): Promise<{ status: string; order: number[] }> => {
        return await apiFetch<{ status: string; order: number[] }>(`/projects/${projectId}/buckets/reorder`, {
            method: "PUT",
            body: JSON.stringify(bucketIds),
        });
    },
};
