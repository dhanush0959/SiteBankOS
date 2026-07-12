package com.sitebank.android.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

enum class ButtonVariant {
    Default, Destructive, Outline, Secondary, Ghost, Link
}

enum class ButtonSize {
    Default, Small, Large, Icon
}

@Composable
fun SiteBankButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ButtonVariant = ButtonVariant.Default,
    size: ButtonSize = ButtonSize.Default,
    enabled: Boolean = true,
    content: @Composable () -> Unit
) {
    val height = when (size) {
        ButtonSize.Default -> 40.dp
        ButtonSize.Small -> 36.dp
        ButtonSize.Large -> 44.dp
        ButtonSize.Icon -> 40.dp // Usually matched with 40.dp width in usage
    }

    val contentPadding = when (size) {
        ButtonSize.Default -> PaddingValues(horizontal = 16.dp, vertical = 8.dp)
        ButtonSize.Small -> PaddingValues(horizontal = 12.dp)
        ButtonSize.Large -> PaddingValues(horizontal = 32.dp)
        ButtonSize.Icon -> PaddingValues(0.dp)
    }

    val colors = when (variant) {
        ButtonVariant.Default -> ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.primary,
            contentColor = MaterialTheme.colorScheme.onPrimary
        )
        ButtonVariant.Destructive -> ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.error,
            contentColor = MaterialTheme.colorScheme.onError
        )
        ButtonVariant.Outline -> ButtonDefaults.outlinedButtonColors(
            contentColor = MaterialTheme.colorScheme.onBackground
        )
        ButtonVariant.Secondary -> ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.secondary,
            contentColor = MaterialTheme.colorScheme.onSecondary
        )
        ButtonVariant.Ghost -> ButtonDefaults.textButtonColors(
            contentColor = MaterialTheme.colorScheme.onBackground
        )
        ButtonVariant.Link -> ButtonDefaults.textButtonColors(
            contentColor = MaterialTheme.colorScheme.primary
        )
    }

    val shape = RoundedCornerShape(6.dp) // Shadcn 'rounded-md' is approx 6dp

    when (variant) {
        ButtonVariant.Outline -> {
            OutlinedButton(
                onClick = onClick,
                modifier = modifier.height(height),
                enabled = enabled,
                shape = shape,
                colors = colors as ButtonColors,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                contentPadding = contentPadding
            ) {
                ProvideTextStyle(MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Medium)) {
                    content()
                }
            }
        }
        ButtonVariant.Ghost, ButtonVariant.Link -> {
            TextButton(
                onClick = onClick,
                modifier = modifier.height(height),
                enabled = enabled,
                shape = shape,
                colors = colors as ButtonColors,
                contentPadding = contentPadding
            ) {
                ProvideTextStyle(MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Medium)) {
                    content()
                }
            }
        }
        else -> {
            Button(
                onClick = onClick,
                modifier = modifier.height(height),
                enabled = enabled,
                shape = shape,
                colors = colors as ButtonColors,
                contentPadding = contentPadding
            ) {
                ProvideTextStyle(MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Medium)) {
                    content()
                }
            }
        }
    }
}
