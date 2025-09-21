const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const usermodel = require("../model/user-model");
const portalmodel = require("../model/portal-model");
const mongoose = require("mongoose");
const CombinedAuth = require("../middleware/Auth");
const { parsePhoneNumberFromString } = require("libphonenumber-js");
const { sendMail } = require("./mailer");
const otpGenerator = require("otp-generator");
const user_router = express.Router();
const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

// GET all users

user_router.get("/", CombinedAuth, async (req, res, next) => {
  try {
    const users = await usermodel.find().select("-password", "-portal");
    return res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
});

// ✅ Update User Route
// user_router.post("/signup", async (req, res, next) => {
//   const { email, password, firstname, lastname, phone, countryCode } = req.body;

//   try {
//     // ✅ Check missing fields dynamically
//     const requiredFields = { firstname, lastname, email, password, phone, countryCode };
//     const missingFields = Object.keys(requiredFields).filter((field) => !requiredFields[field]);

//     if (missingFields.length > 0) {
//       return res.status(400).json({
//         message: `Missing required field(s): ${missingFields.join(", ")}`,
//       });
//     }

//     // ✅ Validate phone
//     const fullPhone = `${countryCode}${phone}`;
//     const phoneNumber = parsePhoneNumberFromString(fullPhone);
//     if (!phoneNumber || !phoneNumber.isValid()) {
//       return res.status(400).json({ message: "Invalid phone number" });
//     }

//     // ✅ Check if user already exists
//     const existingUser = await usermodel.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "User email already exists" });
//     }

//     // ✅ Create portal if not exists
//     const portalNameRaw = email.split("@")[0];
//     const portalName = slugify(portalNameRaw);

//     let portal = await portalmodel.findOne({ portalName });
//     if (!portal) {
//       const slug = slugify(portalName);
//       portal = new portalmodel({ portalName, slug, users: [] });
//       await portal.save();
//     }

//     // ✅ Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // ✅ Create user
//     const newUser = new usermodel({
//       firstname,
//       lastname,
//       phone,
//       countryCode,
//       email,
//       password: hashedPassword,
//       portal: portal._id,
//     });

//     await newUser.save();

//     // ✅ Link user to portal as admin
//     if (!portal.users.some((u) => u.userId.toString() === newUser._id.toString())) {
//       portal.users.push({ userId: newUser._id, role: "admin" });
//       await portal.save();
//     }

//     // ✅ Generate token
//     const tokenPayload = {
//       id: newUser._id,
//       email: newUser.email,
//       portalId: portal._id,
//       role: "admin",
//     };

//     const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, { expiresIn: "1d" });
//     await sendMail({
//       to: user.email,
//       subject: "Sign up Notification",
//       username: user.firstname || user.email,
//       text: "Welcome,You have successfully signed up your CRM account.",
//     });
//     return res.status(201).json({
//       message: "User and portal created successfully",
//       token,
//       user: {
//         id: newUser._id,
//         email: newUser.email,
//         firstname: newUser.firstname,
//         lastname: newUser.lastname,
//         phone: newUser.phone,
//         countryCode: newUser.countryCode,
//         portalId: portal._id,
//       },
//       portal: {
//         id: portal._id,
//         name: portal.portalName,
//         slug: portal.slug,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// });
user_router.post("/signup", async (req, res, next) => {
  const { email, password, firstname, lastname, phone, countryCode } = req.body;

  try {
    // ✅ Check missing fields dynamically
    const requiredFields = { firstname, lastname, email, password, phone, countryCode };
    const missingFields = Object.keys(requiredFields).filter((field) => !requiredFields[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required field(s): ${missingFields.join(", ")}`,
      });
    }

    // ✅ Validate phone
    const fullPhone = `${countryCode}${phone}`;
    const phoneNumber = parsePhoneNumberFromString(fullPhone);
    if (!phoneNumber || !phoneNumber.isValid()) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    // ✅ Check if user already exists
    const existingUser = await usermodel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User email already exists" });
    }

    // ✅ Create portal if not exists
    const portalNameRaw = email.split("@")[0];
    const portalName = slugify(portalNameRaw);

    let portal = await portalmodel.findOne({ portalName });
    if (!portal) {
      portal = new portalmodel({ portalName, slug: portalName, users: [] });
      await portal.save();
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user
    const newUser = new usermodel({
      firstname,
      lastname,
      phone,
      countryCode,
      email,
      password: hashedPassword,
      portal: portal._id,
    });

    await newUser.save();

    // ✅ Link user to portal as admin
    if (!portal.users.some((u) => u.userId.toString() === newUser._id.toString())) {
      portal.users.push({ userId: newUser._id, role: "admin" });
      await portal.save();
    }

    // ✅ Generate token
    const tokenPayload = {
      id: newUser._id,
      email: newUser.email,
      portalId: portal._id,
      role: "admin",
    };

    const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, { expiresIn: "1d" });

    // ✅ Send welcome email
    await sendMail({
      to: newUser.email,
      subject: "Sign up Notification",
      username: newUser.firstname || newUser.email,
      text: "Welcome! You have successfully signed up for your CRM account.",
    });

    return res.status(201).json({
      message: "User and portal created successfully",
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        phone: newUser.phone,
        countryCode: newUser.countryCode,
        portalId: portal._id,
      },
      portal: {
        id: portal._id,
        name: portal.portalName,
        slug: portal.slug,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE - Delete user
user_router.delete("/:id", CombinedAuth, async (req, res, next) => {
  const id = req.params.id;

  try {
    const user = await usermodel.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Removed successfully" });
  } catch (err) {
    next(err);
  }
});

// POST - Login
user_router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await usermodel.findOne({ email }).populate("portal");
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const tokenPayload = {
      userId: user._id,
      email: user.email,
      portalId: user.portal?._id,
      portalName: user.portal?.name,
    };

    const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });

    // ✅ Send login email
    await sendMail({
      to: user.email,
      subject: "Login Notification",
      username: user.firstname || user.email,
      text: "You have successfully logged into your CRM account.",
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: `${user.firstname} ${user.lastname}`,
      },
      portal: {
        id: user.portal._id,
        name: user.portal.name,
        slug: user.portal.slug,
      },
    });
  } catch (err) {
    next(err);
  }
});
// user_router.post("/login", async (req, res, next) => {
//   const { email, password } = req.body;

//   try {
//     const user = await usermodel.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: "Invalid email" });
//     }

//     const isPasswordCorrect = await bcrypt.compare(password, user.password);
//     if (!isPasswordCorrect) {
//       return res.status(400).json({ message: "Invalid password" });
//     }

//     const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
//       expiresIn: "1d",
//     });

//     return res.status(200).json({
//       message: "Login successfully",
//       token,
//       id: user._id,
//     });
//   } catch (err) {
//     next(err);
//   }
// });

// GET - Get user by ID

user_router.post("/portal/:portalId/add-user", async (req, res) => {
  try {
    const { portalId } = req.params;
    const { userId, role } = req.body; // role: "admin" or "user"

    const portal = await Portal.findById(portalId);
    if (!portal) return res.status(404).json({ error: "Portal not found" });

    // Check if user is already in portal
    const existingUserIndex = portal.users.findIndex((u) => u.userId.toString() === userId);

    if (existingUserIndex >= 0) {
      // Update role
      portal.users[existingUserIndex].role = role;
    } else {
      // Add new user
      portal.users.push({ userId, role });
    }

    await portal.save();

    // Also update user.portalId if needed
    await User.findByIdAndUpdate(userId, { portalId });

    res.json({ message: "User added/updated in portal", portal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add/update user" });
  }
});

// user_router.post("/generateOTP", async (req, res) => {
//   try {
//     debugger;
//     req.app.locals.OTP = await otpGenerator.generate(6, {
//       lowerCaseAlphabets: false,
//       upperCaseAlphabets: false,
//       specialChars: false,
//     });
//     res.status(201).json({ code: req.app.locals.OTP });
//   } catch (error) {
//     console.error("Generate OTP Error:", error);
//     res.status(500).json({ error: "Failed to generate OTP" });
//   }
// });

user_router.post("/generateOTP", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const user = await usermodel.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User with this email not found" });
    }
    // Generate OTP
    const OTP = otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    // Store OTP temporarily in app.locals (better: use DB or cache)
    req.app.locals.OTP = OTP;

    // Send email
    await sendMail({
      to: email,
      subject: "Your OTP Code",
      username: email,
      text: `Your OTP code is ${OTP}. It will expire shortly.`,
    });

    console.log("OTP Generated:", OTP);

    // ✅ Return OTP to frontend (if needed for testing)
    // For production, avoid sending OTP back in response!
    return res.status(201).json({ msg: "OTP sent successfully", code: OTP });
  } catch (error) {
    console.error("Generate OTP Error:", error);
    return res.status(500).json({ error: "Failed to generate OTP" });
  }
});

user_router.get("/verifyOTP", async (req, res) => {
  try {
    const { code } = req.query;
    if (parseInt(req.app.locals.OTP) === parseInt(code)) {
      req.app.locals.OTP = null; // reset OTP after success
      req.app.locals.resetSession = true; // start session for reset password
      return res.status(201).json({ msg: "Verified successfully!" });
    }
    return res.status(400).json({ error: "Invalid OTP" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ error: "OTP verification failed" });
  }
});
user_router.get("/createResetSession", async (req, res) => {
  if (req.app.locals.resetSession) {
    return res.status(201).json({ flag: req.app.locals.resetSession });
  }
  return res.status(440).json({ error: "Session expired!" });
});

user_router.put("/resetPassword", async (req, res) => {
  try {
    if (!req.app.locals.resetSession) {
      return res.status(440).json({ error: "Session expired!" });
    }

    const { email, password } = req.body;

    // find user
    const user = await usermodel.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "email not found" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // update password
    await usermodel.updateOne({ email: user.email }, { $set: { password: hashedPassword } });

    req.app.locals.resetSession = false; // clear session after success
    return res.status(201).json({ msg: "Password updated successfully!" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ error: "Unable to reset password" });
  }
});
user_router.get("/:id", CombinedAuth, async (req, res, next) => {
  const id = req.params.id;

  // ✅ Check if the id is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    const user = await usermodel.findById(id).select("-password", "-portal");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    debugger;
    return res.status(200).json({ user });
  } catch (err) {
    next(err); // Pass error to global handler
  }
});
user_router.put("/:id", CombinedAuth, async (req, res, next) => {
  const id = req.params.id;
  const { firstname, lastname, email, phone, countryCode, password } = req.body;

  if (
    (firstname && firstname.trim() === "") ||
    (lastname && lastname.trim() === "") ||
    (email && email.trim() === "") ||
    (phone && phone.trim() === "") ||
    (countryCode && countryCode.trim() === "") ||
    (password && password.trim() === "")
  ) {
    return res.status(422).json({ message: "Invalid inputs: fields cannot be empty strings" });
  }

  const updateData = {};
  if (firstname) updateData.firstname = firstname;
  if (lastname) updateData.lastname = lastname;
  if (email) updateData.email = email;
  if (phone && countryCode) {
    const fullPhone = `${countryCode}${phone}`;
    const phoneNumber = parsePhoneNumberFromString(fullPhone);
    if (!phoneNumber || !phoneNumber.isValid()) {
      return res.status(400).json({ message: "Invalid phone number" });
    }
    updateData.phone = phone;
    updateData.countryCode = countryCode;
  }
  if (password) updateData.password = bcrypt.hashSync(password, 10);

  try {
    const user = await usermodel.findByIdAndUpdate(id, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return res.status(200).json({
      message: "Updated successfully",
      user: userWithoutPassword,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = user_router;
