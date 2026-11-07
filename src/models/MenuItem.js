import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true, trim: true },
      am: { type: String, required: true, trim: true },
    },
    description: {
      en: { type: String, default: '', trim: true },
      am: { type: String, default: '', trim: true },
    },
    price: {
      type: Number,
      required: [true, 'Price in ETB is required'],
      min: [0, 'Price must be positive'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    spiceLevel: {
      type: String,
      enum: ['None', 'Mild', 'Medium', 'Spicy'],
      default: 'None',
    },
    isFasting: {
      type: Boolean,
      default: false, // Fasting / Vegan (የጾም)
    },
    allergens: {
      type: [String],
      default: [],
    },
    prepTimeMinutes: {
      type: Number,
      default: 15,
    },
  },
  { timestamps: true }
);

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
