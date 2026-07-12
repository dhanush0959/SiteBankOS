package com.sitebank.android.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class BadgeVariant {
    Default, Secondary, Destructive, Outline, Success, Warning, Hot
}

@Composable
fun SiteBankBadge(
    text: String,
    modifier: Modifier = Modifier,
    variant: BadgeVariant = BadgeVariant.Default
) {
    val containerColor = when (variant) {
        BadgeVariant.Default -> MaterialTheme.colorScheme.primary
        BadgeVariant.Secondary -> MaterialTheme.colorScheme.secondary
        BadgeVariant.Destructive -> MaterialTheme.colorScheme.error
        BadgeVariant.Outline -> Color.Transparent
        BadgeVariant.Success -> Color(0xFFDCFCE7) // green-100
        BadgeVariant.Warning -> Color(0xFFFEF9C3) // yellow-100
        BadgeVariant.Hot -> Color(0xFFEF4444) // red-500
    }

    val contentColor = when (variant) {
        BadgeVariant.Default -> MaterialTheme.colorScheme.onPrimary
        BadgeVariant.Secondary -> MaterialTheme.colorScheme.onSecondary
        BadgeVariant.Destructive -> MaterialTheme.colorScheme.onError
        BadgeVariant.Outline -> MaterialTheme.colorScheme.onBackground
        BadgeVariant.Success -> Color(0xFF166534) // green-800
        BadgeVariant.Warning -> Color(0xFF854D0E) // yellow-800
        BadgeVariant.Hot -> Color.White
    }

    val border = if (variant == BadgeVariant.Outline) {
        BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    } else null

    val shape = RoundedCornerShape(percent = 50) // rounded-full

    Box(
        modifier = modifier
            .clip(shape)
            .background(containerColor)
            .then(if (border != null) Modifier.border(border, shape) else Modifier)
            .padding(horizontal = 10.dp, vertical = 2.dp)
    ) {
        Text(
            text = text,
            color = contentColor,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}
