package com.sitebank.android.ui.leads

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sitebank.android.data.repository.LeadsRepository
import com.sitebank.android.domain.model.Lead
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class LeadsListState {
    object Loading : LeadsListState()
    data class Success(val leads: List<Lead>) : LeadsListState()
    data class Error(val message: String) : LeadsListState()
}

@HiltViewModel
class LeadsViewModel @Inject constructor(
    private val repository: LeadsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<LeadsListState>(LeadsListState.Loading)
    val uiState: StateFlow<LeadsListState> = _uiState.asStateFlow()

    init {
        fetchLeads()
    }

    fun fetchLeads(status: String? = null) {
        viewModelScope.launch {
            _uiState.value = LeadsListState.Loading
            val result = repository.getLeads(status = status)
            result.onSuccess { response ->
                _uiState.value = LeadsListState.Success(response.items)
            }.onFailure {
                _uiState.value = LeadsListState.Error(it.message ?: "Failed to load leads")
            }
        }
    }
}
