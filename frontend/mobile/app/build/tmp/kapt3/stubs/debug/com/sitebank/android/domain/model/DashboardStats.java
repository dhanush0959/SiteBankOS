package com.sitebank.android.domain.model;

import kotlinx.serialization.SerialName;
import kotlinx.serialization.Serializable;

@kotlinx.serialization.Serializable()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000X\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0012\n\u0002\u0010\u000b\n\u0002\b\u0004\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\b\u0087\b\u0018\u0000 02\u00020\u0001:\u0002/0BW\b\u0011\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\b\u0010\u0004\u001a\u0004\u0018\u00010\u0005\u0012\b\u0010\u0006\u001a\u0004\u0018\u00010\u0007\u0012\u000e\u0010\b\u001a\n\u0012\u0004\u0012\u00020\n\u0018\u00010\t\u0012\b\u0010\u000b\u001a\u0004\u0018\u00010\f\u0012\u000e\u0010\r\u001a\n\u0012\u0004\u0012\u00020\u000e\u0018\u00010\t\u0012\b\u0010\u000f\u001a\u0004\u0018\u00010\u0010\u00a2\u0006\u0002\u0010\u0011BM\u0012\n\b\u0002\u0010\u0004\u001a\u0004\u0018\u00010\u0005\u0012\n\b\u0002\u0010\u0006\u001a\u0004\u0018\u00010\u0007\u0012\u0010\b\u0002\u0010\b\u001a\n\u0012\u0004\u0012\u00020\n\u0018\u00010\t\u0012\n\b\u0002\u0010\u000b\u001a\u0004\u0018\u00010\f\u0012\u0010\b\u0002\u0010\r\u001a\n\u0012\u0004\u0012\u00020\u000e\u0018\u00010\t\u00a2\u0006\u0002\u0010\u0012J\u000b\u0010\u001c\u001a\u0004\u0018\u00010\u0005H\u00c6\u0003J\u000b\u0010\u001d\u001a\u0004\u0018\u00010\u0007H\u00c6\u0003J\u0011\u0010\u001e\u001a\n\u0012\u0004\u0012\u00020\n\u0018\u00010\tH\u00c6\u0003J\u000b\u0010\u001f\u001a\u0004\u0018\u00010\fH\u00c6\u0003J\u0011\u0010 \u001a\n\u0012\u0004\u0012\u00020\u000e\u0018\u00010\tH\u00c6\u0003JQ\u0010!\u001a\u00020\u00002\n\b\u0002\u0010\u0004\u001a\u0004\u0018\u00010\u00052\n\b\u0002\u0010\u0006\u001a\u0004\u0018\u00010\u00072\u0010\b\u0002\u0010\b\u001a\n\u0012\u0004\u0012\u00020\n\u0018\u00010\t2\n\b\u0002\u0010\u000b\u001a\u0004\u0018\u00010\f2\u0010\b\u0002\u0010\r\u001a\n\u0012\u0004\u0012\u00020\u000e\u0018\u00010\tH\u00c6\u0001J\u0013\u0010\"\u001a\u00020#2\b\u0010$\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010%\u001a\u00020\u0003H\u00d6\u0001J\t\u0010&\u001a\u00020\u0005H\u00d6\u0001J&\u0010\'\u001a\u00020(2\u0006\u0010)\u001a\u00020\u00002\u0006\u0010*\u001a\u00020+2\u0006\u0010,\u001a\u00020-H\u00c1\u0001\u00a2\u0006\u0002\b.R\u0013\u0010\u000b\u001a\u0004\u0018\u00010\f\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\u0014R\u0013\u0010\u0004\u001a\u0004\u0018\u00010\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0015\u0010\u0016R\u0019\u0010\b\u001a\n\u0012\u0004\u0012\u00020\n\u0018\u00010\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0017\u0010\u0018R\u0019\u0010\r\u001a\n\u0012\u0004\u0012\u00020\u000e\u0018\u00010\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0019\u0010\u0018R\u0013\u0010\u0006\u001a\u0004\u0018\u00010\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001a\u0010\u001b\u00a8\u00061"}, d2 = {"Lcom/sitebank/android/domain/model/DashboardStats;", "", "seen1", "", "range", "", "totals", "Lcom/sitebank/android/domain/model/DashboardTotals;", "timeseries", "", "Lcom/sitebank/android/domain/model/TimeseriesPoint;", "funnel", "Lcom/sitebank/android/domain/model/DashboardFunnel;", "topProperties", "Lcom/sitebank/android/domain/model/DashboardTopProperty;", "serializationConstructorMarker", "Lkotlinx/serialization/internal/SerializationConstructorMarker;", "(ILjava/lang/String;Lcom/sitebank/android/domain/model/DashboardTotals;Ljava/util/List;Lcom/sitebank/android/domain/model/DashboardFunnel;Ljava/util/List;Lkotlinx/serialization/internal/SerializationConstructorMarker;)V", "(Ljava/lang/String;Lcom/sitebank/android/domain/model/DashboardTotals;Ljava/util/List;Lcom/sitebank/android/domain/model/DashboardFunnel;Ljava/util/List;)V", "getFunnel", "()Lcom/sitebank/android/domain/model/DashboardFunnel;", "getRange", "()Ljava/lang/String;", "getTimeseries", "()Ljava/util/List;", "getTopProperties", "getTotals", "()Lcom/sitebank/android/domain/model/DashboardTotals;", "component1", "component2", "component3", "component4", "component5", "copy", "equals", "", "other", "hashCode", "toString", "write$Self", "", "self", "output", "Lkotlinx/serialization/encoding/CompositeEncoder;", "serialDesc", "Lkotlinx/serialization/descriptors/SerialDescriptor;", "write$Self$app_debug", "$serializer", "Companion", "app_debug"})
public final class DashboardStats {
    @org.jetbrains.annotations.Nullable()
    private final java.lang.String range = null;
    @org.jetbrains.annotations.Nullable()
    private final com.sitebank.android.domain.model.DashboardTotals totals = null;
    @org.jetbrains.annotations.Nullable()
    private final java.util.List<com.sitebank.android.domain.model.TimeseriesPoint> timeseries = null;
    @org.jetbrains.annotations.Nullable()
    private final com.sitebank.android.domain.model.DashboardFunnel funnel = null;
    @org.jetbrains.annotations.Nullable()
    private final java.util.List<com.sitebank.android.domain.model.DashboardTopProperty> topProperties = null;
    @org.jetbrains.annotations.NotNull()
    public static final com.sitebank.android.domain.model.DashboardStats.Companion Companion = null;
    
    public DashboardStats(@org.jetbrains.annotations.Nullable()
    java.lang.String range, @org.jetbrains.annotations.Nullable()
    com.sitebank.android.domain.model.DashboardTotals totals, @org.jetbrains.annotations.Nullable()
    java.util.List<com.sitebank.android.domain.model.TimeseriesPoint> timeseries, @org.jetbrains.annotations.Nullable()
    com.sitebank.android.domain.model.DashboardFunnel funnel, @org.jetbrains.annotations.Nullable()
    java.util.List<com.sitebank.android.domain.model.DashboardTopProperty> topProperties) {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getRange() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.sitebank.android.domain.model.DashboardTotals getTotals() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.util.List<com.sitebank.android.domain.model.TimeseriesPoint> getTimeseries() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.sitebank.android.domain.model.DashboardFunnel getFunnel() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.util.List<com.sitebank.android.domain.model.DashboardTopProperty> getTopProperties() {
        return null;
    }
    
    public DashboardStats() {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String component1() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.sitebank.android.domain.model.DashboardTotals component2() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.util.List<com.sitebank.android.domain.model.TimeseriesPoint> component3() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.sitebank.android.domain.model.DashboardFunnel component4() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.util.List<com.sitebank.android.domain.model.DashboardTopProperty> component5() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.sitebank.android.domain.model.DashboardStats copy(@org.jetbrains.annotations.Nullable()
    java.lang.String range, @org.jetbrains.annotations.Nullable()
    com.sitebank.android.domain.model.DashboardTotals totals, @org.jetbrains.annotations.Nullable()
    java.util.List<com.sitebank.android.domain.model.TimeseriesPoint> timeseries, @org.jetbrains.annotations.Nullable()
    com.sitebank.android.domain.model.DashboardFunnel funnel, @org.jetbrains.annotations.Nullable()
    java.util.List<com.sitebank.android.domain.model.DashboardTopProperty> topProperties) {
        return null;
    }
    
    @java.lang.Override()
    public boolean equals(@org.jetbrains.annotations.Nullable()
    java.lang.Object other) {
        return false;
    }
    
    @java.lang.Override()
    public int hashCode() {
        return 0;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.NotNull()
    public java.lang.String toString() {
        return null;
    }
    
    @kotlin.jvm.JvmStatic()
    public static final void write$Self$app_debug(@org.jetbrains.annotations.NotNull()
    com.sitebank.android.domain.model.DashboardStats self, @org.jetbrains.annotations.NotNull()
    kotlinx.serialization.encoding.CompositeEncoder output, @org.jetbrains.annotations.NotNull()
    kotlinx.serialization.descriptors.SerialDescriptor serialDesc) {
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00006\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0011\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c7\u0002\u0018\u00002\b\u0012\u0004\u0012\u00020\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0003J\u0018\u0010\b\u001a\f\u0012\b\u0012\u0006\u0012\u0002\b\u00030\n0\tH\u00d6\u0001\u00a2\u0006\u0002\u0010\u000bJ\u0011\u0010\f\u001a\u00020\u00022\u0006\u0010\r\u001a\u00020\u000eH\u00d6\u0001J\u0019\u0010\u000f\u001a\u00020\u00102\u0006\u0010\u0011\u001a\u00020\u00122\u0006\u0010\u0013\u001a\u00020\u0002H\u00d6\u0001R\u0014\u0010\u0004\u001a\u00020\u00058VX\u00d6\u0005\u00a2\u0006\u0006\u001a\u0004\b\u0006\u0010\u0007\u00a8\u0006\u0014"}, d2 = {"com/sitebank/android/domain/model/DashboardStats.$serializer", "Lkotlinx/serialization/internal/GeneratedSerializer;", "Lcom/sitebank/android/domain/model/DashboardStats;", "()V", "descriptor", "Lkotlinx/serialization/descriptors/SerialDescriptor;", "getDescriptor", "()Lkotlinx/serialization/descriptors/SerialDescriptor;", "childSerializers", "", "Lkotlinx/serialization/KSerializer;", "()[Lkotlinx/serialization/KSerializer;", "deserialize", "decoder", "Lkotlinx/serialization/encoding/Decoder;", "serialize", "", "encoder", "Lkotlinx/serialization/encoding/Encoder;", "value", "app_debug"})
    @java.lang.Deprecated()
    public static final class $serializer implements kotlinx.serialization.internal.GeneratedSerializer<com.sitebank.android.domain.model.DashboardStats> {
        @org.jetbrains.annotations.NotNull()
        public static final com.sitebank.android.domain.model.DashboardStats.$serializer INSTANCE = null;
        
        private $serializer() {
            super();
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public kotlinx.serialization.KSerializer<?>[] childSerializers() {
            return null;
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public com.sitebank.android.domain.model.DashboardStats deserialize(@org.jetbrains.annotations.NotNull()
        kotlinx.serialization.encoding.Decoder decoder) {
            return null;
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public kotlinx.serialization.descriptors.SerialDescriptor getDescriptor() {
            return null;
        }
        
        @java.lang.Override()
        public void serialize(@org.jetbrains.annotations.NotNull()
        kotlinx.serialization.encoding.Encoder encoder, @org.jetbrains.annotations.NotNull()
        com.sitebank.android.domain.model.DashboardStats value) {
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public kotlinx.serialization.KSerializer<?>[] typeParametersSerializers() {
            return null;
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0016\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u000f\u0010\u0003\u001a\b\u0012\u0004\u0012\u00020\u00050\u0004H\u00c6\u0001\u00a8\u0006\u0006"}, d2 = {"Lcom/sitebank/android/domain/model/DashboardStats$Companion;", "", "()V", "serializer", "Lkotlinx/serialization/KSerializer;", "Lcom/sitebank/android/domain/model/DashboardStats;", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final kotlinx.serialization.KSerializer<com.sitebank.android.domain.model.DashboardStats> serializer() {
            return null;
        }
    }
}