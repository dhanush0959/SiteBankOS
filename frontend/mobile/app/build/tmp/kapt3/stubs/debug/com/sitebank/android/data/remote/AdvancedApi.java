package com.sitebank.android.data.remote;

import com.sitebank.android.domain.model.ApiResponse;
import com.sitebank.android.domain.model.Agency;
import com.sitebank.android.domain.model.DashboardStats;
import com.sitebank.android.domain.model.PaginatedResponse;
import com.sitebank.android.domain.model.SmartLink;
import com.sitebank.android.domain.model.Subscription;
import retrofit2.Response;
import retrofit2.http.GET;
import retrofit2.http.Path;
import retrofit2.http.Query;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000@\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0003\bf\u0018\u00002\u00020\u0001J$\u0010\u0002\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00050\u00040\u00032\b\b\u0003\u0010\u0006\u001a\u00020\u0007H\u00a7@\u00a2\u0006\u0002\u0010\bJ\u001a\u0010\t\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\n0\u00040\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u000bJ\u001a\u0010\f\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\r0\u00040\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u000bJ4\u0010\u000e\u001a\u0014\u0012\u0010\u0012\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00100\u000f0\u00040\u00032\b\b\u0003\u0010\u0011\u001a\u00020\u00122\b\b\u0003\u0010\u0013\u001a\u00020\u0012H\u00a7@\u00a2\u0006\u0002\u0010\u0014\u00a8\u0006\u0015"}, d2 = {"Lcom/sitebank/android/data/remote/AdvancedApi;", "", "getDashboardStats", "Lretrofit2/Response;", "Lcom/sitebank/android/domain/model/ApiResponse;", "Lcom/sitebank/android/domain/model/DashboardStats;", "range", "", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getMyAgency", "Lcom/sitebank/android/domain/model/Agency;", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getMySubscription", "Lcom/sitebank/android/domain/model/Subscription;", "getSmartLinks", "Lcom/sitebank/android/domain/model/PaginatedResponse;", "Lcom/sitebank/android/domain/model/SmartLink;", "page", "", "pageSize", "(IILkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public abstract interface AdvancedApi {
    
    @retrofit2.http.GET(value = "analytics/dashboard")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getDashboardStats(@retrofit2.http.Query(value = "range")
    @org.jetbrains.annotations.NotNull()
    java.lang.String range, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.sitebank.android.domain.model.ApiResponse<com.sitebank.android.domain.model.DashboardStats>>> $completion);
    
    @retrofit2.http.GET(value = "agencies/me")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getMyAgency(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.sitebank.android.domain.model.ApiResponse<com.sitebank.android.domain.model.Agency>>> $completion);
    
    @retrofit2.http.GET(value = "subscriptions/me")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getMySubscription(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.sitebank.android.domain.model.ApiResponse<com.sitebank.android.domain.model.Subscription>>> $completion);
    
    @retrofit2.http.GET(value = "smart-links")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getSmartLinks(@retrofit2.http.Query(value = "page")
    int page, @retrofit2.http.Query(value = "pageSize")
    int pageSize, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.sitebank.android.domain.model.ApiResponse<com.sitebank.android.domain.model.PaginatedResponse<com.sitebank.android.domain.model.SmartLink>>>> $completion);
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 3, xi = 48)
    public static final class DefaultImpls {
    }
}