package com.sitebank.android.data.repository;

import com.sitebank.android.data.remote.PropertyApi;
import com.sitebank.android.domain.model.PaginatedResponse;
import com.sitebank.android.domain.model.Property;
import javax.inject.Inject;
import javax.inject.Singleton;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000.\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0007\b\u0007\u0018\u00002\u00020\u0001B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J8\u0010\u0005\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\b0\u00070\u00062\b\b\u0002\u0010\t\u001a\u00020\n2\n\b\u0002\u0010\u000b\u001a\u0004\u0018\u00010\fH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\r\u0010\u000eJ$\u0010\u000f\u001a\b\u0012\u0004\u0012\u00020\b0\u00062\u0006\u0010\u0010\u001a\u00020\fH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\u0011\u0010\u0012R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u0082\u0002\u000b\n\u0002\b!\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006\u0013"}, d2 = {"Lcom/sitebank/android/data/repository/PropertyRepository;", "", "propertyApi", "Lcom/sitebank/android/data/remote/PropertyApi;", "(Lcom/sitebank/android/data/remote/PropertyApi;)V", "getProperties", "Lkotlin/Result;", "Lcom/sitebank/android/domain/model/PaginatedResponse;", "Lcom/sitebank/android/domain/model/Property;", "page", "", "status", "", "getProperties-0E7RQCE", "(ILjava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getPropertyDetails", "id", "getPropertyDetails-gIAlu-s", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public final class PropertyRepository {
    @org.jetbrains.annotations.NotNull()
    private final com.sitebank.android.data.remote.PropertyApi propertyApi = null;
    
    @javax.inject.Inject()
    public PropertyRepository(@org.jetbrains.annotations.NotNull()
    com.sitebank.android.data.remote.PropertyApi propertyApi) {
        super();
    }
}