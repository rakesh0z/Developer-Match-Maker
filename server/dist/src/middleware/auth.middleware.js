import jwt from "jsonwebtoken";
const authMiddleware = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: "Unauthorized" });
    }
};
export default authMiddleware;
//# sourceMappingURL=auth.middleware.js.map