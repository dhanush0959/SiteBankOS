package com.sitebank.android.data.repository

import com.sitebank.android.data.local.TokenManager
import com.sitebank.android.data.remote.AuthApi
import com.sitebank.android.domain.model.AuthSession
import com.sitebank.android.domain.model.LoginRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authApi: AuthApi,
    private val tokenManager: TokenManager
) {
    suspend fun login(request: LoginRequest): Result<AuthSession> {
        return try {
            val response = authApi.login(request)
            if (response.isSuccessful && response.body() != null) {
                val session = response.body()!!.data
                tokenManager.saveToken(session.accessToken)
                Result.success(session)
            } else {
                Result.failure(Exception("Login failed: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        try {
            authApi.logout()
        } catch (e: Exception) {
            // Ignore network errors on logout
        } finally {
            tokenManager.clearToken()
        }
    }
}
