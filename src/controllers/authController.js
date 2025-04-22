import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { BadRequestError, NotFoundError } from "../utils/errorTypes.js";
import { sendEmail } from "../utils/sendEmail.js";
import { registerSchema } from "../validators/registerSchema.js";
import { withTransaction } from "../utils/withTransaction.js";
import { Token } from "../models/Token.js";
import { generateAccessToken, generatePasswordResetToken, generateRefreshToken, generateVerificationToken } from "../utils/generateToken.js";
import { verifyToken } from "../utils/jwt.js";

/**
 * @desc Register a new user
 * @route POST /api/v1/auth/register
 * @access Public
 */
export const registerUser = asyncHandler(async(req, res, next) => {
  // Validate input fields
  const {error, value} = registerSchema.validate(req.body, {abortEarly: false});
  if(error) throw new BadRequestError(error.details.map(err => err.message).join(","));
  const {name, email, password} = value;

  const user = await withTransaction(async(session) => {
    // Check if verified user already exist
    const user =  await User.findOne({email}).session(session);

    if(user && user.is_verified) throw new BadRequestError("Email already exist");

    let newUser;
    if(user && !user.is_verified){
      user.name = name;
      user.password = password;
      await user.save({session});
      newUser = user;

      // delete existing verification tokens
      await Token.deleteMany({user_id: user._id, type: "verification"});
    }else{
      newUser = new User({
        name,
        email,
        password
      });
      await newUser.save({session});
    }
  
    // Generate Token
    const tokenRecord = new Token({
      user_id: newUser._id, 
      type: "verification",
      token: generateVerificationToken(newUser._id, newUser.name, newUser.role),
      expiresAt: Token.getExpirationTime("verification")
    });

    await tokenRecord.save({session});

    // Send email verification
    await sendEmail({
      to: email,
      subject: "Email verification",
      html: `<p>http://localhost:5174/email-verification?token=${tokenRecord.token}</p>`
    });

    return newUser;
  })

  res.status(201).json({
    success: true,
    message: "User registered successfully, Check your email for OTP verification"
  });
});

/**
 * @desc Login user and get JWT token
 * @route POST /api/v1/auth/login
 * @access Public
 */
export const loginUser = asyncHandler(async(req, res, next) => {
  const {email, password} = req.body;

  //Validate input fields
  if(!email || !password) throw new BadRequestError("All fields are required");

  const result = await withTransaction(async(session) => {
    //Check if user exists
    const user = await User.findOne({email}).session(session);
    if(!user || !user.is_verified) throw new BadRequestError("Invalid email or password");

    const isMatch = await user.validatePassword(password);
    if(!isMatch) throw new BadRequestError("Invalid email or password");

    const accessToken = generateAccessToken(user._id, user.name, user.role);
    const refreshToken = generateRefreshToken(user._id, user.name, user.role);

    const tokenRecord = await new Token({
      user_id: user._id,
      type: "refresh_token",
      token: refreshToken,
      expiresAt: Token.getExpirationTime("refresh_token")
    });

    await tokenRecord.save({session});

    return {
      success: true,
      message: "Successfully logged in",
      accessToken,
      refreshToken

    }
  });

  res.status(200).json(result);
});


/**
 * @desc User account verification
 * @route POST /api/v1/auth/verify/email?token=
 * @access Public
 */
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.query;
  const decodedToken = verifyToken(token); 

  let attempt = 0;
  const MAX_RETRIES = 3;

  while (attempt < MAX_RETRIES) {
    try {
      const result = await withTransaction(async (session) => {
        const tokenRecord = await Token.findOne({ token, type: "verification" }).session(session);
        if (!tokenRecord) throw new BadRequestError("Invalid Token");

        const user = await User.findById(tokenRecord.user_id).session(session);
        if (!user) throw new BadRequestError("User not found");
        if (user.is_verified) throw new BadRequestError("User is already verified");

        user.is_verified = true;
        await user.save({ session });

        await Token.deleteOne({ _id: tokenRecord._id }).session(session);

        return {
          success: true,
          message: "User verified successfully",
        };
      });

      return res.status(200).json(result);
    } catch (err) {
      attempt++;
      if (
        err.message.includes("Write conflict") &&
        attempt < MAX_RETRIES
      ) {
        await new Promise(res => setTimeout(res, 100 * attempt)); // backoff
        continue;
      }
      throw err;
    }
  }
});


/**
 * @desc Request password reset link
 * @route POST /api/v1/auth/forgot_password
 * @access Public
 */
export const requestResetPassword = asyncHandler(async(req, res, next) => {
  const { email } = req.body;

  const result = await withTransaction(async(session) => {
    const user = await User.findOne({email, is_verified: true}).session(session);
    if (!user) throw new NotFoundError("User not found");

    await Token.deleteMany({user_id: user._id, type: "reset_password"}).session(session);

    const resetPasswordToken = new Token({
      user_id: user._id,
      type: "reset_password",
      token: generatePasswordResetToken(user._id, user.name, user.role),
      expiresAt: Token.getExpirationTime("reset_password")
    });

    await resetPasswordToken.save({session});

    // Send email verification
    await sendEmail({
      to: email,
      subject: "Reset Password Link",
      html: `<p>${resetPasswordToken.token}</p>`
    });

    return {
      success: true,
      message: "Reset password link sent to your email."
    }
  });
  return res.status(200).json(result);
});

/**
 * @desc Verify reset password token
 * @route GET /api/v1/auth/reset_password?token=
 * @access Public
 */
export const verifyResetPassword = asyncHandler(async(req, res, next) => {
  const { token } = req.query;

  if(!token) throw new BadRequestError('Token is missing')

  const decodedToken = verifyToken(token);
  if(decodedToken.type == "reset_password") throw new BadRequestError('Invalid token type');

  const tokenRecord = await Token.findOne({token, type: "reset_password"});
  if(!tokenRecord) throw new BadRequestError("Token is invalid or expired");

  return res.status(200).json({
    success: true,
    message: "Reset password token is valid",
    data: []
  });
});

/**
 * @desc Reset password
 * @route POST /api/v1/auth/reset_password
 * @access Public
 */
export const resetPassword = asyncHandler(async(req, res, next) => {
  const { newPassword, token } = req.body;

  if(!newPassword || !token) throw new BadRequestError("New password and token are required");

  const decodedToken = verifyToken(token);
  if(!decodedToken.type == "reset_password") throw new BadRequestError("Invalid token type");

  const result = await withTransaction(async(session) => {
    const tokenRecord = await Token.findOne({token, type: "reset_password"}).session(session);
    if(!tokenRecord) throw new BadRequestError("Token is invalid or expired");

    const user = await User.findById(tokenRecord.user_id).session(session);
    if(!user) throw new BadRequestError("User not found, token may be tampered");

    user.password = newPassword;
    await user.save({session});

    await Token.deleteOne({_id: tokenRecord._id}).session(session);

    return {
      success: true,
      message: "Password has been reset successfully"
    };
  });

  return res.status(200).json(result);  
});