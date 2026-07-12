package com.sitebank.android.data.remote

import com.sitebank.android.domain.model.AuthSession
import com.sitebank.android.domain.model.LoginRequest
import com.sitebank.android.domain.model.RegisterRequest
import com.sitebank.android.domain.model.User
import com.sitebank.android.domain.model.ApiResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthApi {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<AuthSession>>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<ApiResponse<AuthSession>>

    @POST("auth/logout")
    suspend fun logout(): Response<Unit>

    @GET("auth/me")
    suspend fun getMe(): Response<ApiResponse<User>>
}
