const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Register User
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please add all fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Helper to get OAuth2 Client
const getOAuth2Client = () => {
  const { OAuth2Client } = require("google-auth-library");
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  // Construct redirect URI based on backend URL or environment
  const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
  const redirectUri = `${backendUrl.replace(/\/+$/, '')}/api/auth/google/callback`;

  return new OAuth2Client(googleClientId, googleClientSecret, redirectUri);
};

// 1. Get Google OAuth Redirect URL
exports.getGoogleAuthUrl = (req, res) => {
  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return res.status(500).json({ message: "GOOGLE_CLIENT_ID is not configured on server" });
    }

    const oAuth2Client = getOAuth2Client();
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      prompt: 'select_account'
    });

    res.json({ url: authorizeUrl });
  } catch (error) {
    console.error("Error generating Google Auth URL:", error);
    res.status(500).json({ message: "Failed to generate Google Auth URL", error: error.message });
  }
};

// 2. Handle Google OAuth Callback (Redirected back from Google)
exports.handleGoogleCallback = async (req, res) => {
  const { code } = req.query;
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  if (!code) {
    return res.redirect(`${clientUrl}?auth_error=No authorization code provided`);
  }

  try {
    const oAuth2Client = getOAuth2Client();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Fetch user profile using access token
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    if (!userinfoRes.ok) {
      throw new Error("Failed to fetch user profile from Google");
    }

    const payload = await userinfoRes.json();
    const { email, name, picture } = payload;

    if (!email) {
      return res.redirect(`${clientUrl}?auth_error=Email not provided by Google account`);
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        username: name || email.split("@")[0],
        email,
        password: hashedPassword,
        profilePic: picture || null,
      });
    } else if (!user.profilePic && picture) {
      user.profilePic = picture;
      await user.save();
    }

    const token = generateToken(user._id);
    const userObj = encodeURIComponent(JSON.stringify({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic || null
    }));

    // Redirect to frontend with auth payload
    res.redirect(`${clientUrl}?auth_token=${token}&auth_user=${userObj}`);
  } catch (error) {
    console.error("Google Auth Callback Error:", error);
    res.redirect(`${clientUrl}?auth_error=${encodeURIComponent(error.message || "Google Authentication failed")}`);
  }
};

// Legacy/Pop-up API Google OAuth Login
exports.googleLogin = async (req, res) => {
  const { credential, email: bodyEmail, name: bodyName, picture: bodyPicture } = req.body;

  try {
    let email, name, picture;

    if (credential) {
      const { OAuth2Client } = require("google-auth-library");
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const client = new OAuth2Client(googleClientId);

      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });

      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else if (bodyEmail) {
      email = bodyEmail;
      name = bodyName;
      picture = bodyPicture;
    } else {
      return res.status(400).json({ message: "Missing Google credential or email payload" });
    }

    if (!email) {
      return res.status(400).json({ message: "Email not provided by Google account" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        username: name || email.split("@")[0],
        email,
        password: hashedPassword,
        profilePic: picture || null,
      });
    } else if (!user.profilePic && picture) {
      user.profilePic = picture;
      await user.save();
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic || null,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Google Auth Verification Error:", error);
    res.status(400).json({ message: "Google Authentication failed", error: error.message });
  }
};

// Logout User 
exports.logoutUser = (req, res) => {
  res.status(200).json({ message: "Logged out successfully. Client should delete the token." });
};
