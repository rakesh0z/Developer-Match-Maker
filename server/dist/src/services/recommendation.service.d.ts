export type RecommendedIssue = {
    id: string;
    githubIssueId: number;
    title: string;
    body: string | null;
    state: string;
    difficulty: string | null;
    url: string;
    updatedAtGithub: string;
    repository: {
        owner: string;
        name: string;
        language: string | null;
        stars: number;
        forks: number;
    };
    matchScore: number;
    matchReasons: string[];
};
export type RecommendationOptions = {
    limit?: number;
    difficulty?: string;
    language?: string;
    accessToken?: string;
};
export declare const invalidateUserRecommendations: (userId: string) => Promise<void>;
export declare const getRecommendationsForUser: (userId: string, options?: RecommendationOptions) => Promise<RecommendedIssue[]>;
//# sourceMappingURL=recommendation.service.d.ts.map