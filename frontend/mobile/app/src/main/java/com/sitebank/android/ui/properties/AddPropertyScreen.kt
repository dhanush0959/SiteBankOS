package com.sitebank.android.ui.properties

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddPropertyScreen(
    viewModel: AddPropertyViewModel = hiltViewModel(),
    onBackClick: () -> Unit,
    onSuccess: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val coroutineScope = rememberCoroutineScope()

    val title by viewModel.title.collectAsState()
    val propertyType by viewModel.propertyType.collectAsState()
    val transactionType by viewModel.transactionType.collectAsState()
    val price by viewModel.price.collectAsState()
    val city by viewModel.city.collectAsState()
    val address by viewModel.address.collectAsState()
    val bedrooms by viewModel.bedrooms.collectAsState()
    val bathrooms by viewModel.bathrooms.collectAsState()
    val areaSqft by viewModel.areaSqft.collectAsState()

    LaunchedEffect(uiState) {
        when (uiState) {
            is AddPropertyState.Success -> onSuccess()
            is AddPropertyState.Error -> {
                snackbarHostState.showSnackbar((uiState as AddPropertyState.Error).message)
                viewModel.resetState()
            }
            else -> {}
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Add Property", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Basic Information", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            
            OutlinedTextField(
                value = title,
                onValueChange = { viewModel.title.value = it },
                label = { Text("Property Title *") },
                modifier = Modifier.fillMaxWidth()
            )

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                // Property Type (Simplified as text field for now, ideally dropdown)
                OutlinedTextField(
                    value = propertyType,
                    onValueChange = { viewModel.propertyType.value = it },
                    label = { Text("Property Type") },
                    modifier = Modifier.weight(1f)
                )
                // Transaction Type
                OutlinedTextField(
                    value = transactionType,
                    onValueChange = { viewModel.transactionType.value = it },
                    label = { Text("Transaction Type") },
                    modifier = Modifier.weight(1f)
                )
            }

            OutlinedTextField(
                value = price,
                onValueChange = { viewModel.price.value = it },
                label = { Text("Price (₹)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth()
            )

            Divider()
            Text("Location", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)

            OutlinedTextField(
                value = address,
                onValueChange = { viewModel.address.value = it },
                label = { Text("Address") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = city,
                onValueChange = { viewModel.city.value = it },
                label = { Text("City *") },
                modifier = Modifier.fillMaxWidth()
            )

            Divider()
            Text("Specifications", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = bedrooms,
                    onValueChange = { viewModel.bedrooms.value = it },
                    label = { Text("Bedrooms") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = bathrooms,
                    onValueChange = { viewModel.bathrooms.value = it },
                    label = { Text("Bathrooms") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f)
                )
            }

            OutlinedTextField(
                value = areaSqft,
                onValueChange = { viewModel.areaSqft.value = it },
                label = { Text("Area (sq.ft)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = { viewModel.submit() },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                enabled = uiState !is AddPropertyState.Loading
            ) {
                if (uiState is AddPropertyState.Loading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Text("Save Property")
                }
            }
            
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
