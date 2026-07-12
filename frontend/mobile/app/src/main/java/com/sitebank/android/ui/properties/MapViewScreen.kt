package com.sitebank.android.ui.properties

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapViewScreen(onCloseClick: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Property Map", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = onCloseClick) {
                        Icon(Icons.Filled.Close, contentDescription = "Close Map")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
            Text("Full Screen Map View goes here", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
