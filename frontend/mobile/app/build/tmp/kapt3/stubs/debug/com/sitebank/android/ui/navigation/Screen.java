package com.sitebank.android.ui.navigation;

import androidx.compose.foundation.layout.*;
import androidx.compose.material.icons.Icons;
import androidx.compose.material3.*;
import androidx.compose.runtime.*;
import androidx.compose.ui.Modifier;
import androidx.navigation.NavType;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000P\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0013\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\b7\u0018\u00002\u00020\u0001:\r\r\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019B#\b\u0004\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0003\u0012\n\b\u0002\u0010\u0005\u001a\u0004\u0018\u00010\u0006\u00a2\u0006\u0002\u0010\u0007R\u0013\u0010\u0005\u001a\u0004\u0018\u00010\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\b\u0010\tR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\n\u0010\u000bR\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\u000b\u0082\u0001\r\u001a\u001b\u001c\u001d\u001e\u001f !\"#$%&\u00a8\u0006\'"}, d2 = {"Lcom/sitebank/android/ui/navigation/Screen;", "", "route", "", "title", "icon", "Landroidx/compose/ui/graphics/vector/ImageVector;", "(Ljava/lang/String;Ljava/lang/String;Landroidx/compose/ui/graphics/vector/ImageVector;)V", "getIcon", "()Landroidx/compose/ui/graphics/vector/ImageVector;", "getRoute", "()Ljava/lang/String;", "getTitle", "AddProperty", "CreateSmartLink", "Dashboard", "LeadDetails", "Leads", "Login", "MapView", "Properties", "PropertyDetails", "Register", "Settings", "SmartLinks", "Spacer", "Lcom/sitebank/android/ui/navigation/Screen$AddProperty;", "Lcom/sitebank/android/ui/navigation/Screen$CreateSmartLink;", "Lcom/sitebank/android/ui/navigation/Screen$Dashboard;", "Lcom/sitebank/android/ui/navigation/Screen$LeadDetails;", "Lcom/sitebank/android/ui/navigation/Screen$Leads;", "Lcom/sitebank/android/ui/navigation/Screen$Login;", "Lcom/sitebank/android/ui/navigation/Screen$MapView;", "Lcom/sitebank/android/ui/navigation/Screen$Properties;", "Lcom/sitebank/android/ui/navigation/Screen$PropertyDetails;", "Lcom/sitebank/android/ui/navigation/Screen$Register;", "Lcom/sitebank/android/ui/navigation/Screen$Settings;", "Lcom/sitebank/android/ui/navigation/Screen$SmartLinks;", "Lcom/sitebank/android/ui/navigation/Screen$Spacer;", "app_debug"})
public abstract class Screen {
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String route = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String title = null;
    @org.jetbrains.annotations.Nullable()
    private final androidx.compose.ui.graphics.vector.ImageVector icon = null;
    
    private Screen(java.lang.String route, java.lang.String title, androidx.compose.ui.graphics.vector.ImageVector icon) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getRoute() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getTitle() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final androidx.compose.ui.graphics.vector.ImageVector getIcon() {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/sitebank/android/ui/navigation/Screen$AddProperty;", "Lcom/sitebank/android/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class AddProperty extends com.sitebank.android.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.sitebank.android.ui.navigation.Screen.AddProperty INSTANCE = null;
        
        private AddProperty() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/sitebank/android/ui/navigation/Screen$CreateSmartLink;", "Lcom/sitebank/android/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class CreateSmartLink extends com.sitebank.android.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.sitebank.android.ui.navigation.Screen.CreateSmartLink INSTANCE = null;
        
        private CreateSmartLink() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/sitebank/android/ui/navigation/Screen$Dashboard;", "Lcom/sitebank/android/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class Dashboard extends com.sitebank.android.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.sitebank.android.ui.navigation.Screen.Dashboard INSTANCE = null;
        
        private Dashboard() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/sitebank/android/ui/navigation/Screen$LeadDetails;", "Lcom/sitebank/android/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class LeadDetails extends com.sitebank.android.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.sitebank.android.ui.navigation.Screen.LeadDetails INSTANCE = null;
        
        private LeadDetails() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/sitebank/android/ui/navigation/Screen$Leads;", "Lcom/sitebank/android/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class Leads extends com.sitebank.android.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.sitebank.android.ui.navigation.Screen.Leads INSTANCE = null;
        
        private Leads() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/sitebank/android/ui/navigation/Screen$Login;", "Lcom/sitebank/android/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class Login extends com.sitebank.android.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.sitebank.android.ui.navigation.Screen.Login INSTANCE = null;
        
        private Login() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/sitebank/android/ui/navigation/Screen$MapView;", "Lcom/sitebank/android/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class MapView extends com.sitebank.android.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.sitebank.android.ui.navigation.Screen.MapView INSTANCE = null;
        
        private MapView() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/sitebank/android/ui/navigation/Screen$Properties;", "Lcom/sitebank/android/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class Properties extends com.sitebank.android.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.sitebank.android.ui.navigation.Screen.Properties INSTANCE = null;
        
        private Properties() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/sitebank/android/ui/navigation/Screen$PropertyDetails;", "Lcom/sitebank/android/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class PropertyDetails extends com.sitebank.android.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.sitebank.android.ui.navigation.Screen.PropertyDetails INSTANCE = null;
        
        private PropertyDetails() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/sitebank/android/ui/navigation/Screen$Register;", "Lcom/sitebank/android/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class Register extends com.sitebank.android.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.sitebank.android.ui.navigation.Screen.Register INSTANCE = null;
        
        private Register() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/sitebank/android/ui/navigation/Screen$Settings;", "Lcom/sitebank/android/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class Settings extends com.sitebank.android.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.sitebank.android.ui.navigation.Screen.Settings INSTANCE = null;
        
        private Settings() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/sitebank/android/ui/navigation/Screen$SmartLinks;", "Lcom/sitebank/android/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class SmartLinks extends com.sitebank.android.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.sitebank.android.ui.navigation.Screen.SmartLinks INSTANCE = null;
        
        private SmartLinks() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/sitebank/android/ui/navigation/Screen$Spacer;", "Lcom/sitebank/android/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class Spacer extends com.sitebank.android.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.sitebank.android.ui.navigation.Screen.Spacer INSTANCE = null;
        
        private Spacer() {
        }
    }
}