import axios from "axios";
export const fetchIssues = async (query) => {
    const response = await axios.get("https://api.github.com/search/issues", {
        params: {
            q: query,
            per_page: 100
        },
        headers: {
            Accept: "application/vnd.github+json"
        }
    });
    return response.data.items;
};
//# sourceMappingURL=issue.service.js.map