import { decode } from 'next-auth/jwt';

// Middleware to validate Next-Auth session
const validateNextAuthSession = async (req, res, next) => {
    try {
        // Get cookie name based on environment
        // const cookieName = process.env.NODE_ENV === 'production' 
        //   ? '__Secure-next-auth.session-token' 
        //   : 'next-auth.session-token';

        // console.log('Cookies received:', req.cookies);

        const cookieName = 'next-auth.session-token';

        // Get the session token from cookies
        const token = req.cookies[cookieName];
        console.log('next-auth.session-token from cookies: ', token);

        if (!token) {
            return res.status(401).json({
                message: 'Not authenticated'
            });
        }

        try {
            // Use next-auth's own JWT decode function to handle the token
            const decoded = await decode({
                token,
                secret: process.env.NEXTAUTH_SECRET
            });

            console.log('Decrypted session data:', decoded);
            if (!decoded) {
                return res.status(401).json({
                    message: 'Invalid session token'
                });
            }

            // Add user data to request
            req.user = {
                id: decoded.id || decoded.sub, // NextAuth might store as either id or sub
                email: decoded.email,
                name: decoded.name
            };

            next();
        } catch (e) {
            console.error('error:', e);
            return res.status(401).json({
                message: 'Invalid session token'
            });
        }

    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            message: 'Authentication failed: ' + error.message
        });
    }
};

export {
    validateNextAuthSession
};