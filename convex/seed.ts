import { mutation } from "./_generated/server";
import { enforceRole } from "./auth";

export default mutation({
  args: {},
  handler: async (ctx) => {
    let userId;
    try {
      const user = await enforceRole(ctx, ["manager"]);
      userId = user._id;
    } catch (e) {
      console.log("Seed bypass auth: attempting admin CLI seed execution");
      let seedUser = await ctx.db.query("users").filter(q => q.eq(q.field("role"), "manager")).first();
      if (!seedUser) {
        seedUser = await ctx.db.query("users").first();
      }
      if (!seedUser) {
        const seedUserId = await ctx.db.insert("users", {
          name: "Manager Admin",
          email: "manager@elfam.com",
          role: "manager",
          profileSetupComplete: true,
          joinedAt: Date.now()
        });
        seedUser = await ctx.db.get(seedUserId);
      }
      userId = seedUser!._id;
    }

    // 1. Seed/ensure supervisor profile is created
    let supervisorUser = await ctx.db.query("users").filter(q => q.eq(q.field("email"), "supervisor@elfam.com")).first();
    if (!supervisorUser) {
      await ctx.db.insert("users", {
        name: "Prof. Margaret Kamar",
        email: "supervisor@elfam.com",
        role: "supervisor",
        profileSetupComplete: true,
        joinedAt: Date.now()
      });
    }

    // 2. Wipe existing application data (do not wipe users or auth sessions/accounts)
    const tablesToClear = [
      "fields",
      "fieldApplications",
      "harvestRecords",
      "contracts",
      "deliveries",
      "feedInventory",
      "vetInventory",
      "tasks",
      "inventoryMovementsLegacy",
      "livestock",
      "livestockGroups",
      "productionRecords",
      "breedingServices",
      "pregnancyChecks",
      "birthEvents",
      "offspring",
      "soilTests",
      "incidents",
      "machinery",
      "machineryMaintenance",
      "rainfall",
      "financialTransactions",
      "requests",
    ];

    for (const table of tablesToClear) {
      const records = await ctx.db.query(table as any).collect();
      for (const r of records) {
        await ctx.db.delete(r._id);
      }
    }

    // 3. Seed Livestock
    const livestockIds = [];
    
    // Cattle: 20 cows
    const cattleNames = [
      "Moraa", "Amani", "Baraka", "Nduta", "Wanjiku", "Nyaboke", "Kendi", "Chepkoech",
      "Zola", "Benta", "Zawadi", "Halima", "Salma", "Furaha", "Upendo", "Subira",
      "Tumaini", "Neema", "Bahati", "Pendo"
    ];
    for (let i = 1; i <= 20; i++) {
      const tagNumber = `EL-LH-${i.toString().padStart(3, "0")}`;
      const name = cattleNames[i - 1];
      const breed = i % 2 === 0 ? "Holstein-Friesian" : "Ayrshire";
      const dateOfBirth = Date.now() - (3 + (i % 4)) * 365 * 24 * 60 * 60 * 1000;
      let status: "milking" | "dry" | "treatment" = "milking";
      if (i === 5) status = "dry";
      if (i === 8) status = "treatment";

      const id = await ctx.db.insert("livestock", {
        tagNumber,
        name,
        species: "cattle",
        breed,
        dateOfBirth,
        sex: "F",
        status,
        currentLactationNumber: 1 + (i % 3),
        lastBirthDate: Date.now() - (40 + (i % 50)) * 24 * 60 * 60 * 1000,
        sireInfo: "EL-SIRE-SUPERIOR-CATTLE",
        damTagNumber: `EL-DAM-C-${100 + i}`,
        notes: `Healthy dairy cow. breed line: ${breed}.`,
      });
      livestockIds.push({ id, tagNumber, species: "cattle", status });
    }

    // Goats: 5 dairy goats
    const goatNames = ["Mimi", "Kiki", "Sisi", "Nene", "Lulu"];
    for (let i = 1; i <= 5; i++) {
      const tagNumber = `EL-GT-${i.toString().padStart(3, "0")}`;
      const breed = i % 2 === 0 ? "Toggenburg" : "Saanen";
      const dateOfBirth = Date.now() - (2 + (i % 3)) * 365 * 24 * 60 * 60 * 1000;
      let status: "milking" | "dry" | "treatment" = "milking";
      if (i === 4) status = "dry";

      const id = await ctx.db.insert("livestock", {
        tagNumber,
        name: goatNames[i - 1],
        species: "goat",
        breed,
        dateOfBirth,
        sex: "F",
        status,
        currentLactationNumber: 1 + (i % 2),
        lastBirthDate: Date.now() - (30 + (i % 30)) * 24 * 60 * 60 * 1000,
        sireInfo: "EL-SIRE-SUPERIOR-GOAT",
        damTagNumber: `EL-DAM-G-${100 + i}`,
        notes: `Dairy goat registered at Elfam Station. breed line: ${breed}.`,
      });
      livestockIds.push({ id, tagNumber, species: "goat", status });
    }

    // Sheep: 3 sheep
    const sheepNames = ["Shaun", "Shirley", "Timmy"];
    for (let i = 1; i <= 3; i++) {
      const tagNumber = `EL-SH-${i.toString().padStart(3, "0")}`;
      const dateOfBirth = Date.now() - (1 + i) * 365 * 24 * 60 * 60 * 1000;

      const id = await ctx.db.insert("livestock", {
        tagNumber,
        name: sheepNames[i - 1],
        species: "sheep",
        breed: "Dorper",
        dateOfBirth,
        sex: "F",
        status: "dry",
        currentLactationNumber: 0,
        lastBirthDate: null,
        sireInfo: "EL-SIRE-DORPER-1",
        damTagNumber: `EL-DAM-S-${100 + i}`,
        notes: `Dorper sheep for meat and wool production tracking.`,
      });
      livestockIds.push({ id, tagNumber, species: "sheep", status: "dry" });
    }

    // 4. Seed Livestock Groups
    // Poultry flock
    const flockId = await ctx.db.insert("livestockGroups", {
      groupCode: "FLOCK-001",
      name: "Hy-Line Brown Layers",
      species: "poultry",
      breed: "Hy-Line Brown",
      status: "active",
      count: 250,
      dateAcquiredOrHatched: Date.now() - 180 * 24 * 60 * 60 * 1000,
      notes: "High productivity laying flock.",
    });

    // Bee hive
    await ctx.db.insert("livestockGroups", {
      groupCode: "HIVE-01",
      name: "Apis Mellifera Colony",
      species: "bees",
      breed: "Apis mellifera scutellata",
      status: "active",
      count: 1,
      dateAcquiredOrHatched: Date.now() - 365 * 24 * 60 * 60 * 1000,
      notes: "Kenya top-bar hive colony located near Valley View plots.",
    });

    // 5. Seed 30 days of production logs
    const today = new Date();
    for (let d = 30; d >= 1; d--) {
      const dateObj = new Date();
      dateObj.setDate(today.getDate() - d);
      const dateStr = dateObj.toISOString().split("T")[0];
      const timestamp = dateObj.getTime();

      for (const animal of livestockIds) {
        if (animal.status === "dry") continue;

        if (animal.species === "cattle") {
          const amAmt = parseFloat((12 + Math.sin(d + animal.tagNumber.charCodeAt(6)) * 4).toFixed(1));
          await ctx.db.insert("productionRecords", {
            livestockId: animal.id,
            type: "milk",
            amount: amAmt,
            session: "AM",
            date: dateStr,
            loggedBy: userId,
            loggedAt: timestamp + 6 * 60 * 60 * 1000,
            flagged: animal.status === "treatment",
          });

          const pmAmt = parseFloat((9 + Math.cos(d + animal.tagNumber.charCodeAt(6)) * 3).toFixed(1));
          await ctx.db.insert("productionRecords", {
            livestockId: animal.id,
            type: "milk",
            amount: pmAmt,
            session: "PM",
            date: dateStr,
            loggedBy: userId,
            loggedAt: timestamp + 16 * 60 * 60 * 1000,
            flagged: animal.status === "treatment",
          });
        } else if (animal.species === "goat") {
          const amAmt = parseFloat((2.0 + Math.sin(d + animal.tagNumber.charCodeAt(6)) * 0.5).toFixed(1));
          await ctx.db.insert("productionRecords", {
            livestockId: animal.id,
            type: "milk",
            amount: amAmt,
            session: "AM",
            date: dateStr,
            loggedBy: userId,
            loggedAt: timestamp + 6.5 * 60 * 60 * 1000,
            flagged: animal.status === "treatment",
          });

          const pmAmt = parseFloat((1.5 + Math.cos(d + animal.tagNumber.charCodeAt(6)) * 0.4).toFixed(1));
          await ctx.db.insert("productionRecords", {
            livestockId: animal.id,
            type: "milk",
            amount: pmAmt,
            session: "PM",
            date: dateStr,
            loggedBy: userId,
            loggedAt: timestamp + 16.5 * 60 * 60 * 1000,
            flagged: animal.status === "treatment",
          });
        }
      }

      // Daily egg counts for poultry
      const eggCount = Math.floor(210 + Math.sin(d) * 15 + Math.cos(d) * 10);
      await ctx.db.insert("productionRecords", {
        groupId: flockId,
        type: "eggs",
        amount: eggCount,
        date: dateStr,
        loggedBy: userId,
        loggedAt: timestamp + 18 * 60 * 60 * 1000,
        flagged: false,
      });
    }

    // Shearing wool records for sheep
    for (const animal of livestockIds) {
      if (animal.species === "sheep") {
        await ctx.db.insert("productionRecords", {
          livestockId: animal.id,
          type: "wool",
          amount: parseFloat((4.2 + (animal.tagNumber.charCodeAt(6) % 3)).toFixed(1)),
          date: today.toISOString().split("T")[0],
          loggedBy: userId,
          loggedAt: Date.now(),
          flagged: false,
        });
      }
    }

    // 6. Seed Treatments
    const cow8 = livestockIds.find(l => l.tagNumber === "EL-LH-008");
    if (cow8) {
      await ctx.db.insert("treatments", {
        livestockId: cow8.id,
        date: Date.now() - 3 * 24 * 60 * 60 * 1000,
        condition: "Mastitis",
        drugAdministered: "Penistrep LA",
        dosage: "15ml intramuscular",
        withholdingDays: 5,
        withholdingUntil: Date.now() + 2 * 24 * 60 * 60 * 1000,
        administeredBy: userId,
        notes: "Cow isolated in treatment wing. Milk withheld.",
      });
    }

    // 7. Seed Crop Fields
    const cropFields = [
      { name: "North Field A", crop: "wheat", acres: 50 },
      { name: "North Field B", crop: "wheat", acres: 45 },
      { name: "South Field A", crop: "barley", acres: 55 },
      { name: "South Field B", crop: "barley", acres: 50 },
      { name: "East Field", crop: "maize", acres: 40 },
      { name: "West Field A", crop: "maize", acres: 35 },
      { name: "West Field B", crop: "wheat", acres: 45 },
      { name: "Valley View A", crop: "lucerne", acres: 30 },
      { name: "Valley View B", crop: "lucerne", acres: 25 },
      { name: "Highway Side", crop: "barley", acres: 35 },
      { name: "Homestead Flat", crop: "fallow", acres: 20 },
      { name: "River Bank Block", crop: "fallow", acres: 20 },
    ] as const;

    const fieldMap = new Map();
    for (const f of cropFields) {
      const fieldId = await ctx.db.insert("fields", {
        name: f.name,
        crop: f.crop,
        acres: f.acres,
        plantedDate: f.crop !== "fallow" ? Date.now() - 45 * 24 * 60 * 60 * 1000 : null,
        expectedHarvestDate: f.crop !== "fallow" ? Date.now() + 75 * 24 * 60 * 60 * 1000 : null,
        notes: `Field acreage fully configured for crop: ${f.crop}.`,
      });
      fieldMap.set(f.name, fieldId);
    }

    // 8. Seed Soil Quality Tests
    const fieldA = fieldMap.get("North Field A");
    if (fieldA) {
      await ctx.db.insert("soilTests", {
        fieldId: fieldA,
        date: Date.now() - 10 * 24 * 60 * 60 * 1000,
        ph: 6.2,
        nitrogen: "medium",
        phosphorus: "low",
        potassium: "high",
        recommendations: "Add agricultural lime to raise pH. Supplement with Nitrogen and Phosphorus.",
        testedBy: userId,
      });
    }

    const fieldB = fieldMap.get("South Field B");
    if (fieldB) {
      await ctx.db.insert("soilTests", {
        fieldId: fieldB,
        date: Date.now() - 8 * 24 * 60 * 60 * 1000,
        ph: 6.8,
        nitrogen: "high",
        phosphorus: "medium",
        potassium: "medium",
        recommendations: "Soil nutrition is excellent. No fertilization required this quarter.",
        testedBy: userId,
      });
    }

    // 9. Seed EABL contract
    const contractId = await ctx.db.insert("contracts", {
      buyer: "East African Breweries Limited (EABL)",
      crop: "barley",
      contractedBags: 3150,
      pricePerBag: 3100,
      season: "2026 rains",
      status: "active",
      signedDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    });

    // 10. Seed EABL deliveries
    const deliverySizes = [200, 220, 240, 210, 250, 230, 240, 250];
    for (let i = 0; i < 8; i++) {
      const delDate = Date.now() - (15 - i) * 24 * 60 * 60 * 1000;
      await ctx.db.insert("deliveries", {
        contractId,
        date: delDate,
        bags: deliverySizes[i],
        vehicleRef: `KBQ ${100 + i}C`,
        notes: `Delivery ${i + 1} of malting barley to EABL depot.`,
      });
    }

    // 11. Feed Inventory
    const feedItems = [
      { type: "silage", product: "Maize Silage Gold", quantity: 15, unit: "tonnes" },
      { type: "concentrate", product: "Dairy Meal High Yield", quantity: 80, unit: "bags" },
      { type: "minerals", product: "Mineral Lick Blocks", quantity: 200, unit: "kg" },
      { type: "hay", product: "Rhodes Grass Hay Bales", quantity: 300, unit: "bags" },
    ] as const;

    for (const f of feedItems) {
      await ctx.db.insert("feedInventory", {
        type: f.type,
        product: f.product,
        quantity: f.quantity,
        unit: f.unit,
        updatedAt: Date.now(),
      });
    }

    // 12. Vet Inventory
    const vetItems = [
      { product: "Penistrep LA", category: "antibiotic", quantity: 10, unit: "vials", lowStockThreshold: 3 },
      { product: "Albendazole 10%", category: "dewormer", quantity: 8, unit: "litres", lowStockThreshold: 2 },
      { product: "Foot & Mouth Vaccine", category: "vaccine", quantity: 5, unit: "vials", lowStockThreshold: 2 },
      { product: "Premium Cow Minerals", category: "minerals", quantity: 25, unit: "bags", lowStockThreshold: 5 },
      { product: "Holstein Sire Semen", category: "semen", quantity: 50, unit: "straws", lowStockThreshold: 10 },
    ] as const;

    for (const v of vetItems) {
      await ctx.db.insert("vetInventory", {
        product: v.product,
        category: v.category,
        quantity: v.quantity,
        unit: v.unit,
        lowStockThreshold: v.lowStockThreshold,
      });
    }

    // 13. Machinery
    const machines = [
      { name: "John Deere 5075E", type: "tractor", plateNumber: "KCD 104M", status: "operational", fuelType: "diesel", nextServiceDate: Date.now() + 30 * 24 * 60 * 60 * 1000, notes: "Main utility tractor." },
      { name: "New Holland TC5.30", type: "harvester", plateNumber: "KCQ 890Y", status: "operational", fuelType: "diesel", nextServiceDate: Date.now() + 120 * 24 * 60 * 60 * 1000, notes: "Combine harvester." },
      { name: "DeLaval Milking Pump Alpha", type: "milking_pump", plateNumber: "STATION-PUMP-1", status: "operational", fuelType: "electric", nextServiceDate: Date.now() + 15 * 24 * 60 * 60 * 1000, notes: "Vacuum milking pump." },
    ] as const;

    for (const m of machines) {
      await ctx.db.insert("machinery", m);
    }

    return {
      success: true,
      message: "Database successfully seeded with multi-species livestock, groups, soil tests, crop fields, EABL barley contract, and inventories.",
    };
  },
});
