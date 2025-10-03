import User from "../models/User.js";

export async function seedCEO() {
  try {
    const ceoEmail = process.env.CEO_EMAIL ;
    const ceoPassword = process.env.CEO_PASSWORD;

    const existing = await User.findOne({ email: ceoEmail });
    if (existing) {
      console.log("👑 CEO already exists:", existing.email);
      return;
    }

    const ceo = new User({
      name: "CEO",
      email: ceoEmail,
      password: ceoPassword, 
      role: "CEO",
    });

    await ceo.save();

    console.log("===== CEO Account Created =====");
    console.log("Email:", ceoEmail);
    console.log("Password:", ceoPassword);
    console.log("================================");
  } catch (err) {
    console.error("Error seeding CEO:", err);
  }
}
