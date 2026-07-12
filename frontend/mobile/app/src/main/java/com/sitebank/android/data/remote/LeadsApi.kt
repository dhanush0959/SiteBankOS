package com.sitebank.android.data.remote

import com.sitebank.android.domain.model.ApiResponse
import com.sitebank.android.domain.model.Lead
import com.sitebank.android.domain.model.PaginatedResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

interface LeadsApi {
    @GET("leads")
    suspend fun getLeads(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
        @Query("status") status: String? = null,
        @Query("propertyId") propertyId: String? = null
    ): Response<ApiResponse<PaginatedResponse<Lead>>>

    @GET("leads/{id}")
    suspend fun getLeadDetails(@retrofit2.http.Path("id") id: String): Response<ApiResponse<Lead>>
}
