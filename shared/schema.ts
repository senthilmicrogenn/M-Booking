import { pgTable, text, integer, timestamp, boolean, decimal, json, varchar, serial, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication and user management
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").unique(),
  phoneNumber: text("phone_number").unique().notNull(),
  password: text("password"),
  name: text("name").notNull(),
  gender: text("gender"),
  dateOfBirth: timestamp("date_of_birth"),
  companyName: text("company_name"),
  gstNumber: text("gst_number"),
  permanentAddress: text("permanent_address"),
  billingAddress: text("billing_address"),
  preferredRoomType: text("preferred_room_type"),
  preferredLanguage: text("preferred_language"),
  specialRequests: text("special_requests"),
  notificationPreferences: json("notification_preferences"),
  socialAccounts: json("social_accounts"),
  referralCode: text("referral_code"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactNumber: text("emergency_contact_number"),
  profilePhoto: text("profile_photo"),
  role: text("role").notNull().default("guest"), // Kept for backwards compatibility
  roleId: integer("role_id"), // Role master reference - will be linked after roleMaster table is defined
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Properties table for hotels, conference rooms, and transportation
export const properties = pgTable("properties", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'hotel', 'conference_room', 'flight', 'train', 'bus', 'taxi'
  location: text("location").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  area: text("area"),
  pincode: text("pincode"),
  description: text("description"),
  amenities: text("amenities").array(),
  images: text("images").array(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  availability: boolean("availability").default(true),
  categoryId: integer("category_id").references(() => propertyCategories.id),
  capacity: integer("capacity"), // For conference rooms
  distanceFromLandmarks: json("distance_from_landmarks"),
  houseRules: text("house_rules").array(),
  cancellationPolicy: json("cancellation_policy"),
  coordinates: json("coordinates"), // lat, lng
  
  // Transportation specific fields
  departureLocation: text("departure_location"), // For flights, trains, buses
  arrivalLocation: text("arrival_location"),
  departureTime: timestamp("departure_time"),
  arrivalTime: timestamp("arrival_time"),
  duration: text("duration"), // Duration of journey
  operatorName: text("operator_name"), // Airline, Railway, Bus operator
  vehicleNumber: text("vehicle_number"), // Flight number, Train number, Bus number
  vehicleType: text("vehicle_type"), // Boeing 737, AC Sleeper, etc.
  seatTypes: json("seat_types"), // Available seat classes with prices
  totalSeats: integer("total_seats"),
  availableSeats: integer("available_seats"),
  stops: json("stops"), // Intermediate stops for buses/trains
  baggage: json("baggage_info"), // Baggage allowance
  operatorLogo: text("operator_logo"),
  
  // Taxi specific fields
  taxiType: text("taxi_type"), // 'sedan', 'suv', 'auto', 'bike'
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  vehicleModel: text("vehicle_model"),
  licensePlate: text("license_plate"),
  ratePerKm: decimal("rate_per_km", { precision: 10, scale: 2 }),
  baseFare: decimal("base_fare", { precision: 10, scale: 2 }),
  
  // Master data relationships
  currencyId: integer("currency_id").references(() => currencyMaster.id),
  hotelStarRatingId: integer("hotel_star_rating_id").references(() => hotelStarRatings.id),
  customerReviewRatingId: integer("customer_review_rating_id").references(() => customerReviewRatings.id),
  propertyAreaId: integer("property_area_id").references(() => propertyAreas.id),
  roomAmenityIds: integer("room_amenity_ids").array(),
  hotelAmenityIds: integer("hotel_amenity_ids").array(),
  roomTypeIds: integer("room_type_ids").array(),
  roomTypeCounts: json("room_type_counts"), // { roomTypeId: count } mapping
  policyTemplateIds: integer("policy_template_ids").array(),

  // Property owner contact information
  ownerEmail: text("owner_email"), // Owner email for booking notifications
  ownerPhone: text("owner_phone"), // Owner phone number
  ownerName: text("owner_name"), // Owner name

  // Approval workflow fields
  approvalStatus: text("approval_status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  approvedBy: integer("approved_by").references(() => users.id), // User who approved/rejected
  approvedAt: timestamp("approved_at"), // When approved/rejected
  rejectionReason: text("rejection_reason"), // Reason for rejection

  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});



// Property Categories table for master data management
export const propertyCategories = pgTable("property_categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  propertyType: text("property_type").notNull(), // 'hotel', 'conference_room', 'flight', 'train', 'bus', 'taxi'
  categoryName: text("category_name").notNull(), // 'Boutique', 'Three Star', 'Five Star', 'Business Class', etc.
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Property Areas Master Data for location filtering
export const propertyAreas = pgTable("property_areas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  cityName: text("city_name").notNull(),
  areaName: text("area_name").notNull(),
  pincode: text("pincode"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Property Amenities Master Data
export const propertyAmenities = pgTable("property_amenities", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  amenityType: text("amenity_type").notNull(), // 'room_amenity' or 'hotel_amenity'
  amenityName: text("amenity_name").notNull(),
  description: text("description"),
  icon: text("icon"), // Icon class or emoji for UI
  category: text("category"), // 'comfort', 'technology', 'safety', 'recreation', etc.
  pictures: text("pictures").array(), // Array of picture URLs from object storage
  videos: text("videos").array(), // Array of video URLs from object storage
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Hotel Star Ratings Master Data
export const hotelStarRatings = pgTable("hotel_star_ratings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  starRating: integer("star_rating").notNull(), // 1, 2, 3, 4, 5
  ratingName: text("rating_name").notNull(), // 'One Star', 'Two Star', etc.
  description: text("description"),
  icon: text("icon"), // Star icons
  amenitiesIncluded: text("amenities_included").array(), // Expected amenities for this rating
  serviceLevel: text("service_level"), // 'Basic', 'Standard', 'Premium', 'Luxury', 'Ultra Luxury'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Customer Review Ratings Master Data
export const customerReviewRatings = pgTable("customer_review_ratings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  ratingRange: text("rating_range").notNull(), // '4.5-5.0', '4.0-4.4', etc.
  ratingLabel: text("rating_label").notNull(), // 'Excellent', 'Very Good', 'Good', etc.
  minRating: decimal("min_rating", { precision: 3, scale: 2 }).notNull(), // 4.50
  maxRating: decimal("max_rating", { precision: 3, scale: 2 }).notNull(), // 5.00
  description: text("description"),
  color: text("color"), // CSS color for UI badges
  icon: text("icon"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Bookings table for all types of reservations
export const bookings = pgTable("bookings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  roomTypeId: integer("room_type_id").references(() => roomTypes.id),
  bookingType: text("booking_type").notNull(), // 'hotel', 'conference_room', 'refreshment_stay'
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  checkInTime: text("check_in_time"),
  checkOutTime: text("check_out_time"),
  guests: integer("guests").notNull(),
  numberOfRooms: integer("number_of_rooms").default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("confirmed"), // 'confirmed', 'cancelled', 'completed', 'checked_in', 'checked_out'
  paymentStatus: text("payment_status").notNull().default("paid"),
  paymentMethod: text("payment_method"),
  bookingReference: text("booking_reference").unique(),
  roomNumber: text("room_number"),
  guestDetails: json("guest_details"),
  specialRequests: text("special_requests"),
  promoCode: text("promo_code"),
  couponCode: text("coupon_code"), // Applied coupon code (SAVE10, FLAT500, etc.)
  couponType: text("coupon_type"), // 'percentage' or 'flat'
  couponDiscountAmount: decimal("coupon_discount_amount", { precision: 10, scale: 2 }).default("0"), // Actual discount applied
  isRefreshmentStay: boolean("is_refreshment_stay").default(false),
  refreshmentSlot: text("refreshment_slot"), // 'slot1', 'slot2'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  bookingId: text("booking_id") // 16-digit alphanumeric booking ID
});

// Transaction Booking Master - Header level transaction data
export const transBookingMas = pgTable("trans_booking_mas", {
  masBillingId: integer("mas_billing_id").primaryKey().generatedAlwaysAsIdentity(),
  bookingId: text("booking_id").notNull(), // Links to bookings.bookingId (16-digit alphanumeric)
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  guestId: integer("guest_id").references(() => guestMaster.id), // Links to guest_master
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Transaction Booking Detail - Line item level transaction data
export const transBookingDet = pgTable("trans_booking_det", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  masBillingId: integer("mas_billing_id").references(() => transBookingMas.masBillingId, { onDelete: "cascade" }).notNull(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  roomTypeId: integer("room_type_id").references(() => roomTypes.id).notNull(),
  numberOfRooms: integer("number_of_rooms").notNull().default(1),
  numberOfNights: integer("number_of_nights").notNull().default(1),
  ratePerNight: decimal("rate_per_night", { precision: 10, scale: 2 }).notNull(), // Rate after discount
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  taxableAmount: decimal("taxable_amount", { precision: 10, scale: 2 }).notNull(), // (ratePerNight - discount) * numberOfNights
  gst: decimal("gst", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // taxableAmount + GST
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schemas for transaction tables
export const insertTransBookingMasSchema = createInsertSchema(transBookingMas).omit({
  masBillingId: true,
  createdAt: true,
  updatedAt: true
});

export const insertTransBookingDetSchema = createInsertSchema(transBookingDet).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type TransBookingMas = typeof transBookingMas.$inferSelect;
export type NewTransBookingMas = z.infer<typeof insertTransBookingMasSchema>;
export type TransBookingDet = typeof transBookingDet.$inferSelect;
export type NewTransBookingDet = z.infer<typeof insertTransBookingDetSchema>;

// Transaction Booking Detail Datewise table - stores date-by-date booking records for inventory tracking
export const transBookingDetailDatewise = pgTable("trans_booking_detaildatewise", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  masBillingId: integer("mas_billing_id").references(() => transBookingMas.masBillingId, { onDelete: "cascade" }).notNull(),
  bookingDate: timestamp("booking_date").notNull(), // One record per date from check-in to check-out
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  roomTypeId: integer("room_type_id").references(() => roomTypes.id).notNull(),
  roomCount: integer("room_count").notNull().default(1), // Number of rooms booked for this date
  balanceRoomCount: integer("balance_room_count").notNull(), // Allocated - sum(booked) for this date/roomType/property
  checkInTime: varchar("check_in_time", { length: 5 }).notNull().default("00:00"), // HH:MM format, 00:00 for full day
  checkOutTime: varchar("check_out_time", { length: 5 }).notNull().default("23:59"), // HH:MM format, 23:59 for full day
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for transaction booking detail datewise
export const insertTransBookingDetailDatewiseSchema = createInsertSchema(transBookingDetailDatewise).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type TransBookingDetailDatewise = typeof transBookingDetailDatewise.$inferSelect;
export type NewTransBookingDetailDatewise = z.infer<typeof insertTransBookingDetailDatewiseSchema>;

// RoomNest Money wallet system
export const wallets = pgTable("wallets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Wallet transactions
export const walletTransactions = pgTable("wallet_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  walletId: integer("wallet_id").references(() => wallets.id).notNull(),
  type: text("type").notNull(), // 'credit', 'debit'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  referenceId: text("reference_id"), // booking_id or refund_id
  status: text("status").default("completed"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Loyalty rewards system
export const loyaltyProgram = pgTable("loyalty_program", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  completedBookings: integer("completed_bookings").default(0),
  availableRefreshmentStays: integer("available_refreshment_stays").default(0),
  isFirstTimeUser: boolean("is_first_time_user").default(true),
  firstRefreshmentClaimed: boolean("first_refreshment_claimed").default(false),
  lastRefreshmentEarned: timestamp("last_refreshment_earned"),
  refreshmentExpiryDate: timestamp("refreshment_expiry_date"),
  totalPointsEarned: integer("total_points_earned").default(0),
  currentPoints: integer("current_points").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Reviews and feedback
export const reviews = pgTable("reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  reviewText: text("review_text"),
  isRecommended: boolean("is_recommended").default(true),
  images: text("images").array(),
  response: text("response"), // Property response
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Business partner inquiries
export const franchiseInquiries = pgTable("franchise_inquiries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fullName: text("full_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email").notNull(),
  locationPreference: text("location_preference").notNull(),
  budgetRange: text("budget_range").notNull(),
  hasExistingBusiness: boolean("has_existing_business").default(false),
  status: text("status").default("pending"), // 'pending', 'contacted', 'approved', 'rejected'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Notifications
export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'booking', 'payment', 'reward', 'offer', 'reminder'
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Promotions and offers
export const promotions = pgTable("promotions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  code: text("code").unique(),
  discountType: text("discount_type").notNull(), // 'percentage', 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  applicableFor: text("applicable_for").array(), // 'hotel', 'conference_room'
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Wishlist
export const wishlists = pgTable("wishlists", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Room Views master data
export const roomViews = pgTable("room_views", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  viewName: text("view_name").notNull(), // "Pool View", "Garden View", "City View"
  viewType: text("view_type").notNull(), // "exterior", "interior", "landmark"
  description: text("description"),
  icon: text("icon").default("🏞️"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Room Types master data
export const roomTypes = pgTable("room_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  roomTypeName: text("room_type_name").notNull(), // "Deluxe Room", "Executive Suite"
  propertyId: integer("property_id").references(() => properties.id), // Links room type to property
  roomSizeSquareMeters: integer("room_size_square_meters").notNull(),
  roomViewId: integer("room_view_id").references(() => roomViews.id),
  roomCount: integer("room_count").notNull().default(1),
  maxOccupancy: integer("max_occupancy").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Room Photos and Videos master data for different room areas
export const roomPhotos = pgTable("room_photos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  roomTypeId: integer("room_type_id").references(() => roomTypes.id).notNull(),
  photoGroup: text("photo_group").notNull(), // "bedroom", "washroom", "restroom", "balcony", "living_area"
  photoName: text("photo_name").notNull(), // "King Bed View", "Master Bathroom"
  photoUrl: text("photo_url").notNull(), // Object storage URL
  photoPath: text("photo_path").notNull(), // Internal storage path
  mediaType: text("media_type").notNull().default("photo"), // "photo", "video"
  originalResolution: text("original_resolution"), // "1920x1080"
  compressedResolution: text("compressed_resolution"), // "1200x800"
  resolutionPercentage: integer("resolution_percentage").default(100), // 85 (minimum 80% required for photos, 100 for videos)
  originalFileSize: integer("original_file_size"), // Original file size in bytes
  compressedFileSize: integer("compressed_file_size"), // Compressed file size in bytes
  compressionRatio: decimal("compression_ratio", { precision: 5, scale: 3 }), // Compression ratio (e.g., 0.65 for 65% size reduction)
  compressionQuality: integer("compression_quality").default(85), // JPEG quality 1-100
  mimeType: text("mime_type"), // "image/jpeg", "image/png", "video/mp4", "video/webm"
  thumbnailUrl: text("thumbnail_url"), // Small thumbnail URL for previews
  duration: integer("duration"), // Video duration in seconds (for videos only)
  isCompressed: boolean("is_compressed").default(true), // Whether media was compressed
  isMainPhoto: boolean("is_main_photo").default(false), // One main photo per group
  displayOrder: integer("display_order").default(1), // Order within the group
  altText: text("alt_text"), // For accessibility
  uploadedBy: text("uploaded_by"), // User who uploaded
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Policy Templates master data for Cancellation, House Rules, Refund policies
export const policyTemplates = pgTable("policy_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  policyType: text("policy_type").notNull(), // "cancellation", "house_rules", "refund", "privacy", "terms"
  policyTitle: text("policy_title").notNull(), // "Cancellation Policy", "House Rules"
  policyContent: text("policy_content").notNull(), // Rich text content in HTML format
  templateFormat: text("template_format").default("html"), // "html", "markdown", "plain_text"
  applicableFor: text("applicable_for").array(), // ["hotel", "flight", "bus"] - which services this applies to
  isDefault: boolean("is_default").default(false), // Is this the default template for this policy type
  isActive: boolean("is_active").default(true).notNull(),
  version: text("version").default("1.0"), // Policy version for tracking changes
  effectiveDate: timestamp("effective_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date"), // When this policy expires (optional)
  createdBy: text("created_by"), // Admin user who created this
  approvedBy: text("approved_by"), // Admin user who approved this
  approvalStatus: text("approval_status").default("draft"), // "draft", "approved", "rejected"
  metadata: json("metadata"), // Additional policy metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Schema validation with proper Zod handling
export const insertUserSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  email: z.string().email().optional(),
  name: z.string().min(1),
  password: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.date().optional(),
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
  permanentAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  preferredRoomType: z.string().optional(),
  preferredLanguage: z.string().optional(),
  specialRequests: z.string().optional(),
  notificationPreferences: z.any().optional(),
  socialAccounts: z.any().optional(),
  referralCode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
  profilePhoto: z.string().optional(),
  role: z.string().default("guest"),
  isVerified: z.boolean().default(false)
});

// Manual property schema to avoid circular dependency issues
export const insertPropertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  type: z.enum(["hotel", "conference_room", "flight", "train", "bus", "taxi"]),
  location: z.string().min(1, "Location is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  pincode: z.string().optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  hourlyRate: z.string().optional(),
  rating: z.string().optional(),
  reviewCount: z.number().optional(),
  availability: z.boolean().default(true),
  categoryId: z.number().optional(),
  capacity: z.number().optional(),
  distanceFromLandmarks: z.any().optional(),
  houseRules: z.array(z.string()).optional(),
  cancellationPolicy: z.any().optional(),
  coordinates: z.any().optional(),
  
  // Transportation specific fields
  departureLocation: z.string().optional(),
  arrivalLocation: z.string().optional(),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  duration: z.string().optional(),
  operatorName: z.string().optional(),
  vehicleNumber: z.string().optional(),
  vehicleType: z.string().optional(),
  seatTypes: z.any().optional(),
  totalSeats: z.number().optional(),
  availableSeats: z.number().optional(),
  stops: z.any().optional(),
  baggage: z.any().optional(),
  operatorLogo: z.string().optional(),
  
  // Taxi specific fields
  taxiType: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vehicleModel: z.string().optional(),
  licensePlate: z.string().optional(),
  ratePerKm: z.string().optional(),
  baseFare: z.string().optional(),
  
  // Master data relationships
  currencyId: z.number().optional(),
  hotelStarRatingId: z.number().optional(),
  customerReviewRatingId: z.number().optional(),
  propertyAreaId: z.number().optional(),
  roomAmenityIds: z.array(z.number()).optional(),
  hotelAmenityIds: z.array(z.number()).optional(),
  roomTypeIds: z.array(z.number()).optional(),
  roomTypeCounts: z.record(z.number()).optional(),
  policyTemplateIds: z.array(z.number()).optional(),
  
  // Approval workflow fields
  approvalStatus: z.string().default("pending"),
  approvedBy: z.number().optional(),
  approvedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  
  metadata: z.any().optional()
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  bookingReference: true
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true
});

export const insertLoyaltyProgramSchema = createInsertSchema(loyaltyProgram).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true
});

export const insertFranchiseInquirySchema = createInsertSchema(franchiseInquiries).omit({
  id: true,
  createdAt: true
});

export const insertPropertyCategorySchema = createInsertSchema(propertyCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPropertyAreaSchema = createInsertSchema(propertyAreas).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPropertyAmenitySchema = createInsertSchema(propertyAmenities).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertHotelStarRatingSchema = createInsertSchema(hotelStarRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCustomerReviewRatingSchema = createInsertSchema(customerReviewRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertRoomViewSchema = createInsertSchema(roomViews).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertRoomTypeSchema = createInsertSchema(roomTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  roomTypeName: z.string().min(1, "Room type name is required").refine(
    (val) => val.trim().length > 0, 
    { message: "Room type name cannot be empty or contain only spaces" }
  )
});

export const insertPolicyTemplateSchema = createInsertSchema(policyTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  policyType: z.string().min(1, "Policy type is required"),
  policyTitle: z.string().min(1, "Policy title is required").refine(
    (val) => val.trim().length > 0, 
    { message: "Policy title cannot be empty or contain only spaces" }
  ),
  policyContent: z.string().min(1, "Policy content is required").refine(
    (val) => val.trim().length > 0, 
    { message: "Policy content cannot be empty or contain only spaces" }
  ),
  effectiveDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  expiryDate: z.string().optional().nullable().transform((val) => {
    if (!val || val === '') return null;
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  })
});

export const insertRoomPhotoSchema = createInsertSchema(roomPhotos).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

export const insertPromotionSchema = createInsertSchema(promotions).omit({
  id: true,
  createdAt: true
});

export const insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  createdAt: true
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Property = typeof properties.$inferSelect;
export type NewProperty = z.infer<typeof insertPropertySchema>;
export type RoomType = typeof roomTypes.$inferSelect;
export type NewRoomType = z.infer<typeof insertRoomTypeSchema>;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = z.infer<typeof insertBookingSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = z.infer<typeof insertWalletSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type NewWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type LoyaltyProgram = typeof loyaltyProgram.$inferSelect;
export type NewLoyaltyProgram = z.infer<typeof insertLoyaltyProgramSchema>;
export type Review = typeof reviews.$inferSelect;
export type NewReview = z.infer<typeof insertReviewSchema>;
export type FranchiseInquiry = typeof franchiseInquiries.$inferSelect;
export type NewFranchiseInquiry = z.infer<typeof insertFranchiseInquirySchema>;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = z.infer<typeof insertNotificationSchema>;
export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = z.infer<typeof insertPromotionSchema>;
export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = z.infer<typeof insertWishlistSchema>;
export type PropertyCategory = typeof propertyCategories.$inferSelect;
export type NewPropertyCategory = z.infer<typeof insertPropertyCategorySchema>;
export type PropertyArea = typeof propertyAreas.$inferSelect;
export type NewPropertyArea = z.infer<typeof insertPropertyAreaSchema>;
export type PropertyAmenity = typeof propertyAmenities.$inferSelect;
export type NewPropertyAmenity = z.infer<typeof insertPropertyAmenitySchema>;
export type HotelStarRating = typeof hotelStarRatings.$inferSelect;
export type NewHotelStarRating = z.infer<typeof insertHotelStarRatingSchema>;
export type CustomerReviewRating = typeof customerReviewRatings.$inferSelect;
export type NewCustomerReviewRating = z.infer<typeof insertCustomerReviewRatingSchema>;
export type RoomView = typeof roomViews.$inferSelect;
export type NewRoomView = z.infer<typeof insertRoomViewSchema>;
export type PolicyTemplate = typeof policyTemplates.$inferSelect;
export type NewPolicyTemplate = z.infer<typeof insertPolicyTemplateSchema>;
export type RoomPhoto = typeof roomPhotos.$inferSelect;
export type NewRoomPhoto = z.infer<typeof insertRoomPhotoSchema>;
export type PlanMaster = typeof planMaster.$inferSelect;
export type NewPlanMaster = z.infer<typeof insertPlanMasterSchema>;
export type PlanPropertyPricing = typeof planPropertyPricing.$inferSelect;
export type NewPlanPropertyPricing = z.infer<typeof insertPlanPropertyPricingSchema>;

// Currency Master for multi-currency support
export const currencyMaster = pgTable("currency_master", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  currencyName: varchar("currency_name", { length: 100 }).notNull(), // Indian Rupee, US Dollar, etc.
  shortName: varchar("short_name", { length: 10 }).notNull().unique(), // INR, USD, EUR, etc.
  conversionPrice: decimal("conversion_price", { precision: 15, scale: 6 }).notNull(), // Exchange rate
  asOnDate: date("as_on_date").notNull(), // Date of the exchange rate
  isActive: boolean("is_active").default(true).notNull(),
  symbol: varchar("symbol", { length: 10 }).notNull(), // ₹, $, €, etc.
  country: varchar("country", { length: 100 }), // India, United States, etc.
  isBaseCurrency: boolean("is_base_currency").default(false), // For setting base currency (usually INR)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Currency Master schemas
export const insertCurrencyMasterSchema = createInsertSchema(currencyMaster).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const selectCurrencyMasterSchema = createSelectSchema(currencyMaster);

export type CurrencyMaster = typeof currencyMaster.$inferSelect;
export type NewCurrencyMaster = z.infer<typeof insertCurrencyMasterSchema>;

// Rate Master for property-based room type pricing
export const rateMaster = pgTable("rate_master", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }), // Made nullable for multi-property rates
  propertyIds: integer("property_ids").array(), // Array of property IDs for multi-property rates
  roomTypeId: integer("room_type_id").notNull().references(() => roomTypes.id, { onDelete: "cascade" }),
  rateName: varchar("rate_name", { length: 100 }).notNull(), // e.g., "Summer Special", "Festive Rates"
  fromDate: date("from_date").notNull(),
  toDate: date("to_date").notNull(),
  
  // Occupancy-based pricing
  singleOccupancyRate: decimal("single_occupancy_rate", { precision: 10, scale: 2 }).notNull(),
  doubleOccupancyRate: decimal("double_occupancy_rate", { precision: 10, scale: 2 }).notNull(),
  tripleOccupancyRate: decimal("triple_occupancy_rate", { precision: 10, scale: 2 }).notNull(),
  quadrupleOccupancyRate: decimal("quadruple_occupancy_rate", { precision: 10, scale: 2 }).notNull(),
  
  // Additional charges
  extraPersonCharge: decimal("extra_person_charge", { precision: 10, scale: 2 }).default("0.00"),
  petCharge: decimal("pet_charge", { precision: 10, scale: 2 }).default("0.00"),
  childCharge: decimal("child_charge", { precision: 10, scale: 2 }).default("0.00"), // Age 6-12
  infantCharge: decimal("infant_charge", { precision: 10, scale: 2 }).default("0.00"), // Age 0-5
  
  // Special charges
  weekendSurcharge: decimal("weekend_surcharge", { precision: 10, scale: 2 }).default("0.00"), // Friday-Sunday
  festivalSurcharge: decimal("festival_surcharge", { precision: 10, scale: 2 }).default("0.00"),
  
  // Configuration
  currencyId: integer("currency_id").notNull().references(() => currencyMaster.id),
  excludedDays: json("excluded_days"), // Array of dates to exclude like ["2025-01-26", "2025-12-25"]
  weekendDays: json("weekend_days").default('["friday","saturday","sunday"]'), // Configurable weekend days
  
  // Metadata
  isActive: boolean("is_active").default(true).notNull(),
  priority: integer("priority").default(1), // Higher priority rates override lower ones
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Rate Master schemas
export const insertRateMasterSchema = createInsertSchema(rateMaster).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  propertyId: z.number().nullish(), // Made optional to support multi-property rates
  propertyIds: z.array(z.number()).nullish(), // Array of property IDs for multi-property rates
  roomTypeId: z.number(), // Explicitly include roomTypeId
  currencyId: z.number(), // Required currency ID
  rateName: z.string().min(1, "Rate name is required"), // Add rateName
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  singleOccupancyRate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid rate format"),
  doubleOccupancyRate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid rate format"),
  tripleOccupancyRate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid rate format"),
  quadrupleOccupancyRate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid rate format"),
  extraPersonCharge: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid charge format").optional(),
  petCharge: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid charge format").optional(),
  childCharge: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid charge format").optional(),
  infantCharge: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid charge format").optional(),
  weekendSurcharge: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid charge format").optional(),
  festivalSurcharge: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid charge format").optional()
});

export const selectRateMasterSchema = createSelectSchema(rateMaster);

export type RateMaster = typeof rateMaster.$inferSelect;
export type NewRateMaster = z.infer<typeof insertRateMasterSchema>;

// Enhanced Booking System Core Tables
export const enhancedBookingStatus = pgEnum('enhanced_booking_status', ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']);

export const enhancedBookings = pgTable("enhanced_bookings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookingReference: varchar("booking_reference", { length: 20 }).notNull().unique(),
  
  // Guest Information
  guestName: varchar("guest_name", { length: 100 }).notNull(),
  guestEmail: varchar("guest_email", { length: 255 }).notNull(),
  guestPhone: varchar("guest_phone", { length: 20 }).notNull(),
  guestAddress: text("guest_address"),
  
  // Property and Room Details
  propertyId: integer("property_id").notNull().references(() => properties.id),
  roomTypeId: integer("room_type_id").notNull().references(() => roomTypes.id),
  planMasterId: integer("plan_master_id").references(() => planMaster.id),
  
  // Booking Dates
  checkIn: date("check_in").notNull(),
  checkOut: date("check_out").notNull(),
  nights: integer("nights").notNull(),
  
  // Occupancy Details
  adults: integer("adults").notNull().default(1),
  children: integer("children").notNull().default(0),
  infants: integer("infants").notNull().default(0),
  rooms: integer("rooms").notNull().default(1),
  
  // Pricing Details
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
  extraCharges: decimal("extra_charges", { precision: 10, scale: 2 }).default("0.00"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currencyId: integer("currency_id").notNull().references(() => currencyMaster.id),
  
  // Special Requests
  specialRequests: text("special_requests"),
  dietaryRestrictions: text("dietary_restrictions"),
  accessibilityNeeds: text("accessibility_needs"),
  
  // Status and Timestamps
  status: enhancedBookingStatus("status").default("pending"),
  bookedAt: timestamp("booked_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  
  // Payment Information
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  transactionId: varchar("transaction_id", { length: 100 }),
  
  // Metadata
  sourceChannel: varchar("source_channel", { length: 50 }).default("web"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Search and Availability System
export const roomInventory = pgTable("room_inventory", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  roomTypeId: integer("room_type_id").notNull().references(() => roomTypes.id),
  date: date("date").notNull(),
  totalRooms: integer("total_rooms").notNull(),
  availableRooms: integer("available_rooms").notNull(),
  bookedRooms: integer("booked_rooms").notNull().default(0),
  blockedRooms: integer("blocked_rooms").notNull().default(0),
  isActive: boolean("is_active").default(true).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull()
});


// Enhanced Booking schema validation
export const insertEnhancedBookingSchema = createInsertSchema(enhancedBookings).omit({
  id: true,
  bookingReference: true,
  bookedAt: true,
  createdAt: true,
  updatedAt: true
}).extend({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  baseAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  taxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format").optional(),
  extraCharges: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format").optional(),
  discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format").optional(),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format")
});

export const selectEnhancedBookingSchema = createSelectSchema(enhancedBookings);

export type EnhancedBooking = typeof enhancedBookings.$inferSelect;
export type NewEnhancedBooking = z.infer<typeof insertEnhancedBookingSchema>;

// Room inventory schemas
export const insertRoomInventorySchema = createInsertSchema(roomInventory).omit({
  id: true,
  lastUpdated: true
});

export const selectRoomInventorySchema = createSelectSchema(roomInventory);

export type RoomInventory = typeof roomInventory.$inferSelect;
export type NewRoomInventory = z.infer<typeof insertRoomInventorySchema>;

// General Ledger Master for Accounting
export const accountType = pgEnum('account_type', ['asset', 'liability', 'equity', 'income', 'expense']);
export const normalBalance = pgEnum('normal_balance', ['debit', 'credit']);

export const generalLedgerMaster = pgTable("general_ledger_master", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  accountName: varchar("account_name", { length: 100 }).notNull(),
  shortName: varchar("short_name", { length: 20 }).notNull().unique(),
  accountCode: varchar("account_code", { length: 10 }).unique(),
  accountType: accountType("account_type").notNull(),
  normalBalance: normalBalance("normal_balance").notNull(),
  parentAccountId: integer("parent_account_id"), // Self-reference - will be linked later
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  isSystemAccount: boolean("is_system_account").default(false),
  
  // Financial tracking
  currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).default("0.00"),
  lastTransactionDate: date("last_transaction_date"),
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 50 }),
  updatedBy: varchar("updated_by", { length: 50 })
});

// Chart of Accounts validation schema
export const insertGeneralLedgerMasterSchema = createInsertSchema(generalLedgerMaster).omit({
  id: true,
  currentBalance: true,
  lastTransactionDate: true,
  createdAt: true,
  updatedAt: true
}).extend({
  accountName: z.string().min(2, "Account name must be at least 2 characters").max(100, "Account name too long"),
  shortName: z.string().min(1, "Short name is required").max(20, "Short name too long"),
  accountCode: z.string().max(10, "Account code too long").optional(),
  accountType: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  normalBalance: z.enum(['debit', 'credit']),
  description: z.string().optional()
});

export const selectGeneralLedgerMasterSchema = createSelectSchema(generalLedgerMaster);

export type GeneralLedgerMaster = typeof generalLedgerMaster.$inferSelect;
export type NewGeneralLedgerMaster = z.infer<typeof insertGeneralLedgerMasterSchema>;

// Subledger Master for detailed subsidiary accounting
export const subledgerMaster = pgTable("subledger_master", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  subledgerName: varchar("subledger_name", { length: 100 }).notNull(),
  shortName: varchar("short_name", { length: 20 }).notNull().unique(),
  subledgerCode: varchar("subledger_code", { length: 15 }).unique(),
  generalLedgerAccountId: integer("general_ledger_account_id"), // References general ledger master
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  isDefaultLedger: boolean("is_default_ledger").default(false),
  taxPercentage: decimal("tax_percentage", { precision: 5, scale: 2 }).default("0.00"),
  
  // Additional financial tracking
  currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).default("0.00"),
  lastTransactionDate: date("last_transaction_date"),
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 50 }),
  updatedBy: varchar("updated_by", { length: 50 })
});

// Subledger Master validation schema
export const insertSubledgerMasterSchema = createInsertSchema(subledgerMaster).omit({
  id: true,
  currentBalance: true,
  lastTransactionDate: true,
  createdAt: true,
  updatedAt: true
}).extend({
  subledgerName: z.string().min(2, "Subledger name must be at least 2 characters").max(100, "Subledger name too long"),
  shortName: z.string().min(1, "Short name is required").max(20, "Short name too long"),
  subledgerCode: z.string().max(15, "Subledger code too long").optional(),
  generalLedgerAccountId: z.number().optional(),
  description: z.string().optional(),
  taxPercentage: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "Tax percentage must be between 0 and 100").optional()
});

export const selectSubledgerMasterSchema = createSelectSchema(subledgerMaster);

export type SubledgerMaster = typeof subledgerMaster.$inferSelect;
export type NewSubledgerMaster = z.infer<typeof insertSubledgerMasterSchema>;

// Meal Inclusion Master for managing meal types and inclusions
export const mealInclusionMaster = pgTable("meal_inclusion_master", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  mealCode: varchar("meal_code", { length: 10 }).notNull().unique(), // BF, LN, DN, etc.
  mealName: varchar("meal_name", { length: 100 }).notNull(), // Breakfast, Lunch, Dinner, etc.
  mealDescription: text("meal_description"), // Detailed description
  mealCategory: varchar("meal_category", { length: 50 }).notNull(), // "meal", "beverage", "service", "amenity"
  
  // Display settings
  displayOrder: integer("display_order").default(1),
  mealIcon: varchar("meal_icon", { length: 50 }), // Icon identifier
  mealColor: varchar("meal_color", { length: 7 }).default("#6B7280"), // Hex color for UI
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  isPopular: boolean("is_popular").default(false), // Popular inclusions
  
  // Pricing impact
  hasAdditionalCost: boolean("has_additional_cost").default(false),
  additionalCostPercentage: decimal("additional_cost_percentage", { precision: 5, scale: 2 }).default("0.00"),
  
  // Metadata
  servingTimes: text("serving_times"), // JSON array of serving times ["07:00-10:00", "19:00-22:00"]
  dietary: text("dietary"), // JSON array of dietary info ["vegetarian", "vegan", "gluten-free"]
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertMealInclusionMasterSchema = createInsertSchema(mealInclusionMaster).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  mealCode: z.string().min(1, "Meal code is required").max(10, "Meal code too long"),
  mealName: z.string().min(2, "Meal name must be at least 2 characters").max(100, "Meal name too long"),
  mealCategory: z.enum(["meal", "beverage", "service", "amenity"], {
    errorMap: () => ({ message: "Invalid meal category" })
  }),
  additionalCostPercentage: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "Cost percentage must be between 0 and 100").optional()
});

export const selectMealInclusionMasterSchema = createSelectSchema(mealInclusionMaster);

export type MealInclusionMaster = typeof mealInclusionMaster.$inferSelect;
export type NewMealInclusionMaster = z.infer<typeof insertMealInclusionMasterSchema>;

// Plan Meal Inclusions - Junction table linking plans to meal inclusions
export const planMealInclusions = pgTable("plan_meal_inclusions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  planId: integer("plan_id").notNull().references(() => planMaster.id, { onDelete: "cascade" }),
  mealInclusionId: integer("meal_inclusion_id").notNull().references(() => mealInclusionMaster.id, { onDelete: "cascade" }),
  
  // Plan-specific overrides
  isIncluded: boolean("is_included").default(true),
  additionalCost: decimal("additional_cost", { precision: 10, scale: 2 }).default("0.00"),
  quantity: integer("quantity").default(1), // e.g., 1 breakfast, 2 snacks
  notes: text("notes"), // Special instructions or details
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertPlanMealInclusionSchema = createInsertSchema(planMealInclusions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type PlanMealInclusion = typeof planMealInclusions.$inferSelect;
export type NewPlanMealInclusion = z.infer<typeof insertPlanMealInclusionSchema>;

// Plan Master for hotel meal plans (EP, MAP, AP)
export const planMaster = pgTable("plan_master", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  planCode: varchar("plan_code", { length: 10 }).notNull().unique(), // EP, MAP, AP, etc.
  planName: varchar("plan_name", { length: 100 }).notNull(), // European Plan, Modified American Plan, etc.
  planDescription: text("plan_description"), // Detailed description of what's included
  planType: varchar("plan_type", { length: 50 }).notNull(), // "meal_plan", "package_plan", etc.
  
  // Meal inclusions will be managed through planMealInclusions junction table
  // Removed individual boolean fields - replaced with flexible meal inclusion system
  
  // Pricing (Optional - can be property-specific)
  hasStandardPricing: boolean("has_standard_pricing").default(false),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).default("0.00"), // Base price per person per day
  childPrice: decimal("child_price", { precision: 10, scale: 2 }).default("0.00"), // Price for children
  infantPrice: decimal("infant_price", { precision: 10, scale: 2 }).default("0.00"), // Price for infants
  
  // Age definitions
  childAgeFrom: integer("child_age_from").default(2), // Child age range start
  childAgeUpto: integer("child_age_upto").default(12), // Child age range end
  infantAgeFrom: integer("infant_age_from").default(0), // Infant age range start  
  infantAgeUpto: integer("infant_age_upto").default(2), // Infant age range end
  
  // Plan configuration
  isActive: boolean("is_active").default(true).notNull(),
  isPopular: boolean("is_popular").default(false), // Mark popular plans
  sortOrder: integer("sort_order").default(1), // Display order
  
  // Validation rules
  minimumStay: integer("minimum_stay").default(1), // Minimum nights required
  maximumStay: integer("maximum_stay"), // Maximum nights allowed
  advanceBookingDays: integer("advance_booking_days").default(0), // Days in advance required
  
  // Metadata
  planIcon: varchar("plan_icon", { length: 50 }), // Icon identifier
  planColor: varchar("plan_color", { length: 7 }).default("#6B7280"), // Hex color for UI
  termsAndConditions: text("terms_and_conditions"), // T&C specific to this plan
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertPlanMasterSchema = createInsertSchema(planMaster).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Plan Property Pricing - Property-specific pricing for plans
export const planPropertyPricing = pgTable("plan_property_pricing", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  planId: integer("plan_id").notNull().references(() => planMaster.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  
  // Property-specific pricing
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  childPrice: decimal("child_price", { precision: 10, scale: 2 }).default("0.00"),
  infantPrice: decimal("infant_price", { precision: 10, scale: 2 }).default("0.00"),
  
  // Seasonal pricing
  seasonName: varchar("season_name", { length: 50 }), // "Peak", "Off-Peak", "Festival"
  validFrom: date("valid_from"),
  validUntil: date("valid_until"),
  
  // Discounts and surcharges
  weekdayDiscount: decimal("weekday_discount", { precision: 5, scale: 2 }).default("0.00"), // Percentage
  weekendSurcharge: decimal("weekend_surcharge", { precision: 5, scale: 2 }).default("0.00"), // Percentage
  
  // Availability
  isActive: boolean("is_active").default(true).notNull(),
  minimumOccupancy: integer("minimum_occupancy").default(1),
  maximumOccupancy: integer("maximum_occupancy").default(4),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertPlanPropertyPricingSchema = createInsertSchema(planPropertyPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Tariff Setup Master for Room rent GST Tax calculation
export const tariffSetupMaster = pgTable("tariff_setup_master", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fromAmount: decimal("from_amount", { precision: 15, scale: 2 }).notNull(),
  toAmount: decimal("to_amount", { precision: 15, scale: 2 }).notNull(),
  cgstPercentage: decimal("cgst_percentage", { precision: 5, scale: 2 }).notNull(), // Central GST %
  sgstPercentage: decimal("sgst_percentage", { precision: 5, scale: 2 }).notNull(), // State GST %
  validFromDate: date("valid_from_date").notNull(),
  validToDate: date("valid_to_date").notNull(),
  subledgerId: integer("subledger_id").references(() => subledgerMaster.id).notNull(),
  cgstSubledgerId: integer("cgst_subledger_id").references(() => subledgerMaster.id), // CGST-specific subledger
  sgstSubledgerId: integer("sgst_subledger_id").references(() => subledgerMaster.id), // SGST-specific subledger
  graceHour: integer("grace_hour").notNull().default(0), // Grace hours for rate calculation
  
  // Additional configuration
  isActive: boolean("is_active").default(true).notNull(),
  description: text("description"), // Optional description
  
  // Audit fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 50 }),
  updatedBy: varchar("updated_by", { length: 50 })
});

// Tariff Setup Master validation schema
export const insertTariffSetupMasterSchema = createInsertSchema(tariffSetupMaster).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  fromAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  toAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  cgstPercentage: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "CGST percentage must be between 0 and 100"),
  sgstPercentage: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "SGST percentage must be between 0 and 100"),
  validFromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  validToDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  subledgerId: z.number(),
  graceHour: z.number().min(0, "Grace hour cannot be negative"),
  cgstSubledgerId: z.number().optional().nullable(),
  sgstSubledgerId: z.number().optional().nullable(),
  description: z.string().optional(),
  isActive: z.boolean()
});

export const selectTariffSetupMasterSchema = createSelectSchema(tariffSetupMaster);

export type TariffSetupMaster = typeof tariffSetupMaster.$inferSelect;
export type NewTariffSetupMaster = z.infer<typeof insertTariffSetupMasterSchema>;

// User-Property Association for multi-property management
export const userPropertyAccess = pgTable("user_property_access", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("manager"), // 'owner', 'manager', 'staff', 'viewer'
  permissions: json("permissions").default('["read", "write"]'), // Array of permissions
  isActive: boolean("is_active").default(true).notNull(),
  assignedBy: integer("assigned_by").references(() => users.id), // Who assigned this access
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Create insert and select schemas for user property access
export const insertUserPropertyAccessSchema = createInsertSchema(userPropertyAccess).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserPropertyAccess = typeof userPropertyAccess.$inferSelect;
export type NewUserPropertyAccess = z.infer<typeof insertUserPropertyAccessSchema>;

// Role Master for comprehensive role-based permission management
export const roleMaster = pgTable("role_master", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  roleName: varchar("role_name", { length: 50 }).notNull().unique(), // e.g., "Super Admin", "Hotel Manager", "Front Desk", "Housekeeping"
  roleCode: varchar("role_code", { length: 20 }).notNull().unique(), // e.g., "SUPER_ADMIN", "HOTEL_MGR", "FRONT_DESK"
  description: text("description"), // Detailed role description
  level: integer("level").notNull().default(1), // Role hierarchy level (1 = highest, 10 = lowest)
  
  // System-wide permissions
  permissions: json("permissions").notNull().default('[]'), // Array of system permissions
  
  // Admin panel access controls
  canAccessAdminPanel: boolean("can_access_admin_panel").default(false),
  canManageUsers: boolean("can_manage_users").default(false),
  canManageProperties: boolean("can_manage_properties").default(false),
  canManageRates: boolean("can_manage_rates").default(false),
  canManageBookings: boolean("can_manage_bookings").default(false),
  canManageFinance: boolean("can_manage_finance").default(false),
  canManageReports: boolean("can_manage_reports").default(false),
  canManageMasterData: boolean("can_manage_master_data").default(false),
  canManageRoles: boolean("can_manage_roles").default(false),
  canViewAuditLogs: boolean("can_view_audit_logs").default(false),
  
  // Property-level permissions (default for property access)
  defaultPropertyPermissions: json("default_property_permissions").default('["read"]'), // Default permissions when assigned to a property
  
  // Configuration
  isActive: boolean("is_active").default(true).notNull(),
  isSystemRole: boolean("is_system_role").default(false), // Cannot be modified/deleted
  maxProperties: integer("max_properties"), // Limit on number of properties this role can access (null = unlimited)
  
  // Metadata
  color: varchar("color", { length: 7 }).default("#3B82F6"), // Display color for UI
  icon: varchar("icon", { length: 50 }).default("user"), // Icon identifier for UI
  notes: text("notes"),
  
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Create insert and select schemas for role master
export const insertRoleMasterSchema = createInsertSchema(roleMaster).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type RoleMaster = typeof roleMaster.$inferSelect;
export type NewRoleMaster = z.infer<typeof insertRoleMasterSchema>;

// Audit Log for tracking all system changes
export const auditLog = pgTable("audit_log", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  tableName: text("table_name").notNull(), // Name of the table that was modified
  recordId: text("record_id").notNull(), // ID of the record that was modified (stored as text to handle different ID types)
  action: text("action").notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
  userId: integer("user_id").references(() => users.id), // User who performed the action
  userEmail: text("user_email"), // Email of the user (for backup reference)
  userName: text("user_name"), // Name of the user (for backup reference)
  userRole: text("user_role"), // Role of the user at time of action
  
  // Change tracking
  oldValues: json("old_values"), // Previous values before change (for UPDATE/DELETE)
  newValues: json("new_values"), // New values after change (for CREATE/UPDATE)
  changedFields: text("changed_fields").array(), // Array of field names that were changed
  
  // Context information
  ipAddress: text("ip_address"), // IP address of the user
  userAgent: text("user_agent"), // Browser/client information
  sessionId: text("session_id"), // Session identifier
  propertyId: integer("property_id").references(() => properties.id), // Related property (if applicable)
  
  // Metadata
  description: text("description"), // Human-readable description of the action
  metadata: json("metadata"), // Additional context data
  severity: text("severity").default("info"), // 'info', 'warning', 'error', 'critical'
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Create insert and select schemas for audit log
export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  createdAt: true,
});

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = z.infer<typeof insertAuditLogSchema>;

// Guest Master for guest management separate from users
export const guestMaster = pgTable("guest_master", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  guestCode: varchar("guest_code", { length: 20 }).notNull().unique(), // "GUEST_001", "VIP_002"
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique(),
  phoneNumber: text("phone_number").notNull().unique(),
  alternatePhoneNumber: text("alternate_phone_number"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"), // "male", "female", "other"
  nationality: text("nationality"),
  idProofType: text("id_proof_type"), // "passport", "driving_license", "aadhar", "pan"
  idProofNumber: text("id_proof_number"),
  
  // Address information
  permanentAddress: text("permanent_address"),
  currentAddress: text("current_address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  pincode: text("pincode"),
  
  // Guest preferences
  preferredRoomType: text("preferred_room_type"),
  preferredLanguage: text("preferred_language"),
  dietaryRequirements: text("dietary_requirements"),
  specialRequests: text("special_requests"),
  smokingPreference: boolean("smoking_preference").default(false),
  
  // Guest status and classification
  guestCategory: text("guest_category").notNull().default("regular"), // "regular", "vip", "corporate", "loyalty"
  loyaltyTier: text("loyalty_tier").default("bronze"), // "bronze", "silver", "gold", "platinum"
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }).default("0.00"),
  
  // Emergency contact
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactNumber: text("emergency_contact_number"),
  emergencyContactRelation: text("emergency_contact_relation"),
  
  // Company information (for corporate guests)
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  gstNumber: text("gst_number"),
  designation: text("designation"),
  
  // Guest history and statistics
  totalBookings: integer("total_bookings").default(0),
  totalAmountSpent: decimal("total_amount_spent", { precision: 15, scale: 2 }).default("0.00"),
  lastBookingDate: timestamp("last_booking_date"),
  averageStayDuration: decimal("average_stay_duration", { precision: 5, scale: 2 }).default("1.00"), // in days
  
  // Status and flags
  isActive: boolean("is_active").default(true).notNull(),
  isBlacklisted: boolean("is_blacklisted").default(false),
  blacklistReason: text("blacklist_reason"),
  isVerified: boolean("is_verified").default(false),
  profilePhoto: text("profile_photo"),
  
  // Metadata
  notes: text("notes"),
  tags: text("tags").array(), // ["frequent_traveler", "corporate", "special_needs"]
  source: text("source").default("direct"), // "direct", "online", "agent", "corporate"
  referredBy: text("referred_by"),
  
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Create insert and select schemas for guest master
export const insertGuestMasterSchema = createInsertSchema(guestMaster).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type GuestMaster = typeof guestMaster.$inferSelect;
export type NewGuestMaster = z.infer<typeof insertGuestMasterSchema>;

// Guest Details table - stores additional guest/companion information linked to main guest
export const guestDetails = pgTable("guest_details", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  guestMasterId: integer("guest_master_id").notNull().references(() => guestMaster.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 16 }).notNull(), // Mr, Mrs, Ms, Dr
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  relationship: varchar("relationship", { length: 40 }), // spouse, child, friend, colleague
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create insert and select schemas for guest details
export const insertGuestDetailsSchema = createInsertSchema(guestDetails).omit({
  id: true,
  createdAt: true,
});

export type GuestDetails = typeof guestDetails.$inferSelect;
export type NewGuestDetails = z.infer<typeof insertGuestDetailsSchema>;

// Booking Guest Details table - stores per-booking snapshot of all guests (primary + companions)
export const bookingGuestDetails = pgTable("booking_guest_details", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").notNull().default(false),
  guestMasterId: integer("guest_master_id").references(() => guestMaster.id, { onDelete: "set null" }),
  guestDetailId: integer("guest_detail_id").references(() => guestDetails.id, { onDelete: "set null" }),
  title: varchar("title", { length: 16 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create insert and select schemas for booking guest details
export const insertBookingGuestDetailsSchema = createInsertSchema(bookingGuestDetails).omit({
  id: true,
  createdAt: true,
});

export type BookingGuestDetails = typeof bookingGuestDetails.$inferSelect;
export type NewBookingGuestDetails = z.infer<typeof insertBookingGuestDetailsSchema>;


// Re-export universal photo schema
export { universalPhotos, insertUniversalPhotoSchema } from "./universalPhotoSchema";
export type { UniversalPhoto, InsertUniversalPhoto } from "./universalPhotoSchema";