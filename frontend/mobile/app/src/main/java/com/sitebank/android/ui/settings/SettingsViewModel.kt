package com.sitebank.android.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sitebank.android.data.remote.AdvancedApi
import com.sitebank.android.domain.model.Subscription
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class SettingsState {
    object Loading : SettingsState()
    data class Success(val subscription: Subscription) : SettingsState()
    data class Error(val message: String) : SettingsState()
}

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val advancedApi: AdvancedApi
) : ViewModel() {

    private val _uiState = MutableStateFlow<SettingsState>(SettingsState.Loading)
    val uiState: StateFlow<SettingsState> = _uiState

    init {
        loadSubscription()
    }

    private fun loadSubscription() {
        viewModelScope.launch {
            _uiState.value = SettingsState.Loading
            try {
                val response = advancedApi.getMySubscription()
                if (response.isSuccessful && response.body() != null) {
                    _uiState.value = SettingsState.Success(response.body()!!.data)
                } else {
                    _uiState.value = SettingsState.Error("Failed to load subscription")
                }
            } catch (e: Exception) {
                _uiState.value = SettingsState.Error(e.message ?: "Unknown error")
            }
        }
    }
}
