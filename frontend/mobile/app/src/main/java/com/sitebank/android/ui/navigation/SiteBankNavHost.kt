package com.sitebank.android.ui.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.People
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.graphics.Color
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.sitebank.android.ui.analytics.DashboardScreen
import com.sitebank.android.ui.auth.LoginScreen
import com.sitebank.android.ui.auth.RegisterScreen
import com.sitebank.android.ui.leads.LeadsScreen
import com.sitebank.android.ui.properties.PropertyListScreen
import com.sitebank.android.ui.properties.AddPropertyScreen
import com.sitebank.android.ui.properties.PropertyDetailsScreen
import com.sitebank.android.ui.properties.MapViewScreen
import com.sitebank.android.ui.leads.LeadDetailsScreen
import com.sitebank.android.ui.smartlinks.CreateSmartLinkScreen
import com.sitebank.android.ui.smartlinks.SmartLinksScreen
import com.sitebank.android.ui.settings.SettingsScreen
import androidx.navigation.NavType
import androidx.navigation.navArgument

sealed class Screen(val route: String, val title: String, val icon: androidx.compose.ui.graphics.vector.ImageVector? = null) {
    object Login : Screen("login", "Login")
    object Register : Screen("register", "Register")
    object Properties : Screen("properties", "Home", Icons.Outlined.Home)
    object Leads : Screen("leads", "Leads", Icons.Outlined.People)
    object Spacer : Screen("spacer", "")
    object Dashboard : Screen("dashboard", "Dashboard", Icons.Outlined.GridView)
    object Settings : Screen("settings", "Settings", Icons.Outlined.Settings)
    object SmartLinks : Screen("smart_links", "Links", Icons.Filled.Share)
    
    // Secondary screens
    object AddProperty : Screen("properties/new", "Add Property")
    object PropertyDetails : Screen("properties/{id}", "Property Details")
    object LeadDetails : Screen("leads/{id}", "Lead Details")
    object CreateSmartLink : Screen("smart_links/new", "Create Smart Link")
    object MapView : Screen("map", "Map View")
}

val bottomNavItems = listOf(
    Screen.Properties,
    Screen.Leads,
    Screen.Spacer,
    Screen.Dashboard,
    Screen.Settings
)

@Composable
fun SiteBankNavHost() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    val currentRoute = currentDestination?.route

    val showBottomNav = currentRoute in bottomNavItems.map { it.route }

    Scaffold(
        bottomBar = {
            if (showBottomNav) {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    bottomNavItems.forEach { screen ->
                        if (screen == Screen.Spacer) {
                            NavigationBarItem(
                                icon = { Spacer(Modifier.size(24.dp)) },
                                label = { Text("Add") },
                                selected = false,
                                onClick = { },
                                enabled = false,
                                colors = NavigationBarItemDefaults.colors(
                                    disabledIconColor = Color.Transparent,
                                    disabledTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            )
                        } else {
                            NavigationBarItem(
                                icon = { Icon(screen.icon!!, contentDescription = screen.title) },
                                label = { Text(screen.title) },
                                selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                                onClick = {
                                    navController.navigate(screen.route) {
                                        popUpTo(navController.graph.findStartDestination().id) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            )
                        }
                    }
                }
            }
        },
        floatingActionButton = {
            if (showBottomNav) {
                FloatingActionButton(
                    onClick = { navController.navigate(Screen.AddProperty.route) },
                    containerColor = Color(0xFF3B82F6),
                    contentColor = Color.White,
                    shape = CircleShape,
                    modifier = Modifier.offset(y = 48.dp)
                ) {
                    Icon(Icons.Filled.Add, contentDescription = "Add", modifier = Modifier.size(32.dp))
                }
            }
        },
        floatingActionButtonPosition = FabPosition.Center
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Login.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Login.route) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(Screen.Properties.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    },
                    onNavigateToRegister = {
                        navController.navigate(Screen.Register.route)
                    }
                )
            }
            
            composable(Screen.Register.route) {
                RegisterScreen(
                    onRegisterSuccess = {
                        navController.navigate(Screen.Properties.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    },
                    onNavigateToLogin = {
                        navController.navigateUp()
                    }
                )
            }

            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    onViewAllProperties = {
                        navController.navigate(Screen.Properties.route) {
                            popUpTo(Screen.Dashboard.route)
                        }
                    }
                )
            }

            composable(Screen.Properties.route) {
                PropertyListScreen(
                    onAddPropertyClick = {
                        navController.navigate(Screen.AddProperty.route)
                    },
                    onPropertyClick = { id ->
                        navController.navigate(Screen.PropertyDetails.route.replace("{id}", id))
                    },
                    onMapViewClick = {
                        navController.navigate(Screen.MapView.route)
                    }
                )
            }

            composable(Screen.AddProperty.route) {
                AddPropertyScreen(
                    onBackClick = { navController.navigateUp() },
                    onSuccess = { navController.navigateUp() }
                )
            }

            composable(
                route = Screen.PropertyDetails.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType })
            ) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id") ?: ""
                PropertyDetailsScreen(
                    propertyId = id,
                    onBackClick = { navController.navigateUp() }
                )
            }

            composable(Screen.MapView.route) {
                MapViewScreen(
                    onCloseClick = { navController.navigateUp() }
                )
            }

            composable(Screen.Leads.route) {
                LeadsScreen(
                    onLeadClick = { id ->
                        navController.navigate(Screen.LeadDetails.route.replace("{id}", id))
                    }
                )
            }

            composable(
                route = Screen.LeadDetails.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType })
            ) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id") ?: ""
                LeadDetailsScreen(
                    leadId = id,
                    onBackClick = { navController.navigateUp() }
                )
            }

            composable(Screen.SmartLinks.route) {
                SmartLinksScreen(
                    onNewLinkClick = {
                        navController.navigate(Screen.CreateSmartLink.route)
                    }
                )
            }

            composable(Screen.CreateSmartLink.route) {
                CreateSmartLinkScreen(
                    onBackClick = { navController.navigateUp() }
                )
            }

            composable(Screen.Settings.route) {
                SettingsScreen()
            }
        }
    }
}
