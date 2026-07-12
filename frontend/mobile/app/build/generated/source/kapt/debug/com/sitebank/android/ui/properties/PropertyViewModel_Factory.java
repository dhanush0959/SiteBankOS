package com.sitebank.android.ui.properties;

import com.sitebank.android.data.repository.PropertyRepository;
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
public final class PropertyViewModel_Factory implements Factory<PropertyViewModel> {
  private final Provider<PropertyRepository> repositoryProvider;

  public PropertyViewModel_Factory(Provider<PropertyRepository> repositoryProvider) {
    this.repositoryProvider = repositoryProvider;
  }

  @Override
  public PropertyViewModel get() {
    return newInstance(repositoryProvider.get());
  }

  public static PropertyViewModel_Factory create(Provider<PropertyRepository> repositoryProvider) {
    return new PropertyViewModel_Factory(repositoryProvider);
  }

  public static PropertyViewModel newInstance(PropertyRepository repository) {
    return new PropertyViewModel(repository);
  }
}
