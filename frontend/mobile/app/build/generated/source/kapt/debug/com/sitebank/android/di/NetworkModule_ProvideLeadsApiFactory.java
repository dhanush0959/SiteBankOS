package com.sitebank.android.di;

import com.sitebank.android.data.remote.LeadsApi;
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
public final class NetworkModule_ProvideLeadsApiFactory implements Factory<LeadsApi> {
  private final Provider<Retrofit> retrofitProvider;

  public NetworkModule_ProvideLeadsApiFactory(Provider<Retrofit> retrofitProvider) {
    this.retrofitProvider = retrofitProvider;
  }

  @Override
  public LeadsApi get() {
    return provideLeadsApi(retrofitProvider.get());
  }

  public static NetworkModule_ProvideLeadsApiFactory create(Provider<Retrofit> retrofitProvider) {
    return new NetworkModule_ProvideLeadsApiFactory(retrofitProvider);
  }

  public static LeadsApi provideLeadsApi(Retrofit retrofit) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideLeadsApi(retrofit));
  }
}
