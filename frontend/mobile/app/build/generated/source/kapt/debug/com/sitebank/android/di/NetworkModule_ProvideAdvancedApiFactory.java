package com.sitebank.android.di;

import com.sitebank.android.data.remote.AdvancedApi;
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
public final class NetworkModule_ProvideAdvancedApiFactory implements Factory<AdvancedApi> {
  private final Provider<Retrofit> retrofitProvider;

  public NetworkModule_ProvideAdvancedApiFactory(Provider<Retrofit> retrofitProvider) {
    this.retrofitProvider = retrofitProvider;
  }

  @Override
  public AdvancedApi get() {
    return provideAdvancedApi(retrofitProvider.get());
  }

  public static NetworkModule_ProvideAdvancedApiFactory create(
      Provider<Retrofit> retrofitProvider) {
    return new NetworkModule_ProvideAdvancedApiFactory(retrofitProvider);
  }

  public static AdvancedApi provideAdvancedApi(Retrofit retrofit) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideAdvancedApi(retrofit));
  }
}
