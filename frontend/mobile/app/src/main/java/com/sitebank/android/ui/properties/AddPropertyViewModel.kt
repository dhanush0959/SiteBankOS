package com.sitebank.android.ui.properties

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sitebank.android.data.remote.PropertyApi
import com.sitebank.android.domain.model.PropertyCreateRequest
import com.sitebank.android.domain.model.PropertyLocation
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class AddPropertyState {
    object Idle : AddPropertyState()
    object Loading : AddPropertyState()
    data class Success(val propertyId: String) : AddPropertyState()
    data class Error(val message: String) : AddPropertyState()
}

@HiltViewModel
class AddPropertyViewModel @Inject constructor(
    private val propertyApi: PropertyApi
) : ViewModel() {

    private val _uiState = MutableStateFlow<AddPropertyState>(AddPropertyState.Idle)
    val uiState: StateFlow<AddPropertyState> = _uiState

    // Form fields
    var title = MutableStateFlow("")
    var propertyType = MutableStateFlow("APARTMENT")
    var transactionType = MutableStateFlow("SALE")
    var price = MutableStateFlow("")
    var city = MutableStateFlow("")
    var address = MutableStateFlow("")
    var bedrooms = MutableStateFlow("")
    var bathrooms = MutableStateFlow("")
    var areaSqft = MutableStateFlow("")

    fun submit() {
        if (title.value.isBlank() || city.value.isBlank()) {
            _uiState.value = AddPropertyState.Error("Title and City are required")
            return
        }

        viewModelScope.launch {
            _uiState.value = AddPropertyState.Loading
            try {
                val specs = mutableMapOf<String, String>()
                if (bedrooms.value.isNotBlank()) specs["bedrooms"] = bedrooms.value
                if (bathrooms.value.isNotBlank()) specs["bathrooms"] = bathrooms.value
                if (areaSqft.value.isNotBlank()) specs["areaSqft"] = areaSqft.value

                val request = PropertyCreateRequest(
                    title = title.value,
                    propertyType = propertyType.value,
                    transactionType = transactionType.value,
                    price = price.value.ifBlank { null },
                    location = PropertyLocation(address = address.value, city = city.value),
                    specs = specs
                )

                val response = propertyApi.createProperty(request)
                if (response.isSuccessful && response.body() != null) {
                    _uiState.value = AddPropertyState.Success(response.body()!!.data.id)
                } else {
                    _uiState.value = AddPropertyState.Error("Failed to create property")
                }
            } catch (e: Exception) {
                _uiState.value = AddPropertyState.Error(e.message ?: "Unknown error occurred")
            }
        }
    }

    fun resetState() {
        _uiState.value = AddPropertyState.Idle
    }
}
