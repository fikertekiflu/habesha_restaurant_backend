import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { MenuItem } from '../models/MenuItem.js';
import { Table } from '../models/Table.js';
import { Setting } from '../models/Setting.js';

dotenv.config();

const seedData = async () => {
  await connectDB();

  if (mongoose.connection.readyState !== 1) {
    console.log('Skipping seed because MongoDB is not connected.');
    process.exit(1);
  }

  console.log('🌱 Starting Database Seeder...');

  // 1. Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    MenuItem.deleteMany({}),
    Table.deleteMany({}),
    Setting.deleteMany({}),
  ]);

  console.log('🧹 Cleaned existing database collections.');

  // 2. Create Staff Users
  const users = await User.create([
    { name: 'Abebe (Admin)', username: 'admin', role: 'admin', pin: '2222', phone: '+251911000001' },
    { name: 'Selam (Manager)', username: 'manager', role: 'manager', pin: '9999', phone: '+251911000002' },
    { name: 'Dawit (Waiter)', username: 'waiter', role: 'waiter', pin: '1111', phone: '+251911000003' },
    { name: 'Chef Almaz (Kitchen)', username: 'kitchen', role: 'kitchen', pin: '4444', phone: '+251911000004' },
    { name: 'Hanna (Cashier)', username: 'cashier', role: 'cashier', pin: '5555', phone: '+251911000005' },
    { name: 'Kassahun (Driver)', username: 'driver', role: 'driver', pin: '3333', phone: '+251911000006' },
  ]);
  console.log(`👤 Created ${users.length} staff accounts with Usernames: admin, waiter, kitchen, cashier, driver (Password: 2222, 1111, 4444, 5555, 3333)`);

  // 3. Create Categories
  const catTraditional = await Category.create({
    name: { en: 'Traditional Foods', am: 'የባህል ምግቦች' },
    slug: 'traditional',
    icon: '🥘',
    order: 1,
  });

  const catFasting = await Category.create({
    name: { en: 'Fasting / Vegan', am: 'የጾም ምግቦች' },
    slug: 'fasting',
    icon: '🥗',
    order: 2,
  });

  const catGrills = await Category.create({
    name: { en: 'Burgers & Grills', am: 'በርገር እና ጥብስ' },
    slug: 'grills',
    icon: '🍔',
    order: 3,
  });

  const catDrinks = await Category.create({
    name: { en: 'Hot & Cold Drinks', am: 'መጠጦች' },
    slug: 'drinks',
    icon: '☕',
    order: 4,
  });

  console.log('📂 Created bilingual menu categories.');

  // 4. Create Menu Items
  await MenuItem.create([
    {
      name: { en: 'Special Kitfo', am: 'ልዩ ክትፎ' },
      description: {
        en: 'Minced lean beef seasoned with spiced butter (niter kibbeh) and mitmita, served with kocho and ayib.',
        am: 'በቅቤ እና በሚጥሚጣ የተዘጋጀ የከብት ስጋ ከቆጮ እና ከአይብ ጋር።',
      },
      price: 550,
      category: catTraditional._id,
      spiceLevel: 'Medium',
      isFasting: false,
      prepTimeMinutes: 15,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: { en: 'Doro Wat Special', am: 'ልዩ ዶሮ ወጥ' },
      description: {
        en: 'Traditional rich chicken stew simmered in authentic berbere spices and clarified butter, served with hard-boiled egg.',
        am: 'በባህላዊ የበርበሬ ቅመም እና ቅቤ የተዘጋጀ ምርጥ የዶሮ ወጥ ከእንቁላል ጋር።',
      },
      price: 650,
      category: catTraditional._id,
      spiceLevel: 'Spicy',
      isFasting: false,
      prepTimeMinutes: 20,
      imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: { en: 'Beef Tibs', am: 'የበሬ ጥብስ' },
      description: {
        en: 'Tender cubed beef sautéed with onions, garlic, fresh rosemary, and jalapeño peppers.',
        am: 'በሽንኩርት፣ በነጭ ሽንኩርት፣ በእርጥብ ሮዝመሪ እና በቃሪያ የተጠበሰ የከብት ስጋ።',
      },
      price: 480,
      category: catGrills._id,
      spiceLevel: 'Mild',
      isFasting: false,
      prepTimeMinutes: 12,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: { en: 'Shiro Tegabino', am: 'ሽሮ ተጋቢኖ' },
      description: {
        en: 'Slow-cooked spiced chickpea stew bubbling in an earthenware clay pot, served with fresh injera.',
        am: 'በባህላዊ የሸክላ ድስት የሚፈላ ጣፋጭ የሽሮ ወጥ።',
      },
      price: 200,
      category: catFasting._id,
      spiceLevel: 'Medium',
      isFasting: true,
      prepTimeMinutes: 10,
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: { en: 'Fasting Beyaynetu', am: 'የጾም በያይነቱ' },
      description: {
        en: 'Platter of colorful vegan stews: yellow split peas, red lentils, collard greens, beetroot, and cabbage.',
        am: 'የተለያዩ የጾም ወጦች ክክ፣ ምስር፣ ጎመን፣ ቀይ ስር እና ጥቅል ጎመን በኢንጀራ ላይ።',
      },
      price: 260,
      category: catFasting._id,
      spiceLevel: 'Mild',
      isFasting: true,
      prepTimeMinutes: 10,
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: { en: 'Special House Beef Burger', am: 'ስፔሻል የበሬ በርገር' },
      description: {
        en: 'Grilled homemade beef patty, melted cheddar cheese, fresh lettuce, tomato, caramelized onions, with crispy fries.',
        am: 'የተጠበሰ የከብት ስጋ ፓቲ፣ ቺዝ፣ ሰላጣ፣ ቲማቲም እና ጥብስ ድንች።',
      },
      price: 320,
      category: catGrills._id,
      spiceLevel: 'None',
      isFasting: false,
      prepTimeMinutes: 15,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: { en: 'Special Mango & Avocado Spris', am: 'ስፔሻል ማንጎ እና አቮካዶ ስፕሪስ' },
      description: {
        en: 'Layered fresh tropical mango and avocado smoothie served with a fresh lime wedge.',
        am: 'ትኩስ የተጨመቀ የማንጎ እና የአቮካዶ ልዩ ጭማቂ።',
      },
      price: 120,
      category: catDrinks._id,
      spiceLevel: 'None',
      isFasting: true,
      prepTimeMinutes: 5,
      imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: { en: 'Traditional Coffee Ceremony', am: 'የሀበሻ ቡና በጀበና' },
      description: {
        en: 'Authentic roasted and freshly brewed Ethiopian coffee served in traditional finjal with popcorn.',
        am: 'በትኩሱ የተቆላ እና በጀበና የፈላ ጣፋጭ ቡና ከፈንዲሻ ጋር።',
      },
      price: 60,
      category: catDrinks._id,
      spiceLevel: 'None',
      isFasting: true,
      prepTimeMinutes: 8,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    },
  ]);

  console.log('🍲 Created sample Ethiopian dishes in ETB with English & Amharic translations.');

  // 5. Create Tables
  const tableData = [];
  for (let i = 1; i <= 16; i++) {
    tableData.push({
      tableNumber: i,
      zone: i <= 10 ? 'Indoor' : 'Terrace',
      capacity: i % 4 === 0 ? 6 : 4,
      status: 'available',
    });
  }
  await Table.create(tableData);
  console.log('🪑 Created 16 dining tables across Indoor and Terrace zones.');

  // 6. Create Restaurant Settings
  await Setting.create({
    name: {
      en: 'Habesha',
      am: 'ሐበሻ',
    },
    intro: {
      en: 'Ethiopian plates from the mitad and the grill — order for delivery or from your table.',
      am: 'ከምድጃና ከግሪል የሚመጡ የሐበሻ ምግቦች — ለደሊቨሪ ወይም ከጠረጴዛዎ ይዘዙ።',
    },
    wifiName: 'Habesha_Guest',
    wifiPass: 'Habesha2026',
    banks: [
      {
        bankName: 'Commercial Bank of Ethiopia (CBE)',
        accountName: 'Habesha Restaurant',
        accountNumber: '1000123456789',
      },
      {
        bankName: 'Awash Bank',
        accountName: 'Habesha Restaurant',
        accountNumber: '0132087654321',
      },
    ],
    telebirrMerchantCode: '887766',
    telebirrMerchantName: 'HABESHA',
    tablesCount: 16,
    directKitchenRouting: false,
  });

  console.log('⚙️ Created restaurant payment & WiFi settings.');
  console.log('✅ Seeding complete!');
  process.exit(0);
};

seedData().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
