package com.sitebank.android.data.remote

import com.sitebank.android.domain.model.ApiResponse
import com.sitebank.android.domain.model.PaginatedResponse
import com.sitebank.android.domain.model.Property
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface PropertyApi {
    @GET("properties")
    suspend fun getProperties(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
        @Query("q") query: String? = null,
        @Query("status") status: String? = null,
    ): Response<ApiResponse<PaginatedResponse<Property>>>

    @GET("properties/{id}")
    suspend fun getPropertyDetails(@Path("id") id: String): Response<ApiResponse<Property>>

    @retrofit2.http.POST("properties")
    suspend fun createProperty(@retrofit2.http.Body request: com.sitebank.android.domain.model.PropertyCreateRequest): Response<ApiResponse<Property>>
}
