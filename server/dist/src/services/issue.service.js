import { fetchIssuesCached } from "./githubCache.service.js";
export const fetchIssues = async (query, token) => {
    return fetchIssuesCached(query, token);
};
//# sourceMappingURL=issue.service.js.map