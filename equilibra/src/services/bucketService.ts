import { apiFetch } from "./apiClient";
import type { Bucket } from "../models";
import JSONBig from "json-bigint";

export const bucketService = {
    getBuckets: async (projectId: string | number): Promise<Bucket[]> => {
        return await apiFetch<Bucket[]>(`/projects/${projectId}/buckets`);
    },

    getBucketById: async (projectId: string | number, bucketId: number | string): Promise<Bucket> => {
        return await apiFetch<Bucket>(`/projects/${projectId}/buckets/${bucketId}`);
    },

    createBucket: async (data: Partial<Bucket>): Promise<Bucket> => {
        return await apiFetch<Bucket>("/buckets", {
            method: "POST",
            body: JSONBig.stringify(data),
        });
    },

    reorderBuckets: async (projectId: string | number, bucketIds: (number | string)[]): Promise<{ status: string; order: (number | string)[] }> => {
        return await apiFetch<{ status: string; order: (number | string)[] }>(`/projects/${projectId}/buckets/reorder`, {
            method: "PUT",
            body: JSONBig.stringify(bucketIds),
        });
    },

    deleteBucket: async (projectId: string | number, bucketId: string | number): Promise<void> => {
        await apiFetch(`/projects/${projectId}/buckets/${bucketId}`, {
            method: "DELETE",
        });
    },
};
