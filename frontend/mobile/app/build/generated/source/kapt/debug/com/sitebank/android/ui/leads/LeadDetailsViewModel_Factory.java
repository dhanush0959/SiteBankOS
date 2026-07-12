package com.sitebank.android.ui.leads;

import com.sitebank.android.data.remote.LeadsApi;
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
public final class LeadDetailsViewModel_Factory implements Factory<LeadDetailsViewModel> {
  private final Provider<LeadsApi> leadsApiProvider;

  public LeadDetailsViewModel_Factory(Provider<LeadsApi> leadsApiProvider) {
    this.leadsApiProvider = leadsApiProvider;
  }

  @Override
  public LeadDetailsViewModel get() {
    return newInstance(leadsApiProvider.get());
  }

  public static LeadDetailsViewModel_Factory create(Provider<LeadsApi> leadsApiProvider) {
    return new LeadDetailsViewModel_Factory(leadsApiProvider);
  }

  public static LeadDetailsViewModel newInstance(LeadsApi leadsApi) {
    return new LeadDetailsViewModel(leadsApi);
  }
}
