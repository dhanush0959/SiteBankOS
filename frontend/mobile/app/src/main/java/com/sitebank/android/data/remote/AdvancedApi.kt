package com.sitebank.android.data.remote

import com.sitebank.android.domain.model.ApiResponse
import com.sitebank.android.domain.model.Agency
import com.sitebank.android.domain.model.DashboardStats
import com.sitebank.android.domain.model.PaginatedResponse
import com.sitebank.android.domain.model.SmartLink
import com.sitebank.android.domain.model.Subscription
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface AdvancedApi {
    // Analytics
    @GET("analytics/dashboard")
    suspend fun getDashboardStats(@Query("range") range: String = "30d"): Response<ApiResponse<DashboardStats>>

    // Agency
    @GET("agencies/me")
    suspend fun getMyAgency(): Response<ApiResponse<Agency>>

    // Subscriptions
    @GET("subscriptions/me")
    suspend fun getMySubscription(): Response<ApiResponse<Subscription>>

    // Smart Links
    @GET("smart-links")
    suspend fun getSmartLinks(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20
    ): Response<ApiResponse<PaginatedResponse<SmartLink>>>
}
