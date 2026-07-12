package com.sitebank.android.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ApiResponse<T>(
    val data: T,
)

// ── Auth ──────────────────────────────────────────────────────────────────────

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

@Serializable
data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    val phone: String? = null,
)

@Serializable
data class AuthTokens(
    val accessToken: String,
    val refreshToken: String? = null,
    val expiresIn: Long? = null,
)

@Serializable
data class AuthSession(
    val user: User,
    val accessToken: String,
)

@Serializable
data class User(
    val id: String,
    val email: String,
    val name: String,
    val phone: String? = null,
    val profilePhotoUrl: String? = null,
    val whatsappNumber: String? = null,
    val role: String? = null,
    val agencyId: String? = null,
    val reraNumber: String? = null,
    val isVerified: Boolean = false,
    val status: String? = null,
)

// ── Properties ────────────────────────────────────────────────────────────────

@Serializable
data class PropertyCreateRequest(
    val title: String,
    val propertyType: String,
    val transactionType: String,
    val price: String? = null,
    val priceOnRequest: Boolean = false,
    val priceNegotiable: Boolean = false,
    val ownershipType: String? = null,
    val location: PropertyLocation? = null,
    val specs: Map<String, String>? = null,
    val amenities: List<String>? = null,
    val internalNotes: String? = null,
)

@Serializable
data class Property(
    val id: String,
    val title: String,
    @SerialName("propertyType") val propertyType: String? = null,
    @SerialName("transactionType") val transactionType: String? = null,
    val price: String? = null,
    val priceOnRequest: Boolean = false,
    val priceNegotiable: Boolean = false,
    val location: PropertyLocation? = null,
    val specs: Map<String, String>? = null,
    val amenities: List<String>? = null,
    val status: String? = null,
    val verificationStatus: String? = null,
    val media: List<PropertyMedia>? = null,
    val aiGeneratedTitle: String? = null,
    val aiGeneratedDescription: String? = null,
    @SerialName("_count") val count: PropertyCount? = null,
)

@Serializable
data class PropertyLocation(
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
)

@Serializable
data class PropertyMedia(
    val id: String? = null,
    val fileUrl: String,
    val cdnUrl: String? = null,
    val isCover: Boolean = false,
    val fileType: String? = null,
    val orderIndex: Int = 0,
)

@Serializable
data class PropertyCount(
    val smartLinks: Int = 0,
    val leads: Int = 0,
)

@Serializable
data class PaginatedResponse<T>(
    val items: List<T>,
    val total: Int,
    val page: Int,
    val pageSize: Int,
)

// ── Leads ─────────────────────────────────────────────────────────────────────

@Serializable
data class Lead(
    val id: String,
    val name: String? = null,
    val phone: String? = null,
    val source: String? = null,
    val notes: String? = null,
    val status: String,
    @SerialName("hotScore") val hotScore: Int = 0,
    @SerialName("lastActivityAt") val lastActivityAt: String? = null,
    val createdAt: String? = null,
    val property: LeadProperty? = null,
)

@Serializable
data class LeadProperty(
    val id: String,
    val title: String,
)

// ── Smart Links ───────────────────────────────────────────────────────────────

@Serializable
data class SmartLink(
    val id: String,
    val slug: String,
    @SerialName("propertyId") val propertyId: String,
    val status: String? = null,
    val expiryAt: String? = null,
    val createdAt: String? = null,
    val property: SmartLinkProperty? = null,
    @SerialName("_count") val count: SmartLinkEventCount? = null,
)

@Serializable
data class SmartLinkProperty(
    val title: String,
    val propertyType: String? = null,
)

@Serializable
data class SmartLinkEventCount(
    val events: Int = 0,
)

// ── Analytics & Dashboard ──────────────────────────────────────────────────────

@Serializable
data class DashboardStats(
    val range: String? = null,
    val totals: DashboardTotals? = null,
    val timeseries: List<TimeseriesPoint>? = null,
    val funnel: DashboardFunnel? = null,
    val topProperties: List<DashboardTopProperty>? = null,
)

@Serializable
data class DashboardTotals(
    val properties: Int = 0,
    val activeProperties: Int = 0,
    val smartLinks: Int = 0,
    val totalViews: Int = 0,
    val uniqueVisitors: Int = 0,
    val leads: Int = 0,
    val hotLeads: Int = 0,
)

@Serializable
data class TimeseriesPoint(
    val date: String,
    val views: Int = 0,
    val leads: Int = 0,
)

@Serializable
data class DashboardFunnel(
    val views: Int = 0,
    val contactClicks: Int = 0,
    val leadSubmissions: Int = 0,
    val conversionPct: Float = 0f,
)

@Serializable
data class DashboardTopProperty(
    val propertyId: String,
    val title: String,
    val views: Int = 0,
    val leads: Int = 0,
)

// ── Agency & Subscriptions ────────────────────────────────────────────────────

@Serializable
data class Agency(
    val id: String,
    val name: String,
    val customDomain: String? = null,
    val logoUrl: String? = null,
    val status: String? = null,
)

@Serializable
data class Subscription(
    val id: String,
    val planId: String,
    val paymentStatus: String? = null,
    val endDate: String? = null,
)
