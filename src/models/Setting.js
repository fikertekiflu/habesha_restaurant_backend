import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true },
});

const settingSchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, default: 'Our Restaurant' },
      am: { type: String, default: 'የእኛ ሬስቶራንት' },
    },
    intro: {
      en: { type: String, default: 'Authentic flavors, prepared fresh with love.' },
      am: { type: String, default: 'ጣፋጭ እና ትኩስ ምግቦች በፍቅር ተዘጋጅተው።' },
    },
    wifiName: { type: String, default: 'Restaurant_Guest_WiFi' },
    wifiPass: { type: String, default: 'Welcome2026' },
    banks: [bankAccountSchema],
    telebirrMerchantCode: { type: String, default: '' },
    telebirrMerchantName: { type: String, default: '' },
    tablesCount: { type: Number, default: 16 },
    directKitchenRouting: { type: Boolean, default: false }, // false = requires waiter approval
  },
  { timestamps: true }
);

export const Setting = mongoose.model('Setting', settingSchema);
