package com.sitebank.android.data.remote;

import com.sitebank.android.domain.model.ApiResponse;
import com.sitebank.android.domain.model.Lead;
import com.sitebank.android.domain.model.PaginatedResponse;
import retrofit2.Response;
import retrofit2.http.GET;
import retrofit2.http.Query;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000.\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0005\bf\u0018\u00002\u00020\u0001J$\u0010\u0002\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00050\u00040\u00032\b\b\u0001\u0010\u0006\u001a\u00020\u0007H\u00a7@\u00a2\u0006\u0002\u0010\bJL\u0010\t\u001a\u0014\u0012\u0010\u0012\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00050\n0\u00040\u00032\b\b\u0003\u0010\u000b\u001a\u00020\f2\b\b\u0003\u0010\r\u001a\u00020\f2\n\b\u0003\u0010\u000e\u001a\u0004\u0018\u00010\u00072\n\b\u0003\u0010\u000f\u001a\u0004\u0018\u00010\u0007H\u00a7@\u00a2\u0006\u0002\u0010\u0010\u00a8\u0006\u0011"}, d2 = {"Lcom/sitebank/android/data/remote/LeadsApi;", "", "getLeadDetails", "Lretrofit2/Response;", "Lcom/sitebank/android/domain/model/ApiResponse;", "Lcom/sitebank/android/domain/model/Lead;", "id", "", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getLeads", "Lcom/sitebank/android/domain/model/PaginatedResponse;", "page", "", "pageSize", "status", "propertyId", "(IILjava/lang/String;Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public abstract interface LeadsApi {
    
    @retrofit2.http.GET(value = "leads")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getLeads(@retrofit2.http.Query(value = "page")
    int page, @retrofit2.http.Query(value = "pageSize")
    int pageSize, @retrofit2.http.Query(value = "status")
    @org.jetbrains.annotations.Nullable()
    java.lang.String status, @retrofit2.http.Query(value = "propertyId")
    @org.jetbrains.annotations.Nullable()
    java.lang.String propertyId, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.sitebank.android.domain.model.ApiResponse<com.sitebank.android.domain.model.PaginatedResponse<com.sitebank.android.domain.model.Lead>>>> $completion);
    
    @retrofit2.http.GET(value = "leads/{id}")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getLeadDetails(@retrofit2.http.Path(value = "id")
    @org.jetbrains.annotations.NotNull()
    java.lang.String id, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.sitebank.android.domain.model.ApiResponse<com.sitebank.android.domain.model.Lead>>> $completion);
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 3, xi = 48)
    public static final class DefaultImpls {
    }
}