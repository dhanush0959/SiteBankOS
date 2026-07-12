package com.sitebank.android.ui.settings;

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
public final class SettingsViewModel_Factory implements Factory<SettingsViewModel> {
  private final Provider<AdvancedApi> advancedApiProvider;

  public SettingsViewModel_Factory(Provider<AdvancedApi> advancedApiProvider) {
    this.advancedApiProvider = advancedApiProvider;
  }

  @Override
  public SettingsViewModel get() {
    return newInstance(advancedApiProvider.get());
  }

  public static SettingsViewModel_Factory create(Provider<AdvancedApi> advancedApiProvider) {
    return new SettingsViewModel_Factory(advancedApiProvider);
  }

  public static SettingsViewModel newInstance(AdvancedApi advancedApi) {
    return new SettingsViewModel(advancedApi);
  }
}
