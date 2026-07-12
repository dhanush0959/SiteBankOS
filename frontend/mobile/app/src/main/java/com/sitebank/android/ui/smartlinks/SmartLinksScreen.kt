package com.sitebank.android.ui.smartlinks

import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sitebank.android.domain.model.SmartLink
import com.sitebank.android.ui.components.BadgeVariant
import com.sitebank.android.ui.components.SiteBankBadge
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.AnnotatedString
import com.sitebank.android.ui.components.SiteBankButton

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SmartLinksScreen(
    viewModel: SmartLinksViewModel = hiltViewModel(),
    onNewLinkClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (val state = uiState) {
                is SmartLinksState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is SmartLinksState.Error -> {
                    Text(
                        text = state.message,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                is SmartLinksState.Success -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(20.dp)
                    ) {
                        // Header
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Filled.Share, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Smart Links", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        "Shareable property microsites with built-in lead capture and analytics.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Button(
                                    onClick = onNewLinkClick,
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                                ) {
                                    Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("New Link", fontSize = 12.sp)
                                }
                            }
                        }

                        // Links Listing
                        item {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                            ) {
                                if (state.links.isEmpty()) {
                                    Column(
                                        modifier = Modifier.padding(32.dp).fillMaxWidth(),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Box(
                                            modifier = Modifier.size(56.dp).background(Color(0xFF3B82F6).copy(alpha = 0.1f), RoundedCornerShape(16.dp)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(Icons.Filled.Link, contentDescription = null, modifier = Modifier.size(28.dp), tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f))
                                        }
                                        Spacer(modifier = Modifier.height(16.dp))
                                        Text("No smart links yet. Create one to share a property with buyers via WhatsApp or social.", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                                    }
                                } else {
                                    Column {
                                        state.links.forEachIndexed { index, link ->
                                            SmartLinkRow(link = link)
                                            if (index < state.links.size - 1) {
                                                Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SmartLinkRow(link: SmartLink) {
    val uriHandler = LocalUriHandler.current
    val clipboardManager = LocalClipboardManager.current
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Filled.Public, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f))
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = link.property?.title ?: "Property",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.weight(1f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.width(8.dp))
            
            val statusVariant = when(link.status) {
                "ACTIVE" -> BadgeVariant.Success
                "EXPIRED" -> BadgeVariant.Warning
                else -> BadgeVariant.Default
            }
            SiteBankBadge(text = link.status ?: "UNKNOWN", variant = statusVariant)
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Row(modifier = Modifier.padding(start = 24.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "https://sitebank.com/p/${link.slug}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.primary,
                textDecoration = TextDecoration.Underline,
                modifier = Modifier.clickable(onClick = { uriHandler.openUri("https://sitebank.com/p/${link.slug}") })
            )
            Spacer(modifier = Modifier.width(4.dp))
            Icon(Icons.Filled.OpenInNew, contentDescription = null, modifier = Modifier.size(12.dp), tint = MaterialTheme.colorScheme.primary)
        }

        Spacer(modifier = Modifier.height(4.dp))
        
        Text(
            text = "Created recently · ${link.count?.events ?: 0} events",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(start = 24.dp)
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Action Buttons Row
        Row(
            modifier = Modifier.fillMaxWidth().padding(start = 24.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedIconButton(Icons.Filled.ContentCopy, "Copy", onClick = { clipboardManager.setText(AnnotatedString("https://sitebank.com/p/${link.slug}")) })
            OutlinedIconButton(Icons.Filled.PowerSettingsNew, "Toggle", onClick = {})
            OutlinedIconButton(Icons.Filled.Refresh, "Regenerate", onClick = {})
            OutlinedIconButton(Icons.Filled.Visibility, "Analytics", onClick = {})
            OutlinedIconButton(Icons.Filled.Delete, "Delete", tint = MaterialTheme.colorScheme.onSurfaceVariant, onClick = {})
        }
    }
}

@Composable
fun OutlinedIconButton(icon: androidx.compose.ui.graphics.vector.ImageVector, desc: String, tint: Color = MaterialTheme.colorScheme.onSurface, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(8.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        color = Color.Transparent,
        modifier = Modifier.size(36.dp)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = desc, modifier = Modifier.size(16.dp), tint = tint)
        }
    }
}
