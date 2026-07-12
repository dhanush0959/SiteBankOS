package com.sitebank.android.data.repository;

import com.sitebank.android.data.local.TokenManager;
import com.sitebank.android.data.remote.AuthApi;
import com.sitebank.android.domain.model.AuthSession;
import com.sitebank.android.domain.model.LoginRequest;
import javax.inject.Inject;
import javax.inject.Singleton;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00002\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0002\n\u0002\b\u0002\b\u0007\u0018\u00002\u00020\u0001B\u0017\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J$\u0010\u0007\u001a\b\u0012\u0004\u0012\u00020\t0\b2\u0006\u0010\n\u001a\u00020\u000bH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\f\u0010\rJ\u000e\u0010\u000e\u001a\u00020\u000fH\u0086@\u00a2\u0006\u0002\u0010\u0010R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u0082\u0002\u000b\n\u0002\b!\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006\u0011"}, d2 = {"Lcom/sitebank/android/data/repository/AuthRepository;", "", "authApi", "Lcom/sitebank/android/data/remote/AuthApi;", "tokenManager", "Lcom/sitebank/android/data/local/TokenManager;", "(Lcom/sitebank/android/data/remote/AuthApi;Lcom/sitebank/android/data/local/TokenManager;)V", "login", "Lkotlin/Result;", "Lcom/sitebank/android/domain/model/AuthSession;", "request", "Lcom/sitebank/android/domain/model/LoginRequest;", "login-gIAlu-s", "(Lcom/sitebank/android/domain/model/LoginRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "logout", "", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public final class AuthRepository {
    @org.jetbrains.annotations.NotNull()
    private final com.sitebank.android.data.remote.AuthApi authApi = null;
    @org.jetbrains.annotations.NotNull()
    private final com.sitebank.android.data.local.TokenManager tokenManager = null;
    
    @javax.inject.Inject()
    public AuthRepository(@org.jetbrains.annotations.NotNull()
    com.sitebank.android.data.remote.AuthApi authApi, @org.jetbrains.annotations.NotNull()
    com.sitebank.android.data.local.TokenManager tokenManager) {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object logout(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
}