# SiteBank Android ProGuard rules
# Retrofit
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.sitebank.android.domain.model.** { *; }
-keep class com.sitebank.android.data.remote.** { *; }

# kotlinx.serialization
-keepclassmembers class kotlinx.serialization.json.** { *** Companion; }
-keepclasseswithmembers class kotlinx.serialization.json.** { kotlinx.serialization.KSerializer serializer(...); }
-keep,includedescriptorclasses class com.sitebank.android.**$$serializer { *; }
-keepclassmembers class com.sitebank.android.** { *** Companion; }
-keepclasseswithmembers class com.sitebank.android.** { kotlinx.serialization.KSerializer serializer(...); }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
