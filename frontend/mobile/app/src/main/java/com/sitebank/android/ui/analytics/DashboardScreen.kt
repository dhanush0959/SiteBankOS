package com.sitebank.android.ui.analytics

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sitebank.android.ui.components.SiteBankTopAppBar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel(),
    onViewAllProperties: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedRange by remember { mutableStateOf("30d") }

    Scaffold(
        topBar = { SiteBankTopAppBar() },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Header & Range Toggle
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Dashboard", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Welcome back. Here's what's happening.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                RangeToggle(selectedRange) { 
                    selectedRange = it
                    viewModel.loadStats(it)
                }
            }

            when (val state = uiState) {
                is DashboardState.Loading -> {
                    Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is DashboardState.Error -> {
                    Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                    }
                }
                is DashboardState.Success -> {
                    val totals = state.stats.totals
                    // KPIs
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        KpiCard(Modifier.weight(1f), Icons.Filled.Home, "Properties", (totals?.activeProperties ?: 0).toString(), "${totals?.properties ?: 0} total")
                        KpiCard(Modifier.weight(1f), Icons.Filled.Visibility, "Views", (totals?.totalViews ?: 0).toString(), "${totals?.uniqueVisitors ?: 0} unique")
                        KpiCard(Modifier.weight(1f), Icons.Filled.People, "Hot leads", (totals?.hotLeads ?: 0).toString(), "${totals?.leads ?: 0} total leads")
                    }

                    // Activity Chart
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(2.dp)
                    ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Activity over time", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(12.dp, 2.dp).background(Color(0xFFF97316))) // orange
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Views", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(12.dp, 2.dp).background(Color(0xFF3B82F6))) // blue
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Leads", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Box(modifier = Modifier.fillMaxWidth().height(160.dp).background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha=0.3f), RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) {
                        Text("Chart Data", color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha=0.5f))
                    }
                }
            }

            // Funnel
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Conversion Funnel", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    val funnel = (uiState as? DashboardState.Success)?.stats?.funnel
                    val views = funnel?.views ?: 0
                    val interactions = funnel?.contactClicks ?: 0
                    val leads = funnel?.leadSubmissions ?: 0
                    
                    val interactionsPct = if (views > 0) (interactions.toFloat() / views * 100).toInt() else 0
                    val leadsPct = if (interactions > 0) (leads.toFloat() / interactions * 100).toInt() else 0

                    FunnelStep("Property Views", views, "100%", Color(0xFF3B82F6), 1f)
                    FunnelStep("Interactions", interactions, "$interactionsPct%", Color(0xFF10B981), if (views > 0) interactions.toFloat() / views else 0f)
                    FunnelStep("Lead Submitted", leads, "$leadsPct%", Color(0xFF8B5CF6), if (interactions > 0) leads.toFloat() / interactions else 0f)
                }
            }

            // Top Properties
            val topProperties = (uiState as? DashboardState.Success)?.stats?.topProperties ?: emptyList()
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Top properties", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                        Text("View all", fontSize = 12.sp, color = MaterialTheme.colorScheme.primary, modifier = Modifier.clickable { onViewAllProperties() })
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    if (topProperties.isEmpty()) {
                        Text("No activity in this range yet.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    } else {
                        topProperties.forEach { prop ->
                            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(prop.title, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                                Row(horizontalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.width(100.dp)) {
                                    Text("${prop.views} views", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text("${prop.leads} leads", fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                                }
                            }
                            Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                        }
                    }
                }
            }
                } // End of Success state
            } // End of when
        }
    }
}

@Composable
fun RangeToggle(selected: String, onSelect: (String) -> Unit) {
    Row(
        modifier = Modifier
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(6.dp))
            .padding(2.dp)
    ) {
        listOf("7d", "30d", "90d").forEach { opt ->
            val isSelected = selected == opt
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent)
                    .clickable { onSelect(opt) }
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Text(
                    text = opt,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun KpiCard(modifier: Modifier = Modifier, icon: ImageVector, label: String, value: String, hint: String) {
    Card(
        modifier = modifier.height(100.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp).fillMaxSize(), verticalArrangement = Arrangement.Center) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(icon, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(modifier = Modifier.width(6.dp))
                Text(label.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(2.dp))
            Text(hint, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun FunnelStep(label: String, value: Int, percentage: String, color: Color, fraction: Float) {
    Column(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, fontSize = 14.sp)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(value.toString(), fontSize = 14.sp, fontWeight = FontWeight.Medium)
                Text(percentage, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        Box(modifier = Modifier.fillMaxWidth().height(8.dp).background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(percent = 50))) {
            Box(modifier = Modifier.fillMaxHeight().fillMaxWidth(fraction.coerceIn(0.02f, 1f)).background(color, RoundedCornerShape(percent = 50)))
        }
    }
}
