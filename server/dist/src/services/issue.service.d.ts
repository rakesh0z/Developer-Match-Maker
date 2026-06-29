export type GitHubIssue = {
    id: number;
    title: string;
    body: string | null;
    state: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    labels: Array<{
        name: string;
    }>;
    repository_url: string;
};
export declare const fetchIssues: (query: string, token?: string) => Promise<GitHubIssue[]>;
//# sourceMappingURL=issue.service.d.ts.map