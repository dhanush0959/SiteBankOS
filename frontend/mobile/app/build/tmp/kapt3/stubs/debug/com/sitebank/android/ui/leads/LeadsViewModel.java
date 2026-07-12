package com.sitebank.android.ui.leads;

import androidx.lifecycle.ViewModel;
import com.sitebank.android.data.repository.LeadsRepository;
import com.sitebank.android.domain.model.Lead;
import dagger.hilt.android.lifecycle.HiltViewModel;
import kotlinx.coroutines.flow.StateFlow;
import javax.inject.Inject;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\b\u0007\u0018\u00002\u00020\u0001B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u0012\u0010\f\u001a\u00020\r2\n\b\u0002\u0010\u000e\u001a\u0004\u0018\u00010\u000fR\u0014\u0010\u0005\u001a\b\u0012\u0004\u0012\u00020\u00070\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0017\u0010\b\u001a\b\u0012\u0004\u0012\u00020\u00070\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\n\u0010\u000b\u00a8\u0006\u0010"}, d2 = {"Lcom/sitebank/android/ui/leads/LeadsViewModel;", "Landroidx/lifecycle/ViewModel;", "repository", "Lcom/sitebank/android/data/repository/LeadsRepository;", "(Lcom/sitebank/android/data/repository/LeadsRepository;)V", "_uiState", "Lkotlinx/coroutines/flow/MutableStateFlow;", "Lcom/sitebank/android/ui/leads/LeadsListState;", "uiState", "Lkotlinx/coroutines/flow/StateFlow;", "getUiState", "()Lkotlinx/coroutines/flow/StateFlow;", "fetchLeads", "", "status", "", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class LeadsViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.sitebank.android.data.repository.LeadsRepository repository = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.sitebank.android.ui.leads.LeadsListState> _uiState = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.sitebank.android.ui.leads.LeadsListState> uiState = null;
    
    @javax.inject.Inject()
    public LeadsViewModel(@org.jetbrains.annotations.NotNull()
    com.sitebank.android.data.repository.LeadsRepository repository) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.sitebank.android.ui.leads.LeadsListState> getUiState() {
        return null;
    }
    
    public final void fetchLeads(@org.jetbrains.annotations.Nullable()
    java.lang.String status) {
    }
}