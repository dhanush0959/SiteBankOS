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
public final class AddPropertyViewModel_Factory implements Factory<AddPropertyViewModel> {
  private final Provider<PropertyApi> propertyApiProvider;

  public AddPropertyViewModel_Factory(Provider<PropertyApi> propertyApiProvider) {
    this.propertyApiProvider = propertyApiProvider;
  }

  @Override
  public AddPropertyViewModel get() {
    return newInstance(propertyApiProvider.get());
  }

  public static AddPropertyViewModel_Factory create(Provider<PropertyApi> propertyApiProvider) {
    return new AddPropertyViewModel_Factory(propertyApiProvider);
  }

  public static AddPropertyViewModel newInstance(PropertyApi propertyApi) {
    return new AddPropertyViewModel(propertyApi);
  }
}
