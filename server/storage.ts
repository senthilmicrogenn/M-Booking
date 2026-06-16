import { 
  type User, type NewUser,
  type Property, type NewProperty,
  type PropertyCategory, type NewPropertyCategory,
  type PropertyArea, type NewPropertyArea,
  type PropertyAmenity, type NewPropertyAmenity,
  type HotelStarRating, type NewHotelStarRating,
  type CustomerReviewRating, type NewCustomerReviewRating,
  type RoomView, type NewRoomView,
  type RoomType, type NewRoomType,
  type RoomPhoto, type NewRoomPhoto,
  type PolicyTemplate, type NewPolicyTemplate,
  type Booking, type NewBooking,
  type Wallet, type NewWallet,
  type WalletTransaction, type NewWalletTransaction,
  type LoyaltyProgram, type NewLoyaltyProgram,
  type Review, type NewReview,
  type FranchiseInquiry, type NewFranchiseInquiry,
  type Notification, type NewNotification,
  type Promotion, type NewPromotion,
  type Wishlist, type NewWishlist,
  type UniversalPhoto, type InsertUniversalPhoto,
  type PlanMaster, type NewPlanMaster,
  type PlanPropertyPricing, type NewPlanPropertyPricing,
  type CurrencyMaster, type NewCurrencyMaster,
  type RateMaster, type NewRateMaster,
  type EnhancedBooking, type NewEnhancedBooking,
  type RoomInventory, type NewRoomInventory,
  type GeneralLedgerMaster, type NewGeneralLedgerMaster,
  type SubledgerMaster, type NewSubledgerMaster,
  type TariffSetupMaster, type NewTariffSetupMaster,
  type UserPropertyAccess, type NewUserPropertyAccess,
  type AuditLog, type NewAuditLog,
  type RoleMaster, type NewRoleMaster,
  type GuestMaster, type NewGuestMaster,
  type MealInclusionMaster, type NewMealInclusionMaster,
  type PlanMealInclusion, type NewPlanMealInclusion,
  type GuestDetails, type NewGuestDetails,
  type BookingGuestDetails, type NewBookingGuestDetails,
  type TransBookingMas, type NewTransBookingMas,
  type TransBookingDet, type NewTransBookingDet,
  type TransBookingDetailDatewise, type NewTransBookingDetailDatewise
} from "@shared/schema";

// Import database connection
import { db } from "./db";
import { eq, and, like, ilike, desc, asc, sql } from 'drizzle-orm';
import { 
  compressTextData, decompressTextData, 
  compressMediaUrls, decompressMediaUrls,
  compressMetadata, decompressMetadata,
  compressTags, decompressTags 
} from "./compressionUtils";
import { 
  users, properties, propertyCategories, propertyAreas, propertyAmenities,
  hotelStarRatings, customerReviewRatings, roomViews, roomTypes, roomPhotos,
  policyTemplates, bookings, wallets, walletTransactions,
  reviews, franchiseInquiries, notifications, promotions, wishlists, loyaltyProgram,
  universalPhotos, planMaster, planPropertyPricing, currencyMaster,
  rateMaster, enhancedBookings, roomInventory, generalLedgerMaster,
  subledgerMaster, tariffSetupMaster, userPropertyAccess,
  roleMaster, guestMaster, mealInclusionMaster, planMealInclusions,
  guestDetails, bookingGuestDetails, transBookingMas, transBookingDet,
  transBookingDetailDatewise
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: NewUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Bookings
  getAllBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByUser(userId: number): Promise<Booking[]>;
  createBooking(booking: NewBooking): Promise<Booking>;
  updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined>;
  
  // Promotions
  getAllPromotions(): Promise<Promotion[]>;
  getActivePromotions(): Promise<Promotion[]>;
  createPromotion(promotion: NewPromotion): Promise<Promotion>;
  updatePromotion(id: number, updates: Partial<Promotion>): Promise<Promotion | undefined>;
  deletePromotion(id: number): Promise<boolean>;
  getPromotionByCode(code: string): Promise<Promotion | undefined>;
  
  // Properties
  getProperty(id: number): Promise<Property | undefined>;
  getAllProperties(): Promise<Property[]>;
  getPropertiesByType(type: string): Promise<Property[]>;
  searchProperties(query: {
    location?: string;
    city?: string;
    checkIn?: Date;
    checkOut?: Date;
    guests?: number;
    category?: string;
    type?: string;
  }): Promise<Property[]>;
  createProperty(property: NewProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<Property>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  getPropertyMasterData(): Promise<{
    currencies: CurrencyMaster[];
    hotelStarRatings: HotelStarRating[];
    customerReviews: CustomerReviewRating[];
    propertyAreas: PropertyArea[];
    propertyCategories: PropertyCategory[];
    roomAmenities: PropertyAmenity[];
    hotelAmenities: PropertyAmenity[];
    roomTypes: RoomType[];
    policyTemplates: PolicyTemplate[];
  }>;

  // Currency Master methods
  getAllCurrencyMasters(): Promise<CurrencyMaster[]>;
  getCurrencyMaster(id: number): Promise<CurrencyMaster | null>;
  getCurrencyMasterByShortName(shortName: string): Promise<CurrencyMaster | null>;
  getBaseCurrencyMaster(): Promise<CurrencyMaster | null>;
  getBaseCurrency(): Promise<CurrencyMaster | null>;
  createCurrencyMaster(currency: NewCurrencyMaster): Promise<CurrencyMaster>;
  updateCurrencyMaster(id: number, currency: Partial<CurrencyMaster>): Promise<CurrencyMaster | null>;
  deleteCurrencyMaster(id: number): Promise<boolean>;
  setBaseCurrencyMaster(id: number): Promise<CurrencyMaster | null>;
  setBaseCurrency(id: number): Promise<CurrencyMaster | null>;
  
  // General Ledger Master methods
  getAllGeneralLedgerAccounts(filters?: { accountType?: string; isActive?: boolean; parentAccountId?: number }): Promise<GeneralLedgerMaster[]>;
  getGeneralLedgerAccount(id: number): Promise<GeneralLedgerMaster | null>;
  createGeneralLedgerAccount(account: NewGeneralLedgerMaster): Promise<GeneralLedgerMaster>;
  updateGeneralLedgerAccount(id: number, account: Partial<GeneralLedgerMaster>): Promise<GeneralLedgerMaster | null>;
  deleteGeneralLedgerAccount(id: number): Promise<boolean>;
  getAccountsByType(accountType: string): Promise<GeneralLedgerMaster[]>;
  updateAccountBalance(id: number, amount: number): Promise<GeneralLedgerMaster | null>;
  
  // Subledger Master methods
  getAllSubledgers(filters?: { generalLedgerAccountId?: number; isActive?: boolean; isDefaultLedger?: boolean }): Promise<SubledgerMaster[]>;
  getSubledger(id: number): Promise<SubledgerMaster | null>;
  createSubledger(subledger: NewSubledgerMaster): Promise<SubledgerMaster>;
  updateSubledger(id: number, subledger: Partial<SubledgerMaster>): Promise<SubledgerMaster | null>;
  deleteSubledger(id: number): Promise<boolean>;
  getSubledgersByAccount(accountId: number): Promise<SubledgerMaster[]>;
  setDefaultSubledger(id: number): Promise<void>;
  updateSubledgerBalance(id: number, amount: number): Promise<SubledgerMaster | null>;
  
  // Tariff Setup Master methods
  getAllTariffSetups(filters?: { isActive?: boolean; subledgerId?: number; validDate?: string }): Promise<TariffSetupMaster[]>;
  getTariffSetup(id: number): Promise<TariffSetupMaster | null>;
  checkTariffOverlap(tariff: NewTariffSetupMaster, excludeId?: number): Promise<TariffSetupMaster | null>;
  createTariffSetup(tariff: NewTariffSetupMaster): Promise<TariffSetupMaster>;
  updateTariffSetup(id: number, tariff: Partial<TariffSetupMaster>): Promise<TariffSetupMaster | null>;
  deleteTariffSetup(id: number): Promise<boolean>;
  getTariffSetupsByAmount(amount: string): Promise<TariffSetupMaster[]>;
  getTariffSetupsBySubledger(subledgerId: number): Promise<TariffSetupMaster[]>;
  getApplicableTariff(amount: number, validDate: Date, subledgerId?: number): Promise<TariffSetupMaster | null>;
  
  // Property approval methods
  approveProperty(id: number, approvedBy: number): Promise<Property | undefined>;
  rejectProperty(id: number, rejectedBy: number, rejectionReason: string): Promise<Property | undefined>;
  getPendingProperties(): Promise<Property[]>;
  getApprovedProperties(): Promise<Property[]>;
  
  // Room availability methods
  checkRoomAvailability(params: { 
    propertyId: number; 
    checkIn: Date; 
    checkOut: Date; 
    rooms: number; 
  }): Promise<boolean>;
  searchAvailableProperties(query: any): Promise<Property[]>;
  calculateBookingPrice(params: any): Promise<number>;
  
  // Property Categories
  getAllPropertyCategories(): Promise<PropertyCategory[]>;
  getPropertyCategoriesByType(propertyType: string): Promise<PropertyCategory[]>;
  createPropertyCategory(category: NewPropertyCategory): Promise<PropertyCategory>;
  updatePropertyCategory(id: number, category: Partial<PropertyCategory>): Promise<PropertyCategory | undefined>;
  deletePropertyCategory(id: number): Promise<boolean>;
  
  // Property Areas
  getAllPropertyAreas(): Promise<PropertyArea[]>;
  getPropertyAreasByCity(cityName: string): Promise<PropertyArea[]>;
  createPropertyArea(area: NewPropertyArea): Promise<PropertyArea>;
  updatePropertyArea(id: number, area: Partial<PropertyArea>): Promise<PropertyArea | undefined>;
  deletePropertyArea(id: number): Promise<boolean>;
  
  // Property Amenities
  getAllPropertyAmenities(): Promise<PropertyAmenity[]>;
  getPropertyAmenitiesByType(amenityType: string): Promise<PropertyAmenity[]>;
  createPropertyAmenity(amenity: NewPropertyAmenity): Promise<PropertyAmenity>;
  updatePropertyAmenity(id: number, amenity: Partial<PropertyAmenity>): Promise<PropertyAmenity | undefined>;
  deletePropertyAmenity(id: number): Promise<boolean>;
  
  // Hotel Star Ratings
  getAllHotelStarRatings(): Promise<HotelStarRating[]>;
  createHotelStarRating(rating: NewHotelStarRating): Promise<HotelStarRating>;
  updateHotelStarRating(id: number, rating: Partial<HotelStarRating>): Promise<HotelStarRating | undefined>;
  deleteHotelStarRating(id: number): Promise<boolean>;
  
  // Customer Review Ratings
  getAllCustomerReviewRatings(): Promise<CustomerReviewRating[]>;
  createCustomerReviewRating(rating: NewCustomerReviewRating): Promise<CustomerReviewRating>;
  updateCustomerReviewRating(id: number, rating: Partial<CustomerReviewRating>): Promise<CustomerReviewRating | undefined>;
  deleteCustomerReviewRating(id: number): Promise<boolean>;
  
  // Room Views
  getAllRoomViews(): Promise<RoomView[]>;
  createRoomView(roomView: NewRoomView): Promise<RoomView>;
  updateRoomView(id: number, roomView: Partial<RoomView>): Promise<RoomView | undefined>;
  deleteRoomView(id: number): Promise<boolean>;
  
  // Room Types
  getAllRoomTypes(): Promise<RoomType[]>;
  getRoomTypesByProperty(propertyId: number): Promise<RoomType[]>;
  createRoomType(roomType: NewRoomType): Promise<RoomType>;
  updateRoomType(id: number, roomType: Partial<RoomType>): Promise<RoomType | undefined>;
  deleteRoomType(id: number): Promise<boolean>;
  
  // Room Photos
  getAllRoomPhotos(): Promise<RoomPhoto[]>;
  getRoomPhotosByRoomType(roomTypeId: number): Promise<RoomPhoto[]>;
  getRoomPhotosByGroup(roomTypeId: number, photoGroup: string): Promise<RoomPhoto[]>;
  getRoomPhotoById(id: number): Promise<RoomPhoto | undefined>;
  createRoomPhoto(roomPhoto: NewRoomPhoto): Promise<RoomPhoto>;
  updateRoomPhoto(id: number, roomPhoto: Partial<RoomPhoto>): Promise<RoomPhoto | undefined>;
  deleteRoomPhoto(id: number): Promise<boolean>;
  setMainPhotoForGroup(roomTypeId: number, photoGroup: string, photoId: number): Promise<void>;
  
  // Policy Templates
  getAllPolicyTemplates(): Promise<PolicyTemplate[]>;
  getPolicyTemplatesByType(policyType: string): Promise<PolicyTemplate[]>;
  getDefaultPolicyTemplate(policyType: string): Promise<PolicyTemplate | undefined>;
  createPolicyTemplate(policyTemplate: NewPolicyTemplate): Promise<PolicyTemplate>;
  updatePolicyTemplate(id: number, policyTemplate: Partial<PolicyTemplate>): Promise<PolicyTemplate | undefined>;
  deletePolicyTemplate(id: number): Promise<boolean>;
  
  // Room Inventory
  getRoomInventory(propertyId: number, roomTypeId: number, startDate: string, endDate: string): Promise<RoomInventory[]>;
  getAllRoomInventory(): Promise<RoomInventory[]>;
  getAllRoomInventoryForProperty(propertyId: number): Promise<RoomInventory[]>;
  createRoomInventory(inventory: NewRoomInventory): Promise<RoomInventory>;
  updateRoomInventory(propertyId: number, roomTypeId: number, date: string, updates: Partial<RoomInventory>): Promise<RoomInventory | undefined>;
  deleteRoomInventory(id: number): Promise<boolean>;
  bulkUpdateRoomInventory(inventoryUpdates: Array<{
    propertyId: number;
    roomTypeId: number;
    date: string;
    totalRooms: number;
    availableRooms?: number;
  }>): Promise<void>;
  
  // Universal Photos
  getAllUniversalPhotos(): Promise<{photos: UniversalPhoto[], photosByCategory: any, totalPhotos: number}>;
  getUniversalPhotosByEntity(entityType: string, entityId?: number): Promise<UniversalPhoto[]>;
  getUniversalPhotosByCategory(photoCategory: string): Promise<UniversalPhoto[]>;
  getUniversalPhotosByEntityType(entityType: string): Promise<UniversalPhoto[]>;
  createUniversalPhoto(photo: InsertUniversalPhoto): Promise<UniversalPhoto>;
  updateUniversalPhoto(id: number, photo: Partial<UniversalPhoto>): Promise<UniversalPhoto | undefined>;
  deleteUniversalPhoto(id: number): Promise<boolean>;
  setMainUniversalPhoto(entityType: string, entityId: number, photoId: number): Promise<boolean>;
  
  // Plan Master methods
  getAllPlanMasters(filters?: any): Promise<PlanMaster[]>;
  getPlanMaster(id: number): Promise<PlanMaster | undefined>;
  getPlanMasterByCode(planCode: string): Promise<PlanMaster | undefined>;
  getPopularPlanMasters(): Promise<PlanMaster[]>;
  createPlanMaster(plan: NewPlanMaster): Promise<PlanMaster>;
  updatePlanMaster(id: number, plan: Partial<PlanMaster>): Promise<PlanMaster | undefined>;
  deletePlanMaster(id: number): Promise<boolean>;

  // Plan Property Pricing methods
  getPlanPropertyPricing(): Promise<PlanPropertyPricing[]>;
  getPlanPropertyPricingById(id: number): Promise<PlanPropertyPricing | undefined>;
  createPlanPropertyPricing(pricing: NewPlanPropertyPricing): Promise<PlanPropertyPricing>;
  updatePlanPropertyPricing(id: number, updates: Partial<PlanPropertyPricing>): Promise<PlanPropertyPricing | undefined>;
  deletePlanPropertyPricing(id: number): Promise<boolean>;

  // Meal Inclusion Master methods
  getAllMealInclusions(filters?: any): Promise<MealInclusionMaster[]>;
  getMealInclusionById(id: number): Promise<MealInclusionMaster | undefined>;
  getMealInclusionByCode(mealCode: string): Promise<MealInclusionMaster | undefined>;
  createMealInclusion(mealInclusion: NewMealInclusionMaster): Promise<MealInclusionMaster>;
  updateMealInclusion(id: number, mealInclusion: Partial<MealInclusionMaster>): Promise<MealInclusionMaster | undefined>;
  deleteMealInclusion(id: number): Promise<boolean>;

  // Plan Meal Inclusions methods
  getPlanMealInclusions(planId: number): Promise<PlanMealInclusion[]>;
  createPlanMealInclusion(planMealInclusion: NewPlanMealInclusion): Promise<PlanMealInclusion>;
  deletePlanMealInclusion(planId: number, mealInclusionId: number): Promise<boolean>;

  // Rate Master methods
  getAllRateMasters(filters?: any): Promise<RateMaster[]>;
  getRateMaster(id: number): Promise<RateMaster | undefined>;
  getRatesByProperty(propertyId: number): Promise<RateMaster[]>;
  getRatesByRoomType(roomTypeId: number): Promise<RateMaster[]>;
  getApplicableRates(propertyId: number, roomTypeId: number, startDate: string, endDate: string): Promise<RateMaster[]>;
  createRateMaster(rate: NewRateMaster): Promise<RateMaster>;
  updateRateMaster(id: number, rate: Partial<RateMaster>): Promise<RateMaster | undefined>;
  deleteRateMaster(id: number): Promise<boolean>;

  // Wallet methods
  getWallet(userId: number): Promise<Wallet | undefined>;
  getWalletTransactions(walletId: number): Promise<WalletTransaction[]>;
  createWallet(wallet: NewWallet): Promise<Wallet>;
  updateWallet(id: number, updates: Partial<Wallet>): Promise<Wallet | undefined>;
  
  // Wishlist methods
  getWishlistByUser(userId: number): Promise<Wishlist[]>;
  addToWishlist(wishlist: NewWishlist): Promise<Wishlist>;
  removeFromWishlist(id: number): Promise<boolean>;
  
  // Review methods
  createReview(review: NewReview): Promise<Review>;
  getReviewsByProperty(propertyId: number): Promise<Review[]>;
  updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  
  // Franchise Inquiry methods
  createFranchiseInquiry(inquiry: NewFranchiseInquiry): Promise<FranchiseInquiry>;
  getAllFranchiseInquiries(): Promise<FranchiseInquiry[]>;
  updateFranchiseInquiry(id: number, updates: Partial<FranchiseInquiry>): Promise<FranchiseInquiry | undefined>;
  
  // Notification methods
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<Notification | undefined>;
  createNotification(notification: NewNotification): Promise<Notification>;

  // Loyalty Program methods
  getAllLoyaltyPrograms(): Promise<LoyaltyProgram[]>;
  getLoyaltyProgram(userId: number): Promise<LoyaltyProgram | undefined>;
  createLoyaltyProgram(loyaltyProgram: NewLoyaltyProgram): Promise<LoyaltyProgram>;
  updateLoyaltyProgram(userId: number, updates: Partial<LoyaltyProgram>): Promise<LoyaltyProgram | undefined>;

  // Promotions/Coupon methods
  getAllPromotions(): Promise<Promotion[]>;
  getActivePromotions(): Promise<Promotion[]>;
  getPromotionByCode(code: string): Promise<Promotion | undefined>;
  createPromotion(promotion: NewPromotion): Promise<Promotion>;
  updatePromotion(id: number, updates: Partial<Promotion>): Promise<Promotion | undefined>;
  deletePromotion(id: number): Promise<boolean>;

  // Guest Master methods
  getAllGuests(filters?: { isActive?: boolean; guestCategory?: string; isBlacklisted?: boolean }): Promise<GuestMaster[]>;
  getGuest(id: number): Promise<GuestMaster | undefined>;
  getGuestByCode(guestCode: string): Promise<GuestMaster | undefined>;
  getGuestByEmail(email: string): Promise<GuestMaster | undefined>;
  getGuestByPhone(phoneNumber: string): Promise<GuestMaster | undefined>;
  searchGuests(query: string): Promise<GuestMaster[]>;
  createGuest(guest: NewGuestMaster): Promise<GuestMaster>;
  updateGuest(id: number, updates: Partial<GuestMaster>): Promise<GuestMaster | undefined>;
  deleteGuest(id: number): Promise<boolean>;

  // Guest Details methods
  createGuestDetails(guestDetails: NewGuestDetails): Promise<GuestDetails>;
  getGuestDetailsByGuestMasterId(guestMasterId: number): Promise<GuestDetails[]>;
  deleteGuestDetails(id: number): Promise<boolean>;

  // Booking Guest Details methods
  createBookingGuestDetails(bookingGuestDetails: NewBookingGuestDetails): Promise<BookingGuestDetails>;
  getBookingGuestDetailsByBookingId(bookingId: number): Promise<BookingGuestDetails[]>;
  deleteBookingGuestDetailsByBookingId(bookingId: number): Promise<boolean>;

  // Transaction Booking Master methods
  createTransBookingMas(transMas: NewTransBookingMas): Promise<TransBookingMas>;
  getTransBookingMasByBookingId(bookingId: string): Promise<TransBookingMas | undefined>;
  getTransBookingMasById(masBillingId: number): Promise<TransBookingMas | undefined>;
  
  // Transaction Booking Detail methods
  createTransBookingDet(transDet: NewTransBookingDet): Promise<TransBookingDet>;
  getTransBookingDetByMasId(masBillingId: number): Promise<TransBookingDet[]>;
  deleteTransBookingDetByMasId(masBillingId: number): Promise<boolean>;

  // Transaction Booking Detail Datewise methods
  createTransBookingDetailDatewise(detailDatewise: NewTransBookingDetailDatewise): Promise<TransBookingDetailDatewise>;
  getTransBookingDetailDatewiseByMasId(masBillingId: number): Promise<TransBookingDetailDatewise[]>;
  getTransBookingDetailDatewiseByDate(propertyId: number, roomTypeId: number, bookingDate: Date): Promise<TransBookingDetailDatewise[]>;
  calculateBalanceRoomCount(propertyId: number, roomTypeId: number, bookingDate: Date): Promise<number>;
  deleteTransBookingDetailDatewiseByMasId(masBillingId: number): Promise<boolean>;

  // Room Availability Report methods
  getRoomAvailabilityReport(filters: {
    propertyId?: number;
    roomTypeId?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    data: Array<{
      propertyId: number;
      propertyName: string;
      roomTypeId: number;
      roomTypeName: string;
      date: string;
      totalRooms: number;
      bookedRooms: number;
      blockedRooms: number;
      availableRooms: number;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }>;

  // Booking Details Report methods
  getBookingDetailsReport(filters: {
    propertyId?: number;
    roomTypeId?: number;
    guestName?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    data: Array<{
      bookingId: string;
      propertyId: number;
      propertyName: string;
      roomTypeId: number | null;
      roomTypeName: string;
      guestName: string;
      guestEmail: string;
      guestPhone: string;
      checkInDate: string;
      checkOutDate: string;
      numberOfRooms: number;
      numberOfNights: number;
      totalAmount: string;
      status: string;
      paymentStatus: string;
      bookingDate: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }>;

  // Role Master and User Profile methods
  getAllRoles(filters?: { isActive?: boolean; isSystemRole?: boolean }): Promise<RoleMaster[]>;
  getActiveRoles(): Promise<RoleMaster[]>;
  getRole(id: number): Promise<RoleMaster | undefined>;
  getRoleByCode(roleCode: string): Promise<RoleMaster | undefined>;
  createRole(role: NewRoleMaster): Promise<RoleMaster>;
  updateRole(id: number, updates: Partial<RoleMaster>): Promise<RoleMaster | undefined>;
  deleteRole(id: number): Promise<boolean>;
  getAllUsers(filters?: { role?: string; isVerified?: boolean }): Promise<User[]>;
  getUsersByRole(roleId: number): Promise<User[]>;
  updateUserRole(userId: number, roleId: number): Promise<User | undefined>;

  // User Property Access methods
  getAllUserPropertyAccess(filters?: any): Promise<UserPropertyAccess[]>;
  getUserPropertyAccess(id: number): Promise<UserPropertyAccess | undefined>;
  createUserPropertyAccess(access: NewUserPropertyAccess): Promise<UserPropertyAccess>;
  updateUserPropertyAccess(id: number, updates: Partial<UserPropertyAccess>): Promise<UserPropertyAccess | undefined>;
  deleteUserPropertyAccess(id: number): Promise<boolean>;
  getUserProperties(userId: number): Promise<Property[]>;
  getPropertyUsers(propertyId: number): Promise<User[]>;

  // Audit Log methods
  getAllAuditLogs(filters?: any): Promise<AuditLog[]>;
  getAuditLog(id: number): Promise<AuditLog | undefined>;
  createAuditLog(auditLog: NewAuditLog): Promise<AuditLog>;

  // Placeholder methods for audit logging
  logAction(action: string, tableName: string, recordId: string, userId?: number, oldValues?: any, newValues?: any, description?: string, metadata?: any): Promise<void>;
}

// Database Storage Implementation
class DatabaseStorage implements IStorage {
  
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phoneNumber, phone));
    return result[0];
  }

  async createUser(user: NewUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Properties  
  async getProperty(id: number): Promise<Property | undefined> {
    const result = await db.select().from(properties).where(eq(properties.id, id));
    return result[0];
  }

  async getAllProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async getPropertiesByType(type: string): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.type, type));
  }

  async searchProperties(query: {
    location?: string;
    city?: string;
    checkIn?: Date;
    checkOut?: Date;
    guests?: number;
    category?: string;
    type?: string;
  }): Promise<Property[]> {
    let whereConditions = [];
    
    if (query.location) {
      whereConditions.push(ilike(properties.location, `%${query.location}%`));
    }
    if (query.city) {
      whereConditions.push(ilike(properties.city, `%${query.city}%`));
    }
    if (query.type) {
      whereConditions.push(eq(properties.type, query.type));
    }
    
    if (whereConditions.length === 0) {
      return await db.select().from(properties);
    }
    
    return await db.select().from(properties).where(and(...whereConditions));
  }

  async createProperty(property: NewProperty): Promise<Property> {
    // Check for existing property with same name, location, and city
    const existing = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.name, property.name),
          eq(properties.location, property.location),
          eq(properties.city, property.city)
        )
      );
    
    if (existing.length > 0) {
      throw new Error(`Property with name "${property.name}" already exists at "${property.location}, ${property.city}"`);
    }
    
    const result = await db.insert(properties).values([property]).returning();
    return result[0];
  }

  async updateProperty(id: number, property: Partial<Property>): Promise<Property | undefined> {
    try {
      // Use the simplest possible approach - only update basic text/number fields
      const updateFields: any = {};
      
      // Allow all safe fields including master data relationships
      if (property.name) updateFields.name = property.name;
      if (property.description) updateFields.description = property.description;
      if (property.location) updateFields.location = property.location;
      if (property.address) updateFields.address = property.address;
      if (property.city) updateFields.city = property.city;
      if (property.area) updateFields.area = property.area;
      if (property.pincode) updateFields.pincode = property.pincode;
      if (property.rating) updateFields.rating = property.rating;
      if (property.reviewCount !== undefined) updateFields.reviewCount = property.reviewCount;
      if (property.availability !== undefined) updateFields.availability = property.availability;
      if (property.hourlyRate) updateFields.hourlyRate = property.hourlyRate;
      if (property.capacity) updateFields.capacity = property.capacity;
      if (property.amenities) updateFields.amenities = property.amenities;
      if (property.images) updateFields.images = property.images;
      
      // Master data relationship fields
      if (property.categoryId !== undefined) updateFields.categoryId = property.categoryId;
      if (property.currencyId !== undefined) updateFields.currencyId = property.currencyId;
      if (property.hotelStarRatingId !== undefined) updateFields.hotelStarRatingId = property.hotelStarRatingId;
      if (property.customerReviewRatingId !== undefined) updateFields.customerReviewRatingId = property.customerReviewRatingId;
      if (property.propertyAreaId !== undefined) updateFields.propertyAreaId = property.propertyAreaId;
      
      // Room and amenity master data fields - handle arrays properly
      if (property.roomAmenityIds !== undefined) {
        updateFields.roomAmenityIds = property.roomAmenityIds;
      }
      if (property.hotelAmenityIds !== undefined) {
        updateFields.hotelAmenityIds = property.hotelAmenityIds;
      }
      if (property.roomTypeIds !== undefined) {
        updateFields.roomTypeIds = property.roomTypeIds;
      }
      if (property.roomTypeCounts !== undefined) {
        updateFields.roomTypeCounts = property.roomTypeCounts;
      }
      
      // Policy template fields - handle arrays properly
      if (property.policyTemplateIds !== undefined) {
        updateFields.policyTemplateIds = property.policyTemplateIds;
      }
      if (property.houseRules) updateFields.houseRules = property.houseRules;
      if (property.cancellationPolicy) updateFields.cancellationPolicy = property.cancellationPolicy;
      
      // Other important fields
      if (property.approvalStatus) updateFields.approvalStatus = property.approvalStatus;
      if (property.approvedBy) updateFields.approvedBy = property.approvedBy;
      if (property.rejectionReason) updateFields.rejectionReason = property.rejectionReason;
      if (property.metadata) updateFields.metadata = property.metadata;
      if (property.distanceFromLandmarks) updateFields.distanceFromLandmarks = property.distanceFromLandmarks;
      if (property.coordinates) updateFields.coordinates = property.coordinates;
      
      // NEVER touch any timestamp fields
      // NO updatedAt, NO createdAt, NO departureTime, NO arrivalTime, NO approvedAt
      
      const result = await db.update(properties).set(updateFields).where(eq(properties.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Property update error:', error);
      throw error;
    }
  }

  async deleteProperty(id: number): Promise<boolean> {
    const result = await db.delete(properties).where(eq(properties.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getPropertyMasterData(): Promise<{
    currencies: CurrencyMaster[];
    hotelStarRatings: HotelStarRating[];
    customerReviews: CustomerReviewRating[];
    propertyAreas: PropertyArea[];
    propertyCategories: PropertyCategory[];
    roomAmenities: PropertyAmenity[];
    hotelAmenities: PropertyAmenity[];
    roomTypes: RoomType[];
    policyTemplates: PolicyTemplate[];
  }> {
    const [
      currencies,
      hotelStarRatingsData,
      customerReviews,
      propertyAreasData,
      propertyCategoriesData,
      amenities,
      roomTypesData,
      policyTemplatesData
    ] = await Promise.all([
      db.select().from(currencyMaster),
      db.select().from(hotelStarRatings),
      db.select().from(customerReviewRatings),
      db.select().from(propertyAreas),
      db.select().from(propertyCategories),
      db.select().from(propertyAmenities),
      db.select().from(roomTypes),
      db.select().from(policyTemplates)
    ]);

    const roomAmenities = amenities.filter(a => a.amenityType === 'room_amenity');
    const hotelAmenities = amenities.filter(a => a.amenityType === 'hotel_amenity');

    return {
      currencies,
      hotelStarRatings: hotelStarRatingsData,
      customerReviews,
      propertyAreas: propertyAreasData,
      propertyCategories: propertyCategoriesData,
      roomAmenities,
      hotelAmenities,
      roomTypes: roomTypesData,
      policyTemplates: policyTemplatesData
    };
  }

  // Property approval methods
  async approveProperty(id: number, approvedBy: number): Promise<Property | undefined> {
    const result = await db.update(properties)
      .set({ 
        approvalStatus: 'approved',
        approvedBy,
        approvedAt: new Date()
      })
      .where(eq(properties.id, id))
      .returning();
    return result[0];
  }

  async rejectProperty(id: number, rejectedBy: number, rejectionReason: string): Promise<Property | undefined> {
    const result = await db.update(properties)
      .set({ 
        approvalStatus: 'rejected',
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        rejectionReason
      })
      .where(eq(properties.id, id))
      .returning();
    return result[0];
  }

  async getPendingProperties(): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.approvalStatus, 'pending'));
  }

  async getApprovedProperties(): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.approvalStatus, 'approved'));
  }

  // Room availability checking method
  async checkRoomAvailability(params: { 
    propertyId: number; 
    checkIn: Date; 
    checkOut: Date; 
    rooms: number; 
  }): Promise<boolean> {
    const { propertyId, checkIn, checkOut, rooms } = params;
    
    try {
      // Get the date range (exclude checkout date)
      const startDate = new Date(checkIn);
      const endDate = new Date(checkOut);
      
      // Query room inventory for this property in the date range
      const inventoryRecords = await db.select()
        .from(roomInventory)
        .where(
          and(
            eq(roomInventory.propertyId, propertyId),
            sql`${roomInventory.date} >= ${startDate.toISOString().split('T')[0]}`,
            sql`${roomInventory.date} < ${endDate.toISOString().split('T')[0]}`,
            eq(roomInventory.isActive, true)
          )
        );
      
      // If no inventory records exist, assume rooms are available (graceful degradation)
      if (inventoryRecords.length === 0) {
        return true;
      }
      
      // Check if all dates in the range have sufficient availability
      const requiredDates = [];
      for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
        requiredDates.push(date.toISOString().split('T')[0]);
      }
      
      // Check each required date for sufficient room availability
      for (const requiredDate of requiredDates) {
        const dateInventory = inventoryRecords.filter(record => 
          record.date === requiredDate
        );
        
        if (dateInventory.length === 0) {
          // No inventory record for this date - assume available
          continue;
        }
        
        // Sum up available rooms across all room types for this date
        const totalAvailableRooms = dateInventory.reduce((sum, record) => 
          sum + record.availableRooms, 0
        );
        
        // If any date doesn't have enough available rooms, return false
        if (totalAvailableRooms < rooms) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking room availability:', error);
      // Return true for graceful degradation - let booking system handle the error
      return true;
    }
  }

  // Property Categories
  async getAllPropertyCategories(): Promise<PropertyCategory[]> {
    return await db.select().from(propertyCategories);
  }

  async getPropertyCategoriesByType(propertyType: string): Promise<PropertyCategory[]> {
    return await db.select().from(propertyCategories).where(eq(propertyCategories.propertyType, propertyType));
  }

  async createPropertyCategory(category: NewPropertyCategory): Promise<PropertyCategory> {
    const result = await db.insert(propertyCategories).values(category).returning();
    return result[0];
  }

  async updatePropertyCategory(id: number, category: Partial<PropertyCategory>): Promise<PropertyCategory | undefined> {
    const result = await db.update(propertyCategories).set(category).where(eq(propertyCategories.id, id)).returning();
    return result[0];
  }

  async deletePropertyCategory(id: number): Promise<boolean> {
    const result = await db.delete(propertyCategories).where(eq(propertyCategories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Property Areas
  async getAllPropertyAreas(): Promise<PropertyArea[]> {
    return await db.select().from(propertyAreas);
  }

  async getPropertyAreasByCity(cityName: string): Promise<PropertyArea[]> {
    return await db.select().from(propertyAreas).where(eq(propertyAreas.cityName, cityName));
  }

  async createPropertyArea(area: NewPropertyArea): Promise<PropertyArea> {
    const result = await db.insert(propertyAreas).values(area).returning();
    return result[0];
  }

  async updatePropertyArea(id: number, area: Partial<PropertyArea>): Promise<PropertyArea | undefined> {
    const result = await db.update(propertyAreas).set(area).where(eq(propertyAreas.id, id)).returning();
    return result[0];
  }

  async deletePropertyArea(id: number): Promise<boolean> {
    const result = await db.delete(propertyAreas).where(eq(propertyAreas.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Property Amenities
  async getAllPropertyAmenities(): Promise<PropertyAmenity[]> {
    return await db.select().from(propertyAmenities);
  }

  async getPropertyAmenitiesByType(amenityType: string): Promise<PropertyAmenity[]> {
    return await db.select().from(propertyAmenities).where(eq(propertyAmenities.amenityType, amenityType));
  }

  async createPropertyAmenity(amenity: NewPropertyAmenity): Promise<PropertyAmenity> {
    const result = await db.insert(propertyAmenities).values(amenity).returning();
    return result[0];
  }

  async updatePropertyAmenity(id: number, amenity: Partial<PropertyAmenity>): Promise<PropertyAmenity | undefined> {
    const result = await db.update(propertyAmenities).set(amenity).where(eq(propertyAmenities.id, id)).returning();
    return result[0];
  }

  async deletePropertyAmenity(id: number): Promise<boolean> {
    const result = await db.delete(propertyAmenities).where(eq(propertyAmenities.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Hotel Star Ratings
  async getAllHotelStarRatings(): Promise<HotelStarRating[]> {
    return await db.select().from(hotelStarRatings);
  }

  async createHotelStarRating(rating: NewHotelStarRating): Promise<HotelStarRating> {
    const result = await db.insert(hotelStarRatings).values(rating).returning();
    return result[0];
  }

  async updateHotelStarRating(id: number, rating: Partial<HotelStarRating>): Promise<HotelStarRating | undefined> {
    const result = await db.update(hotelStarRatings).set(rating).where(eq(hotelStarRatings.id, id)).returning();
    return result[0];
  }

  async deleteHotelStarRating(id: number): Promise<boolean> {
    const result = await db.delete(hotelStarRatings).where(eq(hotelStarRatings.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Customer Review Ratings
  async getAllCustomerReviewRatings(): Promise<CustomerReviewRating[]> {
    return await db.select().from(customerReviewRatings);
  }

  async createCustomerReviewRating(rating: NewCustomerReviewRating): Promise<CustomerReviewRating> {
    const result = await db.insert(customerReviewRatings).values(rating).returning();
    return result[0];
  }

  async updateCustomerReviewRating(id: number, rating: Partial<CustomerReviewRating>): Promise<CustomerReviewRating | undefined> {
    const result = await db.update(customerReviewRatings).set(rating).where(eq(customerReviewRatings.id, id)).returning();
    return result[0];
  }

  async deleteCustomerReviewRating(id: number): Promise<boolean> {
    const result = await db.delete(customerReviewRatings).where(eq(customerReviewRatings.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Room Views
  async getAllRoomViews(): Promise<RoomView[]> {
    return await db.select().from(roomViews);
  }

  async createRoomView(roomView: NewRoomView): Promise<RoomView> {
    const result = await db.insert(roomViews).values(roomView).returning();
    return result[0];
  }

  async updateRoomView(id: number, roomView: Partial<RoomView>): Promise<RoomView | undefined> {
    const result = await db.update(roomViews).set(roomView).where(eq(roomViews.id, id)).returning();
    return result[0];
  }

  async deleteRoomView(id: number): Promise<boolean> {
    const result = await db.delete(roomViews).where(eq(roomViews.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Room Types
  async getAllRoomTypes(): Promise<RoomType[]> {
    return await db.select().from(roomTypes);
  }

  async getRoomTypesByProperty(propertyId: number): Promise<RoomType[]> {
    return await db.select().from(roomTypes).where(eq(roomTypes.propertyId, propertyId));
  }

  async getRoomType(id: number): Promise<RoomType | undefined> {
    const result = await db.select().from(roomTypes).where(eq(roomTypes.id, id));
    return result[0];
  }

  async createRoomType(roomType: NewRoomType): Promise<RoomType> {
    const result = await db.insert(roomTypes).values(roomType).returning();
    return result[0];
  }

  async updateRoomType(id: number, roomType: Partial<RoomType>): Promise<RoomType | undefined> {
    const result = await db.update(roomTypes).set(roomType).where(eq(roomTypes.id, id)).returning();
    return result[0];
  }

  async deleteRoomType(id: number): Promise<boolean> {
    const result = await db.delete(roomTypes).where(eq(roomTypes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Room Photos
  async getAllRoomPhotos(): Promise<RoomPhoto[]> {
    return await db.select().from(roomPhotos);
  }

  async getRoomPhotosByRoomType(roomTypeId: number): Promise<RoomPhoto[]> {
    return await db.select().from(roomPhotos).where(eq(roomPhotos.roomTypeId, roomTypeId));
  }

  async getRoomPhotosByGroup(roomTypeId: number, photoGroup: string): Promise<RoomPhoto[]> {
    return await db.select().from(roomPhotos)
      .where(and(eq(roomPhotos.roomTypeId, roomTypeId), eq(roomPhotos.photoGroup, photoGroup)));
  }

  async getRoomPhotoById(id: number): Promise<RoomPhoto | undefined> {
    const result = await db.select().from(roomPhotos).where(eq(roomPhotos.id, id));
    return result[0];
  }

  async createRoomPhoto(roomPhoto: NewRoomPhoto): Promise<RoomPhoto> {
    const result = await db.insert(roomPhotos).values(roomPhoto).returning();
    return result[0];
  }

  async updateRoomPhoto(id: number, roomPhoto: Partial<RoomPhoto>): Promise<RoomPhoto | undefined> {
    const result = await db.update(roomPhotos).set(roomPhoto).where(eq(roomPhotos.id, id)).returning();
    return result[0];
  }

  async deleteRoomPhoto(id: number): Promise<boolean> {
    const result = await db.delete(roomPhotos).where(eq(roomPhotos.id, id));
    return (result.rowCount || 0) > 0;
  }

  async setMainPhotoForGroup(roomTypeId: number, photoGroup: string, photoId: number): Promise<void> {
    // Set all photos in group to not main
    await db.update(roomPhotos)
      .set({ isMainPhoto: false })
      .where(and(eq(roomPhotos.roomTypeId, roomTypeId), eq(roomPhotos.photoGroup, photoGroup)));
    
    // Set specific photo as main
    await db.update(roomPhotos)
      .set({ isMainPhoto: true })
      .where(eq(roomPhotos.id, photoId));
  }

  // Policy Templates
  async getAllPolicyTemplates(): Promise<PolicyTemplate[]> {
    return await db.select().from(policyTemplates);
  }

  async getPolicyTemplatesByType(policyType: string): Promise<PolicyTemplate[]> {
    return await db.select().from(policyTemplates).where(eq(policyTemplates.policyType, policyType));
  }

  async createPolicyTemplate(policyTemplate: NewPolicyTemplate): Promise<PolicyTemplate> {
    const result = await db.insert(policyTemplates).values(policyTemplate).returning();
    return result[0];
  }

  async updatePolicyTemplate(id: number, policyTemplate: Partial<PolicyTemplate>): Promise<PolicyTemplate | undefined> {
    const result = await db.update(policyTemplates).set(policyTemplate).where(eq(policyTemplates.id, id)).returning();
    return result[0];
  }

  async deletePolicyTemplate(id: number): Promise<boolean> {
    const result = await db.delete(policyTemplates).where(eq(policyTemplates.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Room Inventory - Critical for user data persistence
  async getRoomInventory(propertyId: number, roomTypeId: number, startDate: string, endDate: string): Promise<RoomInventory[]> {
    return await db.select().from(roomInventory)
      .where(and(
        eq(roomInventory.propertyId, propertyId),
        eq(roomInventory.roomTypeId, roomTypeId),
        sql`date >= ${startDate}`,
        sql`date <= ${endDate}`
      ));
  }

  async createRoomInventory(inventory: NewRoomInventory): Promise<RoomInventory> {
    const result = await db.insert(roomInventory).values(inventory).returning();
    return result[0];
  }

  async updateRoomInventory(propertyId: number, roomTypeId: number, date: string, updates: Partial<RoomInventory>): Promise<RoomInventory | undefined> {
    const result = await db.update(roomInventory)
      .set({ ...updates, lastUpdated: new Date() })
      .where(and(
        eq(roomInventory.propertyId, propertyId),
        eq(roomInventory.roomTypeId, roomTypeId),
        eq(roomInventory.date, date)
      ))
      .returning();
    return result[0];
  }

  async bulkUpdateRoomInventory(inventoryUpdates: Array<{
    propertyId: number;
    roomTypeId: number;
    date: string;
    totalRooms: number;
    availableRooms?: number;
  }>): Promise<void> {
    for (const update of inventoryUpdates) {
      // Try to find existing record
      const existing = await db.select().from(roomInventory)
        .where(and(
          eq(roomInventory.propertyId, update.propertyId),
          eq(roomInventory.roomTypeId, update.roomTypeId),
          eq(roomInventory.date, update.date)
        ));

      if (existing.length > 0) {
        // Update existing
        await db.update(roomInventory)
          .set({
            totalRooms: update.totalRooms,
            availableRooms: update.availableRooms ?? update.totalRooms,
            lastUpdated: new Date()
          })
          .where(eq(roomInventory.id, existing[0].id));
      } else {
        // Create new
        await db.insert(roomInventory).values({
          propertyId: update.propertyId,
          roomTypeId: update.roomTypeId,
          date: update.date,
          totalRooms: update.totalRooms,
          availableRooms: update.availableRooms ?? update.totalRooms,
          bookedRooms: 0,
          blockedRooms: 0,
          isActive: true,
          lastUpdated: new Date()
        });
      }
    }
  }

  // Universal photos for photo management
  async getAllUniversalPhotos(): Promise<{photos: UniversalPhoto[], photosByCategory: any, totalPhotos: number}> {
    const rawPhotos = await db.select().from(universalPhotos);
    const photos = rawPhotos.map(photo => this.decompressPhotoData(photo));
    
    const photosByCategory = photos.reduce((acc, photo) => {
      const key = `${photo.entityType}-${photo.entityId}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(photo);
      return acc;
    }, {} as any);
    
    return {
      photos,
      photosByCategory,
      totalPhotos: photos.length
    };
  }

  async getUniversalPhotosByEntity(entityType: string, entityId?: number): Promise<UniversalPhoto[]> {
    let photos;
    if (entityId) {
      photos = await db.select().from(universalPhotos)
        .where(and(
          eq(universalPhotos.entityType, entityType), 
          eq(universalPhotos.entityId, entityId),
          eq(universalPhotos.isActive, true)
        ))
        .orderBy(universalPhotos.displayOrder, universalPhotos.createdAt);
    } else {
      photos = await db.select().from(universalPhotos)
        .where(and(
          eq(universalPhotos.entityType, entityType),
          eq(universalPhotos.isActive, true)
        ))
        .orderBy(universalPhotos.displayOrder, universalPhotos.createdAt);
    }
    
    // Decompress photo data before returning
    return photos.map(photo => this.decompressPhotoData(photo));
  }

  async getUniversalPhotosByCategory(photoCategory: string): Promise<UniversalPhoto[]> {
    const photos = await db.select().from(universalPhotos)
      .where(eq(universalPhotos.photoCategory, photoCategory))
      .orderBy(universalPhotos.displayOrder, universalPhotos.createdAt);
    
    // Decompress photo data before returning
    return photos.map(photo => this.decompressPhotoData(photo));
  }

  async getUniversalPhotosByEntityType(entityType: string): Promise<UniversalPhoto[]> {
    const photos = await db.select().from(universalPhotos)
      .where(eq(universalPhotos.entityType, entityType))
      .orderBy(universalPhotos.displayOrder, universalPhotos.createdAt);
    
    // Decompress photo data before returning
    return photos.map(photo => this.decompressPhotoData(photo));
  }

  async createUniversalPhoto(photo: InsertUniversalPhoto): Promise<UniversalPhoto> {
    // Compress photo data before storing
    const compressedUrls = compressMediaUrls(
      photo.photoUrl || '', 
      photo.photoPath || '', 
      photo.thumbnailUrl || ''
    );
    
    const compressedPhoto = {
      ...photo,
      compressedUrlData: compressedUrls.compressedPhotoUrl,
      compressedTags: photo.tags ? compressTags(photo.tags) : null,
      compressedMetadata: photo.metadata ? compressMetadata(photo.metadata) : null
    };
    
    const result = await db.insert(universalPhotos).values(compressedPhoto).returning();
    return this.decompressPhotoData(result[0]);
  }

  async updateUniversalPhoto(id: number, photo: Partial<UniversalPhoto>): Promise<UniversalPhoto | undefined> {
    const result = await db.update(universalPhotos).set(photo).where(eq(universalPhotos.id, id)).returning();
    return result[0];
  }

  async deleteUniversalPhoto(id: number): Promise<boolean> {
    const result = await db.delete(universalPhotos).where(eq(universalPhotos.id, id));
    return (result.rowCount || 0) > 0;
  }

  async setMainUniversalPhoto(entityType: string, entityId: number, photoId: number): Promise<boolean> {
    // First, remove main photo status from all photos for this entity
    await db.update(universalPhotos)
      .set({ isMainPhoto: false })
      .where(and(eq(universalPhotos.entityType, entityType), eq(universalPhotos.entityId, entityId)));
    
    // Then set the specified photo as main
    const result = await db.update(universalPhotos)
      .set({ isMainPhoto: true })
      .where(eq(universalPhotos.id, photoId));
    
    return (result.rowCount || 0) > 0;
  }

  // Helper method to decompress photo data
  private decompressPhotoData(photo: any): UniversalPhoto {
    const decompressedData = { ...photo };
    
    // Decompress URLs if compressed data exists
    if (photo.compressedUrlData) {
      try {
        const urls = decompressMediaUrls(photo.compressedUrlData);
        decompressedData.photoUrl = urls.photoUrl || photo.photoUrl;
        decompressedData.photoPath = urls.photoPath || photo.photoPath;
        decompressedData.thumbnailUrl = urls.thumbnailUrl || photo.thumbnailUrl;
      } catch (error) {
        console.error('Error decompressing URL data:', error);
        // Keep original data if decompression fails
      }
    }
    
    // Decompress tags if compressed data exists
    if (photo.compressedTags) {
      try {
        decompressedData.tags = decompressTags(photo.compressedTags) || photo.tags;
      } catch (error) {
        console.error('Error decompressing tags:', error);
        // Keep original data if decompression fails
      }
    }
    
    // Decompress metadata if compressed data exists
    if (photo.compressedMetadata) {
      try {
        const decompressed = decompressMetadata(photo.compressedMetadata);
        decompressedData.metadata = typeof decompressed === 'string' 
          ? decompressed 
          : JSON.stringify(decompressed);
      } catch (error) {
        console.error('Error decompressing metadata:', error);
        // Keep original data if decompression fails
      }
    }
    
    return decompressedData;
  }

  // Bookings methods
  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id));
    return result[0];
  }

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async createBooking(booking: NewBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(booking).returning();
    return result[0];
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined> {
    const result = await db.update(bookings).set(updates).where(eq(bookings.id, id)).returning();
    return result[0];
  }

  // Promotions methods
  async getAllPromotions(): Promise<Promotion[]> {
    return await db.select().from(promotions);
  }

  async getActivePromotions(): Promise<Promotion[]> {
    try {
      return await db.select().from(promotions).where(eq(promotions.isActive, true));
    } catch (error) {
      // Return empty array if promotions table has issues
      console.log("Promotions table not ready, returning empty array");
      return [];
    }
  }

  async createPromotion(promotion: NewPromotion): Promise<Promotion> {
    const result = await db.insert(promotions).values(promotion).returning();
    return result[0];
  }

  async updatePromotion(id: number, updates: Partial<Promotion>): Promise<Promotion | undefined> {
    const result = await db.update(promotions).set(updates).where(eq(promotions.id, id)).returning();
    return result[0];
  }

  async deletePromotion(id: number): Promise<boolean> {
    const result = await db.delete(promotions).where(eq(promotions.id, id)).returning();
    return result.length > 0;
  }

  async getPromotionByCode(code: string): Promise<Promotion | undefined> {
    const result = await db.select().from(promotions).where(eq(promotions.promoCode, code));
    return result[0];
  }

  // Currency Master methods
  async getAllCurrencyMasters(): Promise<CurrencyMaster[]> {
    return await db.select().from(currencyMaster);
  }

  async getCurrencyMaster(id: number): Promise<CurrencyMaster | null> {
    const result = await db.select().from(currencyMaster).where(eq(currencyMaster.id, id));
    return result[0] || null;
  }

  async getCurrencyMasterByShortName(shortName: string): Promise<CurrencyMaster | null> {
    const result = await db.select().from(currencyMaster).where(eq(currencyMaster.shortName, shortName));
    return result[0] || null;
  }

  async getBaseCurrencyMaster(): Promise<CurrencyMaster | null> {
    const result = await db.select().from(currencyMaster).where(eq(currencyMaster.isBaseCurrency, true));
    return result[0] || null;
  }

  async getBaseCurrency(): Promise<CurrencyMaster | null> {
    const result = await db.select().from(currencyMaster).where(eq(currencyMaster.isBaseCurrency, true));
    return result[0] || null;
  }

  async createCurrencyMaster(currency: NewCurrencyMaster): Promise<CurrencyMaster> {
    const result = await db.insert(currencyMaster).values(currency).returning();
    return result[0];
  }

  async updateCurrencyMaster(id: number, currency: Partial<CurrencyMaster>): Promise<CurrencyMaster | null> {
    const result = await db.update(currencyMaster).set(currency).where(eq(currencyMaster.id, id)).returning();
    return result[0] || null;
  }

  async deleteCurrencyMaster(id: number): Promise<boolean> {
    const result = await db.delete(currencyMaster).where(eq(currencyMaster.id, id));
    return (result.rowCount || 0) > 0;
  }

  async setBaseCurrencyMaster(id: number): Promise<CurrencyMaster | null> {
    // First, unset all other base currencies
    await db.update(currencyMaster).set({ isBaseCurrency: false });
    
    // Then set the specified currency as base
    const result = await db.update(currencyMaster)
      .set({ isBaseCurrency: true })
      .where(eq(currencyMaster.id, id))
      .returning();
    
    return result[0] || null;
  }

  async setBaseCurrency(id: number): Promise<CurrencyMaster | null> {
    return this.setBaseCurrencyMaster(id);
  }

  // General Ledger Master methods
  async getAllGeneralLedgerAccounts(filters?: { accountType?: string; isActive?: boolean; parentAccountId?: number }): Promise<GeneralLedgerMaster[]> {
    let query = db.select().from(generalLedgerMaster);
    const conditions = [];
    
    if (filters?.accountType) {
      conditions.push(eq(generalLedgerMaster.accountType, filters.accountType));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(generalLedgerMaster.isActive, filters.isActive));
    }
    if (filters?.parentAccountId) {
      conditions.push(eq(generalLedgerMaster.parentAccountId, filters.parentAccountId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(generalLedgerMaster.accountName);
  }

  async getGeneralLedgerAccount(id: number): Promise<GeneralLedgerMaster | null> {
    const result = await db.select().from(generalLedgerMaster)
      .where(eq(generalLedgerMaster.id, id))
      .limit(1);
    return result[0] || null;
  }

  async createGeneralLedgerAccount(account: NewGeneralLedgerMaster): Promise<GeneralLedgerMaster> {
    const result = await db.insert(generalLedgerMaster)
      .values(account)
      .returning();
    return result[0];
  }

  async updateGeneralLedgerAccount(id: number, account: Partial<GeneralLedgerMaster>): Promise<GeneralLedgerMaster | null> {
    const result = await db.update(generalLedgerMaster)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(generalLedgerMaster.id, id))
      .returning();
    
    return result[0] || null;
  }

  async updateAccountBalance(id: number, amount: number): Promise<GeneralLedgerMaster | null> {
    const result = await db.update(generalLedgerMaster)
      .set({ currentBalance: amount, updatedAt: new Date() })
      .where(eq(generalLedgerMaster.id, id))
      .returning();
    
    return result[0] || null;
  }

  async deleteGeneralLedgerAccount(id: number): Promise<boolean> {
    // Check if account has child accounts
    const childAccounts = await db.select().from(generalLedgerMaster)
      .where(eq(generalLedgerMaster.parentAccountId, id))
      .limit(1);
    
    if (childAccounts.length > 0) {
      return false; // Cannot delete account with child accounts
    }
    
    // Check if account has subledgers
    const subledgers = await db.select().from(subledgerMaster)
      .where(eq(subledgerMaster.generalLedgerAccountId, id))
      .limit(1);
    
    if (subledgers.length > 0) {
      return false; // Cannot delete account with subledgers
    }
    
    const result = await db.delete(generalLedgerMaster)
      .where(eq(generalLedgerMaster.id, id))
      .returning();
    
    return result.length > 0;
  }

  async getAccountsByType(accountType: string): Promise<GeneralLedgerMaster[]> {
    return await db.select().from(generalLedgerMaster)
      .where(eq(generalLedgerMaster.accountType, accountType))
      .orderBy(generalLedgerMaster.accountName);
  }

  // Subledger Master methods
  async getAllSubledgers(filters?: { generalLedgerAccountId?: number; isActive?: boolean; isDefaultLedger?: boolean }): Promise<SubledgerMaster[]> {
    let query = db.select().from(subledgerMaster);
    const conditions = [];
    
    if (filters?.generalLedgerAccountId) {
      conditions.push(eq(subledgerMaster.generalLedgerAccountId, filters.generalLedgerAccountId));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(subledgerMaster.isActive, filters.isActive));
    }
    if (filters?.isDefaultLedger !== undefined) {
      conditions.push(eq(subledgerMaster.isDefaultLedger, filters.isDefaultLedger));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }

  async getSubledger(id: number): Promise<SubledgerMaster | null> {
    const result = await db.select().from(subledgerMaster).where(eq(subledgerMaster.id, id));
    return result[0] || null;
  }

  async createSubledger(subledger: NewSubledgerMaster): Promise<SubledgerMaster> {
    const result = await db.insert(subledgerMaster).values(subledger).returning();
    return result[0];
  }

  async updateSubledger(id: number, subledger: Partial<SubledgerMaster>): Promise<SubledgerMaster | null> {
    const result = await db.update(subledgerMaster).set(subledger).where(eq(subledgerMaster.id, id)).returning();
    return result[0] || null;
  }

  async deleteSubledger(id: number): Promise<boolean> {
    // Check if balance is zero before allowing deletion
    const subledger = await this.getSubledger(id);
    if (subledger && parseFloat(subledger.currentBalance) !== 0) {
      return false;
    }
    
    const result = await db.delete(subledgerMaster).where(eq(subledgerMaster.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getSubledgersByAccount(accountId: number): Promise<SubledgerMaster[]> {
    return await db.select().from(subledgerMaster)
      .where(eq(subledgerMaster.generalLedgerAccountId, accountId));
  }

  async setDefaultSubledger(id: number): Promise<void> {
    // First, unset all other default ledgers for the same general ledger account
    const subledger = await this.getSubledger(id);
    if (subledger) {
      await db.update(subledgerMaster)
        .set({ isDefaultLedger: false })
        .where(eq(subledgerMaster.generalLedgerAccountId, subledger.generalLedgerAccountId));
      
      // Then set this one as default
      await db.update(subledgerMaster)
        .set({ isDefaultLedger: true })
        .where(eq(subledgerMaster.id, id));
    }
  }

  // Tariff Setup Master methods
  async getAllTariffSetups(filters?: { isActive?: boolean; subledgerId?: number; validDate?: string }): Promise<TariffSetupMaster[]> {
    let query = db.select().from(tariffSetupMaster);
    const conditions = [];
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(tariffSetupMaster.isActive, filters.isActive));
    }
    if (filters?.subledgerId) {
      conditions.push(eq(tariffSetupMaster.subledgerId, filters.subledgerId));
    }
    if (filters?.validDate) {
      // Check if the provided date falls within the valid date range
      conditions.push(
        and(
          sql`${tariffSetupMaster.validFromDate} <= ${filters.validDate}`,
          sql`${tariffSetupMaster.validToDate} >= ${filters.validDate}`
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }

  async getTariffSetup(id: number): Promise<TariffSetupMaster | null> {
    const result = await db.select().from(tariffSetupMaster).where(eq(tariffSetupMaster.id, id));
    return result[0] || null;
  }

  async checkTariffOverlap(tariff: NewTariffSetupMaster, excludeId?: number): Promise<TariffSetupMaster | null> {
    const conditions = [
      eq(tariffSetupMaster.subledgerId, tariff.subledgerId),
      // Check for amount range overlap
      sql`(${tariff.fromAmount} BETWEEN ${tariffSetupMaster.fromAmount} AND ${tariffSetupMaster.toAmount} 
           OR ${tariff.toAmount} BETWEEN ${tariffSetupMaster.fromAmount} AND ${tariffSetupMaster.toAmount} 
           OR ${tariffSetupMaster.fromAmount} BETWEEN ${tariff.fromAmount} AND ${tariff.toAmount})`,
      // Check for date range overlap
      sql`(${tariff.validFromDate} <= ${tariffSetupMaster.validToDate} 
           AND ${tariff.validToDate} >= ${tariffSetupMaster.validFromDate})`
    ];
    
    if (excludeId) {
      conditions.push(sql`${tariffSetupMaster.id} != ${excludeId}`);
    }
    
    const result = await db.select().from(tariffSetupMaster).where(and(...conditions));
    return result[0] || null;
  }

  async createTariffSetup(tariff: NewTariffSetupMaster): Promise<TariffSetupMaster> {
    const result = await db.insert(tariffSetupMaster).values(tariff).returning();
    return result[0];
  }

  async updateTariffSetup(id: number, tariff: Partial<TariffSetupMaster>): Promise<TariffSetupMaster | null> {
    const result = await db.update(tariffSetupMaster).set(tariff).where(eq(tariffSetupMaster.id, id)).returning();
    return result[0] || null;
  }

  async deleteTariffSetup(id: number): Promise<boolean> {
    const result = await db.delete(tariffSetupMaster).where(eq(tariffSetupMaster.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getTariffSetupsByAmount(amount: string): Promise<TariffSetupMaster[]> {
    const amountNum = parseFloat(amount);
    return await db.select().from(tariffSetupMaster).where(
      and(
        sql`${amountNum} BETWEEN ${tariffSetupMaster.fromAmount} AND ${tariffSetupMaster.toAmount}`,
        eq(tariffSetupMaster.isActive, true)
      )
    );
  }

  async getTariffSetupsBySubledger(subledgerId: number): Promise<TariffSetupMaster[]> {
    return await db.select().from(tariffSetupMaster)
      .where(and(
        eq(tariffSetupMaster.subledgerId, subledgerId),
        eq(tariffSetupMaster.isActive, true)
      ));
  }

  // Plan Master methods
  async getAllPlanMasters(filters?: any): Promise<PlanMaster[]> {
    let query = db.select().from(planMaster);
    
    if (filters?.planType) {
      query = query.where(eq(planMaster.planType, filters.planType));
    }
    
    return await query;
  }

  async getPopularPlanMasters(): Promise<PlanMaster[]> {
    return await db.select().from(planMaster).where(eq(planMaster.isPopular, true));
  }

  async getPlanMaster(id: number): Promise<PlanMaster | undefined> {
    const result = await db.select().from(planMaster).where(eq(planMaster.id, id));
    return result[0];
  }

  async getPlanMasterByCode(planCode: string): Promise<PlanMaster | undefined> {
    const result = await db.select().from(planMaster).where(eq(planMaster.planCode, planCode));
    return result[0];
  }

  async createPlanMaster(plan: NewPlanMaster): Promise<PlanMaster> {
    const result = await db.insert(planMaster).values(plan).returning();
    return result[0];
  }

  async updatePlanMaster(id: number, plan: Partial<PlanMaster>): Promise<PlanMaster | undefined> {
    try {
      // Filter out timestamp fields to avoid type conversion errors
      const updateFields: any = {};
      
      // Only update safe fields, exclude id and timestamp fields
      if (plan.planCode !== undefined) updateFields.planCode = plan.planCode;
      if (plan.planName !== undefined) updateFields.planName = plan.planName;
      if (plan.planDescription !== undefined) updateFields.planDescription = plan.planDescription;
      if (plan.planType !== undefined) updateFields.planType = plan.planType;
      if (plan.hasStandardPricing !== undefined) updateFields.hasStandardPricing = plan.hasStandardPricing;
      if (plan.basePrice !== undefined) updateFields.basePrice = plan.basePrice;
      if (plan.childPrice !== undefined) updateFields.childPrice = plan.childPrice;
      if (plan.infantPrice !== undefined) updateFields.infantPrice = plan.infantPrice;
      if (plan.childAgeFrom !== undefined) updateFields.childAgeFrom = plan.childAgeFrom;
      if (plan.childAgeUpto !== undefined) updateFields.childAgeUpto = plan.childAgeUpto;
      if (plan.infantAgeFrom !== undefined) updateFields.infantAgeFrom = plan.infantAgeFrom;
      if (plan.infantAgeUpto !== undefined) updateFields.infantAgeUpto = plan.infantAgeUpto;
      if (plan.isActive !== undefined) updateFields.isActive = plan.isActive;
      if (plan.isPopular !== undefined) updateFields.isPopular = plan.isPopular;
      if (plan.sortOrder !== undefined) updateFields.sortOrder = plan.sortOrder;
      if (plan.minimumStay !== undefined) updateFields.minimumStay = plan.minimumStay;
      if (plan.maximumStay !== undefined) updateFields.maximumStay = plan.maximumStay;
      if (plan.advanceBookingDays !== undefined) updateFields.advanceBookingDays = plan.advanceBookingDays;
      if (plan.planIcon !== undefined) updateFields.planIcon = plan.planIcon;
      if (plan.planColor !== undefined) updateFields.planColor = plan.planColor;
      if (plan.termsAndConditions !== undefined) updateFields.termsAndConditions = plan.termsAndConditions;
      
      // Meal inclusion boolean fields
      if (plan.includesBreakfast !== undefined) updateFields.includesBreakfast = plan.includesBreakfast;
      if (plan.includesLunch !== undefined) updateFields.includesLunch = plan.includesLunch;
      if (plan.includesDinner !== undefined) updateFields.includesDinner = plan.includesDinner;
      if (plan.includesWifi !== undefined) updateFields.includesWifi = plan.includesWifi;
      if (plan.includesGym !== undefined) updateFields.includesGym = plan.includesGym;
      
      // NEVER touch timestamp fields: createdAt, updatedAt
      // Let the database handle updatedAt automatically
      
      const result = await db.update(planMaster).set(updateFields).where(eq(planMaster.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Plan master update error:', error);
      throw error;
    }
  }

  async deletePlanMaster(id: number): Promise<boolean> {
    const result = await db.delete(planMaster).where(eq(planMaster.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Meal Inclusion Master methods
  async getAllMealInclusions(filters?: any): Promise<MealInclusionMaster[]> {
    let query = db.select().from(mealInclusionMaster);
    
    if (filters?.isActive !== undefined) {
      query = query.where(eq(mealInclusionMaster.isActive, filters.isActive));
    }
    
    if (filters?.mealCategory) {
      query = query.where(eq(mealInclusionMaster.mealCategory, filters.mealCategory));
    }
    
    return await query;
  }

  async getMealInclusionById(id: number): Promise<MealInclusionMaster | undefined> {
    const result = await db.select().from(mealInclusionMaster).where(eq(mealInclusionMaster.id, id));
    return result[0];
  }

  async getMealInclusionByCode(mealCode: string): Promise<MealInclusionMaster | undefined> {
    const result = await db.select().from(mealInclusionMaster).where(eq(mealInclusionMaster.mealCode, mealCode));
    return result[0];
  }

  async createMealInclusion(mealInclusion: NewMealInclusionMaster): Promise<MealInclusionMaster> {
    const result = await db.insert(mealInclusionMaster).values(mealInclusion).returning();
    return result[0];
  }

  async updateMealInclusion(id: number, mealInclusion: Partial<MealInclusionMaster>): Promise<MealInclusionMaster | undefined> {
    const result = await db.update(mealInclusionMaster).set(mealInclusion).where(eq(mealInclusionMaster.id, id)).returning();
    return result[0];
  }

  async deleteMealInclusion(id: number): Promise<boolean> {
    const result = await db.delete(mealInclusionMaster).where(eq(mealInclusionMaster.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Plan Meal Inclusions methods
  async getPlanMealInclusions(planId: number): Promise<PlanMealInclusion[]> {
    return await db.select().from(planMealInclusions).where(eq(planMealInclusions.planId, planId));
  }

  async createPlanMealInclusion(planMealInclusion: NewPlanMealInclusion): Promise<PlanMealInclusion> {
    const result = await db.insert(planMealInclusions).values(planMealInclusion).returning();
    return result[0];
  }

  async deletePlanMealInclusion(planId: number, mealInclusionId: number): Promise<boolean> {
    const result = await db.delete(planMealInclusions)
      .where(and(eq(planMealInclusions.planId, planId), eq(planMealInclusions.mealInclusionId, mealInclusionId)));
    return (result.rowCount || 0) > 0;
  }

  // Rate Master methods
  async getAllRateMasters(filters?: any): Promise<RateMaster[]> {
    let query = db.select().from(rateMaster);
    
    if (filters?.propertyId) {
      query = query.where(eq(rateMaster.propertyId, filters.propertyId));
    }
    
    if (filters?.roomTypeId) {
      query = query.where(eq(rateMaster.roomTypeId, filters.roomTypeId));
    }
    
    if (filters?.isActive !== undefined) {
      query = query.where(eq(rateMaster.isActive, filters.isActive));
    }
    
    return await query;
  }

  async getRateMaster(id: number): Promise<RateMaster | undefined> {
    const result = await db.select().from(rateMaster).where(eq(rateMaster.id, id));
    return result[0];
  }

  async getRatesByProperty(propertyId: number): Promise<RateMaster[]> {
    return await db.select().from(rateMaster).where(eq(rateMaster.propertyId, propertyId));
  }

  async getRatesByRoomType(roomTypeId: number): Promise<RateMaster[]> {
    return await db.select().from(rateMaster).where(eq(rateMaster.roomTypeId, roomTypeId));
  }

  async getApplicableRates(propertyId: number, roomTypeId: number, startDate: string, endDate: string): Promise<RateMaster[]> {
    return await db.select().from(rateMaster)
      .where(
        and(
          eq(rateMaster.propertyId, propertyId),
          eq(rateMaster.roomTypeId, roomTypeId),
          eq(rateMaster.isActive, true),
          sql`${rateMaster.fromDate} <= ${endDate}`,
          sql`${rateMaster.toDate} >= ${startDate}`
        )
      );
  }

  async createRateMaster(rate: NewRateMaster): Promise<RateMaster> {
    const result = await db.insert(rateMaster).values(rate).returning();
    return result[0];
  }

  async updateRateMaster(id: number, rate: Partial<RateMaster>): Promise<RateMaster | undefined> {
    try {
      // Use string interpolation to avoid parameter binding issues
      const single = rate.singleOccupancyRate || '0.00';
      const double = rate.doubleOccupancyRate || '0.00';
      const triple = rate.tripleOccupancyRate || '0.00';
      const quadruple = rate.quadrupleOccupancyRate || '0.00';
      
      const query = `
        UPDATE rate_master 
        SET single_occupancy_rate = '${single}',
            double_occupancy_rate = '${double}',
            triple_occupancy_rate = '${triple}',
            quadruple_occupancy_rate = '${quadruple}',
            updated_at = NOW()
        WHERE id = ${id} 
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query));
      
      return result.rows[0] as RateMaster;
    } catch (error) {
      console.error('Rate master update error:', error);
      throw error;
    }
  }

  async deleteRateMaster(id: number): Promise<boolean> {
    const result = await db.delete(rateMaster).where(eq(rateMaster.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Loyalty Program methods
  async getAllLoyaltyPrograms(): Promise<LoyaltyProgram[]> {
    return await db.select().from(loyaltyProgram).orderBy(desc(loyaltyProgram.createdAt));
  }

  async getLoyaltyProgram(userId: number): Promise<LoyaltyProgram | undefined> {
    const result = await db.select().from(loyaltyProgram).where(eq(loyaltyProgram.userId, userId));
    return result[0];
  }

  async createLoyaltyProgram(loyaltyProgramData: NewLoyaltyProgram): Promise<LoyaltyProgram> {
    const result = await db.insert(loyaltyProgram).values(loyaltyProgramData).returning();
    return result[0];
  }

  async updateLoyaltyProgram(userId: number, updates: Partial<LoyaltyProgram>): Promise<LoyaltyProgram | undefined> {
    const result = await db.update(loyaltyProgram)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(loyaltyProgram.userId, userId))
      .returning();
    return result[0];
  }

  // Promotions/Coupon methods
  async getAllPromotions(): Promise<Promotion[]> {
    return await db.select().from(promotions).orderBy(desc(promotions.createdAt));
  }

  async getActivePromotions(): Promise<Promotion[]> {
    const now = new Date();
    return await db.select().from(promotions)
      .where(and(
        eq(promotions.isActive, true),
        sql`${promotions.validFrom} <= ${now}`,
        sql`${promotions.validUntil} >= ${now}`
      ))
      .orderBy(desc(promotions.createdAt));
  }

  async getPromotionByCode(code: string): Promise<Promotion | undefined> {
    const result = await db.select().from(promotions).where(eq(promotions.code, code));
    return result[0];
  }

  async createPromotion(promotionData: NewPromotion): Promise<Promotion> {
    const result = await db.insert(promotions).values(promotionData).returning();
    return result[0];
  }

  async updatePromotion(id: number, updates: Partial<Promotion>): Promise<Promotion | undefined> {
    const result = await db.update(promotions)
      .set(updates)
      .where(eq(promotions.id, id))
      .returning();
    return result[0];
  }

  async deletePromotion(id: number): Promise<boolean> {
    const result = await db.delete(promotions).where(eq(promotions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Guest Master methods
  async getAllGuests(filters?: { isActive?: boolean; guestCategory?: string; isBlacklisted?: boolean }): Promise<GuestMaster[]> {
    let query = db.select().from(guestMaster);
    
    if (filters?.isActive !== undefined) {
      query = query.where(eq(guestMaster.isActive, filters.isActive));
    }
    if (filters?.guestCategory) {
      query = query.where(eq(guestMaster.guestCategory, filters.guestCategory));
    }
    if (filters?.isBlacklisted !== undefined) {
      query = query.where(eq(guestMaster.isBlacklisted, filters.isBlacklisted));
    }
    
    return await query.orderBy(desc(guestMaster.createdAt));
  }

  async getGuest(id: number): Promise<GuestMaster | undefined> {
    const result = await db.select().from(guestMaster).where(eq(guestMaster.id, id));
    return result[0];
  }

  async getGuestByCode(guestCode: string): Promise<GuestMaster | undefined> {
    const result = await db.select().from(guestMaster).where(eq(guestMaster.guestCode, guestCode));
    return result[0];
  }

  async getGuestByEmail(email: string): Promise<GuestMaster | undefined> {
    const result = await db.select().from(guestMaster).where(eq(guestMaster.email, email));
    return result[0];
  }

  async getGuestByPhone(phoneNumber: string): Promise<GuestMaster | undefined> {
    const result = await db.select().from(guestMaster).where(eq(guestMaster.phoneNumber, phoneNumber));
    return result[0];
  }

  async searchGuests(query: string): Promise<GuestMaster[]> {
    return await db.select().from(guestMaster)
      .where(
        sql`LOWER(${guestMaster.firstName}) LIKE ${`%${query.toLowerCase()}%`} OR 
            LOWER(${guestMaster.lastName}) LIKE ${`%${query.toLowerCase()}%`} OR 
            LOWER(${guestMaster.email}) LIKE ${`%${query.toLowerCase()}%`} OR 
            ${guestMaster.phoneNumber} LIKE ${`%${query}%`} OR 
            LOWER(${guestMaster.guestCode}) LIKE ${`%${query.toLowerCase()}%`}`
      )
      .orderBy(desc(guestMaster.createdAt));
  }

  async createGuest(guest: NewGuestMaster): Promise<GuestMaster> {
    const result = await db.insert(guestMaster).values(guest).returning();
    return result[0];
  }

  async updateGuest(id: number, updates: Partial<GuestMaster>): Promise<GuestMaster | undefined> {
    const result = await db.update(guestMaster)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(guestMaster.id, id))
      .returning();
    return result[0];
  }

  async deleteGuest(id: number): Promise<boolean> {
    const result = await db.delete(guestMaster).where(eq(guestMaster.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Guest Details methods
  async createGuestDetails(guestDetailsData: NewGuestDetails): Promise<GuestDetails> {
    const result = await db.insert(guestDetails).values(guestDetailsData).returning();
    return result[0];
  }

  async getGuestDetailsByGuestMasterId(guestMasterId: number): Promise<GuestDetails[]> {
    return await db.select().from(guestDetails)
      .where(eq(guestDetails.guestMasterId, guestMasterId))
      .orderBy(desc(guestDetails.createdAt));
  }

  async deleteGuestDetails(id: number): Promise<boolean> {
    const result = await db.delete(guestDetails).where(eq(guestDetails.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Booking Guest Details methods
  async createBookingGuestDetails(bookingGuestDetailsData: NewBookingGuestDetails): Promise<BookingGuestDetails> {
    const result = await db.insert(bookingGuestDetails).values(bookingGuestDetailsData).returning();
    return result[0];
  }

  async getBookingGuestDetailsByBookingId(bookingId: number): Promise<BookingGuestDetails[]> {
    return await db.select().from(bookingGuestDetails)
      .where(eq(bookingGuestDetails.bookingId, bookingId))
      .orderBy(desc(bookingGuestDetails.isPrimary), asc(bookingGuestDetails.id));
  }

  async deleteBookingGuestDetailsByBookingId(bookingId: number): Promise<boolean> {
    const result = await db.delete(bookingGuestDetails).where(eq(bookingGuestDetails.bookingId, bookingId));
    return (result.rowCount || 0) > 0;
  }

  // Transaction Booking Master methods
  async createTransBookingMas(transMasData: NewTransBookingMas): Promise<TransBookingMas> {
    const result = await db.insert(transBookingMas).values(transMasData).returning();
    return result[0];
  }

  async getTransBookingMasByBookingId(bookingId: string): Promise<TransBookingMas | undefined> {
    const result = await db.select().from(transBookingMas)
      .where(eq(transBookingMas.bookingId, bookingId));
    return result[0];
  }

  async getTransBookingMasById(masBillingId: number): Promise<TransBookingMas | undefined> {
    const result = await db.select().from(transBookingMas)
      .where(eq(transBookingMas.masBillingId, masBillingId));
    return result[0];
  }

  // Transaction Booking Detail methods
  async createTransBookingDet(transDetData: NewTransBookingDet): Promise<TransBookingDet> {
    const result = await db.insert(transBookingDet).values(transDetData).returning();
    return result[0];
  }

  async getTransBookingDetByMasId(masBillingId: number): Promise<TransBookingDet[]> {
    return await db.select().from(transBookingDet)
      .where(eq(transBookingDet.masBillingId, masBillingId))
      .orderBy(asc(transBookingDet.id));
  }

  async deleteTransBookingDetByMasId(masBillingId: number): Promise<boolean> {
    const result = await db.delete(transBookingDet).where(eq(transBookingDet.masBillingId, masBillingId));
    return (result.rowCount || 0) > 0;
  }

  // Transaction Booking Detail Datewise methods
  async createTransBookingDetailDatewise(detailDatewiseData: NewTransBookingDetailDatewise): Promise<TransBookingDetailDatewise> {
    const result = await db.insert(transBookingDetailDatewise).values(detailDatewiseData).returning();
    return result[0];
  }

  async getTransBookingDetailDatewiseByMasId(masBillingId: number): Promise<TransBookingDetailDatewise[]> {
    return await db.select().from(transBookingDetailDatewise)
      .where(eq(transBookingDetailDatewise.masBillingId, masBillingId))
      .orderBy(asc(transBookingDetailDatewise.bookingDate));
  }

  async getTransBookingDetailDatewiseByDate(propertyId: number, roomTypeId: number, bookingDate: Date): Promise<TransBookingDetailDatewise[]> {
    return await db.select().from(transBookingDetailDatewise)
      .where(
        and(
          eq(transBookingDetailDatewise.propertyId, propertyId),
          eq(transBookingDetailDatewise.roomTypeId, roomTypeId),
          eq(transBookingDetailDatewise.bookingDate, bookingDate)
        )
      );
  }

  async calculateBalanceRoomCount(propertyId: number, roomTypeId: number, bookingDate: Date): Promise<number> {
    // Get allocated room count from room_inventory for this date
    const inventory = await db.select().from(roomInventory)
      .where(
        and(
          eq(roomInventory.propertyId, propertyId),
          eq(roomInventory.roomTypeId, roomTypeId),
          eq(roomInventory.date, bookingDate)
        )
      );
    
    const allocatedRooms = inventory[0]?.roomsAllocated || 0;
    
    // Sum all booked rooms for this date/roomType/property from trans_booking_detaildatewise
    const bookedRooms = await db.select({
      totalBooked: sql<number>`COALESCE(SUM(${transBookingDetailDatewise.roomCount}), 0)`
    }).from(transBookingDetailDatewise)
      .where(
        and(
          eq(transBookingDetailDatewise.propertyId, propertyId),
          eq(transBookingDetailDatewise.roomTypeId, roomTypeId),
          eq(transBookingDetailDatewise.bookingDate, bookingDate)
        )
      );
    
    const totalBooked = Number(bookedRooms[0]?.totalBooked || 0);
    return allocatedRooms - totalBooked;
  }

  async deleteTransBookingDetailDatewiseByMasId(masBillingId: number): Promise<boolean> {
    const result = await db.delete(transBookingDetailDatewise).where(eq(transBookingDetailDatewise.masBillingId, masBillingId));
    return (result.rowCount || 0) > 0;
  }

  // Room Availability Report methods
  async getBookingDetailsReport(filters: {
    propertyId?: number;
    roomTypeId?: number;
    guestName?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    data: Array<{
      bookingId: string;
      propertyId: number;
      propertyName: string;
      roomTypeId: number | null;
      roomTypeName: string;
      guestName: string;
      guestEmail: string;
      guestPhone: string;
      checkInDate: string;
      checkOutDate: string;
      numberOfRooms: number;
      numberOfNights: number;
      totalAmount: string;
      status: string;
      paymentStatus: string;
      bookingDate: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
    grandTotals: {
      numberOfRooms: number;
      numberOfNights: number;
      totalAmount: number;
    };
  }> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    const offset = (page - 1) * pageSize;

    // Build WHERE conditions
    const conditions = [];
    
    if (filters.propertyId) {
      conditions.push(eq(enhancedBookings.propertyId, filters.propertyId));
    }
    
    if (filters.roomTypeId) {
      conditions.push(eq(enhancedBookings.roomTypeId, filters.roomTypeId));
    }
    
    if (filters.guestName) {
      conditions.push(ilike(enhancedBookings.guestName, `%${filters.guestName}%`));
    }
    
    // Date overlap logic: Include bookings that overlap with the selected date range
    // A booking overlaps if: checkOut >= dateFrom AND checkIn <= dateTo
    if (filters.dateFrom) {
      conditions.push(sql`${enhancedBookings.checkOut} >= ${filters.dateFrom}`);
    }
    
    if (filters.dateTo) {
      conditions.push(sql`${enhancedBookings.checkIn} <= ${filters.dateTo}`);
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(enhancedBookings)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = countResult[0]?.count || 0;

    // Get grand totals
    const grandTotalsResult = await db
      .select({
        numberOfRooms: sql<number>`COALESCE(SUM(${enhancedBookings.numberOfRooms}), 0)::int`,
        numberOfNights: sql<number>`COALESCE(SUM(${enhancedBookings.numberOfNights}), 0)::int`,
        totalAmount: sql<number>`COALESCE(SUM(${enhancedBookings.totalAmount}::numeric), 0)::numeric`
      })
      .from(enhancedBookings)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const grandTotals = grandTotalsResult[0] || {
      numberOfRooms: 0,
      numberOfNights: 0,
      totalAmount: 0
    };

    // Get paginated data with joins
    const results = await db
      .select()
      .from(enhancedBookings)
      .leftJoin(properties, eq(enhancedBookings.propertyId, properties.id))
      .leftJoin(roomTypes, eq(enhancedBookings.roomTypeId, roomTypes.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(enhancedBookings.bookedAt))
      .limit(pageSize)
      .offset(offset);

    return {
      data: results.map(row => ({
        bookingId: row.enhanced_bookings.bookingId || '',
        propertyId: row.enhanced_bookings.propertyId,
        propertyName: row.properties?.name || 'Unknown',
        roomTypeId: row.enhanced_bookings.roomTypeId,
        roomTypeName: row.room_types?.roomTypeName || 'N/A',
        guestName: row.enhanced_bookings.guestName || '',
        guestEmail: row.enhanced_bookings.guestEmail || '',
        guestPhone: row.enhanced_bookings.guestPhone || '',
        checkInDate: row.enhanced_bookings.checkIn || '',
        checkOutDate: row.enhanced_bookings.checkOut || '',
        numberOfRooms: row.enhanced_bookings.numberOfRooms || 0,
        numberOfNights: row.enhanced_bookings.numberOfNights || 0,
        totalAmount: row.enhanced_bookings.totalAmount || '0',
        status: row.enhanced_bookings.status || 'pending',
        paymentStatus: row.enhanced_bookings.paymentStatus || 'pending',
        bookingDate: row.enhanced_bookings.bookedAt ? row.enhanced_bookings.bookedAt.toISOString() : ''
      })),
      total,
      page,
      pageSize,
      grandTotals
    };
  }

  async getRoomAvailabilityReport(filters: {
    propertyId?: number;
    roomTypeId?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    data: Array<{
      propertyId: number;
      propertyName: string;
      roomTypeId: number;
      roomTypeName: string;
      date: string;
      totalRooms: number;
      bookedRooms: number;
      blockedRooms: number;
      availableRooms: number;
    }>;
    total: number;
    page: number;
    pageSize: number;
    grandTotals: {
      totalRooms: number;
      bookedRooms: number;
      blockedRooms: number;
      availableRooms: number;
    };
  }> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    const offset = (page - 1) * pageSize;

    // Build WHERE conditions
    const conditions = [eq(roomInventory.isActive, true)];
    
    if (filters.propertyId) {
      conditions.push(eq(roomInventory.propertyId, filters.propertyId));
    }
    
    if (filters.roomTypeId) {
      conditions.push(eq(roomInventory.roomTypeId, filters.roomTypeId));
    }
    
    if (filters.dateFrom) {
      conditions.push(sql`${roomInventory.date} >= ${filters.dateFrom}`);
    }
    
    if (filters.dateTo) {
      conditions.push(sql`${roomInventory.date} <= ${filters.dateTo}`);
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(roomInventory)
      .where(and(...conditions));
    
    const total = countResult[0]?.count || 0;

    // Get grand totals
    const grandTotalsResult = await db
      .select({
        totalRooms: sql<number>`COALESCE(SUM(${roomInventory.totalRooms}), 0)::int`,
        bookedRooms: sql<number>`COALESCE(SUM(${roomInventory.bookedRooms}), 0)::int`,
        blockedRooms: sql<number>`COALESCE(SUM(${roomInventory.blockedRooms}), 0)::int`,
        availableRooms: sql<number>`COALESCE(SUM(${roomInventory.availableRooms}), 0)::int`
      })
      .from(roomInventory)
      .where(and(...conditions));

    const grandTotals = grandTotalsResult[0] || {
      totalRooms: 0,
      bookedRooms: 0,
      blockedRooms: 0,
      availableRooms: 0
    };

    // Get paginated data with joins
    const results = await db
      .select({
        propertyId: roomInventory.propertyId,
        propertyName: properties.name,
        roomTypeId: roomInventory.roomTypeId,
        roomTypeName: roomTypes.roomTypeName,
        date: roomInventory.date,
        totalRooms: roomInventory.totalRooms,
        bookedRooms: roomInventory.bookedRooms,
        blockedRooms: roomInventory.blockedRooms,
        availableRooms: roomInventory.availableRooms
      })
      .from(roomInventory)
      .leftJoin(properties, eq(roomInventory.propertyId, properties.id))
      .leftJoin(roomTypes, eq(roomInventory.roomTypeId, roomTypes.id))
      .where(and(...conditions))
      .orderBy(asc(roomInventory.date), asc(properties.name), asc(roomTypes.roomTypeName))
      .limit(pageSize)
      .offset(offset);

    return {
      data: results.map(row => ({
        propertyId: row.propertyId,
        propertyName: row.propertyName || 'Unknown',
        roomTypeId: row.roomTypeId,
        roomTypeName: row.roomTypeName || 'Unknown',
        date: row.date || '',
        totalRooms: row.totalRooms,
        bookedRooms: row.bookedRooms,
        blockedRooms: row.blockedRooms,
        availableRooms: row.availableRooms
      })),
      total,
      page,
      pageSize,
      grandTotals
    };
  }

  // Role Master and User Profile methods
  async getAllRoles(filters?: { isActive?: boolean; isSystemRole?: boolean }): Promise<RoleMaster[]> {
    let query = db.select().from(roleMaster);
    
    if (filters?.isActive !== undefined) {
      query = query.where(eq(roleMaster.isActive, filters.isActive));
    }
    if (filters?.isSystemRole !== undefined) {
      query = query.where(eq(roleMaster.isSystemRole, filters.isSystemRole));
    }
    
    return await query.orderBy(asc(roleMaster.level), asc(roleMaster.roleName));
  }

  async getRole(id: number): Promise<RoleMaster | undefined> {
    const result = await db.select().from(roleMaster).where(eq(roleMaster.id, id));
    return result[0];
  }

  async getRoleByCode(roleCode: string): Promise<RoleMaster | undefined> {
    const result = await db.select().from(roleMaster).where(eq(roleMaster.roleCode, roleCode));
    return result[0];
  }

  async createRole(role: NewRoleMaster): Promise<RoleMaster> {
    const result = await db.insert(roleMaster).values(role).returning();
    return result[0];
  }

  async updateRole(id: number, updates: Partial<RoleMaster>): Promise<RoleMaster | undefined> {
    const result = await db.update(roleMaster)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(roleMaster.id, id))
      .returning();
    return result[0];
  }

  async deleteRole(id: number): Promise<boolean> {
    const result = await db.delete(roleMaster).where(eq(roleMaster.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllUsers(filters?: { role?: string; isVerified?: boolean }): Promise<User[]> {
    let query = db.select().from(users);
    
    if (filters?.role) {
      query = query.where(eq(users.role, filters.role));
    }
    if (filters?.isVerified !== undefined) {
      query = query.where(eq(users.isVerified, filters.isVerified));
    }
    
    return await query.orderBy(desc(users.createdAt));
  }

  async getUsersByRole(roleId: number): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.roleId, roleId))
      .orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: number, roleId: number): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ roleId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // User Property Access methods
  async getAllUserPropertyAccess(filters?: { userId?: number; propertyId?: number; isActive?: boolean }): Promise<UserPropertyAccess[]> {
    let query = db.select().from(userPropertyAccess);
    
    if (filters?.userId !== undefined) {
      query = query.where(eq(userPropertyAccess.userId, filters.userId));
    }
    if (filters?.propertyId !== undefined) {
      query = query.where(eq(userPropertyAccess.propertyId, filters.propertyId));
    }
    if (filters?.isActive !== undefined) {
      query = query.where(eq(userPropertyAccess.isActive, filters.isActive));
    }
    
    return await query.orderBy(desc(userPropertyAccess.assignedAt));
  }

  async getUserPropertyAccess(id: number): Promise<UserPropertyAccess | undefined> {
    const result = await db.select().from(userPropertyAccess).where(eq(userPropertyAccess.id, id));
    return result[0];
  }

  async createUserPropertyAccess(access: NewUserPropertyAccess): Promise<UserPropertyAccess> {
    const result = await db.insert(userPropertyAccess).values(access).returning();
    return result[0];
  }

  async updateUserPropertyAccess(id: number, updates: Partial<UserPropertyAccess>): Promise<UserPropertyAccess | undefined> {
    const result = await db.update(userPropertyAccess)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPropertyAccess.id, id))
      .returning();
    return result[0];
  }

  async deleteUserPropertyAccess(id: number): Promise<boolean> {
    const result = await db.delete(userPropertyAccess).where(eq(userPropertyAccess.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getUserProperties(userId: number): Promise<Property[]> {
    const accessList = await db.select()
      .from(userPropertyAccess)
      .where(eq(userPropertyAccess.userId, userId))
      .where(eq(userPropertyAccess.isActive, true));
    
    if (accessList.length === 0) return [];
    
    const propertyIds = accessList.map(a => a.propertyId);
    return await db.select().from(properties).where(sql`${properties.id} = ANY(${propertyIds})`);
  }

  async getPropertyUsers(propertyId: number): Promise<User[]> {
    const accessList = await db.select()
      .from(userPropertyAccess)
      .where(eq(userPropertyAccess.propertyId, propertyId))
      .where(eq(userPropertyAccess.isActive, true));
    
    if (accessList.length === 0) return [];
    
    const userIds = accessList.map(a => a.userId);
    return await db.select().from(users).where(sql`${users.id} = ANY(${userIds})`);
  }

  // Audit logging placeholder
  async logAction(action: string, tableName: string, recordId: string, userId?: number, oldValues?: any, newValues?: any, description?: string, metadata?: any): Promise<void> {
    // TODO: Implement audit logging to database
    console.log(`[AUDIT] ${action} on ${tableName} record ${recordId}`, { userId, description });
  }
}

// Use DatabaseStorage for persistent data
export const storage = new DatabaseStorage();