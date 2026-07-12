package com.sitebank.android.data.remote;

import com.sitebank.android.domain.model.ApiResponse;
import com.sitebank.android.domain.model.PaginatedResponse;
import com.sitebank.android.domain.model.Property;
import retrofit2.Response;
import retrofit2.http.GET;
import retrofit2.http.Path;
import retrofit2.http.Query;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00006\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0006\bf\u0018\u00002\u00020\u0001J$\u0010\u0002\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00050\u00040\u00032\b\b\u0001\u0010\u0006\u001a\u00020\u0007H\u00a7@\u00a2\u0006\u0002\u0010\bJL\u0010\t\u001a\u0014\u0012\u0010\u0012\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00050\n0\u00040\u00032\b\b\u0003\u0010\u000b\u001a\u00020\f2\b\b\u0003\u0010\r\u001a\u00020\f2\n\b\u0003\u0010\u000e\u001a\u0004\u0018\u00010\u000f2\n\b\u0003\u0010\u0010\u001a\u0004\u0018\u00010\u000fH\u00a7@\u00a2\u0006\u0002\u0010\u0011J$\u0010\u0012\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00050\u00040\u00032\b\b\u0001\u0010\u0013\u001a\u00020\u000fH\u00a7@\u00a2\u0006\u0002\u0010\u0014\u00a8\u0006\u0015"}, d2 = {"Lcom/sitebank/android/data/remote/PropertyApi;", "", "createProperty", "Lretrofit2/Response;", "Lcom/sitebank/android/domain/model/ApiResponse;", "Lcom/sitebank/android/domain/model/Property;", "request", "Lcom/sitebank/android/domain/model/PropertyCreateRequest;", "(Lcom/sitebank/android/domain/model/PropertyCreateRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getProperties", "Lcom/sitebank/android/domain/model/PaginatedResponse;", "page", "", "pageSize", "query", "", "status", "(IILjava/lang/String;Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getPropertyDetails", "id", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public abstract interface PropertyApi {
    
    @retrofit2.http.GET(value = "properties")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getProperties(@retrofit2.http.Query(value = "page")
    int page, @retrofit2.http.Query(value = "pageSize")
    int pageSize, @retrofit2.http.Query(value = "q")
    @org.jetbrains.annotations.Nullable()
    java.lang.String query, @retrofit2.http.Query(value = "status")
    @org.jetbrains.annotations.Nullable()
    java.lang.String status, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.sitebank.android.domain.model.ApiResponse<com.sitebank.android.domain.model.PaginatedResponse<com.sitebank.android.domain.model.Property>>>> $completion);
    
    @retrofit2.http.GET(value = "properties/{id}")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getPropertyDetails(@retrofit2.http.Path(value = "id")
    @org.jetbrains.annotations.NotNull()
    java.lang.String id, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.sitebank.android.domain.model.ApiResponse<com.sitebank.android.domain.model.Property>>> $completion);
    
    @retrofit2.http.POST(value = "properties")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object createProperty(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.sitebank.android.domain.model.PropertyCreateRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.sitebank.android.domain.model.ApiResponse<com.sitebank.android.domain.model.Property>>> $completion);
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 3, xi = 48)
    public static final class DefaultImpls {
    }
}