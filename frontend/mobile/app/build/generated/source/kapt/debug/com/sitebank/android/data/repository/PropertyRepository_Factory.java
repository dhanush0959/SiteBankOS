package com.sitebank.android.data.repository;

import com.sitebank.android.data.remote.PropertyApi;
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
public final class PropertyRepository_Factory implements Factory<PropertyRepository> {
  private final Provider<PropertyApi> propertyApiProvider;

  public PropertyRepository_Factory(Provider<PropertyApi> propertyApiProvider) {
    this.propertyApiProvider = propertyApiProvider;
  }

  @Override
  public PropertyRepository get() {
    return newInstance(propertyApiProvider.get());
  }

  public static PropertyRepository_Factory create(Provider<PropertyApi> propertyApiProvider) {
    return new PropertyRepository_Factory(propertyApiProvider);
  }

  public static PropertyRepository newInstance(PropertyApi propertyApi) {
    return new PropertyRepository(propertyApi);
  }
}
