package com.sitebank.android.data.repository;

import com.sitebank.android.data.remote.LeadsApi;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
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
public final class LeadsRepository_Factory implements Factory<LeadsRepository> {
  private final Provider<LeadsApi> leadsApiProvider;

  public LeadsRepository_Factory(Provider<LeadsApi> leadsApiProvider) {
    this.leadsApiProvider = leadsApiProvider;
  }

  @Override
  public LeadsRepository get() {
    return newInstance(leadsApiProvider.get());
  }

  public static LeadsRepository_Factory create(Provider<LeadsApi> leadsApiProvider) {
    return new LeadsRepository_Factory(leadsApiProvider);
  }

  public static LeadsRepository newInstance(LeadsApi leadsApi) {
    return new LeadsRepository(leadsApi);
  }
}
