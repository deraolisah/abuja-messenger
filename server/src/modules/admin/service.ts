// server/src/modules/admin/service.ts
import mongoose, { Types } from "mongoose";
import { AppError } from "../../middleware/errors.js";
import { User } from "../../models/User.js";
import { RiderProfile } from "../../models/RiderProfile.js";
import { hashPassword } from "../auth/tokens.js";

async function supportsTransactions(): Promise<boolean> {
  const hello = await mongoose.connection.db?.admin().command({ hello: 1 });
  return Boolean(hello?.setName);
}


export async function createRider(input: {
  adminId: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  plateNumber: string;
  vehicleSlug: string;
  licenseNumber?: string;
  licenseExpiryAt?: string;
}) {
  const email = input.email.toLowerCase();
  const username = input.username.toLowerCase();

  // Pre-check for clean errors (before the transaction, so we fail fast)
  if (await User.exists({ email })) {
    throw new AppError(409, "EMAIL_IN_USE", "An account with that email already exists.");
  }
  if (await User.exists({ username })) {
    throw new AppError(409, "USERNAME_TAKEN", "That username is already taken.");
  }

  const transactional = await supportsTransactions();
  if (transactional) {
    // use session flow
    const session = await mongoose.startSession();
    session.startTransaction();



  try {
    const user = new User({
      name: input.name,
      username,
      email,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      role: "rider",
      riderVerificationStatus: "active",
      authProviders: ["local"],
    });
    await user.save({ session });

    await RiderProfile.create(
      [
        {
          userId: user._id,
          plateNumber: input.plateNumber.toUpperCase(),
          vehicleSlug: input.vehicleSlug,
          licenseNumber: input.licenseNumber ?? null,
          licenseExpiryAt: input.licenseExpiryAt ? new Date(input.licenseExpiryAt) : null,
          status: "active",
          createdBy: new Types.ObjectId(input.adminId),
          rating: 5,
          totalDeliveries: 0,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    // Return a summary
    return {
      user: {
        id: String(user._id),
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      message:
        "Rider account created. Share the email and initial password with them; " +
        "they should change it on first login.",
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }

    } else {
    // create User; if RiderProfile fails, delete the user
  }
}



export async function suspendRider(userId: string, reason: string) {
  const profile = await RiderProfile.findOne({ userId });
  if (!profile) throw new AppError(404, "NOT_FOUND", "Rider profile not found.");
  if (profile.status === "suspended") {
    throw new AppError(409, "ALREADY_SUSPENDED", "This rider is already suspended.");
  }

  profile.status = "suspended";
  profile.suspendedReason = reason;
  await profile.save();

  await User.updateOne(
    { _id: userId },
    { $set: { riderVerificationStatus: "suspended" } },
  );

  return { ok: true, message: "Rider suspended." };
}

export async function reactivateRider(userId: string) {
  const profile = await RiderProfile.findOne({ userId });
  if (!profile) throw new AppError(404, "NOT_FOUND", "Rider profile not found.");
  if (profile.status === "active") {
    throw new AppError(409, "ALREADY_ACTIVE", "This rider is already active.");
  }

  profile.status = "active";
  profile.suspendedReason = null;
  await profile.save();

  await User.updateOne(
    { _id: userId },
    { $set: { riderVerificationStatus: "active" } },
  );

  return { ok: true, message: "Rider reactivated." };
}


export async function listRiders() {
  // const profiles = await RiderProfile.find()
  //   .populate("userId", "name username email phone avatarUrl riderVerificationStatus")
  //   .sort({ createdAt: -1 })
  //   .lean();
  // return profiles;

  const profiles = await RiderProfile.find({ userId: { $ne: null } })
    .populate<{ userId: { _id: Types.ObjectId; name: string; username: string; email: string; phone?: string; avatarUrl?: string; riderVerificationStatus: string } }>(
      "userId",
      "name username email phone avatarUrl riderVerificationStatus",
    )
    .sort({ createdAt: -1 })
    .lean();

  return profiles.filter((p) => p.userId != null);
}