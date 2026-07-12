package com.sitebank.android.data.repository;

import com.sitebank.android.data.remote.LeadsApi;
import com.sitebank.android.domain.model.Lead;
import com.sitebank.android.domain.model.PaginatedResponse;
import javax.inject.Inject;
import javax.inject.Singleton;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000.\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0003\b\u0007\u0018\u00002\u00020\u0001B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J8\u0010\u0005\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\b0\u00070\u00062\b\b\u0002\u0010\t\u001a\u00020\n2\n\b\u0002\u0010\u000b\u001a\u0004\u0018\u00010\fH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\r\u0010\u000eR\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u0082\u0002\u000b\n\u0002\b!\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006\u000f"}, d2 = {"Lcom/sitebank/android/data/repository/LeadsRepository;", "", "leadsApi", "Lcom/sitebank/android/data/remote/LeadsApi;", "(Lcom/sitebank/android/data/remote/LeadsApi;)V", "getLeads", "Lkotlin/Result;", "Lcom/sitebank/android/domain/model/PaginatedResponse;", "Lcom/sitebank/android/domain/model/Lead;", "page", "", "status", "", "getLeads-0E7RQCE", "(ILjava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public final class LeadsRepository {
    @org.jetbrains.annotations.NotNull()
    private final com.sitebank.android.data.remote.LeadsApi leadsApi = null;
    
    @javax.inject.Inject()
    public LeadsRepository(@org.jetbrains.annotations.NotNull()
    com.sitebank.android.data.remote.LeadsApi leadsApi) {
        super();
    }
}