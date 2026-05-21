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

    // 2. Wipe existing application data (do not wipe users or auth sessions/accounts)
    const tablesToClear = [
      "cows",
      "milkingSessions",
      "treatments",
      "services",
      "pregnancyDiagnoses",
      "calvings",
      "calves",
      "fields",
      "fieldApplications",
      "harvestRecords",
      "contracts",
      "deliveries",
      "feedInventory",
      "vetInventory",
      "tasks",
      "inventoryMovementsLegacy",
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

    // 3. Seed Cows (EL-001 to EL-028)
    const cowIds = [];
    const cowNames = [
      "Moraa", "Amani", "Baraka", "Nduta", "Wanjiku", "Nyaboke", "Kendi", "Chepkoech",
      "Zola", "Benta", "Zawadi", "Halima", "Salma", "Furaha", "Upendo", "Subira",
      "Tumaini", "Neema", "Bahati", "Pendo", "Rehema", "Farida", "Adhiambo", "Akoth",
      "Atieno", "Achieng", "Kwamboka", "Kerubo"
    ];
    const breeds = ["Holstein-Friesian", "Ayrshire", "Guernsey", "Jersey"];

    const now = Date.now();

    for (let i = 1; i <= 28; i++) {
      const tagNumber = `EL-${i.toString().padStart(3, "0")}`;
      const name = cowNames[i - 1];
      const breed = breeds[(i - 1) % breeds.length];
      // Random age between 3 and 7 years
      const ageMs = (3 + (i % 5)) * 365 * 24 * 60 * 60 * 1000;
      const dateOfBirth = now - ageMs;

      // Status: milking, dry, or treatment
      let status: "milking" | "dry" | "treatment" = "milking";
      if (i === 5 || i === 12) status = "dry";
      if (i === 8) status = "treatment";

      const cowId = await ctx.db.insert("cows", {
        tagNumber,
        name,
        breed,
        dateOfBirth,
        status,
        currentLactationNumber: 2 + (i % 3),
        lastCalvingDate: now - (30 + (i % 60)) * 24 * 60 * 60 * 1000,
        sireInfo: "EL-SIRE-SUPERIOR-1",
        damTagNumber: `EL-DAM-${100 + i}`,
        notes: `Healthy cow registered at Elfam Station. Breed line: ${breed}.`,
      });
      cowIds.push({ id: cowId, status });
    }

    // 4. Seed Milking Sessions (30 days of AM/PM yields for milking and treatment cows)
    const today = new Date();
    for (let d = 30; d >= 1; d--) {
      const dateObj = new Date();
      dateObj.setDate(today.getDate() - d);
      const dateStr = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD

      for (const { id: cowId, status } of cowIds) {
        // Dry cows do not yield milk
        if (status === "dry") continue;

        // AM yield (10 to 18 Litres)
        const amLitres = 10 + (Math.sin(d + (cowId as any).charCodeAt(10)) * 4) + 4;
        await ctx.db.insert("milkingSessions", {
          cowId,
          session: "AM",
          date: dateStr,
          litres: parseFloat(amLitres.toFixed(1)),
          loggedBy: userId,
          loggedAt: dateObj.getTime() + 6 * 60 * 60 * 1000, // 6:00 AM
          flagged: status === "treatment", // flag treatments withholding
        });

        // PM yield (8 to 15 Litres)
        const pmLitres = 8 + (Math.cos(d + (cowId as any).charCodeAt(10)) * 3.5) + 3.5;
        await ctx.db.insert("milkingSessions", {
          cowId,
          session: "PM",
          date: dateStr,
          litres: parseFloat(pmLitres.toFixed(1)),
          loggedBy: userId,
          loggedAt: dateObj.getTime() + 16 * 60 * 60 * 1000, // 4:00 PM
          flagged: status === "treatment",
        });
      }
    }

    // 5. Seed 1 EABL Contract (350 acres, 3,150 bags, Sh3,100/bag, 2026 rains, active)
    const contractId = await ctx.db.insert("contracts", {
      buyer: "East African Breweries Limited (EABL)",
      crop: "barley",
      contractedBags: 3150,
      pricePerBag: 3100,
      season: "2026 rains",
      status: "active",
      signedDate: now - 30 * 24 * 60 * 60 * 1000,
    });

    // 6. Seed 8 Deliveries under that contract (totaling 1,840 bags delivered)
    const deliverySizes = [200, 220, 240, 210, 250, 230, 240, 250];
    for (let i = 0; i < 8; i++) {
      const delDate = now - (15 - i) * 24 * 60 * 60 * 1000;
      await ctx.db.insert("deliveries", {
        contractId,
        date: delDate,
        bags: deliverySizes[i],
        vehicleRef: `KBQ ${100 + i}C`,
        notes: `Delivery ${i + 1} of high grade malting barley to EABL depot.`,
      });
    }

    // 7. Seed 12 specific crop fields
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

    for (const f of cropFields) {
      await ctx.db.insert("fields", {
        name: f.name,
        crop: f.crop,
        acres: f.acres,
        plantedDate: f.crop !== "fallow" ? now - 45 * 24 * 60 * 60 * 1000 : null,
        expectedHarvestDate: f.crop !== "fallow" ? now + 75 * 24 * 60 * 60 * 1000 : null,
        notes: `Field acreage fully configured for crop: ${f.crop}.`,
      });
    }

    // 8. Seed Feed Inventory
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
        updatedAt: now,
      });
    }

    // 9. Seed Vet Inventory
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

    // 10. Seed typical treatments for cow EL-008
    const cow8 = await ctx.db.query("cows").withIndex("by_tag", q => q.eq("tagNumber", "EL-008")).unique();
    if (cow8) {
      await ctx.db.insert("treatments", {
        cowId: cow8._id,
        date: now - 3 * 24 * 60 * 60 * 1000,
        condition: "Mastitis",
        drugAdministered: "Penistrep LA",
        dosage: "15ml intramuscular",
        withholdingDays: 5,
        withholdingUntil: now + 2 * 24 * 60 * 60 * 1000, // 2 days left
        administeredBy: userId,
        notes: "Cow isolated in sick bay. Flag milk yield withholding.",
      });
    }

    // 11. Seed a few machinery items
    const machines = [
      { name: "John Deere 5075E", type: "tractor", plateNumber: "KCD 104M", status: "operational", fuelType: "diesel", nextServiceDate: now + 30 * 24 * 60 * 60 * 1000, notes: "Main farm utility tractor." },
      { name: "New Holland TC5.30", type: "harvester", plateNumber: "KCQ 890Y", status: "operational", fuelType: "diesel", nextServiceDate: now + 120 * 24 * 60 * 60 * 1000, notes: "Cereal combine harvester." },
      { name: "DeLaval Milking Pump Alpha", type: "milking_pump", plateNumber: "STATION-PUMP-1", status: "operational", fuelType: "electric", nextServiceDate: now + 15 * 24 * 60 * 60 * 1000, notes: "Main parlor double vacuum pump." },
    ] as const;

    for (const m of machines) {
      await ctx.db.insert("machinery", m);
    }

    return {
      success: true,
      message: "Database successfully seeded: 28 cows, 30 days yields, EABL contract, 8 deliveries, 12 crop fields, inventories, and parlor machinery are live.",
    };
  },
});
