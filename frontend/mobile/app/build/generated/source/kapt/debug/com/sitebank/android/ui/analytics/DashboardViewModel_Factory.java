package com.sitebank.android.ui.analytics;

import com.sitebank.android.data.remote.AdvancedApi;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast"
})
public final class DashboardViewModel_Factory implements Factory<DashboardViewModel> {
  private final Provider<AdvancedApi> advancedApiProvider;

  public DashboardViewModel_Factory(Provider<AdvancedApi> advancedApiProvider) {
    this.advancedApiProvider = advancedApiProvider;
  }

  @Override
  public DashboardViewModel get() {
    return newInstance(advancedApiProvider.get());
  }

  public static DashboardViewModel_Factory create(Provider<AdvancedApi> advancedApiProvider) {
    return new DashboardViewModel_Factory(advancedApiProvider);
  }

  public static DashboardViewModel newInstance(AdvancedApi advancedApi) {
    return new DashboardViewModel(advancedApi);
  }
}
