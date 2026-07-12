"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkEventType = exports.AspectRatio = exports.ThumbnailTemplate = exports.PaymentStatus = exports.EntityType = exports.RewardStatus = exports.ReminderStatus = exports.LeadStatus = exports.SmartLinkStatus = exports.DocumentVisibility = exports.MediaType = exports.VerificationStatus = exports.PropertyStatus = exports.TransactionType = exports.PropertyType = exports.AgencyStatus = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["AGENCY_ADMIN"] = "AGENCY_ADMIN";
    UserRole["AGENT"] = "AGENT";
    UserRole["OWNER"] = "OWNER";
    UserRole["BUYER"] = "BUYER";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["DELETED"] = "DELETED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var AgencyStatus;
(function (AgencyStatus) {
    AgencyStatus["ACTIVE"] = "ACTIVE";
    AgencyStatus["SUSPENDED"] = "SUSPENDED";
})(AgencyStatus || (exports.AgencyStatus = AgencyStatus = {}));
var PropertyType;
(function (PropertyType) {
    PropertyType["PLOT"] = "PLOT";
    PropertyType["VILLA"] = "VILLA";
    PropertyType["APARTMENT"] = "APARTMENT";
    PropertyType["COMMERCIAL"] = "COMMERCIAL";
    PropertyType["AGRICULTURAL"] = "AGRICULTURAL";
    PropertyType["INDUSTRIAL"] = "INDUSTRIAL";
    PropertyType["FARM_LAND"] = "FARM_LAND";
    PropertyType["INDEPENDENT_HOUSE"] = "INDEPENDENT_HOUSE";
})(PropertyType || (exports.PropertyType = PropertyType = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["SALE"] = "SALE";
    TransactionType["RENT"] = "RENT";
    TransactionType["LEASE"] = "LEASE";
    TransactionType["JOINT_DEVELOPMENT"] = "JOINT_DEVELOPMENT";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var PropertyStatus;
(function (PropertyStatus) {
    PropertyStatus["ACTIVE"] = "ACTIVE";
    PropertyStatus["UNDER_NEGOTIATION"] = "UNDER_NEGOTIATION";
    PropertyStatus["SOLD"] = "SOLD";
    PropertyStatus["RENTED"] = "RENTED";
    PropertyStatus["ARCHIVED"] = "ARCHIVED";
})(PropertyStatus || (exports.PropertyStatus = PropertyStatus = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["UNVERIFIED"] = "UNVERIFIED";
    VerificationStatus["SUBMITTED"] = "SUBMITTED";
    VerificationStatus["VERIFIED"] = "VERIFIED";
    VerificationStatus["REJECTED"] = "REJECTED";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
var MediaType;
(function (MediaType) {
    MediaType["PHOTO"] = "PHOTO";
    MediaType["VIDEO"] = "VIDEO";
    MediaType["DOCUMENT"] = "DOCUMENT";
    MediaType["THUMBNAIL"] = "THUMBNAIL";
})(MediaType || (exports.MediaType = MediaType = {}));
var DocumentVisibility;
(function (DocumentVisibility) {
    DocumentVisibility["PRIVATE"] = "PRIVATE";
    DocumentVisibility["PUBLIC"] = "PUBLIC";
    DocumentVisibility["ON_REQUEST"] = "ON_REQUEST";
})(DocumentVisibility || (exports.DocumentVisibility = DocumentVisibility = {}));
var SmartLinkStatus;
(function (SmartLinkStatus) {
    SmartLinkStatus["ACTIVE"] = "ACTIVE";
    SmartLinkStatus["DISABLED"] = "DISABLED";
    SmartLinkStatus["EXPIRED"] = "EXPIRED";
})(SmartLinkStatus || (exports.SmartLinkStatus = SmartLinkStatus = {}));
var LeadStatus;
(function (LeadStatus) {
    LeadStatus["NEW"] = "NEW";
    LeadStatus["CONTACTED"] = "CONTACTED";
    LeadStatus["SITE_VISIT_SCHEDULED"] = "SITE_VISIT_SCHEDULED";
    LeadStatus["NEGOTIATING"] = "NEGOTIATING";
    LeadStatus["CLOSED"] = "CLOSED";
    LeadStatus["DEAD"] = "DEAD";
})(LeadStatus || (exports.LeadStatus = LeadStatus = {}));
var ReminderStatus;
(function (ReminderStatus) {
    ReminderStatus["PENDING"] = "PENDING";
    ReminderStatus["DONE"] = "DONE";
    ReminderStatus["SNOOZED"] = "SNOOZED";
})(ReminderStatus || (exports.ReminderStatus = ReminderStatus = {}));
var RewardStatus;
(function (RewardStatus) {
    RewardStatus["PENDING"] = "PENDING";
    RewardStatus["CREDITED"] = "CREDITED";
    RewardStatus["EXPIRED"] = "EXPIRED";
})(RewardStatus || (exports.RewardStatus = RewardStatus = {}));
var EntityType;
(function (EntityType) {
    EntityType["USER"] = "USER";
    EntityType["AGENCY"] = "AGENCY";
})(EntityType || (exports.EntityType = EntityType = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["ACTIVE"] = "ACTIVE";
    PaymentStatus["EXPIRED"] = "EXPIRED";
    PaymentStatus["CANCELLED"] = "CANCELLED";
    PaymentStatus["TRIAL"] = "TRIAL";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var ThumbnailTemplate;
(function (ThumbnailTemplate) {
    ThumbnailTemplate["PREMIUM"] = "PREMIUM";
    ThumbnailTemplate["HOT_PROPERTY"] = "HOT_PROPERTY";
    ThumbnailTemplate["SIMPLE_WHATSAPP"] = "SIMPLE_WHATSAPP";
})(ThumbnailTemplate || (exports.ThumbnailTemplate = ThumbnailTemplate = {}));
var AspectRatio;
(function (AspectRatio) {
    AspectRatio["WIDE"] = "16:9";
    AspectRatio["SQUARE"] = "1:1";
    AspectRatio["STORY"] = "9:16";
})(AspectRatio || (exports.AspectRatio = AspectRatio = {}));
var LinkEventType;
(function (LinkEventType) {
    LinkEventType["VIEW"] = "view";
    LinkEventType["WHATSAPP_CLICK"] = "whatsapp_click";
    LinkEventType["CALL_CLICK"] = "call_click";
    LinkEventType["MAP_OPEN"] = "map_open";
    LinkEventType["DOC_REQUEST"] = "doc_request";
    LinkEventType["QUESTION_ASKED"] = "question_asked";
})(LinkEventType || (exports.LinkEventType = LinkEventType = {}));
//# sourceMappingURL=enums.js.map