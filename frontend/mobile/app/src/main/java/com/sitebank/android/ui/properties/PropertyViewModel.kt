package com.sitebank.android.ui.properties

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sitebank.android.data.repository.PropertyRepository
import com.sitebank.android.domain.model.Property
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class PropertyListState {
    object Loading : PropertyListState()
    data class Success(val properties: List<Property>) : PropertyListState()
    data class Error(val message: String) : PropertyListState()
}

@HiltViewModel
class PropertyViewModel @Inject constructor(
    private val repository: PropertyRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<PropertyListState>(PropertyListState.Loading)
    val uiState: StateFlow<PropertyListState> = _uiState.asStateFlow()

    init {
        fetchProperties()
    }

    fun fetchProperties() {
        viewModelScope.launch {
            _uiState.value = PropertyListState.Loading
            val result = repository.getProperties()
            result.onSuccess { response ->
                _uiState.value = PropertyListState.Success(response.items)
            }.onFailure {
                _uiState.value = PropertyListState.Error(it.message ?: "Failed to load properties")
            }
        }
    }
}
