package com.sitebank.android.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = Blue600,
    onPrimary = Gray50,
    primaryContainer = Blue50,
    onPrimaryContainer = Blue700,
    secondary = Slate400,
    onSecondary = Gray50,
    secondaryContainer = Gray100,
    onSecondaryContainer = Slate600,
    tertiary = Purple500,
    onTertiary = Gray50,
    tertiaryContainer = Purple50,
    onTertiaryContainer = Purple500,
    background = Gray50,
    onBackground = Gray900,
    surface = Gray50,
    onSurface = Gray900,
    surfaceVariant = Gray100,
    onSurfaceVariant = Gray600,
    outline = Gray200,
    outlineVariant = Gray100,
    error = Red500,
    errorContainer = Red50,
    onError = Gray50,
    onErrorContainer = Red500,
)

private val DarkColorScheme = darkColorScheme(
    primary = Blue500,
    onPrimary = Gray900,
    primaryContainer = Color(0xFF1E3A8A), // Blue900 approx
    onPrimaryContainer = Blue50,
    secondary = Gray300,
    onSecondary = Gray900,
    secondaryContainer = Gray700,
    onSecondaryContainer = Gray50,
    tertiary = Purple500,
    onTertiary = Gray900,
    tertiaryContainer = Color(0xFF4C1D95), // Purple900 approx
    onTertiaryContainer = Purple50,
    background = Gray950,
    onBackground = Gray200,
    surface = Gray900,
    onSurface = Gray200,
    surfaceVariant = Gray800,
    onSurfaceVariant = Gray300,
    outline = Gray500,
    outlineVariant = Gray800,
    error = Red500,
    errorContainer = Color(0xFF7F1D1D), // Red900 approx
    onError = Gray900,
    onErrorContainer = Color(0xFFFECACA), // Red200 approx
)

@Composable
fun SiteBankTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = SiteBankTypography,
        content = content,
    )
}
