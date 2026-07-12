package com.sitebank.android.ui.smartlinks;

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
public final class SmartLinksViewModel_Factory implements Factory<SmartLinksViewModel> {
  private final Provider<AdvancedApi> advancedApiProvider;

  public SmartLinksViewModel_Factory(Provider<AdvancedApi> advancedApiProvider) {
    this.advancedApiProvider = advancedApiProvider;
  }

  @Override
  public SmartLinksViewModel get() {
    return newInstance(advancedApiProvider.get());
  }

  public static SmartLinksViewModel_Factory create(Provider<AdvancedApi> advancedApiProvider) {
    return new SmartLinksViewModel_Factory(advancedApiProvider);
  }

  public static SmartLinksViewModel newInstance(AdvancedApi advancedApi) {
    return new SmartLinksViewModel(advancedApi);
  }
}
