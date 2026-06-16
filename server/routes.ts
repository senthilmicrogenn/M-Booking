import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPropertySchema, insertPropertyCategorySchema, insertPropertyAreaSchema, insertPropertyAmenitySchema, insertHotelStarRatingSchema, insertCustomerReviewRatingSchema, insertRoomViewSchema, insertRoomTypeSchema, insertRoomPhotoSchema, insertPolicyTemplateSchema, insertBookingSchema, insertFranchiseInquirySchema, insertUniversalPhotoSchema, insertPlanMasterSchema, insertPlanPropertyPricingSchema, insertCurrencyMasterSchema, insertRateMasterSchema, insertEnhancedBookingSchema, insertGeneralLedgerMasterSchema, insertSubledgerMasterSchema, insertTariffSetupMasterSchema, insertUserPropertyAccessSchema, insertAuditLogSchema, insertMealInclusionMasterSchema, insertPlanMealInclusionSchema, insertGuestDetailsSchema, insertBookingGuestDetailsSchema, type NewPlanMaster, type NewMealInclusionMaster, type NewPlanMealInclusion, type MealInclusionMaster } from "@shared/schema";
import { z } from "zod";
import { photoService } from "./photoService";
import { universalPhotoService } from "./universalPhotoService";
import { ObjectStorageService, ObjectNotFoundError, parseObjectPath, objectStorageClient } from "./objectStorage";

// Generate a unique 16-digit alphanumeric booking ID
function generateBookingId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let bookingId = '';
  
  // Generate 16 random characters
  for (let i = 0; i < 16; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    bookingId += chars[randomIndex];
  }
  
  return bookingId;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Test data seeding route (development only)
  app.post("/api/seed-database", async (req, res) => {
    try {
      const { seedDatabase } = await import("./seed-data");
      const result = await seedDatabase();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to seed database", error: error.message });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhone(validatedData.phoneNumber);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this phone number" });
      }
      
      const user = await storage.createUser(validatedData);
      res.status(201).json({ 
        user: { ...user, password: undefined }, 
        message: "Registration successful" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phoneNumber, password } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      
      const user = await storage.getUserByPhone(phoneNumber);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you'd verify password hash here
      // For demo purposes, we'll just check if password exists or matches
      if (password && user.password && user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ 
        user: { ...user, password: undefined }, 
        message: "Login successful" 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User profile routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(parseInt(req.params.id), req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Properties search and listing routes
  app.get("/api/properties/search", async (req, res) => {
    try {
      const { location, city, checkIn, checkOut, guests, category, type } = req.query;
      
      const searchQuery: any = {};
      if (location && typeof location === 'string') searchQuery.location = location;
      if (city && typeof city === 'string') searchQuery.city = city;
      if (checkIn && typeof checkIn === 'string') searchQuery.checkIn = new Date(checkIn);
      if (checkOut && typeof checkOut === 'string') searchQuery.checkOut = new Date(checkOut);
      if (guests && typeof guests === 'string') searchQuery.guests = parseInt(guests);
      if (category && typeof category === 'string') searchQuery.category = category;
      if (type && typeof type === 'string') searchQuery.type = type;
      
      const properties = await storage.searchProperties(searchQuery);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to search properties" });
    }
  });

  app.get("/api/properties", async (req, res) => {
    try {
      const { type, location, limit, starRating, reviewRating, portalMode, checkIn, checkOut, guests, rooms } = req.query;
      let properties;
      
      if (type && typeof type === 'string') {
        properties = await storage.getPropertiesByType(type);
      } else {
        properties = await storage.getAllProperties();
      }
      
      // For portal mode, only show approved and available properties
      if (portalMode === 'true') {
        properties = properties.filter(property => 
          property.approvalStatus === 'approved' && 
          property.availability === true
        );
      }
      
      // Filter by location if provided
      if (location && typeof location === 'string') {
        const locationLower = location.toLowerCase();
        properties = properties.filter(property => 
          property.city.toLowerCase().includes(locationLower) ||
          property.location.toLowerCase().includes(locationLower) ||
          property.name.toLowerCase().includes(locationLower)
        );
      }

      // Filter by hotel star ratings if provided
      if (starRating) {
        const starRatings = Array.isArray(starRating) ? starRating.map(Number) : [Number(starRating)];
        properties = properties.filter(property => 
          (property as any).starRating && starRatings.includes((property as any).starRating)
        );
      }

      // Filter by customer review ratings if provided
      if (reviewRating) {
        const reviewRatings = Array.isArray(reviewRating) ? reviewRating : [reviewRating];
        properties = properties.filter(property => {
          if (!(property as any).averageRating) return false;
          
          return reviewRatings.some((ratingRange) => {
            const [min, max] = String(ratingRange).split('-').map(parseFloat);
            const avgRating = (property as any).averageRating;
            return avgRating >= min && avgRating <= max;
          });
        });
      }
      
      // Check room availability for hotel searches with dates
      if (portalMode === 'true' && type === 'hotel' && checkIn && checkOut) {
        const checkInDate = new Date(checkIn as string);
        const checkOutDate = new Date(checkOut as string);
        const requestedRooms = parseInt(rooms as string) || 1;
        
        // Filter properties that have room availability for the requested dates
        const propertiesWithAvailability = [];
        
        for (const property of properties) {
          try {
            const hasAvailability = await storage.checkRoomAvailability({
              propertyId: property.id,
              checkIn: checkInDate,
              checkOut: checkOutDate,
              rooms: requestedRooms
            });
            
            if (hasAvailability) {
              propertiesWithAvailability.push(property);
            }
          } catch (error) {
            console.error(`Error checking availability for property ${property.id}:`, error);
            // Include property in results if availability check fails (graceful degradation)
            propertiesWithAvailability.push(property);
          }
        }
        
        properties = propertiesWithAvailability;
      }
      
      // Limit results if specified
      if (limit && typeof limit === 'string') {
        const limitNum = parseInt(limit);
        if (!isNaN(limitNum)) {
          properties = properties.slice(0, limitNum);
        }
      }
      
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Get all master data needed for property relationships
  app.get("/api/properties/master-data", async (req, res) => {
    try {
      const masterData = await storage.getPropertyMasterData();
      res.json(masterData);
    } catch (error) {
      console.error("Error fetching property master data:", error);
      res.status(500).json({ error: "Failed to fetch property master data" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("already exists")) {
        return res.status(409).json({ message: error.message, type: "duplicate" });
      }
      console.error("Error creating property:", error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.put("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.updateProperty(parseInt(req.params.id), req.body);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        return res.status(409).json({ message: error.message, type: "duplicate" });
      }
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProperty(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(parseInt(req.params.id));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Return just the property data - room types and reviews are fetched separately
      res.json(property);
    } catch (error) {
      console.error('Error fetching property:', error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  // Property approval routes
  app.post("/api/properties/:id/approve", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const { approvedBy } = req.body;
      
      if (!approvedBy) {
        return res.status(400).json({ message: "approvedBy is required" });
      }
      
      const property = await storage.approveProperty(propertyId, approvedBy);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      console.error('Error approving property:', error);
      res.status(500).json({ message: "Failed to approve property" });
    }
  });

  app.post("/api/properties/:id/reject", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const { rejectedBy, rejectionReason } = req.body;
      
      if (!rejectedBy || !rejectionReason) {
        return res.status(400).json({ message: "rejectedBy and rejectionReason are required" });
      }
      
      const property = await storage.rejectProperty(propertyId, rejectedBy, rejectionReason);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      console.error('Error rejecting property:', error);
      res.status(500).json({ message: "Failed to reject property" });
    }
  });

  app.get("/api/properties/status/pending", async (req, res) => {
    try {
      const properties = await storage.getPendingProperties();
      res.json(properties);
    } catch (error) {
      console.error('Error fetching pending properties:', error);
      res.status(500).json({ message: "Failed to fetch pending properties" });
    }
  });

  app.get("/api/properties/status/approved", async (req, res) => {
    try {
      const properties = await storage.getApprovedProperties();
      res.json(properties);
    } catch (error) {
      console.error('Error fetching approved properties:', error);
      res.status(500).json({ message: "Failed to fetch approved properties" });
    }
  });

  // Property Categories management routes
  app.get("/api/property-categories", async (req, res) => {
    try {
      const { type } = req.query;
      
      if (type) {
        const categories = await storage.getPropertyCategoriesByType(type as string);
        res.json(categories);
      } else {
        const categories = await storage.getAllPropertyCategories();
        res.json(categories);
      }
    } catch (error) {
      console.error('Error fetching property categories:', error);
      res.status(500).json({ message: "Failed to fetch property categories" });
    }
  });

  app.post("/api/property-categories", async (req, res) => {
    try {
      const validatedData = insertPropertyCategorySchema.parse(req.body);
      const category = await storage.createPropertyCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error('Error creating property category:', error);
      res.status(500).json({ message: "Failed to create property category" });
    }
  });

  app.patch("/api/property-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedCategory = await storage.updatePropertyCategory(id, req.body);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Property category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      console.error('Error updating property category:', error);
      res.status(500).json({ message: "Failed to update property category" });
    }
  });

  app.delete("/api/property-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePropertyCategory(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Property category not found" });
      }
      
      res.json({ message: "Property category deleted successfully" });
    } catch (error) {
      console.error('Error deleting property category:', error);
      res.status(500).json({ message: "Failed to delete property category" });
    }
  });

  // Property Areas management routes
  app.get("/api/property-areas", async (req, res) => {
    try {
      const { city } = req.query;
      
      if (city) {
        const areas = await storage.getPropertyAreasByCity(city as string);
        res.json(areas);
      } else {
        const areas = await storage.getAllPropertyAreas();
        res.json(areas);
      }
    } catch (error) {
      console.error('Error fetching property areas:', error);
      res.status(500).json({ message: "Failed to fetch property areas" });
    }
  });

  app.post("/api/property-areas", async (req, res) => {
    try {
      const validatedData = insertPropertyAreaSchema.parse(req.body);
      const area = await storage.createPropertyArea(validatedData);
      res.status(201).json(area);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid area data", errors: error.errors });
      }
      console.error('Error creating property area:', error);
      res.status(500).json({ message: "Failed to create property area" });
    }
  });

  app.patch("/api/property-areas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedArea = await storage.updatePropertyArea(id, req.body);
      
      if (!updatedArea) {
        return res.status(404).json({ message: "Property area not found" });
      }
      
      res.json(updatedArea);
    } catch (error) {
      console.error('Error updating property area:', error);
      res.status(500).json({ message: "Failed to update property area" });
    }
  });

  app.delete("/api/property-areas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePropertyArea(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Property area not found" });
      }
      
      res.json({ message: "Property area deleted successfully" });
    } catch (error) {
      console.error('Error deleting property area:', error);
      res.status(500).json({ message: "Failed to delete property area" });
    }
  });

  // Property Amenities management routes
  app.get("/api/property-amenities", async (req, res) => {
    try {
      const { type } = req.query;
      
      if (type) {
        const amenities = await storage.getPropertyAmenitiesByType(type as string);
        res.json(amenities);
      } else {
        const amenities = await storage.getAllPropertyAmenities();
        res.json(amenities);
      }
    } catch (error) {
      console.error('Error fetching property amenities:', error);
      res.status(500).json({ message: "Failed to fetch property amenities" });
    }
  });

  app.post("/api/property-amenities", async (req, res) => {
    try {
      const validatedData = insertPropertyAmenitySchema.parse(req.body);
      const amenity = await storage.createPropertyAmenity(validatedData);
      res.status(201).json(amenity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid amenity data", errors: error.errors });
      }
      console.error('Error creating property amenity:', error);
      res.status(500).json({ message: "Failed to create property amenity" });
    }
  });

  app.patch("/api/property-amenities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedAmenity = await storage.updatePropertyAmenity(id, req.body);
      
      if (!updatedAmenity) {
        return res.status(404).json({ message: "Property amenity not found" });
      }
      
      res.json(updatedAmenity);
    } catch (error) {
      console.error('Error updating property amenity:', error);
      res.status(500).json({ message: "Failed to update property amenity" });
    }
  });

  app.delete("/api/property-amenities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePropertyAmenity(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Property amenity not found" });
      }
      
      res.json({ message: "Property amenity deleted successfully" });
    } catch (error) {
      console.error('Error deleting property amenity:', error);
      res.status(500).json({ message: "Failed to delete property amenity" });
    }
  });

  // Hotel Star Ratings management routes
  app.get("/api/hotel-star-ratings", async (req, res) => {
    try {
      const ratings = await storage.getAllHotelStarRatings();
      res.json(ratings);
    } catch (error) {
      console.error('Error fetching hotel star ratings:', error);
      res.status(500).json({ message: "Failed to fetch hotel star ratings" });
    }
  });

  app.post("/api/hotel-star-ratings", async (req, res) => {
    try {
      const validatedData = insertHotelStarRatingSchema.parse(req.body);
      const rating = await storage.createHotelStarRating(validatedData);
      res.status(201).json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rating data", errors: error.errors });
      }
      console.error('Error creating hotel star rating:', error);
      res.status(500).json({ message: "Failed to create hotel star rating" });
    }
  });

  app.patch("/api/hotel-star-ratings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedRating = await storage.updateHotelStarRating(id, req.body);
      
      if (!updatedRating) {
        return res.status(404).json({ message: "Hotel star rating not found" });
      }
      
      res.json(updatedRating);
    } catch (error) {
      console.error('Error updating hotel star rating:', error);
      res.status(500).json({ message: "Failed to update hotel star rating" });
    }
  });

  app.delete("/api/hotel-star-ratings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHotelStarRating(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Hotel star rating not found" });
      }
      
      res.json({ message: "Hotel star rating deleted successfully" });
    } catch (error) {
      console.error('Error deleting hotel star rating:', error);
      res.status(500).json({ message: "Failed to delete hotel star rating" });
    }
  });

  // Customer Review Ratings management routes
  app.get("/api/customer-review-ratings", async (req, res) => {
    try {
      const ratings = await storage.getAllCustomerReviewRatings();
      res.json(ratings);
    } catch (error) {
      console.error('Error fetching customer review ratings:', error);
      res.status(500).json({ message: "Failed to fetch customer review ratings" });
    }
  });

  app.post("/api/customer-review-ratings", async (req, res) => {
    try {
      const validatedData = insertCustomerReviewRatingSchema.parse(req.body);
      const rating = await storage.createCustomerReviewRating(validatedData);
      res.status(201).json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rating data", errors: error.errors });
      }
      console.error('Error creating customer review rating:', error);
      res.status(500).json({ message: "Failed to create customer review rating" });
    }
  });

  app.patch("/api/customer-review-ratings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedRating = await storage.updateCustomerReviewRating(id, req.body);
      
      if (!updatedRating) {
        return res.status(404).json({ message: "Customer review rating not found" });
      }
      
      res.json(updatedRating);
    } catch (error) {
      console.error('Error updating customer review rating:', error);
      res.status(500).json({ message: "Failed to update customer review rating" });
    }
  });

  app.delete("/api/customer-review-ratings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCustomerReviewRating(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Customer review rating not found" });
      }
      
      res.json({ message: "Customer review rating deleted successfully" });
    } catch (error) {
      console.error('Error deleting customer review rating:', error);
      res.status(500).json({ message: "Failed to delete customer review rating" });
    }
  });

  // Room Views management routes
  app.get("/api/room-views", async (req, res) => {
    try {
      const views = await storage.getAllRoomViews();
      res.json(views);
    } catch (error) {
      console.error('Error fetching room views:', error);
      res.status(500).json({ message: "Failed to fetch room views" });
    }
  });

  app.post("/api/room-views", async (req, res) => {
    try {
      const validatedData = insertRoomViewSchema.parse(req.body);
      const view = await storage.createRoomView(validatedData);
      res.status(201).json(view);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid room view data", errors: error.errors });
      }
      console.error('Error creating room view:', error);
      res.status(500).json({ message: "Failed to create room view" });
    }
  });

  app.patch("/api/room-views/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedView = await storage.updateRoomView(id, req.body);
      
      if (!updatedView) {
        return res.status(404).json({ message: "Room view not found" });
      }
      
      res.json(updatedView);
    } catch (error) {
      console.error('Error updating room view:', error);
      res.status(500).json({ message: "Failed to update room view" });
    }
  });

  app.delete("/api/room-views/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRoomView(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Room view not found" });
      }
      
      res.json({ message: "Room view deleted successfully" });
    } catch (error) {
      console.error('Error deleting room view:', error);
      res.status(500).json({ message: "Failed to delete room view" });
    }
  });

  // Room Types management routes
  app.get("/api/room-types", async (req, res) => {
    try {
      const { propertyId } = req.query;
      let roomTypes = await storage.getAllRoomTypes();
      
      // If propertyId is specified, filter to only room types that belong to that property
      // IMPORTANT: Exclude room types with NULL property_id
      if (propertyId) {
        const propId = parseInt(propertyId as string);
        roomTypes = roomTypes.filter(rt => rt.propertyId === propId);
      }
      
      res.json(roomTypes);
    } catch (error) {
      console.error('Error fetching room types:', error);
      res.status(500).json({ message: "Failed to fetch room types" });
    }
  });

  // Get single room type by ID
  app.get("/api/room-types/:id", async (req, res) => {
    try {
      const roomTypeId = parseInt(req.params.id);
      const roomTypes = await storage.getAllRoomTypes();
      const roomType = roomTypes.find(rt => rt.id === roomTypeId);
      
      if (!roomType) {
        return res.status(404).json({ message: "Room type not found" });
      }
      
      res.json(roomType);
    } catch (error) {
      console.error('Error fetching room type:', error);
      res.status(500).json({ message: "Failed to fetch room type" });
    }
  });

  app.post("/api/room-types", async (req, res) => {
    try {
      const validatedData = insertRoomTypeSchema.parse(req.body);
      const roomType = await storage.createRoomType(validatedData);
      res.status(201).json(roomType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid room type data", errors: error.errors });
      }
      console.error('Error creating room type:', error);
      res.status(500).json({ message: "Failed to create room type" });
    }
  });

  app.patch("/api/room-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate the update data using the partial schema
      const validatedData = insertRoomTypeSchema.partial().parse(req.body);
      
      const updatedRoomType = await storage.updateRoomType(id, validatedData);
      
      if (!updatedRoomType) {
        return res.status(404).json({ message: "Room type not found" });
      }
      
      res.json(updatedRoomType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid room type data", errors: error.errors });
      }
      console.error('Error updating room type:', error);
      res.status(500).json({ message: "Failed to update room type" });
    }
  });

  app.delete("/api/room-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRoomType(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Room type not found" });
      }
      
      res.json({ message: "Room type deleted successfully" });
    } catch (error) {
      console.error('Error deleting room type:', error);
      res.status(500).json({ message: "Failed to delete room type" });
    }
  });

  // Legacy room types routes
  app.get("/api/properties/:propertyId/room-types", async (req, res) => {
    try {
      const roomTypes = await storage.getRoomTypesByProperty(parseInt(req.params.propertyId));
      res.json(roomTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch room types" });
    }
  });

  // Bookings routes
  app.get("/api/bookings", async (req, res) => {
    try {
      const { userId } = req.query;
      let bookings;
      
      if (userId && typeof userId === 'string') {
        bookings = await storage.getBookingsByUser(parseInt(userId));
      } else {
        bookings = await storage.getAllBookings();
      }
      
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(parseInt(req.params.id));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Get property details
      const property = await storage.getProperty(booking.propertyId);
      
      // Get room type details if applicable
      let roomType = null;
      if (booking.roomTypeId) {
        roomType = await storage.getRoomType(booking.roomTypeId);
      }
      
      res.json({ ...booking, property, roomType });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      // Generate a unique 16-digit alphanumeric booking ID
      const bookingId = generateBookingId();
      
      // Convert date strings to Date objects before validation
      const preprocessedData = {
        ...req.body,
        bookingId: bookingId, // Add the generated booking ID
        checkInDate: new Date(req.body.checkInDate),
        checkOutDate: new Date(req.body.checkOutDate)
      };
      
      const validatedData = insertBookingSchema.parse(preprocessedData);
      const booking = await storage.createBooking(validatedData);
      
      // Save guest details to booking_guest_details table
      try {
        const guestDetails = booking.guestDetails as any;
        if (guestDetails) {
          // Save primary guest (the one who made the booking)
          const primaryGuestData = {
            bookingId: booking.id,
            isPrimary: true,
            guestMasterId: null, // Will link this after guest master sync
            guestDetailId: null,
            title: guestDetails.title || 'Mr',
            firstName: guestDetails.name?.split(' ')[0] || guestDetails.name || 'Guest',
            lastName: guestDetails.name?.split(' ').slice(1).join(' ') || ''
          };
          await storage.createBookingGuestDetails(primaryGuestData);
          console.log(`✅ Saved primary guest to booking_guest_details for booking ${booking.id}`);
          
          // Save additional guests if provided
          if (guestDetails.additionalGuests && Array.isArray(guestDetails.additionalGuests)) {
            for (const additionalGuest of guestDetails.additionalGuests) {
              if (additionalGuest.name || (additionalGuest.firstName && additionalGuest.lastName)) {
                const additionalGuestData = {
                  bookingId: booking.id,
                  isPrimary: false,
                  guestMasterId: null,
                  guestDetailId: null,
                  title: additionalGuest.title || 'Mr',
                  firstName: additionalGuest.name?.split(' ')[0] || additionalGuest.firstName || 'Guest',
                  lastName: additionalGuest.name?.split(' ').slice(1).join(' ') || additionalGuest.lastName || ''
                };
                await storage.createBookingGuestDetails(additionalGuestData);
              }
            }
            console.log(`✅ Saved ${guestDetails.additionalGuests.length} additional guests to booking_guest_details`);
          }
        }
      } catch (guestDetailsError) {
        console.error('⚠️ Failed to save guest details to booking_guest_details:', guestDetailsError);
      }
      
      // Sync guest data to Guest Master
      try {
        const user = await storage.getUser(booking.userId);
        const guestDetails = booking.guestDetails as any;
        
        if (user) {
          // Check if guest already exists by phone or email
          let existingGuest = null;
          
          // Try to find existing guest by phone from booking form first
          const bookingPhone = guestDetails?.phone?.replace(/\s+/g, '') || user.phoneNumber;
          if (bookingPhone) {
            existingGuest = await storage.getGuestByPhone(bookingPhone);
          }
          
          // Try email from booking form or user
          const bookingEmail = guestDetails?.email || user.email;
          if (!existingGuest && bookingEmail) {
            existingGuest = await storage.getGuestByEmail(bookingEmail);
          }
          
          if (!existingGuest) {
            // Create new guest from booking form data (not user data)
            const guestCode = `GUEST_${String(user.id).padStart(4, '0')}`;
            
            // Use firstName and lastName from booking form
            const firstName = guestDetails?.name?.split(' ')[0] || user.name.split(' ')[0] || user.name;
            const lastName = guestDetails?.name?.split(' ').slice(1).join(' ') || user.name.split(' ').slice(1).join(' ') || '';
            
            const newGuest = {
              guestCode,
              firstName,
              lastName,
              email: bookingEmail || null,
              phoneNumber: bookingPhone || user.phoneNumber,
              dateOfBirth: user.dateOfBirth || null,
              gender: user.gender || null,
              permanentAddress: user.permanentAddress || null,
              currentAddress: user.billingAddress || null,
              state: guestDetails?.state || null, // Add state from booking form
              preferredRoomType: user.preferredRoomType || null,
              preferredLanguage: user.preferredLanguage || null,
              specialRequests: user.specialRequests || null,
              companyName: user.companyName || null,
              gstNumber: user.gstNumber || null,
              emergencyContactName: user.emergencyContactName || null,
              emergencyContactNumber: user.emergencyContactNumber || null,
              guestCategory: 'regular',
              loyaltyTier: 'bronze',
              creditLimit: '0.00',
              totalBookings: 1,
              totalAmountSpent: booking.finalAmount.toString(),
              lastBookingDate: new Date(),
              averageStayDuration: '0',
              isActive: true,
              isBlacklisted: false,
              isVerified: user.isVerified || false,
              source: 'booking_portal',
              smokingPreference: false
            };
            
            await storage.createGuest(newGuest);
            console.log(`✅ Created guest record for user ${user.id}: ${guestCode}`);
          } else {
            // Update existing guest's booking statistics
            const newTotalBookings = existingGuest.totalBookings + 1;
            const currentTotalSpent = parseFloat(existingGuest.totalAmountSpent) || 0;
            const bookingAmount = parseFloat(booking.finalAmount.toString()) || 0;
            const newTotalSpent = (currentTotalSpent + bookingAmount).toFixed(2);
            
            await storage.updateGuest(existingGuest.id, {
              totalBookings: newTotalBookings,
              totalAmountSpent: newTotalSpent,
              lastBookingDate: new Date()
            });
            console.log(`✅ Updated guest record ${existingGuest.guestCode}: ${newTotalBookings} bookings, $${newTotalSpent} spent`);
          }
        }
      } catch (guestSyncError) {
        // Log error but don't fail the booking
        console.error('⚠️ Failed to sync guest data to Guest Master:', guestSyncError);
      }
      
      // Reduce room inventory after successful booking
      if (booking.checkInDate && booking.checkOutDate && booking.propertyId && booking.roomTypeId) {
        const roomsBooked = booking.numberOfRooms || 1;
        const checkInDate = new Date(booking.checkInDate);
        const checkOutDate = new Date(booking.checkOutDate);
        
        console.log(`🏨 Reducing inventory for booking ${booking.id}: ${roomsBooked} rooms from ${checkInDate.toISOString().split('T')[0]} to ${checkOutDate.toISOString().split('T')[0]}`);
        
        // Reduce inventory for each date in the booking period
        const currentDate = new Date(checkInDate);
        while (currentDate < checkOutDate) {
          const dateString = currentDate.toISOString().split('T')[0];
          
          try {
            // Get current inventory for this date
            const inventoryRecords = await storage.getRoomInventory(
              booking.propertyId, 
              booking.roomTypeId, 
              dateString, 
              dateString
            );
            
            if (inventoryRecords.length > 0) {
              const currentInventory = inventoryRecords[0];
              const newAvailableRooms = Math.max(0, currentInventory.availableRooms - roomsBooked);
              const newBookedRooms = currentInventory.bookedRooms + roomsBooked;
              
              await storage.updateRoomInventory(
                booking.propertyId,
                booking.roomTypeId,
                dateString,
                {
                  availableRooms: newAvailableRooms,
                  bookedRooms: newBookedRooms
                }
              );
              
              console.log(`✅ Updated inventory for ${dateString}: ${currentInventory.availableRooms} → ${newAvailableRooms} available, ${currentInventory.bookedRooms} → ${newBookedRooms} booked`);
            } else {
              console.log(`⚠️ No inventory record found for ${dateString}, property ${booking.propertyId}, room type ${booking.roomTypeId}`);
            }
          } catch (inventoryError) {
            console.error(`❌ Failed to update inventory for ${dateString}:`, inventoryError);
            // Continue with other dates even if one fails
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      // TODO: Implement loyalty program system later
      // const loyaltyProgram = await storage.getLoyaltyProgram(booking.userId);
      // if (loyaltyProgram) { ... }
      
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Booking validation errors:', JSON.stringify(error.errors, null, 2));
        console.error('Received booking data:', JSON.stringify(req.body, null, 2));
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      console.error('Booking creation error:', error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.updateBooking(parseInt(req.params.id), req.body);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Room Photos upload endpoint for object storage
  // Amenity media upload route
  app.post("/api/amenity-media/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getAmenityMediaUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error('Error getting amenity media upload URL:', error);
      if (error?.message?.includes('127.0.0.1:1106') || error?.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          message: "Photo uploads not available on VPS deployment",
          hint: "This feature requires Replit Object Storage or Google Cloud Storage configuration"
        });
      }
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Room media upload route (photos and videos)
  app.post("/api/room-photos/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getRoomMediaUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error('Error getting room media upload URL:', error);
      if (error?.message?.includes('127.0.0.1:1106') || error?.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          message: "Photo uploads not available on VPS deployment",
          hint: "This feature requires Replit Object Storage or Google Cloud Storage configuration"
        });
      }
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Room Photos endpoints with compression analytics
  app.get("/api/room-photos", async (req, res) => {
    try {
      const { roomTypeId, propertyId, photoGroup, includeStats } = req.query;
      let roomPhotos;
      
      if (roomTypeId && photoGroup) {
        roomPhotos = await photoService.getPhotosByGroup(parseInt(roomTypeId as string), photoGroup as string);
      } else if (roomTypeId) {
        roomPhotos = await photoService.getRoomPhotosWithMetadata(parseInt(roomTypeId as string));
      } else if (propertyId) {
        // Get all room photos for a property by getting room types first
        const roomTypes = await storage.getAllRoomTypes();
        const propertyRoomTypes = roomTypes.filter(rt => rt.propertyId === parseInt(propertyId as string));
        const roomPhotosPromises = propertyRoomTypes.map(rt => 
          photoService.getRoomPhotosWithMetadata(rt.id!)
        );
        const allRoomPhotos = await Promise.all(roomPhotosPromises);
        roomPhotos = allRoomPhotos.flat();
      } else {
        roomPhotos = await storage.getAllRoomPhotos();
      }
      
      // Include compression statistics if requested
      if (includeStats === 'true' && roomTypeId) {
        const stats = await photoService.getCompressionStats(parseInt(roomTypeId as string));
        res.json({ photos: roomPhotos, compressionStats: stats });
      } else {
        res.json(roomPhotos);
      }
    } catch (error) {
      console.error('Error fetching room photos:', error);
      res.status(500).json({ message: "Failed to fetch room photos" });
    }
  });

  app.post("/api/room-photos", async (req, res) => {
    try {
      const validatedData = insertRoomPhotoSchema.parse(req.body);
      
      // Validation: Check resolution percentage (minimum 90%)
      if (validatedData.resolutionPercentage < 90) {
        return res.status(400).json({ 
          message: "Resolution percentage must be at least 90% for professional quality standards" 
        });
      }
      
      const roomPhoto = await storage.createRoomPhoto(validatedData);
      res.status(201).json(roomPhoto);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid room photo data", errors: error.errors });
      }
      console.error('Error creating room photo:', error);
      res.status(500).json({ message: "Failed to create room photo" });
    }
  });

  app.patch("/api/room-photos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const roomPhoto = await storage.updateRoomPhoto(id, req.body);
      
      if (!roomPhoto) {
        return res.status(404).json({ message: "Room photo not found" });
      }
      
      res.json(roomPhoto);
    } catch (error) {
      console.error('Error updating room photo:', error);
      res.status(500).json({ message: "Failed to update room photo" });
    }
  });

  app.delete("/api/room-photos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRoomPhoto(id);
      
      if (!success) {
        return res.status(404).json({ message: "Room photo not found" });
      }
      
      res.json({ message: "Room photo deleted successfully" });
    } catch (error) {
      console.error('Error deleting room photo:', error);
      res.status(500).json({ message: "Failed to delete room photo" });
    }
  });

  app.patch("/api/room-photos/:id/set-main", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const { roomTypeId, photoGroup } = req.body;
      
      const success = await storage.setMainPhotoForGroup(roomTypeId, photoGroup, photoId);
      
      if (!success) {
        return res.status(404).json({ message: "Room photo not found or invalid parameters" });
      }
      
      res.json({ message: "Main photo set successfully" });
    } catch (error) {
      console.error('Error setting main photo:', error);
      res.status(500).json({ message: "Failed to set main photo" });
    }
  });

  // Photo compression analytics endpoint
  app.get("/api/room-photos/stats/:roomTypeId", async (req, res) => {
    try {
      const roomTypeId = parseInt(req.params.roomTypeId);
      const stats = await photoService.getCompressionStats(roomTypeId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching photo stats:', error);
      res.status(500).json({ message: "Failed to fetch photo statistics" });
    }
  });

  // Optimized photo serving endpoint
  app.get("/api/room-photos/:id/serve", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const { quality = 'compressed', format } = req.query;
      
      const photo = await storage.getRoomPhotoById(photoId);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      const optimalUrl = photoService.getOptimalPhotoUrl(photo, { 
        quality: quality as any,
        format: format as any 
      });
      
      const metadata = photoService.getPhotoMetadata(photo);
      
      res.json({
        photoUrl: optimalUrl,
        metadata,
        compressionInfo: {
          isCompressed: photo.isCompressed,
          originalSize: photoService.formatFileSize(metadata.originalSize),
          compressedSize: photoService.formatFileSize(metadata.compressedSize),
          spaceSaved: photoService.formatFileSize(metadata.originalSize - metadata.compressedSize),
          compressionPercentage: Math.round((1 - metadata.compressionRatio) * 100)
        }
      });
    } catch (error) {
      console.error('Error serving photo:', error);
      res.status(500).json({ message: "Failed to serve photo" });
    }
  });

  // Route to serve universal photos from object storage
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectPath = req.params.objectPath;
    console.log(`🖼️ Serving object: /${objectPath}`);
    
    try {
      const objectStorageService = new ObjectStorageService();
      
      // Try to find as public object first
      let objectFile = await objectStorageService.searchPublicObject(objectPath);
      
      if (!objectFile) {
        // If not found as public, construct the private path
        const privateObjectDir = objectStorageService.getPrivateObjectDir();
        
        // If the path already starts with .private/, we need to construct it properly
        // to avoid double .private/ in the path
        let fullPath;
        if (objectPath.startsWith('.private/')) {
          // Path already includes .private, so we use the bucket directly
          const bucketName = privateObjectDir.split('/')[1]; // Extract bucket name from /bucket/.private
          fullPath = `/${bucketName}/${objectPath}`;
        } else {
          // Path doesn't include .private, so add the full private dir
          fullPath = `${privateObjectDir}/${objectPath}`;
        }
        
        console.log(`🔍 Looking for private object at: ${fullPath}`);
        const { bucketName, objectName } = parseObjectPath(fullPath);
        const bucket = objectStorageClient.bucket(bucketName);
        objectFile = bucket.file(objectName);
        
        // Check if private file exists
        const [exists] = await objectFile.exists();
        if (!exists) {
          console.log(`❌ Object not found: ${objectPath}`);
          return res.status(404).json({ error: "Object not found" });
        }
      }
      
      console.log(`✅ Found object, streaming...`);
      
      // Set aggressive caching for images to improve performance
      const cacheTtl = 3600 * 24; // 24 hours cache
      await objectStorageService.downloadObject(objectFile, res, cacheTtl);
    } catch (error: any) {
      console.error("❌ Error serving object:", error);
      
      // VPS Environment: Replit Object Storage not available
      if (error?.code === 'ECONNREFUSED' || error?.message?.includes('127.0.0.1:1106')) {
        console.log('⚠️  VPS Environment detected: Photo storage not configured');
        // Return transparent 1x1 pixel PNG instead of error
        const transparentPixel = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'base64'
        );
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'public, max-age=86400');
        return res.send(transparentPixel);
      }
      
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Universal Photo Management endpoints
  app.post("/api/universal-photos/upload", async (req, res) => {
    try {
      const { entityType, entityId, photoCategory } = req.body;
      
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error('Error getting universal photo upload URL:', error);
      if (error?.message?.includes('127.0.0.1:1106') || error?.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          message: "Photo uploads not available on VPS deployment",
          hint: "This feature requires Replit Object Storage or Google Cloud Storage configuration"
        });
      }
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.get("/api/universal-photos", async (req, res) => {
    try {
      const { entityType, entityId, photoCategory } = req.query;
      
      if (entityType && entityId) {
        const gallery = await universalPhotoService.getEntityPhotos(
          entityType as string, 
          parseInt(entityId as string)
        );
        res.json(gallery);
      } else if (entityType) {
        const stats = await universalPhotoService.getEntityTypeStats(entityType as string);
        res.json(stats);
      } else if (photoCategory) {
        const photos = await universalPhotoService.getPhotosByCategory(photoCategory as string);
        res.json(photos);
      } else {
        // Get all universal photos with basic info
        const allPhotos = await storage.getAllUniversalPhotos();
        res.json(allPhotos);
      }
    } catch (error) {
      console.error('Error fetching universal photos:', error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  app.post("/api/universal-photos", async (req, res) => {
    try {
      const validatedData = insertUniversalPhotoSchema.parse(req.body);
      
      // Validation: Check resolution percentage (minimum 90%)
      if (validatedData.resolutionPercentage < 90) {
        return res.status(400).json({ 
          message: "Resolution percentage must be at least 90% for professional quality standards" 
        });
      }
      
      const photo = await storage.createUniversalPhoto(validatedData);
      res.status(201).json(photo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid photo data", errors: error.errors });
      }
      console.error('Error creating universal photo:', error);
      res.status(500).json({ message: "Failed to create photo" });
    }
  });

  app.patch("/api/universal-photos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const photo = await storage.updateUniversalPhoto(id, req.body);
      
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      res.json(photo);
    } catch (error) {
      console.error('Error updating universal photo:', error);
      res.status(500).json({ message: "Failed to update photo" });
    }
  });

  app.delete("/api/universal-photos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUniversalPhoto(id);
      
      if (!success) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      console.error('Error deleting universal photo:', error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  app.patch("/api/universal-photos/:id/set-main", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const { entityType, entityId } = req.body;
      
      const success = await universalPhotoService.setMainPhoto(entityType, entityId, photoId);
      
      if (!success) {
        return res.status(404).json({ message: "Photo not found or invalid parameters" });
      }
      
      res.json({ message: "Main photo set successfully" });
    } catch (error) {
      console.error('Error setting main photo:', error);
      res.status(500).json({ message: "Failed to set main photo" });
    }
  });

  app.get("/api/universal-photos/analytics", async (req, res) => {
    try {
      const analytics = await universalPhotoService.getPhotoAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching photo analytics:', error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/universal-photos/search", async (req, res) => {
    try {
      const { q, entityType, photoCategory, isCompressed, uploadedBy } = req.query;
      
      const photos = await universalPhotoService.searchPhotos(q as string, {
        entityType: entityType as string,
        photoCategory: photoCategory as string,
        isCompressed: isCompressed === 'true' ? true : isCompressed === 'false' ? false : undefined,
        uploadedBy: uploadedBy as string
      });
      
      res.json(photos);
    } catch (error) {
      console.error('Error searching photos:', error);
      res.status(500).json({ message: "Failed to search photos" });
    }
  });

  // Policy Templates endpoints
  app.get("/api/policy-templates", async (req, res) => {
    try {
      const { type } = req.query;
      let policyTemplates;
      
      if (type && typeof type === 'string') {
        policyTemplates = await storage.getPolicyTemplatesByType(type);
      } else {
        policyTemplates = await storage.getAllPolicyTemplates();
      }
      
      res.json(policyTemplates);
    } catch (error) {
      console.error('Error fetching policy templates:', error);
      res.status(500).json({ message: "Failed to fetch policy templates" });
    }
  });

  app.get("/api/policy-templates/default/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const defaultTemplate = await storage.getDefaultPolicyTemplate(type);
      
      if (!defaultTemplate) {
        return res.status(404).json({ message: "Default policy template not found" });
      }
      
      res.json(defaultTemplate);
    } catch (error) {
      console.error('Error fetching default policy template:', error);
      res.status(500).json({ message: "Failed to fetch default policy template" });
    }
  });

  app.post("/api/policy-templates", async (req, res) => {
    try {
      const validatedData = insertPolicyTemplateSchema.parse(req.body);
      const policyTemplate = await storage.createPolicyTemplate(validatedData);
      res.status(201).json(policyTemplate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid policy template data", errors: error.errors });
      }
      console.error('Error creating policy template:', error);
      res.status(500).json({ message: "Failed to create policy template" });
    }
  });

  app.patch("/api/policy-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const policyTemplate = await storage.updatePolicyTemplate(id, req.body);
      
      if (!policyTemplate) {
        return res.status(404).json({ message: "Policy template not found" });
      }
      
      res.json(policyTemplate);
    } catch (error) {
      console.error('Error updating policy template:', error);
      res.status(500).json({ message: "Failed to update policy template" });
    }
  });

  app.delete("/api/policy-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePolicyTemplate(id);
      
      if (!success) {
        return res.status(404).json({ message: "Policy template not found" });
      }
      
      res.json({ message: "Policy template deleted successfully" });
    } catch (error) {
      console.error('Error deleting policy template:', error);
      res.status(500).json({ message: "Failed to delete policy template" });
    }
  });

  // Wallet routes
  app.get("/api/wallet/:userId", async (req, res) => {
    try {
      const wallet = await storage.getWallet(parseInt(req.params.userId));
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const transactions = await storage.getWalletTransactions(wallet.id);
      res.json({ ...wallet, transactions });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  // Loyalty program routes
  // Put specific routes before parameterized routes
  app.get("/api/loyalty/all", async (req, res) => {
    try {
      const loyaltyPrograms = [];
      res.json(loyaltyPrograms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all loyalty programs" });
    }
  });

  app.get("/api/loyalty/:userId", async (req, res) => {
    try {
      const loyaltyProgram = await storage.getLoyaltyProgram(parseInt(req.params.userId));
      if (!loyaltyProgram) {
        return res.status(404).json({ message: "Loyalty program not found" });
      }
      res.json(loyaltyProgram);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loyalty program" });
    }
  });

  // Promotions routes
  app.get("/api/promotions", async (req, res) => {
    try {
      const promotions = await storage.getActivePromotions();
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  app.get("/api/promotions/code/:code", async (req, res) => {
    try {
      const promotion = await storage.getPromotionByCode(req.params.code);
      if (!promotion) {
        return res.status(404).json({ message: "Invalid promo code" });
      }
      res.json(promotion);
    } catch (error) {
      res.status(500).json({ message: "Failed to validate promo code" });
    }
  });


  app.post("/api/loyalty", async (req, res) => {
    try {
      const { userId } = req.body;
      
      // Check if loyalty program already exists for user
      const existing = await storage.getLoyaltyProgram(userId);
      if (existing) {
        return res.status(400).json({ message: "Loyalty program already exists for this user" });
      }
      
      const loyaltyProgram = await storage.createLoyaltyProgram({ userId });
      res.status(201).json(loyaltyProgram);
    } catch (error) {
      res.status(500).json({ message: "Failed to create loyalty program" });
    }
  });

  app.put("/api/loyalty/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updates = req.body;
      
      const loyaltyProgram = await storage.updateLoyaltyProgram(userId, updates);
      if (!loyaltyProgram) {
        return res.status(404).json({ message: "Loyalty program not found" });
      }
      
      res.json(loyaltyProgram);
    } catch (error) {
      res.status(500).json({ message: "Failed to update loyalty program" });
    }
  });

  // Additional Promotion routes for admin management
  app.get("/api/promotions/all", async (req, res) => {
    try {
      const promotions = await storage.getAllPromotions();
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all promotions" });
    }
  });


  app.post("/api/promotions", async (req, res) => {
    try {
      const promotionData = req.body;
      const promotion = await storage.createPromotion(promotionData);
      res.status(201).json(promotion);
    } catch (error) {
      res.status(500).json({ message: "Failed to create promotion" });
    }
  });

  app.put("/api/promotions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const promotion = await storage.updatePromotion(id, updates);
      if (!promotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }
      
      res.json(promotion);
    } catch (error) {
      res.status(500).json({ message: "Failed to update promotion" });
    }
  });

  app.delete("/api/promotions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePromotion(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Promotion not found" });
      }
      
      res.json({ message: "Promotion deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete promotion" });
    }
  });

  // Wishlist routes
  app.get("/api/wishlist/:userId", async (req, res) => {
    try {
      const wishlist = await storage.getWishlistByUser(parseInt(req.params.userId));
      
      // Get property details for each wishlist item
      const wishlistWithProperties = await Promise.all(
        wishlist.map(async (item) => {
          const property = await storage.getProperty(item.propertyId);
          return { ...item, property };
        })
      );
      
      res.json(wishlistWithProperties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/wishlist", async (req, res) => {
    try {
      const { userId, propertyId } = req.body;
      
      if (!userId || !propertyId) {
        return res.status(400).json({ message: "User ID and Property ID are required" });
      }
      
      const wishlistItem = await storage.addToWishlist({ userId, propertyId });
      res.status(201).json(wishlistItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/wishlist/:userId/:propertyId", async (req, res) => {
    try {
      const removed = await storage.removeFromWishlist(
        parseInt(req.params.userId), 
        parseInt(req.params.propertyId)
      );
      
      if (!removed) {
        return res.status(404).json({ message: "Wishlist item not found" });
      }
      
      res.json({ message: "Removed from wishlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  // Reviews routes
  app.get("/api/reviews", async (req, res) => {
    try {
      const { propertyId } = req.query;
      if (propertyId) {
        // Return empty array since reviews table is empty - frontend uses mock data
        res.json([]);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const validatedData = insertFranchiseInquirySchema.parse(req.body);
      const review = await storage.createReview(validatedData as any);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Policy Templates routes
  app.get("/api/policy-templates", async (req, res) => {
    try {
      // Mock policy templates since table has limited data
      const mockPolicies = [
        {
          id: 1,
          policyType: "cancellation",
          policyTitle: "Standard Cancellation Policy",
          policyContent: "Free cancellation up to 24 hours before check-in. After that, 1 night charge applies.",
          isActive: true
        },
        {
          id: 2,
          policyType: "checkin",
          policyTitle: "Check-in & Check-out Policy", 
          policyContent: "Check-in: 2:00 PM onwards. Check-out: 11:00 AM. Early check-in and late check-out subject to availability.",
          isActive: true
        },
        {
          id: 3,
          policyType: "pet",
          policyTitle: "Pet Policy",
          policyContent: "Pets are welcome with prior approval. Additional cleaning fee of ₹500 per pet applies.",
          isActive: true
        },
        {
          id: 4,
          policyType: "smoking",
          policyTitle: "Smoking Policy",
          policyContent: "This is a non-smoking property. Smoking is only permitted in designated outdoor areas.",
          isActive: true
        },
        {
          id: 5,
          policyType: "payment",
          policyTitle: "Payment Policy",
          policyContent: "All major credit cards and UPI payments accepted. Full payment required at check-in.",
          isActive: true
        }
      ];
      res.json(mockPolicies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch policy templates" });
    }
  });

  // Franchise inquiry routes
  app.post("/api/franchise-inquiry", async (req, res) => {
    try {
      const validatedData = insertFranchiseInquirySchema.parse(req.body);
      const inquiry = await storage.createFranchiseInquiry(validatedData);
      res.status(201).json({ 
        message: "Thank you for your interest in partnering with RoomNest. Our team will review your details and contact you within 3-5 business days.",
        inquiry 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit inquiry" });
    }
  });

  // Notifications routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(parseInt(req.params.userId));
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationRead(parseInt(req.params.id));
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Admin routes for PMS integrations
  app.get("/api/pms-integrations", async (req, res) => {
    try {
      const mockIntegrations = [
        {
          id: "pms-oracle",
          name: "Oracle Opera",
          isConnected: false,
          lastSyncAt: null,
          status: "disconnected"
        },
        {
          id: "pms-fidelio",
          name: "Fidelio Suite",
          isConnected: true,
          lastSyncAt: new Date(Date.now() - 3600000), // 1 hour ago
          status: "active"
        },
        {
          id: "pms-cloudbeds",
          name: "Cloudbeds PMS",
          isConnected: false,
          lastSyncAt: null,
          status: "disconnected"
        }
      ];
      res.json(mockIntegrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PMS integrations" });
    }
  });

  app.patch("/api/pms-integrations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { isConnected, lastSyncAt } = req.body;
      
      // Mock update response
      const updatedIntegration = {
        id,
        name: id === "pms-oracle" ? "Oracle Opera" : 
              id === "pms-fidelio" ? "Fidelio Suite" : "Cloudbeds PMS",
        isConnected,
        lastSyncAt: isConnected ? (lastSyncAt || new Date()) : null,
        status: isConnected ? "active" : "disconnected"
      };
      
      res.json(updatedIntegration);
    } catch (error) {
      res.status(500).json({ message: "Failed to update PMS integration" });
    }
  });

  // Admin dashboard stats
  app.get("/api/stats/dashboard", async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      const bookings = await storage.getAllBookings();
      
      const stats = {
        totalBookings: bookings.length,
        revenue: bookings.reduce((sum, booking) => sum + parseFloat(booking.totalAmount || "0"), 0),
        properties: properties.length,
        activeUsers: 127, // Mock data
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Plan Master CRUD endpoints
  app.get("/api/plan-masters", async (req, res) => {
    try {
      const { planType, popular } = req.query;
      
      let plans;
      if (popular === 'true') {
        plans = await storage.getPopularPlanMasters();
      } else if (planType) {
        plans = await storage.getAllPlanMasters({ planType: planType as string });
      } else {
        plans = await storage.getAllPlanMasters();
      }
      
      res.json(plans);
    } catch (error) {
      console.error('Error fetching plan masters:', error);
      res.status(500).json({ message: "Failed to fetch plan masters" });
    }
  });

  app.get("/api/plan-masters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.getPlanMaster(id);
      
      if (!plan) {
        return res.status(404).json({ message: "Plan master not found" });
      }
      
      res.json(plan);
    } catch (error) {
      console.error('Error fetching plan master:', error);
      res.status(500).json({ message: "Failed to fetch plan master" });
    }
  });

  app.get("/api/plan-masters/code/:planCode", async (req, res) => {
    try {
      const { planCode } = req.params;
      const plan = await storage.getPlanMasterByCode(planCode);
      
      if (!plan) {
        return res.status(404).json({ message: "Plan master not found" });
      }
      
      res.json(plan);
    } catch (error) {
      console.error('Error fetching plan master by code:', error);
      res.status(500).json({ message: "Failed to fetch plan master" });
    }
  });

  app.post("/api/plan-masters", async (req, res) => {
    try {
      const validatedData: NewPlanMaster = insertPlanMasterSchema.parse(req.body);
      
      // Check if plan code already exists
      const existingPlan = await storage.getPlanMasterByCode(validatedData.planCode);
      if (existingPlan) {
        return res.status(400).json({ message: "Plan code already exists" });
      }
      
      const plan = await storage.createPlanMaster(validatedData);
      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid plan data", errors: error.errors });
      }
      console.error('Error creating plan master:', error);
      res.status(500).json({ message: "Failed to create plan master" });
    }
  });

  app.put("/api/plan-masters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.updatePlanMaster(id, req.body);
      
      if (!plan) {
        return res.status(404).json({ message: "Plan master not found" });
      }
      
      res.json(plan);
    } catch (error) {
      console.error('Error updating plan master:', error);
      res.status(500).json({ message: "Failed to update plan master" });
    }
  });

  app.delete("/api/plan-masters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePlanMaster(id);
      
      if (!success) {
        return res.status(404).json({ message: "Plan master not found" });
      }
      
      res.json({ message: "Plan master deleted successfully" });
    } catch (error) {
      console.error('Error deleting plan master:', error);
      res.status(500).json({ message: "Failed to delete plan master" });
    }
  });

  // Meal Inclusion Master Management Routes
  app.get("/api/meal-inclusions", async (req, res) => {
    try {
      const { isActive, mealCategory } = req.query;
      const filters = {
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        mealCategory: mealCategory as string
      };
      
      const mealInclusions = await storage.getAllMealInclusions(filters);
      res.json(mealInclusions);
    } catch (error) {
      console.error('Error fetching meal inclusions:', error);
      res.status(500).json({ message: "Failed to fetch meal inclusions" });
    }
  });

  app.get("/api/meal-inclusions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mealInclusion = await storage.getMealInclusionById(id);
      
      if (!mealInclusion) {
        return res.status(404).json({ message: "Meal inclusion not found" });
      }
      
      res.json(mealInclusion);
    } catch (error) {
      console.error('Error fetching meal inclusion:', error);
      res.status(500).json({ message: "Failed to fetch meal inclusion" });
    }
  });

  app.get("/api/meal-inclusions/code/:mealCode", async (req, res) => {
    try {
      const { mealCode } = req.params;
      const mealInclusion = await storage.getMealInclusionByCode(mealCode);
      
      if (!mealInclusion) {
        return res.status(404).json({ message: "Meal inclusion not found" });
      }
      
      res.json(mealInclusion);
    } catch (error) {
      console.error('Error fetching meal inclusion by code:', error);
      res.status(500).json({ message: "Failed to fetch meal inclusion" });
    }
  });

  app.post("/api/meal-inclusions", async (req, res) => {
    try {
      const validatedData: NewMealInclusionMaster = insertMealInclusionMasterSchema.parse(req.body);
      
      // Check if meal code already exists
      const existingMeal = await storage.getMealInclusionByCode(validatedData.mealCode);
      if (existingMeal) {
        return res.status(400).json({ message: "Meal code already exists" });
      }
      
      const mealInclusion = await storage.createMealInclusion(validatedData);
      res.status(201).json(mealInclusion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid meal inclusion data", errors: error.errors });
      }
      console.error('Error creating meal inclusion:', error);
      res.status(500).json({ message: "Failed to create meal inclusion" });
    }
  });

  app.put("/api/meal-inclusions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mealInclusion = await storage.updateMealInclusion(id, req.body);
      
      if (!mealInclusion) {
        return res.status(404).json({ message: "Meal inclusion not found" });
      }
      
      res.json(mealInclusion);
    } catch (error) {
      console.error('Error updating meal inclusion:', error);
      res.status(500).json({ message: "Failed to update meal inclusion" });
    }
  });

  app.delete("/api/meal-inclusions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMealInclusion(id);
      
      if (!success) {
        return res.status(404).json({ message: "Meal inclusion not found" });
      }
      
      res.json({ message: "Meal inclusion deleted successfully" });
    } catch (error) {
      console.error('Error deleting meal inclusion:', error);
      res.status(500).json({ message: "Failed to delete meal inclusion" });
    }
  });

  // Plan Meal Inclusions Routes (Junction table operations)
  app.get("/api/plans/:planId/meal-inclusions", async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const planMealInclusions = await storage.getPlanMealInclusions(planId);
      res.json(planMealInclusions);
    } catch (error) {
      console.error('Error fetching plan meal inclusions:', error);
      res.status(500).json({ message: "Failed to fetch plan meal inclusions" });
    }
  });

  app.post("/api/plans/:planId/meal-inclusions", async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const validatedData: NewPlanMealInclusion = insertPlanMealInclusionSchema.parse({
        ...req.body,
        planId
      });
      
      const planMealInclusion = await storage.createPlanMealInclusion(validatedData);
      res.status(201).json(planMealInclusion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid plan meal inclusion data", errors: error.errors });
      }
      console.error('Error creating plan meal inclusion:', error);
      res.status(500).json({ message: "Failed to create plan meal inclusion" });
    }
  });

  app.delete("/api/plans/:planId/meal-inclusions/:mealInclusionId", async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const mealInclusionId = parseInt(req.params.mealInclusionId);
      const success = await storage.deletePlanMealInclusion(planId, mealInclusionId);
      
      if (!success) {
        return res.status(404).json({ message: "Plan meal inclusion not found" });
      }
      
      res.json({ message: "Plan meal inclusion removed successfully" });
    } catch (error) {
      console.error('Error deleting plan meal inclusion:', error);
      res.status(500).json({ message: "Failed to delete plan meal inclusion" });
    }
  });

  // Plan Property Pricing CRUD endpoints
  app.get("/api/plan-property-pricing", async (req, res) => {
    try {
      const { propertyId, planId } = req.query;
      
      if (!propertyId) {
        return res.status(400).json({ message: "Property ID is required" });
      }
      
      const pricing = await storage.getPlanPropertyPricing(
        parseInt(propertyId as string),
        planId ? parseInt(planId as string) : undefined
      );
      
      res.json(pricing);
    } catch (error) {
      console.error('Error fetching plan property pricing:', error);
      res.status(500).json({ message: "Failed to fetch pricing" });
    }
  });

  app.get("/api/plan-property-pricing/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pricing = await storage.getPlanPropertyPricingById(id);
      
      if (!pricing) {
        return res.status(404).json({ message: "Pricing not found" });
      }
      
      res.json(pricing);
    } catch (error) {
      console.error('Error fetching plan property pricing:', error);
      res.status(500).json({ message: "Failed to fetch pricing" });
    }
  });

  app.post("/api/plan-property-pricing", async (req, res) => {
    try {
      const validatedData = insertPlanPropertyPricingSchema.parse(req.body);
      const pricing = await storage.createPlanPropertyPricing(validatedData);
      res.status(201).json(pricing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid pricing data", errors: error.errors });
      }
      console.error('Error creating plan property pricing:', error);
      res.status(500).json({ message: "Failed to create pricing" });
    }
  });

  app.put("/api/plan-property-pricing/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pricing = await storage.updatePlanPropertyPricing(id, req.body);
      
      if (!pricing) {
        return res.status(404).json({ message: "Pricing not found" });
      }
      
      res.json(pricing);
    } catch (error) {
      console.error('Error updating plan property pricing:', error);
      res.status(500).json({ message: "Failed to update pricing" });
    }
  });

  app.delete("/api/plan-property-pricing/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePlanPropertyPricing(id);
      
      if (!success) {
        return res.status(404).json({ message: "Pricing not found" });
      }
      
      res.json({ message: "Pricing deleted successfully" });
    } catch (error) {
      console.error('Error deleting plan property pricing:', error);
      res.status(500).json({ message: "Failed to delete pricing" });
    }
  });

  // Currency Master Routes
  
  // Get all currencies
  app.get("/api/currencies", async (req, res) => {
    try {
      const currencies = await storage.getAllCurrencyMasters();
      res.json(currencies);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      res.status(500).json({ error: "Failed to fetch currencies" });
    }
  });

  // Get currency by ID
  app.get("/api/currencies/:id", async (req, res) => {
    try {
      const currency = await storage.getCurrencyMaster(parseInt(req.params.id));
      if (!currency) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      console.error("Error fetching currency:", error);
      res.status(500).json({ error: "Failed to fetch currency" });
    }
  });

  // Get currency by short name
  app.get("/api/currencies/code/:shortName", async (req, res) => {
    try {
      const currency = await storage.getCurrencyMasterByShortName(req.params.shortName);
      if (!currency) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      console.error("Error fetching currency:", error);
      res.status(500).json({ error: "Failed to fetch currency" });
    }
  });

  // Get base currency
  app.get("/api/currencies/base", async (req, res) => {
    try {
      const currency = await storage.getBaseCurrency();
      if (!currency) {
        return res.status(404).json({ error: "Base currency not found" });
      }
      res.json(currency);
    } catch (error) {
      console.error("Error fetching base currency:", error);
      res.status(500).json({ error: "Failed to fetch base currency" });
    }
  });

  // Create new currency
  app.post("/api/currencies", async (req, res) => {
    try {
      const result = insertCurrencyMasterSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid currency data", 
          details: result.error.errors 
        });
      }

      const currency = await storage.createCurrencyMaster(result.data);
      res.status(201).json(currency);
    } catch (error) {
      console.error("Error creating currency:", error);
      res.status(500).json({ error: "Failed to create currency" });
    }
  });

  // Update currency
  app.put("/api/currencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertCurrencyMasterSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid currency data", 
          details: result.error.errors 
        });
      }

      const currency = await storage.updateCurrencyMaster(id, result.data);
      if (!currency) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      console.error("Error updating currency:", error);
      res.status(500).json({ error: "Failed to update currency" });
    }
  });

  // Delete currency
  app.delete("/api/currencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCurrencyMaster(id);
      if (!success) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting currency:", error);
      res.status(500).json({ error: "Failed to delete currency" });
    }
  });

  // Set base currency
  app.post("/api/currencies/:id/set-base", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.setBaseCurrency(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting base currency:", error);
      res.status(500).json({ error: "Failed to set base currency" });
    }
  });

  // Rate Master Routes
  
  // Get all rates with optional filters
  app.get("/api/rates", async (req, res) => {
    try {
      const { propertyId, roomTypeId, isActive, fromDate, toDate } = req.query;
      
      const filters: any = {};
      if (propertyId) filters.propertyId = parseInt(propertyId as string);
      if (roomTypeId) filters.roomTypeId = parseInt(roomTypeId as string);
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (fromDate && toDate) {
        filters.dateRange = { 
          fromDate: fromDate as string, 
          toDate: toDate as string 
        };
      }

      const rates = await storage.getAllRateMasters(filters);
      res.json(rates);
    } catch (error) {
      console.error("Error fetching rates:", error);
      res.status(500).json({ error: "Failed to fetch rates" });
    }
  });

  // Get rate by ID
  app.get("/api/rates/:id", async (req, res) => {
    try {
      const rate = await storage.getRateMaster(parseInt(req.params.id));
      if (!rate) {
        return res.status(404).json({ error: "Rate not found" });
      }
      res.json(rate);
    } catch (error) {
      console.error("Error fetching rate:", error);
      res.status(500).json({ error: "Failed to fetch rate" });
    }
  });

  // Get rates by property
  app.get("/api/rates/property/:propertyId", async (req, res) => {
    try {
      const rates = await storage.getRatesByProperty(parseInt(req.params.propertyId));
      res.json(rates);
    } catch (error) {
      console.error("Error fetching rates by property:", error);
      res.status(500).json({ error: "Failed to fetch rates" });
    }
  });

  // Get rates by room type
  app.get("/api/rates/roomtype/:roomTypeId", async (req, res) => {
    try {
      const rates = await storage.getRatesByRoomType(parseInt(req.params.roomTypeId));
      res.json(rates);
    } catch (error) {
      console.error("Error fetching rates by room type:", error);
      res.status(500).json({ error: "Failed to fetch rates" });
    }
  });

  // Get applicable rates for specific date
  app.get("/api/rates/applicable", async (req, res) => {
    try {
      const { propertyId, roomTypeId, checkDate } = req.query;
      
      if (!propertyId || !roomTypeId || !checkDate) {
        return res.status(400).json({ 
          error: "propertyId, roomTypeId, and checkDate are required" 
        });
      }

      const rates = await storage.getApplicableRates(
        parseInt(propertyId as string),
        parseInt(roomTypeId as string),
        checkDate as string
      );
      res.json(rates);
    } catch (error) {
      console.error("Error fetching applicable rates:", error);
      res.status(500).json({ error: "Failed to fetch applicable rates" });
    }
  });

  // Bulk rate update endpoint (following room inventory pattern)
  app.put("/api/rates/bulk", async (req, res) => {
    try {
      console.log('=== BULK RATE UPDATE REQUEST ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const { rateUpdates } = req.body;
      
      if (!Array.isArray(rateUpdates) || rateUpdates.length === 0) {
        return res.status(400).json({ error: "No rate updates provided" });
      }
      
      const results = [];
      
      for (const update of rateUpdates) {
        const { propertyId, roomTypeId, date, rate } = update;
        
        // Check if rate already exists for this date and room type
        const existingRates = await storage.getApplicableRates(propertyId, roomTypeId, date, date);
        const rateData = {
          propertyId,
          roomTypeId,
          currencyId: 16, // Default to INR
          rateName: `Matrix Rate - ${date}`,
          fromDate: date,
          toDate: date,
          singleOccupancyRate: rate,
          doubleOccupancyRate: rate,
          tripleOccupancyRate: rate,
          quadrupleOccupancyRate: rate,
          extraPersonCharge: '0.00',
          petCharge: '0.00',
          childCharge: '0.00',
          infantCharge: '0.00',
          weekendSurcharge: '0.00',
          festivalSurcharge: '0.00'
        };
        
        let result;
        if (existingRates.length > 0) {
          // Update existing rate
          const existingRate = existingRates[0];
          result = await storage.updateRateMaster(existingRate.id, {
            singleOccupancyRate: parseFloat(rate).toFixed(2),
            doubleOccupancyRate: parseFloat(rate).toFixed(2),
            tripleOccupancyRate: parseFloat(rate).toFixed(2),
            quadrupleOccupancyRate: parseFloat(rate).toFixed(2)
          });
        } else {
          // Create new rate
          result = await storage.createRateMaster(rateData);
        }
        
        results.push(result);
      }
      
      console.log(`✅ Bulk rate update completed: ${results.length} rates processed`);
      res.status(200).json({ message: `Updated ${results.length} rates`, results });
      
    } catch (error) {
      console.error("Error in bulk rate update:", error);
      res.status(500).json({ error: "Failed to update rates" });
    }
  });

  // Create new rate
  app.post("/api/rates", async (req, res) => {
    try {
      console.log('=== RATE CREATION REQUEST ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const result = insertRateMasterSchema.safeParse(req.body);
      if (!result.success) {
        console.error('=== VALIDATION FAILED ===');
        console.error('Validation errors:', JSON.stringify(result.error.errors, null, 2));
        console.error('Request data that failed:', JSON.stringify(req.body, null, 2));
        return res.status(400).json({ 
          error: "Invalid rate data", 
          details: result.error.errors 
        });
      }

      console.log('✅ Validation passed, creating rate...');
      const rate = await storage.createRateMaster(result.data);
      console.log('✅ Rate created successfully:', rate.id);
      res.status(201).json(rate);
    } catch (error) {
      console.error("Error creating rate:", error);
      res.status(500).json({ error: "Failed to create rate" });
    }
  });

  // Update rate (both PUT and PATCH supported)
  const updateRateHandler = async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Updating rate ${id} with data:`, req.body);
      
      const result = insertRateMasterSchema.partial().safeParse(req.body);
      if (!result.success) {
        console.error("Rate validation failed:", result.error.errors);
        return res.status(400).json({ 
          error: "Invalid rate data", 
          details: result.error.errors 
        });
      }

      const rate = await storage.updateRateMaster(id, result.data);
      if (!rate) {
        console.error(`Rate ${id} not found`);
        return res.status(404).json({ error: "Rate not found" });
      }
      console.log(`Rate ${id} updated successfully:`, rate);
      res.json(rate);
    } catch (error) {
      console.error("Error updating rate:", error);
      res.status(500).json({ error: "Failed to update rate" });
    }
  };

  app.put("/api/rates/:id", updateRateHandler);
  app.patch("/api/rates/:id", updateRateHandler);

  // Delete rate
  app.delete("/api/rates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRateMaster(id);
      if (!success) {
        return res.status(404).json({ error: "Rate not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting rate:", error);
      res.status(500).json({ error: "Failed to delete rate" });
    }
  });

  // Enhanced Booking System Routes
  app.get("/api/enhanced-bookings", async (req, res) => {
    try {
      const { status, propertyId, guestEmail, fromDate, toDate } = req.query;
      const filters: any = {};
      
      if (status) filters.status = status as string;
      if (propertyId) filters.propertyId = parseInt(propertyId as string);
      if (guestEmail) filters.guestEmail = guestEmail as string;
      if (fromDate && toDate) {
        filters.dateRange = { fromDate: fromDate as string, toDate: toDate as string };
      }
      
      const bookings = await storage.getAllBookings(filters);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching enhanced bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.post("/api/enhanced-bookings", async (req, res) => {
    try {
      const validation = insertEnhancedBookingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid booking data", details: validation.error.issues });
      }
      
      const booking = await storage.createBooking(validation.data);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // Search and Availability Routes
  app.get("/api/search/properties", async (req, res) => {
    try {
      const { location, checkIn, checkOut, guests, rooms, propertyType } = req.query;
      
      if (!checkIn || !checkOut || !guests || !rooms) {
        return res.status(400).json({ error: "Missing required search parameters" });
      }
      
      const searchParams = {
        location: location as string,
        checkIn: checkIn as string,
        checkOut: checkOut as string,
        guests: parseInt(guests as string),
        rooms: parseInt(rooms as string),
        propertyType: propertyType as string
      };
      
      const properties = await storage.searchAvailableProperties(searchParams);
      res.json(properties);
    } catch (error) {
      console.error("Error searching properties:", error);
      res.status(500).json({ error: "Failed to search properties" });
    }
  });

  app.post("/api/calculate-price", async (req, res) => {
    try {
      const { propertyId, roomTypeId, checkIn, checkOut, adults, children, infants, rooms, planMasterId } = req.body;
      
      if (!propertyId || !roomTypeId || !checkIn || !checkOut || !adults || !rooms) {
        return res.status(400).json({ error: "Missing required pricing parameters" });
      }
      
      const pricing = await storage.calculateBookingPrice(
        propertyId, roomTypeId, checkIn, checkOut, adults, children || 0, infants || 0, rooms, planMasterId
      );
      
      res.json(pricing);
    } catch (error) {
      console.error("Error calculating price:", error);
      res.status(500).json({ error: "Failed to calculate booking price" });
    }
  });

  // Room Inventory Management Routes
  app.get("/api/room-inventory", async (req, res) => {
    try {
      const { propertyId, roomTypeId, startDate, endDate, isActive } = req.query;
      const filters = {
        propertyId: propertyId ? parseInt(propertyId as string) : undefined,
        roomTypeId: roomTypeId ? parseInt(roomTypeId as string) : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };
      
      const inventories = await storage.getAllRoomInventory(filters);
      res.json(inventories);
    } catch (error) {
      console.error("Error fetching room inventory:", error);
      res.status(500).json({ error: "Failed to fetch room inventory" });
    }
  });

  app.get("/api/room-inventory/:propertyId/:roomTypeId", async (req, res) => {
    try {
      const { propertyId, roomTypeId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }
      
      const inventories = await storage.getRoomInventory(
        parseInt(propertyId), 
        parseInt(roomTypeId), 
        startDate as string, 
        endDate as string
      );
      
      res.json(inventories);
    } catch (error) {
      console.error("Error fetching room inventory by date range:", error);
      res.status(500).json({ error: "Failed to fetch room inventory" });
    }
  });

  // Get room inventory for all room types of a property
  app.get("/api/room-inventory/:propertyId/all", async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }
      
      const inventories = await storage.getAllRoomInventoryForProperty(
        parseInt(propertyId), 
        startDate as string, 
        endDate as string
      );
      
      res.json(inventories);
    } catch (error) {
      console.error("Error fetching all room inventory for property:", error);
      res.status(500).json({ error: "Failed to fetch room inventory" });
    }
  });

  app.post("/api/room-inventory", async (req, res) => {
    try {
      const inventoryData = req.body;
      
      // Validate required fields
      if (!inventoryData.propertyId || !inventoryData.roomTypeId || !inventoryData.date || inventoryData.totalRooms === undefined) {
        return res.status(400).json({ error: "Missing required fields: propertyId, roomTypeId, date, totalRooms" });
      }
      
      const inventory = await storage.createRoomInventory(inventoryData);
      res.status(201).json(inventory);
    } catch (error) {
      console.error("Error creating room inventory:", error);
      res.status(500).json({ error: "Failed to create room inventory" });
    }
  });

  app.put("/api/room-inventory/bulk", async (req, res) => {
    try {
      const { inventoryUpdates } = req.body;
      
      if (!Array.isArray(inventoryUpdates) || inventoryUpdates.length === 0) {
        return res.status(400).json({ error: "inventoryUpdates array is required" });
      }
      
      await storage.bulkUpdateRoomInventory(inventoryUpdates);
      res.json({ message: "Room inventory updated successfully" });
    } catch (error) {
      console.error("Error updating room inventory bulk:", error);
      res.status(500).json({ error: "Failed to update room inventory" });
    }
  });

  app.put("/api/room-inventory/:propertyId/:roomTypeId/:date", async (req, res) => {
    try {
      const { propertyId, roomTypeId, date } = req.params;
      const { availableRooms } = req.body;
      
      if (availableRooms === undefined) {
        return res.status(400).json({ error: "availableRooms is required" });
      }
      
      await storage.updateRoomInventory(
        parseInt(propertyId), 
        parseInt(roomTypeId), 
        date, 
        { availableRooms: parseInt(availableRooms) }
      );
      
      res.json({ message: "Room inventory updated successfully" });
    } catch (error) {
      console.error("Error updating room inventory:", error);
      res.status(500).json({ error: "Failed to update room inventory" });
    }
  });

  app.delete("/api/room-inventory/:propertyId/:roomTypeId/:date", async (req, res) => {
    try {
      const { propertyId, roomTypeId, date } = req.params;
      
      const deleted = await storage.deleteRoomInventory(
        parseInt(propertyId), 
        parseInt(roomTypeId), 
        date
      );
      
      if (deleted) {
        res.json({ message: "Room inventory deleted successfully" });
      } else {
        res.status(404).json({ error: "Room inventory not found" });
      }
    } catch (error) {
      console.error("Error deleting room inventory:", error);
      res.status(500).json({ error: "Failed to delete room inventory" });
    }
  });

  // General Ledger Master Routes
  app.get("/api/general-ledger-accounts", async (req, res) => {
    try {
      const { accountType, isActive, parentAccountId } = req.query;
      const filters: any = {};
      
      if (accountType) filters.accountType = accountType as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (parentAccountId) filters.parentAccountId = parseInt(parentAccountId as string);
      
      const accounts = await storage.getAllGeneralLedgerAccounts(filters);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching general ledger accounts:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.get("/api/general-ledger-accounts/:id", async (req, res) => {
    try {
      const account = await storage.getGeneralLedgerAccount(parseInt(req.params.id));
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ error: "Failed to fetch account" });
    }
  });

  app.post("/api/general-ledger-accounts", async (req, res) => {
    try {
      const validation = insertGeneralLedgerMasterSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid account data", details: validation.error.issues });
      }
      
      const account = await storage.createGeneralLedgerAccount(validation.data);
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.put("/api/general-ledger-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.updateGeneralLedgerAccount(id, req.body);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(500).json({ error: "Failed to update account" });
    }
  });

  app.delete("/api/general-ledger-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteGeneralLedgerAccount(id);
      if (!success) {
        return res.status(400).json({ error: "Cannot delete account with child accounts or non-zero balance" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  app.get("/api/general-ledger-accounts/by-type/:accountType", async (req, res) => {
    try {
      const accounts = await storage.getAccountsByType(req.params.accountType);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts by type:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.put("/api/general-ledger-accounts/:id/balance", async (req, res) => {
    try {
      const { newBalance } = req.body;
      if (!newBalance || isNaN(parseFloat(newBalance))) {
        return res.status(400).json({ error: "Valid balance amount is required" });
      }
      
      const success = await storage.updateAccountBalance(parseInt(req.params.id), newBalance);
      if (!success) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating account balance:", error);
      res.status(500).json({ error: "Failed to update balance" });
    }
  });

  // Subledger Master Routes
  app.get("/api/subledgers", async (req, res) => {
    try {
      const { generalLedgerAccountId, isActive, isDefaultLedger } = req.query;
      const filters: any = {};
      
      if (generalLedgerAccountId) filters.generalLedgerAccountId = parseInt(generalLedgerAccountId as string);
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (isDefaultLedger !== undefined) filters.isDefaultLedger = isDefaultLedger === 'true';
      
      const subledgers = await storage.getAllSubledgers(filters);
      res.json(subledgers);
    } catch (error) {
      console.error("Error fetching subledgers:", error);
      res.status(500).json({ error: "Failed to fetch subledgers" });
    }
  });

  app.get("/api/subledgers/:id", async (req, res) => {
    try {
      const subledger = await storage.getSubledger(parseInt(req.params.id));
      if (!subledger) {
        return res.status(404).json({ error: "Subledger not found" });
      }
      res.json(subledger);
    } catch (error) {
      console.error("Error fetching subledger:", error);
      res.status(500).json({ error: "Failed to fetch subledger" });
    }
  });

  app.post("/api/subledgers", async (req, res) => {
    try {
      const validation = insertSubledgerMasterSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid subledger data", details: validation.error.issues });
      }
      
      const subledger = await storage.createSubledger(validation.data);
      res.status(201).json(subledger);
    } catch (error) {
      console.error("Error creating subledger:", error);
      res.status(500).json({ error: "Failed to create subledger" });
    }
  });

  app.put("/api/subledgers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subledger = await storage.updateSubledger(id, req.body);
      if (!subledger) {
        return res.status(404).json({ error: "Subledger not found" });
      }
      res.json(subledger);
    } catch (error) {
      console.error("Error updating subledger:", error);
      res.status(500).json({ error: "Failed to update subledger" });
    }
  });

  app.delete("/api/subledgers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSubledger(id);
      if (!success) {
        return res.status(400).json({ error: "Cannot delete subledger with non-zero balance" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subledger:", error);
      res.status(500).json({ error: "Failed to delete subledger" });
    }
  });

  app.get("/api/subledgers/by-account/:accountId", async (req, res) => {
    try {
      const subledgers = await storage.getSubledgersByAccount(parseInt(req.params.accountId));
      res.json(subledgers);
    } catch (error) {
      console.error("Error fetching subledgers by account:", error);
      res.status(500).json({ error: "Failed to fetch subledgers" });
    }
  });

  app.put("/api/subledgers/:id/balance", async (req, res) => {
    try {
      const { newBalance } = req.body;
      if (!newBalance || isNaN(parseFloat(newBalance))) {
        return res.status(400).json({ error: "Valid balance amount is required" });
      }
      
      const success = await storage.updateSubledgerBalance(parseInt(req.params.id), newBalance);
      if (!success) {
        return res.status(404).json({ error: "Subledger not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating subledger balance:", error);
      res.status(500).json({ error: "Failed to update balance" });
    }
  });

  app.put("/api/subledgers/:id/set-default", async (req, res) => {
    try {
      await storage.setDefaultSubledger(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default subledger:", error);
      res.status(500).json({ error: "Failed to set default subledger" });
    }
  });

  // Tariff Setup Master Routes
  app.get("/api/tariff-setups", async (req, res) => {
    try {
      const { isActive, subledgerId, validDate } = req.query;
      const filters: any = {};
      
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (subledgerId) filters.subledgerId = parseInt(subledgerId as string);
      if (validDate) filters.validDate = validDate as string;
      
      const tariffs = await storage.getAllTariffSetups(filters);
      res.json(tariffs);
    } catch (error) {
      console.error("Error fetching tariff setups:", error);
      res.status(500).json({ error: "Failed to fetch tariff setups" });
    }
  });

  app.get("/api/tariff-setups/:id", async (req, res) => {
    try {
      const tariff = await storage.getTariffSetup(parseInt(req.params.id));
      if (!tariff) {
        return res.status(404).json({ error: "Tariff setup not found" });
      }
      res.json(tariff);
    } catch (error) {
      console.error("Error fetching tariff setup:", error);
      res.status(500).json({ error: "Failed to fetch tariff setup" });
    }
  });

  app.post("/api/tariff-setups", async (req, res) => {
    try {
      const validation = insertTariffSetupMasterSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid tariff setup data", details: validation.error.issues });
      }
      
      // Check for overlapping tariffs
      const overlappingTariff = await storage.checkTariffOverlap(validation.data);
      if (overlappingTariff) {
        return res.status(409).json({ 
          error: "Duplicate tariff setup detected",
          message: `A tariff setup already exists with overlapping amount range (₹${overlappingTariff.fromAmount} - ₹${overlappingTariff.toAmount}) and date range (${overlappingTariff.validFromDate} to ${overlappingTariff.validToDate}). Please adjust your ranges to avoid conflicts.`,
          conflictingTariff: overlappingTariff
        });
      }
      
      const tariff = await storage.createTariffSetup(validation.data);
      res.status(201).json(tariff);
    } catch (error) {
      console.error("Error creating tariff setup:", error);
      res.status(500).json({ error: "Failed to create tariff setup" });
    }
  });

  app.put("/api/tariff-setups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate the update data
      const validation = insertTariffSetupMasterSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid tariff setup data", details: validation.error.issues });
      }
      
      // Check for overlapping tariffs (exclude current tariff from check)
      if (validation.data.fromAmount || validation.data.toAmount || validation.data.validFromDate || validation.data.validToDate) {
        const existingTariff = await storage.getTariffSetup(id);
        if (!existingTariff) {
          return res.status(404).json({ error: "Tariff setup not found" });
        }
        
        // Create a complete tariff object for validation
        const tariffForValidation = {
          ...existingTariff,
          ...validation.data,
          description: validation.data.description !== undefined ? validation.data.description : (existingTariff.description || undefined)
        };
        
        const overlappingTariff = await storage.checkTariffOverlap(tariffForValidation, id);
        if (overlappingTariff) {
          return res.status(409).json({ 
            error: "Duplicate tariff setup detected",
            message: `A tariff setup already exists with overlapping amount range (₹${overlappingTariff.fromAmount} - ₹${overlappingTariff.toAmount}) and date range (${overlappingTariff.validFromDate} to ${overlappingTariff.validToDate}). Please adjust your ranges to avoid conflicts.`,
            conflictingTariff: overlappingTariff
          });
        }
      }
      
      const tariff = await storage.updateTariffSetup(id, validation.data);
      if (!tariff) {
        return res.status(404).json({ error: "Tariff setup not found" });
      }
      res.json(tariff);
    } catch (error) {
      console.error("Error updating tariff setup:", error);
      res.status(500).json({ error: "Failed to update tariff setup" });
    }
  });

  app.delete("/api/tariff-setups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTariffSetup(id);
      if (!success) {
        return res.status(404).json({ error: "Tariff setup not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tariff setup:", error);
      res.status(500).json({ error: "Failed to delete tariff setup" });
    }
  });

  app.get("/api/tariff-setups/by-amount/:amount", async (req, res) => {
    try {
      const tariffs = await storage.getTariffSetupsByAmount(req.params.amount);
      res.json(tariffs);
    } catch (error) {
      console.error("Error fetching tariffs by amount:", error);
      res.status(500).json({ error: "Failed to fetch tariffs" });
    }
  });

  app.get("/api/tariff-setups/by-subledger/:subledgerId", async (req, res) => {
    try {
      const tariffs = await storage.getTariffSetupsBySubledger(parseInt(req.params.subledgerId));
      res.json(tariffs);
    } catch (error) {
      console.error("Error fetching tariffs by subledger:", error);
      res.status(500).json({ error: "Failed to fetch tariffs" });
    }
  });

  app.post("/api/tariff-setups/applicable", async (req, res) => {
    try {
      const { amount, validDate, subledgerId } = req.body;
      if (!amount || !validDate) {
        return res.status(400).json({ error: "Amount and validDate are required" });
      }
      
      const tariff = await storage.getApplicableTariff(amount, validDate, subledgerId);
      if (!tariff) {
        return res.status(404).json({ error: "No applicable tariff found" });
      }
      res.json(tariff);
    } catch (error) {
      console.error("Error finding applicable tariff:", error);
      res.status(500).json({ error: "Failed to find applicable tariff" });
    }
  });

  // User-Property Access Management routes
  app.get("/api/user-property-access", async (req, res) => {
    try {
      const filters = {
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        propertyId: req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
      };
      
      const accesses = await storage.getAllUserPropertyAccess(filters);
      res.json(accesses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user property access" });
    }
  });

  app.get("/api/user-property-access/:id", async (req, res) => {
    try {
      const access = await storage.getUserPropertyAccess(parseInt(req.params.id));
      if (!access) {
        return res.status(404).json({ message: "User property access not found" });
      }
      res.json(access);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user property access" });
    }
  });

  app.post("/api/user-property-access", async (req, res) => {
    try {
      const validatedData = insertUserPropertyAccessSchema.parse(req.body);
      const access = await storage.createUserPropertyAccess(validatedData);
      res.status(201).json(access);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user property access data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user property access" });
    }
  });

  app.put("/api/user-property-access/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertUserPropertyAccessSchema.partial().parse(req.body);
      const access = await storage.updateUserPropertyAccess(id, validatedData);
      
      if (!access) {
        return res.status(404).json({ message: "User property access not found" });
      }
      
      res.json(access);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user property access data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user property access" });
    }
  });

  app.delete("/api/user-property-access/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUserPropertyAccess(id);
      
      if (!success) {
        return res.status(404).json({ message: "User property access not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user property access" });
    }
  });

  app.get("/api/users/:userId/properties", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const properties = await storage.getUserProperties(userId);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user properties" });
    }
  });

  app.get("/api/properties/:propertyId/users", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const users = await storage.getPropertyUsers(propertyId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property users" });
    }
  });

  // Audit Log routes
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const filters = {
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        tableName: req.query.tableName as string,
        action: req.query.action as string,
        propertyId: req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        severity: req.query.severity as string
      };
      
      const logs = await storage.getAllAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/audit-logs/:id", async (req, res) => {
    try {
      const log = await storage.getAuditLog(parseInt(req.params.id));
      if (!log) {
        return res.status(404).json({ message: "Audit log not found" });
      }
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit log" });
    }
  });

  app.post("/api/audit-logs", async (req, res) => {
    try {
      const validatedData = insertAuditLogSchema.parse(req.body);
      const log = await storage.createAuditLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid audit log data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create audit log" });
    }
  });

  // Role Master Management Routes
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.get("/api/roles/active", async (req, res) => {
    try {
      const roles = await storage.getActiveRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active roles" });
    }
  });

  app.get("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const role = await storage.getRole(id);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      // Validate required fields
      const { roleName, roleCode, description, level } = req.body;
      if (!roleName || !roleCode || !description || typeof level !== 'number') {
        return res.status(400).json({ 
          message: "Missing required fields: roleName, roleCode, description, level" 
        });
      }

      // Check if role code already exists
      const existingRole = await storage.getRoleByCode(roleCode);
      if (existingRole) {
        return res.status(400).json({ 
          message: "Role code already exists" 
        });
      }

      const newRole = await storage.createRole(req.body);
      res.status(201).json(newRole);
    } catch (error: any) {
      res.status(500).json({ 
        message: "Failed to create role",
        details: error.message 
      });
    }
  });

  app.put("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get existing role to check if it's a system role
      const existingRole = await storage.getRole(id);
      if (!existingRole) {
        return res.status(404).json({ message: "Role not found" });
      }

      // Prevent modification of certain system role properties
      if (existingRole.isSystemRole) {
        const allowedUpdates = ['description', 'notes', 'color', 'icon', 'isActive'];
        const updates = Object.keys(req.body);
        const invalidUpdates = updates.filter(update => !allowedUpdates.includes(update));
        
        if (invalidUpdates.length > 0) {
          return res.status(400).json({ 
            message: `Cannot modify system role properties: ${invalidUpdates.join(', ')}` 
          });
        }
      }

      // Check if role code is being changed and if it conflicts
      if (req.body.roleCode && req.body.roleCode !== existingRole.roleCode) {
        const roleWithCode = await storage.getRoleByCode(req.body.roleCode);
        if (roleWithCode && roleWithCode.id !== id) {
          return res.status(400).json({ 
            message: "Role code already exists" 
          });
        }
      }

      const updatedRole = await storage.updateRole(id, req.body);
      if (!updatedRole) {
        return res.status(404).json({ message: "Role not found" });
      }

      res.json(updatedRole);
    } catch (error: any) {
      res.status(500).json({ 
        message: "Failed to update role",
        details: error.message 
      });
    }
  });

  app.delete("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const deleted = await storage.deleteRole(id);
      if (!deleted) {
        return res.status(404).json({ message: "Role not found" });
      }

      res.status(204).send();
    } catch (error: any) {
      if (error.message.includes('Cannot delete system roles') || 
          error.message.includes('Cannot delete role that is assigned to users')) {
        return res.status(400).json({ 
          message: error.message 
        });
      }
      res.status(500).json({ 
        message: "Failed to delete role",
        details: error.message 
      });
    }
  });

  app.get("/api/roles/:id/users", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const users = await storage.getUsersByRole(id);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users for role" });
    }
  });

  // GST Calculation routes
  app.post("/api/calculate-gst", async (req, res) => {
    try {
      const { perDayRate, totalAmount, days } = req.body;
      
      if (!perDayRate || perDayRate <= 0) {
        return res.status(400).json({ 
          message: "Valid per-day rate is required" 
        });
      }

      // Find applicable tariff slab based on per-day rate
      const tariffSlabs = await storage.getTariffSetupsByAmount(perDayRate.toString());
      
      if (!tariffSlabs || tariffSlabs.length === 0) {
        return res.status(404).json({ 
          message: "No applicable GST slab found for this rate",
          perDayRate 
        });
      }

      // Use the first matching slab (should be only one)
      const applicableSlab = tariffSlabs[0];
      
      // Calculate GST amounts
      const baseAmount = totalAmount || (parseFloat(perDayRate) * (days || 1));
      const cgstPercentage = parseFloat(applicableSlab.cgstPercentage);
      const sgstPercentage = parseFloat(applicableSlab.sgstPercentage);
      
      const cgstAmount = (baseAmount * cgstPercentage) / 100;
      const sgstAmount = (baseAmount * sgstPercentage) / 100;
      const totalGstAmount = cgstAmount + sgstAmount;
      const totalWithGst = baseAmount + totalGstAmount;

      res.json({
        perDayRate,
        baseAmount,
        days: days || 1,
        gst: {
          cgst: {
            percentage: cgstPercentage,
            amount: cgstAmount
          },
          sgst: {
            percentage: sgstPercentage,
            amount: sgstAmount
          },
          total: {
            percentage: cgstPercentage + sgstPercentage,
            amount: totalGstAmount
          }
        },
        totalWithGst,
        applicableSlab: {
          id: applicableSlab.id,
          description: applicableSlab.description,
          fromAmount: applicableSlab.fromAmount,
          toAmount: applicableSlab.toAmount
        }
      });
    } catch (error: any) {
      console.error("GST calculation error:", error);
      res.status(500).json({ 
        message: "Failed to calculate GST",
        details: error.message 
      });
    }
  });

  // Guest Master routes
  app.get("/api/guests", async (req, res) => {
    try {
      const { isActive, guestCategory, isBlacklisted } = req.query;
      const filters: any = {};
      
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (guestCategory) filters.guestCategory = guestCategory as string;
      if (isBlacklisted !== undefined) filters.isBlacklisted = isBlacklisted === 'true';
      
      const guests = await storage.getAllGuests(filters);
      res.json(guests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guests" });
    }
  });

  app.get("/api/guests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const guest = await storage.getGuest(id);
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }
      res.json(guest);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guest" });
    }
  });

  app.get("/api/guests/code/:code", async (req, res) => {
    try {
      const guest = await storage.getGuestByCode(req.params.code);
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }
      res.json(guest);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guest" });
    }
  });

  app.get("/api/guests/search/:query", async (req, res) => {
    try {
      const guests = await storage.searchGuests(req.params.query);
      res.json(guests);
    } catch (error) {
      res.status(500).json({ message: "Failed to search guests" });
    }
  });

  app.post("/api/guests", async (req, res) => {
    try {
      const guestData = req.body;
      
      // Validate that at least one of email or phoneNumber is provided
      if (!guestData.email && !guestData.phoneNumber) {
        return res.status(400).json({ message: "Either email or phone number must be provided" });
      }
      
      // Check for duplicate email
      if (guestData.email) {
        const existingGuestByEmail = await storage.getGuestByEmail(guestData.email);
        if (existingGuestByEmail) {
          return res.status(409).json({ message: "A guest with this email already exists" });
        }
      }
      
      // Check for duplicate phone number
      if (guestData.phoneNumber) {
        const existingGuestByPhone = await storage.getGuestByPhone(guestData.phoneNumber);
        if (existingGuestByPhone) {
          return res.status(409).json({ message: "A guest with this phone number already exists" });
        }
      }
      
      const guest = await storage.createGuest(guestData);
      res.status(201).json(guest);
    } catch (error: any) {
      if (error.message && error.message.includes("unique")) {
        res.status(409).json({ message: "Email or phone number already exists" });
      } else {
        res.status(500).json({ message: "Failed to create guest" });
      }
    }
  });

  app.put("/api/guests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Get existing guest
      const existingGuest = await storage.getGuest(id);
      if (!existingGuest) {
        return res.status(404).json({ message: "Guest not found" });
      }
      
      // Validate that at least one of email or phoneNumber is provided
      const finalEmail = updates.email !== undefined ? updates.email : existingGuest.email;
      const finalPhone = updates.phoneNumber !== undefined ? updates.phoneNumber : existingGuest.phoneNumber;
      
      if (!finalEmail && !finalPhone) {
        return res.status(400).json({ message: "Either email or phone number must be provided" });
      }
      
      // Check for duplicate email (if being updated and different from current)
      if (updates.email && updates.email !== existingGuest.email) {
        const existingGuestByEmail = await storage.getGuestByEmail(updates.email);
        if (existingGuestByEmail && existingGuestByEmail.id !== id) {
          return res.status(409).json({ message: "A guest with this email already exists" });
        }
      }
      
      // Check for duplicate phone number (if being updated and different from current)
      if (updates.phoneNumber && updates.phoneNumber !== existingGuest.phoneNumber) {
        const existingGuestByPhone = await storage.getGuestByPhone(updates.phoneNumber);
        if (existingGuestByPhone && existingGuestByPhone.id !== id) {
          return res.status(409).json({ message: "A guest with this phone number already exists" });
        }
      }
      
      const guest = await storage.updateGuest(id, updates);
      res.json(guest);
    } catch (error: any) {
      if (error.message && error.message.includes("unique")) {
        res.status(409).json({ message: "Email or phone number already exists" });
      } else {
        res.status(500).json({ message: "Failed to update guest" });
      }
    }
  });

  app.delete("/api/guests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGuest(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Guest not found" });
      }
      
      res.json({ message: "Guest deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete guest" });
    }
  });

  // Guest Details routes (companion/additional guests)
  app.get("/api/guest-details/guest/:guestMasterId", async (req, res) => {
    try {
      const guestMasterId = parseInt(req.params.guestMasterId);
      const guestDetailsList = await storage.getGuestDetailsByGuestMasterId(guestMasterId);
      res.json(guestDetailsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guest details" });
    }
  });

  app.post("/api/guest-details", async (req, res) => {
    try {
      const guestDetails = await storage.createGuestDetails(req.body);
      res.status(201).json(guestDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to create guest details" });
    }
  });

  app.delete("/api/guest-details/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGuestDetails(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Guest details not found" });
      }
      
      res.json({ message: "Guest details deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete guest details" });
    }
  });

  // Booking Guest Details routes (per-booking guest snapshots)
  app.get("/api/booking-guest-details/booking/:bookingId", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const bookingGuestDetailsList = await storage.getBookingGuestDetailsByBookingId(bookingId);
      res.json(bookingGuestDetailsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking guest details" });
    }
  });

  app.post("/api/booking-guest-details", async (req, res) => {
    try {
      const bookingGuestDetails = await storage.createBookingGuestDetails(req.body);
      res.status(201).json(bookingGuestDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to create booking guest details" });
    }
  });

  // Role Master and User Profile routes
  app.get("/api/roles", async (req, res) => {
    try {
      const { isActive, isSystemRole } = req.query;
      const filters: any = {};
      
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (isSystemRole !== undefined) filters.isSystemRole = isSystemRole === 'true';
      
      const roles = await storage.getAllRoles(filters);
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.get("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const role = await storage.getRole(id);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const roleData = req.body;
      const role = await storage.createRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.put("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const role = await storage.updateRole(id, updates);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      res.json(role);
    } catch (error) {
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRole(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  // User management endpoints
  app.get("/api/users", async (req, res) => {
    try {
      const { role, isVerified } = req.query;
      const filters: any = {};
      
      if (role) filters.role = role as string;
      if (isVerified !== undefined) filters.isVerified = isVerified === 'true';
      
      const users = await storage.getAllUsers(filters);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      console.log("=== CREATE USER REQUEST ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      const validatedData = insertUserSchema.parse(req.body);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhone(validatedData.phoneNumber);
      if (existingUser) {
        console.log("User already exists with phone:", validatedData.phoneNumber);
        return res.status(400).json({ message: "User already exists with this phone number" });
      }
      
      const user = await storage.createUser(validatedData);
      console.log("User created successfully:", user.id);
      res.status(201).json({ ...user, password: undefined });
    } catch (error) {
      console.error("=== CREATE USER ERROR ===");
      console.error("Error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.updateUser(id, req.body);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get("/api/users/all", async (req, res) => {
    try {
      const { role, isVerified } = req.query;
      const filters: any = {};
      
      if (role) filters.role = role as string;
      if (isVerified !== undefined) filters.isVerified = isVerified === 'true';
      
      const users = await storage.getAllUsers(filters);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/role/:roleId", async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const users = await storage.getUsersByRole(roleId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users by role" });
    }
  });

  app.put("/api/users/:userId/role", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { roleId } = req.body;
      
      const user = await storage.updateUserRole(userId, roleId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Email sending for booking confirmations
  app.post("/api/send-booking-confirmation", async (req, res) => {
    try {
      const bookingData = req.body;
      
      if (!bookingData.guestEmail || !bookingData.propertyName) {
        return res.status(400).json({ 
          message: "Missing required booking data for email" 
        });
      }

      // Try Brevo first, fallback to Gmail SMTP
      let emailService;
      let serviceName;
      
      if (process.env.BREVO_API_KEY) {
        emailService = await import("./brevo");
        serviceName = "Brevo";
      } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        emailService = await import("./gmail");
        serviceName = "Gmail";
      } else {
        return res.status(500).json({
          success: false,
          message: "No email service configured. Please set up either BREVO_API_KEY or Gmail credentials."
        });
      }
      
      const { sendBookingConfirmationToGuest, sendBookingNotificationToOwner, sendBookingNotificationToSuperAdmin } = emailService;
      
      // Debug: Log the incoming booking data for email preparation
      console.log('📧 Email preparation - booking data received:', {
        finalAmount: bookingData.finalAmount,
        _numericFinalPrice: bookingData._numericFinalPrice,
        totalAmount: bookingData.totalAmount,
        totalPrice: bookingData.totalPrice,
        taxAmount: bookingData.taxAmount,
        _numericTaxAmount: bookingData._numericTaxAmount,
        gstAmount: bookingData.gstAmount,
        roomTypeId: bookingData.roomTypeId,
        roomTypeName: bookingData.roomTypeName
      });

      // Fetch room type data for room name
      let roomTypeName = bookingData.roomTypeName;
      
      // Try to get roomTypeId from different possible fields
      const roomTypeId = bookingData.roomTypeId || bookingData.roomType?.id;
      
      if (!roomTypeName && roomTypeId) {
        try {
          console.log(`📧 Fetching room type data for ID: ${roomTypeId}`);
          const roomType = await storage.getRoomType(roomTypeId);
          if (roomType) {
            roomTypeName = roomType.roomTypeName;
            console.log(`📧 Room type found:`, { roomTypeName });
          } else {
            console.log(`📧 No room type found for ID: ${roomTypeId}`);
          }
        } catch (error) {
          console.error('Error fetching room type data for email:', error);
        }
      }
      
      // Prepare booking confirmation data - calculate correct amounts
      const nights = bookingData.nights || 1;
      const rooms = bookingData.numberOfRooms || 1;
      const numberOfGuests = bookingData.numberOfGuests || bookingData.guests || 1;
      const gstAmount = Number(bookingData._numericTaxAmount ?? bookingData.taxAmount ?? bookingData.gstAmount ?? 0);
      const couponDiscountAmount = Number(bookingData.couponDiscountAmount ?? 0);
      
      // Get the transactional booked rate from the bookings table
      // totalAmount already has coupon/discount applied (this is the final booked rate)
      const roomTotal = Number(bookingData.totalAmount ?? 0);
      
      // Calculate per-night rate from the transactional booked amount
      // perNightRate = (bookedAmount after discount) / (nights × rooms)
      const perNightRate = roomTotal / (nights * rooms);
      
      console.log(`📧 Using transactional booked rate from bookings table - Per-night rate: ₹${perNightRate}`);
      
      // Calculate final total amount (room total + GST)
      const totalAmount = roomTotal + gstAmount;
      
      console.log('📧 Email preparation - calculated amounts:', {
        perNightRate,
        numberOfGuests,
        nights,
        rooms,
        roomTotal,
        gstAmount,
        couponDiscountAmount,
        totalAmount
      });
      
      // Format dates as dd-mm-yyyy
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      // Extract guest information from guestDetails object or direct fields
      const guestDetails = typeof bookingData.guestDetails === 'string' 
        ? JSON.parse(bookingData.guestDetails) 
        : bookingData.guestDetails;
      
      const guestName = bookingData.guestName || guestDetails?.name || 'Guest';
      const guestPhone = bookingData.guestPhone || guestDetails?.phone || '';
      const guestEmail = bookingData.guestEmail || guestDetails?.email || '';

      const confirmationData = {
        bookingId: bookingData.bookingId || bookingData.id?.toString() || 'TEMP-' + Date.now(),
        propertyName: bookingData.propertyName,
        guestName: guestName,
        guestPhone: guestPhone,
        guestAddress: bookingData.guestAddress, // May not be available from current form
        checkIn: formatDate(bookingData.checkInDate),
        checkOut: formatDate(bookingData.checkOutDate),
        nights: nights,
        rooms: rooms,
        guests: bookingData.numberOfGuests || 1,
        totalPrice: totalAmount,
        gstAmount: gstAmount > 0 ? gstAmount : undefined,
        currencySymbol: '₹',
        roomTypeName: roomTypeName,
        roomTypePrice: perNightRate,
        couponCode: bookingData.couponCode,
        couponType: bookingData.couponType,
        couponDiscountAmount: couponDiscountAmount > 0 ? couponDiscountAmount : undefined
      };

      console.log('📧 Final confirmation data for email:', confirmationData);

      // Send email to guest using extracted email
      const guestEmailSent = await sendBookingConfirmationToGuest(
        guestEmail,
        confirmationData
      );

      let ownerEmailSent = false;
      let superAdminEmailSent = false;
      let propertyOwnerEmail = '';
      
      // Try to send email to property owner if email exists
      if (bookingData.propertyId) {
        try {
          const property = await storage.getProperty(bookingData.propertyId);
          if (property && property.ownerEmail) {
            propertyOwnerEmail = property.ownerEmail;
            ownerEmailSent = await sendBookingNotificationToOwner(
              property.ownerEmail,
              confirmationData
            );
          }
        } catch (error) {
          console.error('Failed to send owner notification:', error);
          // Don't fail the entire request if owner email fails
        }
      }

      // Send notification to superadmin (platform admin)
      try {
        // Get superadmin email from environment or use default
        const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'admin@yourhotel.com';
        superAdminEmailSent = await sendBookingNotificationToSuperAdmin(
          superAdminEmail,
          confirmationData,
          propertyOwnerEmail
        );
      } catch (error) {
        console.error('Failed to send superadmin notification:', error);
      }

      res.json({
        success: guestEmailSent,
        guestEmailSent,
        ownerEmailSent,
        superAdminEmailSent,
        message: guestEmailSent ? `Booking confirmation emails sent via ${serviceName}` : "Email sending failed"
      });

    } catch (error: any) {
      console.error("Email sending error:", error);
      res.status(500).json({ 
        message: "Failed to send booking confirmation email",
        details: error.message 
      });
    }
  });

  // Room Availability Report APIs
  app.get("/api/reports/room-availability", async (req, res) => {
    try {
      const { propertyId, roomTypeId, dateFrom, dateTo, page, pageSize } = req.query;
      
      const filters = {
        propertyId: propertyId ? parseInt(propertyId as string) : undefined,
        roomTypeId: roomTypeId ? parseInt(roomTypeId as string) : undefined,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 50
      };

      const report = await storage.getRoomAvailabilityReport(filters);
      res.json(report);
    } catch (error: any) {
      console.error("Room availability report error:", error);
      res.status(500).json({ message: "Failed to fetch room availability report", details: error.message });
    }
  });

  app.get("/api/reports/room-availability/export", async (req, res) => {
    try {
      const { format, propertyId, roomTypeId, dateFrom, dateTo } = req.query;
      
      if (!format || !['excel', 'csv', 'pdf', 'word'].includes(format as string)) {
        return res.status(400).json({ message: "Invalid format. Use: excel, csv, pdf, or word" });
      }

      const filters = {
        propertyId: propertyId ? parseInt(propertyId as string) : undefined,
        roomTypeId: roomTypeId ? parseInt(roomTypeId as string) : undefined,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        page: 1,
        pageSize: 10000 // Get all data for export
      };

      const report = await storage.getRoomAvailabilityReport(filters);

      // Group data by property
      const groupedData: Record<string, typeof report.data> = {};
      report.data.forEach(row => {
        if (!groupedData[row.propertyName]) {
          groupedData[row.propertyName] = [];
        }
        groupedData[row.propertyName].push(row);
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `room-availability-report-${timestamp}`;

      if (format === 'csv') {
        let csvContent = 'ROOM AVAILABILITY REPORT\n';
        csvContent += `Generated on: ${new Date().toLocaleString()}\n`;
        csvContent += `Period: ${dateFrom || 'N/A'} to ${dateTo || 'N/A'}\n\n`;

        // Add data grouped by property
        Object.entries(groupedData).forEach(([propertyName, rows]) => {
          csvContent += `\n=== ${propertyName} ===\n`;
          csvContent += 'Room Type,Date,Total Rooms,Booked,Blocked,Available\n';
          
          rows.forEach(row => {
            csvContent += `"${row.roomTypeName}","${row.date}",${row.totalRooms},${row.bookedRooms},${row.blockedRooms},${row.availableRooms}\n`;
          });
          
          const propertyTotals = rows.reduce((acc, row) => ({
            totalRooms: acc.totalRooms + row.totalRooms,
            bookedRooms: acc.bookedRooms + row.bookedRooms,
            blockedRooms: acc.blockedRooms + row.blockedRooms,
            availableRooms: acc.availableRooms + row.availableRooms
          }), { totalRooms: 0, bookedRooms: 0, blockedRooms: 0, availableRooms: 0 });
          
          csvContent += `\nProperty Totals,,${propertyTotals.totalRooms},${propertyTotals.bookedRooms},${propertyTotals.blockedRooms},${propertyTotals.availableRooms}\n`;
        });

        csvContent += '\n\nGRAND TOTALS\n';
        csvContent += `Total Rooms,Booked,Blocked,Available\n`;
        csvContent += `${report.grandTotals.totalRooms},${report.grandTotals.bookedRooms},${report.grandTotals.blockedRooms},${report.grandTotals.availableRooms}\n`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(csvContent);
      } else if (format === 'excel') {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const dataSheet = workbook.addWorksheet('Room Availability');
        const chartSheet = workbook.addWorksheet('Chart Data');

        // Add title
        const titleRow = dataSheet.addRow(['ROOM AVAILABILITY REPORT']);
        titleRow.font = { bold: true, size: 16, color: { argb: 'FF4B7A4F' } };
        titleRow.alignment = { horizontal: 'center' };
        dataSheet.mergeCells('A1:F1');

        dataSheet.addRow([`Generated on: ${new Date().toLocaleString()}`]);
        dataSheet.addRow([`Period: ${dateFrom || 'N/A'} to ${dateTo || 'N/A'}`]);
        dataSheet.addRow([]);

        let currentRow = 5;

        // Add data grouped by property
        Object.entries(groupedData).forEach(([propertyName, rows]) => {
          const propertyHeaderRow = dataSheet.addRow([propertyName]);
          propertyHeaderRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
          propertyHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4B7A4F' }
          };
          dataSheet.mergeCells(`A${currentRow}:F${currentRow}`);
          currentRow++;

          const headerRow = dataSheet.addRow([
            'Room Type',
            'Date',
            'Total Rooms',
            'Booked',
            'Blocked',
            'Available'
          ]);
          headerRow.font = { bold: true };
          headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFB5D3B7' }
          };
          currentRow++;

          rows.forEach(row => {
            const dataRow = dataSheet.addRow([
              row.roomTypeName,
              row.date,
              row.totalRooms,
              row.bookedRooms,
              row.blockedRooms,
              row.availableRooms
            ]);
            
            dataRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC9C9' } };
            dataRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEAA7' } };
            dataRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC7F5C7' } };
            currentRow++;
          });

          const propertyTotals = rows.reduce((acc, row) => ({
            totalRooms: acc.totalRooms + row.totalRooms,
            bookedRooms: acc.bookedRooms + row.bookedRooms,
            blockedRooms: acc.blockedRooms + row.blockedRooms,
            availableRooms: acc.availableRooms + row.availableRooms
          }), { totalRooms: 0, bookedRooms: 0, blockedRooms: 0, availableRooms: 0 });

          const totalRow = dataSheet.addRow([
            `${propertyName} Totals`,
            '',
            propertyTotals.totalRooms,
            propertyTotals.bookedRooms,
            propertyTotals.blockedRooms,
            propertyTotals.availableRooms
          ]);
          totalRow.font = { bold: true };
          totalRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8F5E9' }
          };
          currentRow++;

          dataSheet.addRow([]);
          currentRow++;
        });

        // Grand totals
        const grandTotalHeaderRow = dataSheet.addRow(['GRAND TOTALS']);
        grandTotalHeaderRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        grandTotalHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2E7D32' }
        };
        dataSheet.mergeCells(`A${currentRow}:F${currentRow}`);
        currentRow++;

        dataSheet.addRow([
          'Total Rooms',
          'Booked',
          'Blocked',
          'Available'
        ]);

        const grandTotalDataRow = dataSheet.addRow([
          report.grandTotals.totalRooms,
          report.grandTotals.bookedRooms,
          report.grandTotals.blockedRooms,
          report.grandTotals.availableRooms
        ]);
        grandTotalDataRow.font = { bold: true, size: 12 };

        dataSheet.columns = [
          { width: 25 },
          { width: 15 },
          { width: 15 },
          { width: 15 },
          { width: 15 },
          { width: 15 }
        ];

        // Chart data sheet for visualization
        chartSheet.addRow(['Date', 'Room Type', 'Available', 'Booked']);
        report.data.forEach(row => {
          chartSheet.addRow([row.date, row.roomTypeName, row.availableRooms, row.bookedRooms]);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
      } else if (format === 'pdf') {
        const PDFDocument = await import('pdfkit');
        const doc = new PDFDocument.default({ margin: 40, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        
        doc.pipe(res);

        // Title
        doc.fontSize(20).fillColor('#4B7A4F').font('Helvetica-Bold')
           .text('ROOM AVAILABILITY REPORT', { align: 'center' });
        doc.fontSize(10).fillColor('#000000').font('Helvetica')
           .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.text(`Period: ${dateFrom || 'N/A'} to ${dateTo || 'N/A'}`, { align: 'center' });
        doc.moveDown(2);

        let yPos = doc.y;
        const leftMargin = 40;
        const colWidths = [100, 80, 60, 60, 60, 80];

        // Process data grouped by property
        Object.entries(groupedData).forEach(([propertyName, rows], groupIndex) => {
          if (yPos > 680) {
            doc.addPage();
            yPos = 40;
          }

          // Property header
          doc.rect(leftMargin, yPos, 520, 25).fillAndStroke('#4B7A4F', '#4B7A4F');
          doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica-Bold')
             .text(propertyName, leftMargin + 5, yPos + 8, { width: 510 });
          yPos += 30;

          // Column headers
          const headers = ['Room Type', 'Date', 'Total', 'Booked', 'Blocked', 'Available'];
          doc.fontSize(9).fillColor('#000000');
          headers.forEach((header, i) => {
            const xPos = leftMargin + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.rect(xPos, yPos, colWidths[i], 20).fillAndStroke('#B5D3B7', '#B5D3B7');
            doc.fillColor('#000000').font('Helvetica-Bold')
               .text(header, xPos + 5, yPos + 6, { width: colWidths[i] - 10 });
          });
          yPos += 25;

          // Data rows
          doc.fontSize(8).font('Helvetica');
          rows.forEach(row => {
            if (yPos > 730) {
              doc.addPage();
              yPos = 40;
            }

            const values = [row.roomTypeName, row.date, row.totalRooms.toString(), 
                          row.bookedRooms.toString(), row.blockedRooms.toString(), 
                          row.availableRooms.toString()];
            
            values.forEach((value, i) => {
              const xPos = leftMargin + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
              doc.fillColor('#000000').text(value, xPos + 5, yPos + 5, { width: colWidths[i] - 10 });
            });
            yPos += 18;
          });

          // Property totals
          const propertyTotals = rows.reduce((acc, row) => ({
            totalRooms: acc.totalRooms + row.totalRooms,
            bookedRooms: acc.bookedRooms + row.bookedRooms,
            blockedRooms: acc.blockedRooms + row.blockedRooms,
            availableRooms: acc.availableRooms + row.availableRooms
          }), { totalRooms: 0, bookedRooms: 0, blockedRooms: 0, availableRooms: 0 });

          doc.rect(leftMargin, yPos, 520, 20).fillAndStroke('#E8F5E9', '#E8F5E9');
          doc.fontSize(9).fillColor('#000000').font('Helvetica-Bold');
          doc.text(`${propertyName} Totals`, leftMargin + 5, yPos + 6, { width: colWidths[0] + colWidths[1] });
          
          const totalValues = [propertyTotals.totalRooms, propertyTotals.bookedRooms, 
                              propertyTotals.blockedRooms, propertyTotals.availableRooms];
          totalValues.forEach((value, i) => {
            const xPos = leftMargin + colWidths.slice(0, i + 2).reduce((a, b) => a + b, 0);
            doc.text(value.toString(), xPos + 5, yPos + 6, { width: colWidths[i + 2] - 10 });
          });
          yPos += 30;
        });

        // Grand totals
        if (yPos > 680) {
          doc.addPage();
          yPos = 40;
        }

        doc.rect(leftMargin, yPos, 520, 25).fillAndStroke('#2E7D32', '#2E7D32');
        doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica-Bold')
           .text('GRAND TOTALS', leftMargin + 5, yPos + 8);
        yPos += 30;

        doc.fontSize(10).fillColor('#000000');
        const grandTotalLabels = ['Total Rooms', 'Booked', 'Blocked', 'Available'];
        const grandTotalValues = [report.grandTotals.totalRooms, report.grandTotals.bookedRooms, 
                                 report.grandTotals.blockedRooms, report.grandTotals.availableRooms];
        
        grandTotalLabels.forEach((label, i) => {
          const xPos = leftMargin + (i * 130);
          doc.text(`${label}: ${grandTotalValues[i]}`, xPos, yPos, { width: 125 });
        });

        doc.end();
      } else if (format === 'word') {
        const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, ShadingType } = await import('docx');

        const documentChildren: any[] = [
          new Paragraph({
            children: [new TextRun({ text: 'ROOM AVAILABILITY REPORT', bold: true, size: 32, color: '4B7A4F' })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [new TextRun({ text: `Generated on: ${new Date().toLocaleString()}`, size: 20 })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [new TextRun({ text: `Period: ${dateFrom || 'N/A'} to ${dateTo || 'N/A'}`, size: 20 })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({ text: '' })
        ];

        // Add data grouped by property
        Object.entries(groupedData).forEach(([propertyName, rows]) => {
          documentChildren.push(
            new Paragraph({
              children: [new TextRun({ text: propertyName, bold: true, size: 28, color: '4B7A4F' })],
              spacing: { before: 300, after: 200 }
            })
          );

          const propertyTableRows = [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Room Type', bold: true })] })], shading: { fill: 'B5D3B7', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Date', bold: true })] })], shading: { fill: 'B5D3B7', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true })] })], shading: { fill: 'B5D3B7', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Booked', bold: true })] })], shading: { fill: 'B5D3B7', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Blocked', bold: true })] })], shading: { fill: 'B5D3B7', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Available', bold: true })] })], shading: { fill: 'B5D3B7', type: ShadingType.CLEAR } })
              ]
            }),
            ...rows.map(row => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(row.roomTypeName)] }),
                new TableCell({ children: [new Paragraph(row.date)] }),
                new TableCell({ children: [new Paragraph(row.totalRooms.toString())] }),
                new TableCell({ children: [new Paragraph(row.bookedRooms.toString())] }),
                new TableCell({ children: [new Paragraph(row.blockedRooms.toString())] }),
                new TableCell({ children: [new Paragraph(row.availableRooms.toString())] })
              ]
            }))
          ];

          const propertyTotals = rows.reduce((acc, row) => ({
            totalRooms: acc.totalRooms + row.totalRooms,
            bookedRooms: acc.bookedRooms + row.bookedRooms,
            blockedRooms: acc.blockedRooms + row.blockedRooms,
            availableRooms: acc.availableRooms + row.availableRooms
          }), { totalRooms: 0, bookedRooms: 0, blockedRooms: 0, availableRooms: 0 });

          propertyTableRows.push(
            new TableRow({
              children: [
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: `${propertyName} Totals`, bold: true })] })],
                  columnSpan: 2,
                  shading: { fill: 'E8F5E9', type: ShadingType.CLEAR }
                }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: propertyTotals.totalRooms.toString(), bold: true })] })], shading: { fill: 'E8F5E9', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: propertyTotals.bookedRooms.toString(), bold: true })] })], shading: { fill: 'E8F5E9', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: propertyTotals.blockedRooms.toString(), bold: true })] })], shading: { fill: 'E8F5E9', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: propertyTotals.availableRooms.toString(), bold: true })] })], shading: { fill: 'E8F5E9', type: ShadingType.CLEAR } })
              ]
            })
          );

          documentChildren.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: propertyTableRows
            }),
            new Paragraph({ text: '' })
          );
        });

        // Grand totals
        documentChildren.push(
          new Paragraph({
            children: [new TextRun({ text: 'GRAND TOTALS', bold: true, size: 28, color: '2E7D32' })],
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Total Rooms: ${report.grandTotals.totalRooms}  |  `, bold: true, size: 22 }),
              new TextRun({ text: `Booked: ${report.grandTotals.bookedRooms}  |  `, bold: true, size: 22 }),
              new TextRun({ text: `Blocked: ${report.grandTotals.blockedRooms}  |  `, bold: true, size: 22 }),
              new TextRun({ text: `Available: ${report.grandTotals.availableRooms}`, bold: true, size: 22 })
            ]
          })
        );

        const doc = new Document({
          sections: [{
            children: documentChildren
          }]
        });

        const buffer = await Packer.toBuffer(doc);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
        res.send(buffer);
      }
    } catch (error: any) {
      console.error("Room availability export error:", error);
      res.status(500).json({ message: "Failed to export room availability report", details: error.message });
    }
  });

  // Booking Details Report APIs
  app.get("/api/reports/booking-details", async (req, res) => {
    try {
      const { propertyId, roomTypeId, guestName, dateFrom, dateTo, page, pageSize } = req.query;
      
      const filters = {
        propertyId: propertyId ? parseInt(propertyId as string) : undefined,
        roomTypeId: roomTypeId ? parseInt(roomTypeId as string) : undefined,
        guestName: guestName as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 50
      };

      const report = await storage.getBookingDetailsReport(filters);
      res.json(report);
    } catch (error: any) {
      console.error("Booking details report error:", error);
      res.status(500).json({ message: "Failed to fetch booking details report", details: error.message });
    }
  });

  app.get("/api/reports/booking-details/export", async (req, res) => {
    try {
      const { format, propertyId, roomTypeId, guestName, dateFrom, dateTo } = req.query;
      
      if (!format || !['excel', 'csv', 'pdf', 'word'].includes(format as string)) {
        return res.status(400).json({ message: "Invalid format. Use: excel, csv, pdf, or word" });
      }

      const filters = {
        propertyId: propertyId ? parseInt(propertyId as string) : undefined,
        roomTypeId: roomTypeId ? parseInt(roomTypeId as string) : undefined,
        guestName: guestName as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        page: 1,
        pageSize: 10000 // Get all data for export
      };

      const report = await storage.getBookingDetailsReport(filters);

      // Group data by property
      const groupedData: Record<string, typeof report.data> = {};
      report.data.forEach(row => {
        if (!groupedData[row.propertyName]) {
          groupedData[row.propertyName] = [];
        }
        groupedData[row.propertyName].push(row);
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `booking-details-report-${timestamp}`;

      if (format === 'csv') {
        let csvContent = 'BOOKING DETAILS REPORT\n';
        csvContent += `Generated on: ${new Date().toLocaleString()}\n`;
        csvContent += `Period: ${dateFrom || 'N/A'} to ${dateTo || 'N/A'}\n\n`;

        // Add data grouped by property
        Object.entries(groupedData).forEach(([propertyName, rows]) => {
          csvContent += `\n=== ${propertyName} ===\n`;
          csvContent += 'Booking ID,Guest Name,Room Type,Check-in,Check-out,Rooms,Nights,Amount,Status,Payment\n';
          
          rows.forEach(row => {
            csvContent += `"${row.bookingId}","${row.guestName}","${row.roomTypeName}","${row.checkInDate}","${row.checkOutDate}",${row.numberOfRooms},${row.numberOfNights},"₹${row.totalAmount}","${row.status}","${row.paymentStatus}"\n`;
          });
          
          const propertyTotals = rows.reduce((acc, row) => ({
            numberOfRooms: acc.numberOfRooms + row.numberOfRooms,
            numberOfNights: acc.numberOfNights + row.numberOfNights,
            totalAmount: acc.totalAmount + row.totalAmount,
            bookingCount: acc.bookingCount + 1
          }), { numberOfRooms: 0, numberOfNights: 0, totalAmount: 0, bookingCount: 0 });
          
          csvContent += `\nProperty Totals,${propertyTotals.bookingCount} bookings,,,${propertyTotals.numberOfRooms},${propertyTotals.numberOfNights},"₹${propertyTotals.totalAmount}",,\n`;
        });

        csvContent += '\n\nGRAND TOTALS\n';
        csvContent += `Total Bookings,Total Rooms,Total Nights,Total Amount\n`;
        csvContent += `${report.grandTotals.bookingCount},${report.grandTotals.numberOfRooms},${report.grandTotals.numberOfNights},"₹${report.grandTotals.totalAmount}"\n`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(csvContent);
      } else if (format === 'excel') {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const dataSheet = workbook.addWorksheet('Booking Details');
        const chartSheet = workbook.addWorksheet('Chart Data');

        // Add title
        const titleRow = dataSheet.addRow(['BOOKING DETAILS REPORT']);
        titleRow.font = { bold: true, size: 16, color: { argb: 'FF4B7A4F' } };
        titleRow.alignment = { horizontal: 'center' };
        dataSheet.mergeCells('A1:H1');

        dataSheet.addRow([`Generated on: ${new Date().toLocaleString()}`]);
        dataSheet.addRow([`Period: ${dateFrom || 'N/A'} to ${dateTo || 'N/A'}`]);
        dataSheet.addRow([]);

        let currentRow = 5;

        // Add data grouped by property
        Object.entries(groupedData).forEach(([propertyName, rows]) => {
          const propertyHeaderRow = dataSheet.addRow([propertyName]);
          propertyHeaderRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
          propertyHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4B7A4F' }
          };
          dataSheet.mergeCells(`A${currentRow}:H${currentRow}`);
          currentRow++;

          const headerRow = dataSheet.addRow([
            'Booking ID',
            'Guest Name',
            'Room Type',
            'Check-in',
            'Check-out',
            'Rooms',
            'Nights',
            'Amount'
          ]);
          headerRow.font = { bold: true };
          headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFB5D3B7' }
          };
          currentRow++;

          rows.forEach(row => {
            const dataRow = dataSheet.addRow([
              row.bookingId,
              row.guestName,
              row.roomTypeName,
              row.checkInDate,
              row.checkOutDate,
              row.numberOfRooms,
              row.numberOfNights,
              row.totalAmount
            ]);
            
            dataRow.getCell(8).numFmt = '₹#,##0.00';
            currentRow++;
          });

          const propertyTotals = rows.reduce((acc, row) => ({
            numberOfRooms: acc.numberOfRooms + row.numberOfRooms,
            numberOfNights: acc.numberOfNights + row.numberOfNights,
            totalAmount: acc.totalAmount + row.totalAmount,
            bookingCount: acc.bookingCount + 1
          }), { numberOfRooms: 0, numberOfNights: 0, totalAmount: 0, bookingCount: 0 });

          const totalRow = dataSheet.addRow([
            `${propertyName} Totals`,
            `${propertyTotals.bookingCount} bookings`,
            '',
            '',
            '',
            propertyTotals.numberOfRooms,
            propertyTotals.numberOfNights,
            propertyTotals.totalAmount
          ]);
          totalRow.font = { bold: true };
          totalRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8F5E9' }
          };
          totalRow.getCell(8).numFmt = '₹#,##0.00';
          currentRow++;

          dataSheet.addRow([]);
          currentRow++;
        });

        // Grand totals
        const grandTotalHeaderRow = dataSheet.addRow(['GRAND TOTALS']);
        grandTotalHeaderRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        grandTotalHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2E7D32' }
        };
        dataSheet.mergeCells(`A${currentRow}:H${currentRow}`);
        currentRow++;

        dataSheet.addRow([
          'Total Bookings',
          'Total Rooms',
          'Total Nights',
          'Total Amount'
        ]);

        const grandTotalDataRow = dataSheet.addRow([
          report.grandTotals.bookingCount,
          report.grandTotals.numberOfRooms,
          report.grandTotals.numberOfNights,
          report.grandTotals.totalAmount
        ]);
        grandTotalDataRow.font = { bold: true, size: 12 };
        grandTotalDataRow.getCell(4).numFmt = '₹#,##0.00';

        dataSheet.columns = [
          { width: 20 },
          { width: 20 },
          { width: 20 },
          { width: 15 },
          { width: 15 },
          { width: 10 },
          { width: 10 },
          { width: 15 }
        ];

        // Chart data sheet for visualization
        chartSheet.addRow(['Date', 'Property', 'Bookings', 'Revenue']);
        report.data.forEach(row => {
          chartSheet.addRow([row.checkInDate, row.propertyName, 1, row.totalAmount]);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
      } else if (format === 'pdf') {
        const PDFDocument = await import('pdfkit');
        const doc = new PDFDocument.default({ margin: 40, size: 'A4', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        
        doc.pipe(res);

        // Title
        doc.fontSize(20).fillColor('#4B7A4F').font('Helvetica-Bold')
           .text('BOOKING DETAILS REPORT', { align: 'center' });
        doc.fontSize(10).fillColor('#000000').font('Helvetica')
           .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.text(`Period: ${dateFrom || 'N/A'} to ${dateTo || 'N/A'}`, { align: 'center' });
        doc.moveDown(2);

        let yPos = doc.y;
        const leftMargin = 40;
        const colWidths = [100, 120, 80, 70, 70, 50, 50, 80];

        // Process data grouped by property
        Object.entries(groupedData).forEach(([propertyName, rows]) => {
          if (yPos > 480) {
            doc.addPage({ layout: 'landscape' });
            yPos = 40;
          }

          // Property header
          doc.rect(leftMargin, yPos, 720, 25).fillAndStroke('#4B7A4F', '#4B7A4F');
          doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica-Bold')
             .text(propertyName, leftMargin + 5, yPos + 8, { width: 710 });
          yPos += 30;

          // Column headers
          const headers = ['Booking ID', 'Guest Name', 'Room Type', 'Check-in', 'Check-out', 'Rooms', 'Nights', 'Amount'];
          doc.fontSize(9).fillColor('#000000');
          headers.forEach((header, i) => {
            const xPos = leftMargin + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.rect(xPos, yPos, colWidths[i], 20).fillAndStroke('#B5D3B7', '#B5D3B7');
            doc.fillColor('#000000').font('Helvetica-Bold')
               .text(header, xPos + 5, yPos + 6, { width: colWidths[i] - 10, align: 'left' });
          });
          yPos += 25;

          // Data rows
          doc.fontSize(8).font('Helvetica');
          rows.forEach(row => {
            if (yPos > 530) {
              doc.addPage({ layout: 'landscape' });
              yPos = 40;
            }

            const values = [
              row.bookingId,
              row.guestName.substring(0, 18),
              row.roomTypeName.substring(0, 12),
              row.checkInDate,
              row.checkOutDate,
              row.numberOfRooms.toString(),
              row.numberOfNights.toString(),
              `₹${row.totalAmount}`
            ];
            
            values.forEach((value, i) => {
              const xPos = leftMargin + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
              doc.fillColor('#000000').text(value, xPos + 5, yPos + 5, { width: colWidths[i] - 10, align: 'left' });
            });
            yPos += 18;
          });

          // Property totals
          const propertyTotals = rows.reduce((acc, row) => ({
            numberOfRooms: acc.numberOfRooms + row.numberOfRooms,
            numberOfNights: acc.numberOfNights + row.numberOfNights,
            totalAmount: acc.totalAmount + row.totalAmount,
            bookingCount: acc.bookingCount + 1
          }), { numberOfRooms: 0, numberOfNights: 0, totalAmount: 0, bookingCount: 0 });

          doc.rect(leftMargin, yPos, 720, 20).fillAndStroke('#E8F5E9', '#E8F5E9');
          doc.fontSize(9).fillColor('#000000').font('Helvetica-Bold');
          doc.text(`${propertyName} Totals: ${propertyTotals.bookingCount} bookings`, leftMargin + 5, yPos + 6, { width: 300 });
          
          const totalValues = [propertyTotals.numberOfRooms, propertyTotals.numberOfNights, propertyTotals.totalAmount];
          [5, 6, 7].forEach((colIndex, i) => {
            const xPos = leftMargin + colWidths.slice(0, colIndex).reduce((a, b) => a + b, 0);
            const value = i === 2 ? `₹${totalValues[i]}` : totalValues[i].toString();
            doc.text(value, xPos + 5, yPos + 6, { width: colWidths[colIndex] - 10 });
          });
          yPos += 30;
        });

        // Grand totals
        if (yPos > 480) {
          doc.addPage({ layout: 'landscape' });
          yPos = 40;
        }

        doc.rect(leftMargin, yPos, 720, 25).fillAndStroke('#2E7D32', '#2E7D32');
        doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica-Bold')
           .text('GRAND TOTALS', leftMargin + 5, yPos + 8);
        yPos += 30;

        doc.fontSize(10).fillColor('#000000');
        const grandTotalLabels = ['Total Bookings', 'Total Rooms', 'Total Nights', 'Total Amount'];
        const grandTotalValues = [
          report.grandTotals.bookingCount,
          report.grandTotals.numberOfRooms,
          report.grandTotals.numberOfNights,
          `₹${report.grandTotals.totalAmount}`
        ];
        
        grandTotalLabels.forEach((label, i) => {
          const xPos = leftMargin + (i * 180);
          doc.text(`${label}: ${grandTotalValues[i]}`, xPos, yPos, { width: 175 });
        });

        doc.end();
      } else if (format === 'word') {
        const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, ShadingType } = await import('docx');

        const documentChildren: any[] = [
          new Paragraph({
            children: [new TextRun({ text: 'BOOKING DETAILS REPORT', bold: true, size: 32, color: '4B7A4F' })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [new TextRun({ text: `Generated on: ${new Date().toLocaleString()}`, size: 20 })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [new TextRun({ text: `Period: ${dateFrom || 'N/A'} to ${dateTo || 'N/A'}`, size: 20 })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({ text: '' })
        ];

        // Add data grouped by property
        Object.entries(groupedData).forEach(([propertyName, rows]) => {
          documentChildren.push(
            new Paragraph({
              children: [new TextRun({ text: propertyName, bold: true, size: 28, color: '4B7A4F' })],
              spacing: { before: 300, after: 200 }
            })
          );

          const propertyTableRows = [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Booking ID', bold: true })] })], shading: { fill: 'B5D3B7', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Guest Name', bold: true })] })], shading: { fill: 'B5D3B7', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Room Type', bold: true })] })], shading: { fill: 'B5D3B7', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Check-in', bold: true })] })], shading: { fill: 'B5D3B7', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Check-out', bold: true })] })], shading: { fill: 'B5D3B7', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Rooms', bold: true })] })], shading: { fill: 'B5D3B7', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nights', bold: true })] })], shading: { fill: 'B5D3B7', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Amount', bold: true })] })], shading: { fill: 'B5D3B7', type: ShadingType.CLEAR } })
              ]
            }),
            ...rows.map(row => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(row.bookingId)] }),
                new TableCell({ children: [new Paragraph(row.guestName)] }),
                new TableCell({ children: [new Paragraph(row.roomTypeName)] }),
                new TableCell({ children: [new Paragraph(row.checkInDate)] }),
                new TableCell({ children: [new Paragraph(row.checkOutDate)] }),
                new TableCell({ children: [new Paragraph(row.numberOfRooms.toString())] }),
                new TableCell({ children: [new Paragraph(row.numberOfNights.toString())] }),
                new TableCell({ children: [new Paragraph(`₹${row.totalAmount}`)] })
              ]
            }))
          ];

          const propertyTotals = rows.reduce((acc, row) => ({
            numberOfRooms: acc.numberOfRooms + row.numberOfRooms,
            numberOfNights: acc.numberOfNights + row.numberOfNights,
            totalAmount: acc.totalAmount + row.totalAmount,
            bookingCount: acc.bookingCount + 1
          }), { numberOfRooms: 0, numberOfNights: 0, totalAmount: 0, bookingCount: 0 });

          propertyTableRows.push(
            new TableRow({
              children: [
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: `${propertyName} Totals`, bold: true })] })],
                  columnSpan: 2,
                  shading: { fill: 'E8F5E9', type: ShadingType.CLEAR }
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: `${propertyTotals.bookingCount} bookings`, bold: true })] })],
                  columnSpan: 3,
                  shading: { fill: 'E8F5E9', type: ShadingType.CLEAR }
                }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: propertyTotals.numberOfRooms.toString(), bold: true })] })], shading: { fill: 'E8F5E9', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: propertyTotals.numberOfNights.toString(), bold: true })] })], shading: { fill: 'E8F5E9', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `₹${propertyTotals.totalAmount}`, bold: true })] })], shading: { fill: 'E8F5E9', type: ShadingType.CLEAR } })
              ]
            })
          );

          documentChildren.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: propertyTableRows
            }),
            new Paragraph({ text: '' })
          );
        });

        // Grand totals
        documentChildren.push(
          new Paragraph({
            children: [new TextRun({ text: 'GRAND TOTALS', bold: true, size: 28, color: '2E7D32' })],
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Total Bookings: ${report.grandTotals.bookingCount}  |  `, bold: true, size: 22 }),
              new TextRun({ text: `Total Rooms: ${report.grandTotals.numberOfRooms}  |  `, bold: true, size: 22 }),
              new TextRun({ text: `Total Nights: ${report.grandTotals.numberOfNights}  |  `, bold: true, size: 22 }),
              new TextRun({ text: `Total Amount: ₹${report.grandTotals.totalAmount}`, bold: true, size: 22 })
            ]
          })
        );

        const doc = new Document({
          sections: [{
            children: documentChildren
          }]
        });

        const buffer = await Packer.toBuffer(doc);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
        res.send(buffer);
      }
    } catch (error: any) {
      console.error("Booking details export error:", error);
      res.status(500).json({ message: "Failed to export booking details report", details: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function logRequest(req: any, res: any, next: any) {
  const start = Date.now();
  const { method, url } = req;
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} ${method} ${url} ${res.statusCode} ${duration}ms`);
  });
  next();
}