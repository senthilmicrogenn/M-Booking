import { db } from "./db";
import { 
  users, properties, propertyCategories, propertyAreas, propertyAmenities,
  hotelStarRatings, customerReviewRatings, roomViews, roomTypes, roomPhotos,
  policyTemplates, currencyMaster, roomInventory, universalPhotos,
  generalLedgerMaster, subledgerMaster, tariffSetupMaster
} from "@shared/schema";

export async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // Clear existing data (optional - for fresh test environment)
    await db.delete(tariffSetupMaster);
    await db.delete(subledgerMaster);
    await db.delete(generalLedgerMaster);
    await db.delete(roomInventory);
    await db.delete(roomPhotos);
    await db.delete(universalPhotos);
    await db.delete(properties);
    await db.delete(roomTypes);
    await db.delete(propertyCategories);
    await db.delete(propertyAreas);
    await db.delete(propertyAmenities);
    await db.delete(hotelStarRatings);
    await db.delete(customerReviewRatings);
    await db.delete(roomViews);
    await db.delete(policyTemplates);
    await db.delete(currencyMaster);
    await db.delete(users);

    console.log("✅ Cleared existing data");

    // 1. Currency Master Data
    const currencies = await db.insert(currencyMaster).values([
      {
        currencyName: "Indian Rupee",
        shortName: "INR",
        conversionPrice: "1.000000",
        asOnDate: "2025-01-03",
        isActive: true,
        symbol: "₹",
        country: "India",
        isBaseCurrency: true
      },
      {
        currencyName: "US Dollar", 
        shortName: "USD",
        conversionPrice: "84.200000",
        asOnDate: "2025-01-03",
        isActive: true,
        symbol: "$",
        country: "United States",
        isBaseCurrency: false
      },
      {
        currencyName: "Euro",
        shortName: "EUR", 
        conversionPrice: "87.500000",
        asOnDate: "2025-01-03",
        isActive: true,
        symbol: "€",
        country: "Europe",
        isBaseCurrency: false
      }
    ]).returning();
    console.log(`✅ Seeded ${currencies.length} currencies`);

    // 2. Hotel Star Ratings
    const starRatings = await db.insert(hotelStarRatings).values([
      { starRating: 1, ratingName: "Budget", description: "Basic accommodation", serviceLevel: "Basic" },
      { starRating: 2, ratingName: "Economy", description: "Comfortable stay", serviceLevel: "Standard" },
      { starRating: 3, ratingName: "Standard", description: "Good quality hotel", serviceLevel: "Good" },
      { starRating: 4, ratingName: "Premium", description: "High-end accommodation", serviceLevel: "Excellent" },
      { starRating: 5, ratingName: "Luxury", description: "Ultra-luxury experience", serviceLevel: "Exceptional" }
    ]).returning();
    console.log(`✅ Seeded ${starRatings.length} star ratings`);

    // 3. Customer Review Ratings
    const reviewRatings = await db.insert(customerReviewRatings).values([
      { ratingRange: "4.5-5.0", ratingLabel: "Excellent", minRating: "4.5", maxRating: "5.0", color: "#16A34A", description: "Outstanding reviews" },
      { ratingRange: "4.0-4.4", ratingLabel: "Very Good", minRating: "4.0", maxRating: "4.4", color: "#22C55E", description: "Great customer feedback" },
      { ratingRange: "3.5-3.9", ratingLabel: "Good", minRating: "3.5", maxRating: "3.9", color: "#84CC16", description: "Positive reviews" },
      { ratingRange: "3.0-3.4", ratingLabel: "Average", minRating: "3.0", maxRating: "3.4", color: "#F59E0B", description: "Moderate reviews" },
      { ratingRange: "0.0-2.9", ratingLabel: "Below Average", minRating: "0.0", maxRating: "2.9", color: "#EF4444", description: "Needs improvement" }
    ]).returning();
    console.log(`✅ Seeded ${reviewRatings.length} review ratings`);

    // 4. Property Areas 
    const areas = await db.insert(propertyAreas).values([
      { cityName: "Mumbai", areaName: "Andheri East", pincode: "400069", description: "Business district near airport" },
      { cityName: "Mumbai", areaName: "Bandra West", pincode: "400050", description: "Upscale residential and commercial area" },
      { cityName: "Mumbai", areaName: "Juhu", pincode: "400049", description: "Beachside area with luxury hotels" },
      { cityName: "Delhi", areaName: "Connaught Place", pincode: "110001", description: "Central business district" },
      { cityName: "Delhi", areaName: "Karol Bagh", pincode: "110005", description: "Shopping and business hub" },
      { cityName: "Bangalore", areaName: "Koramangala", pincode: "560034", description: "IT hub with modern amenities" },
      { cityName: "Bangalore", areaName: "Whitefield", pincode: "560066", description: "Major IT corridor" },
      { cityName: "Chennai", areaName: "T. Nagar", pincode: "600017", description: "Commercial and shopping center" },
      { cityName: "Pune", areaName: "Hinjewadi", pincode: "411057", description: "IT park area" },
      { cityName: "Coimbatore", areaName: "RS Puram", pincode: "641002", description: "Central business area" }
    ]).returning();
    console.log(`✅ Seeded ${areas.length} property areas`);

    // 5. Property Categories
    const categories = await db.insert(propertyCategories).values([
      { propertyType: "hotel", categoryName: "Budget Hotel", description: "Affordable accommodation" },
      { propertyType: "hotel", categoryName: "Business Hotel", description: "Corporate-friendly hotels" },
      { propertyType: "hotel", categoryName: "Luxury Resort", description: "Premium resort experience" },
      { propertyType: "hotel", categoryName: "Boutique Hotel", description: "Unique themed properties" },
      { propertyType: "conference_room", categoryName: "Corporate Meeting Room", description: "Professional meeting spaces" },
      { propertyType: "conference_room", categoryName: "Event Hall", description: "Large event venues" },
      { propertyType: "flight", categoryName: "Domestic Flight", description: "Within country flights" },
      { propertyType: "flight", categoryName: "International Flight", description: "Cross-border flights" },
      { propertyType: "train", categoryName: "Express Train", description: "Fast intercity trains" },
      { propertyType: "bus", categoryName: "Luxury Bus", description: "Premium bus services" }
    ]).returning();
    console.log(`✅ Seeded ${categories.length} property categories`);

    // 6. Property Amenities
    const amenities = await db.insert(propertyAmenities).values([
      // Room Amenities
      { amenityType: "room_amenity", amenityName: "Air Conditioning", description: "Climate control", icon: "🌡️", category: "Comfort", pictures: [], videos: [] },
      { amenityType: "room_amenity", amenityName: "Free WiFi", description: "High-speed internet", icon: "📶", category: "Technology", pictures: [], videos: [] },
      { amenityType: "room_amenity", amenityName: "LED TV", description: "Modern entertainment", icon: "📺", category: "Entertainment", pictures: [], videos: [] },
      { amenityType: "room_amenity", amenityName: "Mini Fridge", description: "In-room refrigerator", icon: "🧊", category: "Comfort", pictures: [], videos: [] },
      { amenityType: "room_amenity", amenityName: "Room Service", description: "24/7 room service", icon: "🍽️", category: "Service", pictures: [], videos: [] },
      { amenityType: "room_amenity", amenityName: "Safe", description: "Electronic safe", icon: "🔒", category: "Security", pictures: [], videos: [] },
      
      // Hotel Amenities  
      { amenityType: "hotel_amenity", amenityName: "Swimming Pool", description: "Outdoor pool", icon: "🏊", category: "Recreation", pictures: [], videos: [] },
      { amenityType: "hotel_amenity", amenityName: "Gym", description: "Fitness center", icon: "💪", category: "Fitness", pictures: [], videos: [] },
      { amenityType: "hotel_amenity", amenityName: "Spa", description: "Wellness and spa services", icon: "💆", category: "Wellness", pictures: [], videos: [] },
      { amenityType: "hotel_amenity", amenityName: "Restaurant", description: "On-site dining", icon: "🍽️", category: "Dining", pictures: [], videos: [] },
      { amenityType: "hotel_amenity", amenityName: "Parking", description: "Free parking", icon: "🚗", category: "Convenience", pictures: [], videos: [] },
      { amenityType: "hotel_amenity", amenityName: "Business Center", description: "Meeting rooms", icon: "💼", category: "Business", pictures: [], videos: [] },
      { amenityType: "hotel_amenity", amenityName: "Concierge", description: "Guest services", icon: "🛎️", category: "Service", pictures: [], videos: [] },
      { amenityType: "hotel_amenity", amenityName: "Airport Shuttle", description: "Free airport transfer", icon: "🚌", category: "Transport", pictures: [], videos: [] }
    ]).returning();
    console.log(`✅ Seeded ${amenities.length} amenities`);

    // 7. Room Views
    const views = await db.insert(roomViews).values([
      { viewName: "Pool View", viewType: "recreational", description: "Overlooks swimming pool area" },
      { viewName: "City View", viewType: "urban", description: "Panoramic city skyline" },
      { viewName: "Garden View", viewType: "nature", description: "Lush garden landscape" },
      { viewName: "Sea View", viewType: "nature", description: "Ocean or sea views" },
      { viewName: "Mountain View", viewType: "nature", description: "Scenic mountain vistas" },
      { viewName: "Courtyard View", viewType: "recreational", description: "Internal courtyard views" }
    ]).returning();
    console.log(`✅ Seeded ${views.length} room views`);

    // 8. Room Types
    const roomTypesData = await db.insert(roomTypes).values([
      { 
        roomTypeName: "Standard Single", 
        roomSizeSquareMeters: 25, 
        maxOccupancy: 1, 
        bedType: "Single Bed",
        description: "Comfortable single occupancy room",
        roomCount: 50,
        basePrice: "2500.00",
        amenityIds: [amenities[0].id, amenities[1].id, amenities[2].id]
      },
      { 
        roomTypeName: "Standard Double", 
        roomSizeSquareMeters: 35, 
        maxOccupancy: 2, 
        bedType: "Double Bed",
        description: "Spacious double occupancy room", 
        roomCount: 40,
        basePrice: "3500.00",
        amenityIds: [amenities[0].id, amenities[1].id, amenities[2].id, amenities[3].id]
      },
      { 
        roomTypeName: "Deluxe Suite", 
        roomSizeSquareMeters: 55, 
        maxOccupancy: 3, 
        bedType: "King Bed + Sofa",
        description: "Luxury suite with separate living area",
        roomCount: 20, 
        basePrice: "6500.00",
        amenityIds: [amenities[0].id, amenities[1].id, amenities[2].id, amenities[3].id, amenities[4].id, amenities[5].id]
      },
      { 
        roomTypeName: "Executive Suite", 
        roomSizeSquareMeters: 75, 
        maxOccupancy: 4, 
        bedType: "King Bed + Twin Beds",
        description: "Premium executive accommodation",
        roomCount: 10,
        basePrice: "9500.00",
        amenityIds: [amenities[0].id, amenities[1].id, amenities[2].id, amenities[3].id, amenities[4].id, amenities[5].id]
      }
    ]).returning();
    console.log(`✅ Seeded ${roomTypesData.length} room types`);

    // 9. Policy Templates
    const policies = await db.insert(policyTemplates).values([
      {
        policyType: "cancellation",
        policyTitle: "Standard Cancellation Policy",
        templateName: "Standard Cancellation",
        policyContent: "Free cancellation up to 24 hours before check-in. After that, 1 night charge applies.",
        isActive: true
      },
      {
        policyType: "cancellation", 
        policyTitle: "Strict Cancellation Policy",
        templateName: "Strict Cancellation",
        policyContent: "Non-refundable booking. No cancellation allowed.",
        isActive: true
      },
      {
        policyType: "checkin",
        policyTitle: "Standard Check-in Policy",
        templateName: "Standard Check-in",
        policyContent: "Check-in: 2:00 PM onwards. Check-out: 11:00 AM. Early check-in subject to availability.",
        isActive: true
      },
      {
        policyType: "amenity",
        policyTitle: "Swimming Pool Policy",
        templateName: "Pool Policy",
        policyContent: "Pool hours: 6:00 AM to 10:00 PM. Children under 12 must be supervised.",
        isActive: true
      }
    ]).returning();
    console.log(`✅ Seeded ${policies.length} policy templates`);

    // 10. Sample Users
    const sampleUsers = await db.insert(users).values([
      {
        email: "admin@roomnest.com",
        phoneNumber: "+91-9876543210", 
        name: "RoomNest Admin",
        role: "admin",
        isVerified: true,
        gender: "male",
        companyName: "RoomNest Hotels",
        preferredLanguage: "English"
      },
      {
        email: "manager@roomnest.com",
        phoneNumber: "+91-9876543211",
        name: "Hotel Manager",
        role: "manager", 
        isVerified: true,
        gender: "female",
        preferredLanguage: "English"
      },
      {
        email: "guest@example.com",
        phoneNumber: "+91-9876543212",
        name: "John Smith",
        role: "guest",
        isVerified: true,
        gender: "male",
        preferredLanguage: "English"
      }
    ]).returning();
    console.log(`✅ Seeded ${sampleUsers.length} users`);

    // 11. Sample Properties
    const sampleProperties = await db.insert(properties).values([
      {
        name: "RoomNest Grand Mumbai",
        type: "hotel",
        location: "Andheri East, Mumbai",
        address: "123 Business District, Andheri East",
        city: "Mumbai",
        area: "Andheri East",
        pincode: "400069",
        description: "Premium business hotel near Mumbai airport with modern amenities",
        amenities: ["Free WiFi", "Swimming Pool", "Business Center", "Airport Shuttle"],
        images: [],
        rating: "4.5",
        reviewCount: 250,
        availability: true,

        approvalStatus: "approved",
        approvedBy: sampleUsers[0].id,
        approvedAt: new Date()
      },
      {
        name: "Hotel Vinayak",
        type: "hotel", 
        location: "Koramangala, Bangalore",
        address: "456 IT Hub Road, Koramangala",
        city: "Bangalore",
        area: "Koramangala", 
        pincode: "560034",
        description: "Modern hotel in IT corridor with excellent connectivity",
        amenities: ["Free WiFi", "Gym", "Restaurant"],
        images: [],
        rating: "4.2",
        reviewCount: 180,
        availability: true,

        approvalStatus: "approved",
        approvedBy: sampleUsers[0].id,
        approvedAt: new Date()
      },
      {
        name: "Hotel K R Grand",
        type: "hotel",
        location: "RS Puram, Coimbatore", 
        address: "789 Central Avenue, RS Puram",
        city: "Coimbatore",
        area: "RS Puram",
        pincode: "641002",
        description: "Comfortable stay in the heart of Coimbatore",
        amenities: ["Free WiFi", "Restaurant", "Parking"],
        images: [],
        rating: "4.0",
        reviewCount: 120,
        availability: true,
        approvalStatus: "approved",
        approvedBy: sampleUsers[0].id,
        approvedAt: new Date()
      }
    ]).returning();
    console.log(`✅ Seeded ${sampleProperties.length} properties`);

    // 12. Sample Room Inventory (for current month)
    const inventoryData = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Generate inventory for current month + next 2 months
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const month = (currentMonth + monthOffset) % 12;
      const year = currentYear + Math.floor((currentMonth + monthOffset) / 12);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        
        // Add inventory for each property and room type
        for (const property of sampleProperties) {
          for (const roomType of roomTypesData) {
            const totalRooms = 20; // Default room count
            inventoryData.push({
              propertyId: property.id,
              roomTypeId: roomType.id,
              date: dateStr,
              totalRooms: totalRooms,
              availableRooms: Math.floor(totalRooms * 0.8), // 80% available
              bookedRooms: Math.floor(totalRooms * 0.15), // 15% booked
              blockedRooms: Math.floor(totalRooms * 0.05), // 5% blocked
              isActive: true,
              lastUpdated: new Date()
            });
          }
        }
      }
    }
    
    // Insert inventory in batches
    const batchSize = 100;
    let inventoryCount = 0;
    for (let i = 0; i < inventoryData.length; i += batchSize) {
      const batch = inventoryData.slice(i, i + batchSize);
      await db.insert(roomInventory).values(batch);
      inventoryCount += batch.length;
    }
    console.log(`✅ Seeded ${inventoryCount} room inventory records`);

    // 19. General Ledger Master - GST Accounts
    const gstLedgerAccounts = await db.insert(generalLedgerMaster).values([
      {
        accountName: "Central Goods and Services Tax (CGST)",
        accountCode: "CGST001",
        accountType: "liability",
        normalBalance: "credit",
        description: "Central GST payable account",
        isActive: true,
        level: 1
      },
      {
        accountName: "State Goods and Services Tax (SGST)",
        accountCode: "SGST001", 
        accountType: "liability",
        normalBalance: "credit",
        description: "State GST payable account",
        isActive: true,
        level: 1
      },
      {
        accountName: "Room Revenue",
        accountCode: "REV001",
        accountType: "revenue", 
        normalBalance: "credit",
        description: "Revenue from room bookings",
        isActive: true,
        level: 1
      }
    ]).returning();
    console.log(`✅ Seeded ${gstLedgerAccounts.length} general ledger accounts`);

    // 20. Subledger Master - GST Subledgers
    const gstSubledgers = await db.insert(subledgerMaster).values([
      {
        subledgerName: "CGST Payable",
        subledgerCode: "CGST_PAY",
        generalLedgerAccountId: gstLedgerAccounts[0].id,
        description: "Central GST tax collection",
        isActive: true,
        isDefaultLedger: true,
        taxPercentage: "9.00"
      },
      {
        subledgerName: "SGST Payable", 
        subledgerCode: "SGST_PAY",
        generalLedgerAccountId: gstLedgerAccounts[1].id,
        description: "State GST tax collection", 
        isActive: true,
        isDefaultLedger: true,
        taxPercentage: "9.00"
      },
      {
        subledgerName: "Room Revenue Main",
        subledgerCode: "ROOM_REV",
        generalLedgerAccountId: gstLedgerAccounts[2].id,
        description: "Primary room revenue account",
        isActive: true,
        isDefaultLedger: true,
        taxPercentage: "0.00"
      }
    ]).returning();
    console.log(`✅ Seeded ${gstSubledgers.length} subledger accounts`);

    // 21. Tariff Setup Master - GST Slabs
    const gstTariffSlabs = await db.insert(tariffSetupMaster).values([
      {
        fromAmount: "0.00",
        toAmount: "1000.00", 
        cgstPercentage: "6.00",
        sgstPercentage: "6.00",
        validFromDate: "2024-01-01",
        validToDate: "2025-12-31",
        subledgerId: gstSubledgers[2].id, // Room Revenue
        cgstSubledgerId: gstSubledgers[0].id,
        sgstSubledgerId: gstSubledgers[1].id,
        graceHour: 12,
        isActive: true,
        description: "Budget tariff slab - 12% total GST",
        createdBy: "system",
        updatedBy: "system"
      },
      {
        fromAmount: "1000.01",
        toAmount: "7500.00",
        cgstPercentage: "9.00", 
        sgstPercentage: "9.00",
        validFromDate: "2024-01-01",
        validToDate: "2025-12-31",
        subledgerId: gstSubledgers[2].id, // Room Revenue
        cgstSubledgerId: gstSubledgers[0].id,
        sgstSubledgerId: gstSubledgers[1].id,
        graceHour: 12,
        isActive: true,
        description: "Standard tariff slab - 18% total GST",
        createdBy: "system",
        updatedBy: "system"
      },
      {
        fromAmount: "7500.01",
        toAmount: "999999.99",
        cgstPercentage: "14.00",
        sgstPercentage: "14.00", 
        validFromDate: "2024-01-01",
        validToDate: "2025-12-31",
        subledgerId: gstSubledgers[2].id, // Room Revenue
        cgstSubledgerId: gstSubledgers[0].id,
        sgstSubledgerId: gstSubledgers[1].id,
        graceHour: 12,
        isActive: true,
        description: "Luxury tariff slab - 28% total GST",
        createdBy: "system",
        updatedBy: "system"
      }
    ]).returning();
    console.log(`✅ Seeded ${gstTariffSlabs.length} GST tariff slabs`);

    console.log("🎉 Database seeding completed successfully!");
    console.log(`
📊 SUMMARY:
✅ ${currencies.length} Currencies
✅ ${starRatings.length} Star Ratings  
✅ ${reviewRatings.length} Review Ratings
✅ ${areas.length} Property Areas
✅ ${categories.length} Property Categories
✅ ${amenities.length} Amenities
✅ ${views.length} Room Views
✅ ${roomTypesData.length} Room Types
✅ ${policies.length} Policy Templates
✅ ${sampleUsers.length} Users
✅ ${sampleProperties.length} Properties
✅ ${inventoryCount} Room Inventory Records
✅ ${gstLedgerAccounts.length} General Ledger Accounts
✅ ${gstSubledgers.length} Subledger Accounts  
✅ ${gstTariffSlabs.length} GST Tariff Slabs
    `);

    return {
      success: true,
      message: "Database seeded successfully with comprehensive test data"
    };

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    return {
      success: false,
      message: `Failed to seed database: ${error}`
    };
  }
}