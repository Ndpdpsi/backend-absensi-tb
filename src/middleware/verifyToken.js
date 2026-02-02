const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access token tidak ditemukan"
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: "Access token tidak valid atau sudah expired"
            });
        }

        req.user = decoded;
        next();
    });
};

module.exports = verifyToken;