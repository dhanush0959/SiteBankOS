package com.sitebank.android.ui.analytics

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sitebank.android.data.remote.AdvancedApi
import com.sitebank.android.domain.model.DashboardStats
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class DashboardState {
    object Loading : DashboardState()
    data class Success(val stats: DashboardStats) : DashboardState()
    data class Error(val message: String) : DashboardState()
}

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val advancedApi: AdvancedApi
) : ViewModel() {

    private val _uiState = MutableStateFlow<DashboardState>(DashboardState.Loading)
    val uiState: StateFlow<DashboardState> = _uiState

    init {
        loadStats("30d")
    }

    fun loadStats(range: String) {
        viewModelScope.launch {
            _uiState.value = DashboardState.Loading
            try {
                val response = advancedApi.getDashboardStats(range)
                if (response.isSuccessful && response.body() != null) {
                    _uiState.value = DashboardState.Success(response.body()!!.data)
                } else {
                    _uiState.value = DashboardState.Error("Failed to fetch dashboard stats")
                }
            } catch (e: Exception) {
                _uiState.value = DashboardState.Error(e.message ?: "Unknown error")
            }
        }
    }
}
