package com.sitebank.android.ui.properties

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sitebank.android.data.remote.PropertyApi
import com.sitebank.android.domain.model.Property
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class PropertyDetailsState {
    object Loading : PropertyDetailsState()
    data class Success(val property: Property) : PropertyDetailsState()
    data class Error(val message: String) : PropertyDetailsState()
}

@HiltViewModel
class PropertyDetailsViewModel @Inject constructor(
    private val propertyApi: PropertyApi
) : ViewModel() {

    private val _uiState = MutableStateFlow<PropertyDetailsState>(PropertyDetailsState.Loading)
    val uiState: StateFlow<PropertyDetailsState> = _uiState

    fun loadProperty(id: String) {
        viewModelScope.launch {
            _uiState.value = PropertyDetailsState.Loading
            try {
                val response = propertyApi.getPropertyDetails(id)
                if (response.isSuccessful && response.body() != null) {
                    _uiState.value = PropertyDetailsState.Success(response.body()!!.data)
                } else {
                    _uiState.value = PropertyDetailsState.Error("Failed to load property details")
                }
            } catch (e: Exception) {
                _uiState.value = PropertyDetailsState.Error(e.message ?: "Unknown error")
            }
        }
    }
}
