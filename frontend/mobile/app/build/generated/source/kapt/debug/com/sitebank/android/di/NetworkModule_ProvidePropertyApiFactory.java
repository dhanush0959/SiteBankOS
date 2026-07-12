package com.sitebank.android.di;

import com.sitebank.android.data.remote.PropertyApi;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import retrofit2.Retrofit;

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
public final class NetworkModule_ProvidePropertyApiFactory implements Factory<PropertyApi> {
  private final Provider<Retrofit> retrofitProvider;

  public NetworkModule_ProvidePropertyApiFactory(Provider<Retrofit> retrofitProvider) {
    this.retrofitProvider = retrofitProvider;
  }

  @Override
  public PropertyApi get() {
    return providePropertyApi(retrofitProvider.get());
  }

  public static NetworkModule_ProvidePropertyApiFactory create(
      Provider<Retrofit> retrofitProvider) {
    return new NetworkModule_ProvidePropertyApiFactory(retrofitProvider);
  }

  public static PropertyApi providePropertyApi(Retrofit retrofit) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.providePropertyApi(retrofit));
  }
}
