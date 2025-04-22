import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required(),
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string()
    .min(8)
    .max(30)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"))
    .message(
      "Password must contain at least one uppercase letter, one lowercase letter, and one digit"
    )
    .required(),
})