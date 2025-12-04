/**
 * Seed script for Central Luzon warehouses/hubs
 * Run with: npx ts-node server/seeds/seed-warehouses.ts
 */

import mongoose from "mongoose";
import { Warehouse } from "../models/Warehouse";

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/agrireach";

const CENTRAL_LUZON_HUBS = [
  {
    name: "Pampanga Regional Hub",
    code: "HUB-PAM",
    type: "regional_hub" as const,
    address: {
      line1: "Brgy. Del Pilar, MacArthur Highway",
      city: "San Fernando",
      province: "Pampanga",
      postal_code: "2000",
      country: "Philippines",
      coordinates: {
        latitude: 15.0286,
        longitude: 120.6876,
      },
    },
    coverage_areas: ["Pampanga", "Tarlac", "Angeles City", "Mabalacat", "Clark"],
    operating_hours: {
      open: "06:00",
      close: "20:00",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
    daily_capacity: 1000,
    phone: "+63 45 123 4567",
    email: "pampanga@agrireach.ph",
    is_active: true,
    connected_hubs: [], // Will be updated after all hubs are created
  },
  {
    name: "Bulacan Regional Hub",
    code: "HUB-BUL",
    type: "regional_hub" as const,
    address: {
      line1: "Brgy. Longos, MacArthur Highway",
      city: "Malolos",
      province: "Bulacan",
      postal_code: "3000",
      country: "Philippines",
      coordinates: {
        latitude: 14.8433,
        longitude: 120.8108,
      },
    },
    coverage_areas: ["Bulacan", "Meycauayan", "Marilao", "Bocaue", "Plaridel", "Baliwag"],
    operating_hours: {
      open: "06:00",
      close: "20:00",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
    daily_capacity: 1200,
    phone: "+63 44 123 4567",
    email: "bulacan@agrireach.ph",
    is_active: true,
    connected_hubs: [],
  },
  {
    name: "Nueva Ecija Regional Hub",
    code: "HUB-NE",
    type: "regional_hub" as const,
    address: {
      line1: "Brgy. Sumacab Este, Maharlika Highway",
      city: "Cabanatuan",
      province: "Nueva Ecija",
      postal_code: "3100",
      country: "Philippines",
      coordinates: {
        latitude: 15.4860,
        longitude: 120.9690,
      },
    },
    coverage_areas: ["Nueva Ecija", "Aurora", "Cabanatuan", "San Jose", "Gapan", "Palayan"],
    operating_hours: {
      open: "06:00",
      close: "20:00",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
    daily_capacity: 800,
    phone: "+63 44 987 6543",
    email: "nuevaecija@agrireach.ph",
    is_active: true,
    connected_hubs: [],
  },
  {
    name: "Zambales Regional Hub",
    code: "HUB-ZAM",
    type: "regional_hub" as const,
    address: {
      line1: "Brgy. Old Cabalan, Rizal Avenue",
      city: "Olongapo",
      province: "Zambales",
      postal_code: "2200",
      country: "Philippines",
      coordinates: {
        latitude: 14.8294,
        longitude: 120.2828,
      },
    },
    coverage_areas: ["Zambales", "Bataan", "Olongapo", "Subic", "Iba", "San Antonio"],
    operating_hours: {
      open: "06:00",
      close: "20:00",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
    daily_capacity: 600,
    phone: "+63 47 123 4567",
    email: "zambales@agrireach.ph",
    is_active: true,
    connected_hubs: [],
  },
  {
    name: "NCR Sorting Center",
    code: "HUB-NCR",
    type: "sorting_center" as const,
    address: {
      line1: "Brgy. Bagong Pag-asa, EDSA",
      city: "Quezon City",
      province: "Metro Manila",
      postal_code: "1105",
      country: "Philippines",
      coordinates: {
        latitude: 14.6570,
        longitude: 121.0327,
      },
    },
    coverage_areas: [
      "Metro Manila", "NCR", "Quezon City", "Manila", "Makati", "Pasig", 
      "Taguig", "Mandaluyong", "San Juan", "Pasay", "Parañaque", 
      "Las Piñas", "Muntinlupa", "Marikina", "Caloocan", "Malabon", 
      "Navotas", "Valenzuela", "Pateros"
    ],
    operating_hours: {
      open: "00:00",
      close: "23:59", // 24/7 operation
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
    daily_capacity: 3000,
    phone: "+63 2 8123 4567",
    email: "ncr@agrireach.ph",
    is_active: true,
    connected_hubs: [],
  },
];

async function seedWarehouses() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n📦 Seeding warehouses...");
    
    // Clear existing warehouses (optional - comment out if you want to keep existing data)
    // await Warehouse.deleteMany({});
    // console.log("🗑️ Cleared existing warehouses");

    // Insert hubs
    const createdHubs: Record<string, mongoose.Types.ObjectId> = {};
    
    for (const hub of CENTRAL_LUZON_HUBS) {
      // Check if hub already exists
      const existing = await Warehouse.findOne({ code: hub.code });
      if (existing) {
        console.log(`⏭️ Hub ${hub.code} already exists, skipping...`);
        createdHubs[hub.code] = existing._id as mongoose.Types.ObjectId;
        continue;
      }

      const created = await Warehouse.create(hub);
      createdHubs[hub.code] = created._id as mongoose.Types.ObjectId;
      console.log(`✅ Created: ${hub.name} (${hub.code})`);
    }

    // Update connected hubs (all hubs connect to NCR sorting center)
    console.log("\n🔗 Updating hub connections...");
    const ncrId = createdHubs["HUB-NCR"];
    
    for (const [code, hubId] of Object.entries(createdHubs)) {
      if (code === "HUB-NCR") {
        // NCR connects to all regional hubs
        const allHubIds = Object.entries(createdHubs)
          .filter(([c]) => c !== "HUB-NCR")
          .map(([, id]) => id);
        await Warehouse.findByIdAndUpdate(hubId, { connected_hubs: allHubIds });
      } else {
        // Regional hubs connect to NCR
        await Warehouse.findByIdAndUpdate(hubId, { connected_hubs: [ncrId] });
      }
    }
    console.log("✅ Hub connections updated");

    // Summary
    console.log("\n📊 Warehouse Summary:");
    const warehouses = await Warehouse.find({}).lean();
    console.table(
      warehouses.map((w) => ({
        Name: w.name,
        Code: w.code,
        Type: w.type,
        City: w.address.city,
        Province: w.address.province,
        Capacity: w.daily_capacity,
        Active: w.is_active ? "Yes" : "No",
      }))
    );

    console.log("\n✅ Warehouse seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding warehouses:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run if called directly
if (require.main === module) {
  seedWarehouses()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedWarehouses, CENTRAL_LUZON_HUBS };

