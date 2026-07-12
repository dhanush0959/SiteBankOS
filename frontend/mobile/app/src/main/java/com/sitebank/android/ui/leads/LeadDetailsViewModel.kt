package com.sitebank.android.ui.leads

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sitebank.android.data.remote.LeadsApi
import com.sitebank.android.domain.model.Lead
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class LeadDetailsState {
    object Loading : LeadDetailsState()
    data class Success(val lead: Lead) : LeadDetailsState()
    data class Error(val message: String) : LeadDetailsState()
}

@HiltViewModel
class LeadDetailsViewModel @Inject constructor(
    private val leadsApi: LeadsApi
) : ViewModel() {

    private val _uiState = MutableStateFlow<LeadDetailsState>(LeadDetailsState.Loading)
    val uiState: StateFlow<LeadDetailsState> = _uiState

    fun loadLead(id: String) {
        viewModelScope.launch {
            _uiState.value = LeadDetailsState.Loading
            try {
                val response = leadsApi.getLeadDetails(id)
                if (response.isSuccessful && response.body() != null) {
                    _uiState.value = LeadDetailsState.Success(response.body()!!.data)
                } else {
                    _uiState.value = LeadDetailsState.Error("Failed to load lead details")
                }
            } catch (e: Exception) {
                _uiState.value = LeadDetailsState.Error(e.message ?: "Unknown error")
            }
        }
    }
}
