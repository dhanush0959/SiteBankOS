package com.sitebank.android.ui.smartlinks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sitebank.android.data.remote.AdvancedApi
import com.sitebank.android.domain.model.SmartLink
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class SmartLinksState {
    object Loading : SmartLinksState()
    data class Success(val links: List<SmartLink>) : SmartLinksState()
    data class Error(val message: String) : SmartLinksState()
}

@HiltViewModel
class SmartLinksViewModel @Inject constructor(
    private val advancedApi: AdvancedApi
) : ViewModel() {

    private val _uiState = MutableStateFlow<SmartLinksState>(SmartLinksState.Loading)
    val uiState: StateFlow<SmartLinksState> = _uiState

    init {
        loadSmartLinks()
    }

    private fun loadSmartLinks() {
        viewModelScope.launch {
            _uiState.value = SmartLinksState.Loading
            try {
                val response = advancedApi.getSmartLinks()
                if (response.isSuccessful && response.body() != null) {
                    _uiState.value = SmartLinksState.Success(response.body()!!.data.items)
                } else {
                    _uiState.value = SmartLinksState.Error("Failed to fetch smart links")
                }
            } catch (e: Exception) {
                _uiState.value = SmartLinksState.Error(e.message ?: "Unknown error")
            }
        }
    }
}
