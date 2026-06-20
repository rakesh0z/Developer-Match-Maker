import axios from "axios";
export const getUserRepos = async (accessToken) => {
    const response = await axios.get("https://api.github.com/user/repos", {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        params: {
            per_page: 100
        }
    });
    return response.data;
};
//# sourceMappingURL=github.service.js.map