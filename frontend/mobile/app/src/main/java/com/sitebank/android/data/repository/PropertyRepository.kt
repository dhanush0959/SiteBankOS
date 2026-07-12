package com.sitebank.android.data.repository

import com.sitebank.android.data.remote.PropertyApi
import com.sitebank.android.domain.model.PaginatedResponse
import com.sitebank.android.domain.model.Property
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PropertyRepository @Inject constructor(
    private val propertyApi: PropertyApi
) {
    suspend fun getProperties(page: Int = 1, status: String? = null): Result<PaginatedResponse<Property>> {
        return try {
            val response = propertyApi.getProperties(page = page, status = status)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.data)
            } else {
                Result.failure(Exception("Failed to fetch properties: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPropertyDetails(id: String): Result<Property> {
        return try {
            val response = propertyApi.getPropertyDetails(id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.data)
            } else {
                Result.failure(Exception("Failed to fetch property details: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
