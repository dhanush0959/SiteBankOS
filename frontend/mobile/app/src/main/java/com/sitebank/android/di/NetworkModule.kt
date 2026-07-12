package com.sitebank.android.di

import com.sitebank.android.BuildConfig
import com.sitebank.android.data.remote.AuthApi
import com.sitebank.android.data.remote.AuthInterceptor
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(authInterceptor: AuthInterceptor): OkHttpClient {
        val builder = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)

        if (BuildConfig.DEBUG) {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }
            builder.addInterceptor(logging)
        }

        return builder.build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient, json: Json): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    @Provides
    @Singleton
    fun provideAuthApi(retrofit: Retrofit): AuthApi {
        return retrofit.create(AuthApi::class.java)
    }

    @Provides
    @Singleton
    fun providePropertyApi(retrofit: Retrofit): com.sitebank.android.data.remote.PropertyApi {
        return retrofit.create(com.sitebank.android.data.remote.PropertyApi::class.java)
    }

    @Provides
    @Singleton
    fun provideLeadsApi(retrofit: Retrofit): com.sitebank.android.data.remote.LeadsApi {
        return retrofit.create(com.sitebank.android.data.remote.LeadsApi::class.java)
    }

    @Provides
    @Singleton
    fun provideAdvancedApi(retrofit: Retrofit): com.sitebank.android.data.remote.AdvancedApi {
        return retrofit.create(com.sitebank.android.data.remote.AdvancedApi::class.java)
    }
}
