package com.sitebank.android.ui.properties

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.sitebank.android.domain.model.Property
import com.sitebank.android.ui.components.SiteBankBadge
import com.sitebank.android.ui.components.BadgeVariant
import com.sitebank.android.ui.components.SiteBankButton
import com.sitebank.android.ui.components.ButtonVariant
import com.sitebank.android.ui.components.SiteBankTextField
import com.sitebank.android.ui.components.SiteBankTopAppBar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PropertyListScreen(
    viewModel: PropertyViewModel = hiltViewModel(),
    onAddPropertyClick: () -> Unit,
    onPropertyClick: (String) -> Unit,
    onMapViewClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }

    Scaffold(
        topBar = { SiteBankTopAppBar() },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (val state = uiState) {
                is PropertyListState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is PropertyListState.Error -> {
                    Text(
                        text = state.message,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                is PropertyListState.Success -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(20.dp)
                    ) {
                        // Greeting Header
                        item {
                            Column {
                                Text("Good Morning", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text("Agent", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                            }
                        }

                        // Quick Action Cards
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                QuickActionCard(
                                    modifier = Modifier.weight(1f),
                                    icon = { Icon(Icons.Filled.Add, contentDescription = null, tint = Color.White) },
                                    label = "Add Property",
                                    bgColor = Color(0xFF2563EB), // blue-600
                                    textColor = Color.White,
                                    onClick = onAddPropertyClick
                                )
                                QuickActionCard(
                                    modifier = Modifier.weight(1f),
                                    icon = { Icon(Icons.Filled.List, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface) },
                                    label = "Properties",
                                    bgColor = MaterialTheme.colorScheme.surfaceVariant,
                                    textColor = MaterialTheme.colorScheme.onSurface,
                                    onClick = {}
                                )
                                QuickActionCard(
                                    modifier = Modifier.weight(1f),
                                    icon = { Icon(Icons.Filled.Map, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface) },
                                    label = "Map View",
                                    bgColor = MaterialTheme.colorScheme.surfaceVariant,
                                    textColor = MaterialTheme.colorScheme.onSurface,
                                    onClick = onMapViewClick
                                )
                            }
                        }

                        // Search & Filters
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                SiteBankTextField(
                                    value = searchQuery,
                                    onValueChange = { searchQuery = it },
                                    modifier = Modifier.weight(1f),
                                    placeholder = "Search by title...",
                                    leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) }
                                )
                                SiteBankButton(
                                    onClick = { /* TODO: Filters */ },
                                    variant = ButtonVariant.Outline,
                                    modifier = Modifier.height(56.dp)
                                ) {
                                    Icon(Icons.Filled.FilterList, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Filters")
                                }
                            }
                        }

                        // Subtitle
                        item {
                            Text(
                                "${state.properties.size} properties in your portfolio",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        // Properties List
                        items(state.properties) { property ->
                            PropertyCardExact(property = property, onPropertyClick = onPropertyClick)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun QuickActionCard(
    modifier: Modifier = Modifier,
    icon: @Composable () -> Unit,
    label: String,
    bgColor: Color,
    textColor: Color,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .height(100.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            icon()
            Spacer(modifier = Modifier.height(8.dp))
            Text(label, color = textColor, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun PropertyCardExact(property: Property, onPropertyClick: (String) -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onPropertyClick(property.id) },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column {
            // Image with Overlays
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(4f / 3f)
                    .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
            ) {
                val coverImage = property.media?.find { it.isCover } ?: property.media?.firstOrNull()
                if (coverImage != null) {
                    AsyncImage(
                        model = coverImage.cdnUrl ?: coverImage.fileUrl,
                        contentDescription = property.title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(MaterialTheme.colorScheme.surfaceVariant),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.Business, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f), modifier = Modifier.size(48.dp))
                    }
                }
                
                // Badges overlay
                Row(
                    modifier = Modifier
                        .padding(8.dp)
                        .align(Alignment.TopStart),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    SiteBankBadge(
                        text = property.status ?: "ACTIVE",
                        variant = BadgeVariant.Default
                    )
                }
            }

            // Content
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = property.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.LocationOn, contentDescription = null, tint = Color(0xFF3B82F6), modifier = Modifier.size(12.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${property.location?.city ?: "—"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val priceText = if (property.priceOnRequest) "On Request" else "₹${property.price ?: "0"}"
                    // Gradient text
                    val gradient = Brush.linearGradient(colors = listOf(Color(0xFF2563EB), Color(0xFF9333EA)))
                    Text(
                        text = priceText,
                        style = MaterialTheme.typography.titleMedium.copy(
                            brush = gradient
                        ),
                        fontWeight = FontWeight.Bold
                    )
                    
                    Text(
                        text = property.propertyType ?: "PROPERTY",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier
                            .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(percent = 50))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }

                Divider(modifier = Modifier.padding(vertical = 12.dp), color = MaterialTheme.colorScheme.outlineVariant)

                // Footer
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Start,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Visibility, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color(0xFF3B82F6).copy(alpha = 0.6f))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("0 links", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    
                    Spacer(modifier = Modifier.width(16.dp))
                    
                    Icon(Icons.Filled.People, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color(0xFF10B981).copy(alpha = 0.6f))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("0 leads", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

                    Spacer(modifier = Modifier.weight(1f))

                    Icon(
                        Icons.Filled.Share, 
                        contentDescription = "Share", 
                        modifier = Modifier.size(16.dp), 
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
