package com.sitebank.android.ui.properties;

import com.sitebank.android.data.remote.PropertyApi;
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
public final class PropertyDetailsViewModel_Factory implements Factory<PropertyDetailsViewModel> {
  private final Provider<PropertyApi> propertyApiProvider;

  public PropertyDetailsViewModel_Factory(Provider<PropertyApi> propertyApiProvider) {
    this.propertyApiProvider = propertyApiProvider;
  }

  @Override
  public PropertyDetailsViewModel get() {
    return newInstance(propertyApiProvider.get());
  }

  public static PropertyDetailsViewModel_Factory create(Provider<PropertyApi> propertyApiProvider) {
    return new PropertyDetailsViewModel_Factory(propertyApiProvider);
  }

  public static PropertyDetailsViewModel newInstance(PropertyApi propertyApi) {
    return new PropertyDetailsViewModel(propertyApi);
  }
}
