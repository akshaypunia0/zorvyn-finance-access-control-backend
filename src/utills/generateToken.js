import dotenv from "dotenv"
dotenv.config()

import jwt from "jsonwebtoken"

const generateToken = (user, res) => {

    const payload = {
        id: user.id,
        email: user.email,
        role: user.role
    }

    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    )

    res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return token

}

export default generateToken