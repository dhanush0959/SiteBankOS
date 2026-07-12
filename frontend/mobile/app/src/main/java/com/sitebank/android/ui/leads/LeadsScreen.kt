package com.sitebank.android.ui.leads

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sitebank.android.domain.model.Lead
import com.sitebank.android.ui.components.BadgeVariant
import com.sitebank.android.ui.components.SiteBankBadge
import com.sitebank.android.ui.components.SiteBankTextField
import com.sitebank.android.ui.components.SiteBankTopAppBar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeadsScreen(
    viewModel: LeadsViewModel = hiltViewModel(),
    onLeadClick: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedStatus by remember { mutableStateOf("") }

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
                is LeadsListState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is LeadsListState.Error -> {
                    Text(
                        text = state.message,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                is LeadsListState.Success -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(20.dp)
                    ) {
                        // Header
                        item {
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Filled.People, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Leads", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    "${state.leads.size} total · 0 new · 0 active",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        // Status filter chips
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                StatusCard(
                                    modifier = Modifier.weight(1f),
                                    label = "All",
                                    value = state.leads.size.toString(),
                                    active = selectedStatus == "",
                                    onClick = { selectedStatus = "" }
                                )
                                StatusCard(
                                    modifier = Modifier.weight(1f),
                                    label = "New",
                                    value = "0",
                                    active = selectedStatus == "NEW",
                                    onClick = { selectedStatus = "NEW" }
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                StatusCard(
                                    modifier = Modifier.weight(1f),
                                    label = "Contacted",
                                    value = "0",
                                    active = selectedStatus == "CONTACTED",
                                    onClick = { selectedStatus = "CONTACTED" }
                                )
                                StatusCard(
                                    modifier = Modifier.weight(1f),
                                    label = "Site Visit",
                                    value = "0",
                                    active = selectedStatus == "SITE_VISIT_SCHEDULED",
                                    onClick = { selectedStatus = "SITE_VISIT_SCHEDULED" }
                                )
                            }
                        }

                        // Search
                        item {
                            SiteBankTextField(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                                placeholder = "Search by name or phone...",
                                leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) }
                            )
                        }

                        // Leads listing
                        if (state.leads.isEmpty()) {
                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(32.dp).fillMaxWidth(),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Icon(Icons.Filled.People, contentDescription = null, modifier = Modifier.size(48.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f))
                                        Spacer(modifier = Modifier.height(16.dp))
                                        Text("No leads yet.", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
                                    }
                                }
                            }
                        } else {
                            items(state.leads) { lead ->
                                LeadCardExact(lead = lead, onLeadClick = onLeadClick)
                                Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StatusCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    active: Boolean,
    onClick: () -> Unit
) {
    val borderColor = if (active) MaterialTheme.colorScheme.primary.copy(alpha = 0.3f) else Color.Transparent
    val bgColor = if (active) MaterialTheme.colorScheme.primary.copy(alpha = 0.05f) else MaterialTheme.colorScheme.surface
    
    Card(
        modifier = modifier
            .height(72.dp)
            .clickable(onClick = onClick)
            .then(if (active) Modifier.border(1.dp, borderColor, RoundedCornerShape(12.dp)) else Modifier),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor),
        elevation = CardDefaults.cardElevation(defaultElevation = if (active) 4.dp else 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp).fillMaxSize(),
            verticalArrangement = Arrangement.Center
        ) {
            Text(label.uppercase(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.SemiBold, fontSize = 10.sp)
            Spacer(modifier = Modifier.height(2.dp))
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun LeadCardExact(lead: Lead, onLeadClick: (String) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onLeadClick(lead.id) }
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = lead.name ?: "(unnamed)",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold
            )
            if (lead.phone != null) {
                Spacer(modifier = Modifier.height(2.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Phone, contentDescription = null, modifier = Modifier.size(10.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = lead.phone,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 11.sp
                    )
                }
            }
        }
        
        Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.Start) {
            val statusVariant = when (lead.status) {
                "NEW" -> BadgeVariant.Success
                "CONTACTED" -> BadgeVariant.Warning
                "SITE_VISIT_SCHEDULED" -> BadgeVariant.Hot
                else -> BadgeVariant.Default
            }
            SiteBankBadge(
                text = lead.status.replace("_", " "),
                variant = statusVariant
            )
        }
    }
}
