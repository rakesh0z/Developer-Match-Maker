import type { GitHubIssue } from "./issue.service.js";
export type RepoMetadata = {
    language: string | null;
    stars: number;
    forks: number;
};
export declare const fetchIssuesCached: (query: string, token?: string) => Promise<GitHubIssue[]>;
export declare const getRepoMetadataCached: (owner: string, repo: string, token?: string) => Promise<RepoMetadata>;
export declare const getRepoLanguageCached: (repositoryUrl: string, token?: string) => Promise<string | null>;
//# sourceMappingURL=githubCache.service.d.ts.map