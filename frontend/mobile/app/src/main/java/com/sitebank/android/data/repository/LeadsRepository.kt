package com.sitebank.android.data.repository

import com.sitebank.android.data.remote.LeadsApi
import com.sitebank.android.domain.model.Lead
import com.sitebank.android.domain.model.PaginatedResponse
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LeadsRepository @Inject constructor(
    private val leadsApi: LeadsApi
) {
    suspend fun getLeads(page: Int = 1, status: String? = null): Result<PaginatedResponse<Lead>> {
        return try {
            val response = leadsApi.getLeads(page = page, status = status)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.data)
            } else {
                Result.failure(Exception("Failed to fetch leads: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
