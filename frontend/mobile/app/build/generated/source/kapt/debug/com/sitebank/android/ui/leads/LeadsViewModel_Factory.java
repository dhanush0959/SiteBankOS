package com.sitebank.android.ui.leads;

import com.sitebank.android.data.repository.LeadsRepository;
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
public final class LeadsViewModel_Factory implements Factory<LeadsViewModel> {
  private final Provider<LeadsRepository> repositoryProvider;

  public LeadsViewModel_Factory(Provider<LeadsRepository> repositoryProvider) {
    this.repositoryProvider = repositoryProvider;
  }

  @Override
  public LeadsViewModel get() {
    return newInstance(repositoryProvider.get());
  }

  public static LeadsViewModel_Factory create(Provider<LeadsRepository> repositoryProvider) {
    return new LeadsViewModel_Factory(repositoryProvider);
  }

  public static LeadsViewModel newInstance(LeadsRepository repository) {
    return new LeadsViewModel(repository);
  }
}
