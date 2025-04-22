  import mongoose from "mongoose";
  import bcrypt from "bcrypt";

  const userSchema = new mongoose.Schema({
    name:{
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [100, "Name cannot exceed 40 characters"],
      trim: true
    },
    email:{
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
  password:{
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
      ],
    },
    role:{
      type: String,
      required: true,
      enum: ["user","admin"], 
      default: "user"
    },
    is_verified:{
      type: Boolean,
      default: false
    }
  }, {timestamps: true}
  );

  //hash password before saving
  userSchema.pre('save', async function(next){
    if(!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next()
  });

  userSchema.methods.validatePassword = async function(password){
    return await bcrypt.compare(password, this.password);
  };

  export const User = mongoose.model("User", userSchema);