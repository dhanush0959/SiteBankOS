package com.sitebank.android;

import android.app.Activity;
import android.app.Service;
import android.view.View;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.SavedStateHandle;
import androidx.lifecycle.ViewModel;
import com.sitebank.android.data.local.TokenManager;
import com.sitebank.android.data.remote.AdvancedApi;
import com.sitebank.android.data.remote.AuthApi;
import com.sitebank.android.data.remote.AuthInterceptor;
import com.sitebank.android.data.remote.LeadsApi;
import com.sitebank.android.data.remote.PropertyApi;
import com.sitebank.android.data.repository.AuthRepository;
import com.sitebank.android.data.repository.LeadsRepository;
import com.sitebank.android.data.repository.PropertyRepository;
import com.sitebank.android.di.NetworkModule_ProvideAdvancedApiFactory;
import com.sitebank.android.di.NetworkModule_ProvideAuthApiFactory;
import com.sitebank.android.di.NetworkModule_ProvideJsonFactory;
import com.sitebank.android.di.NetworkModule_ProvideLeadsApiFactory;
import com.sitebank.android.di.NetworkModule_ProvideOkHttpClientFactory;
import com.sitebank.android.di.NetworkModule_ProvidePropertyApiFactory;
import com.sitebank.android.di.NetworkModule_ProvideRetrofitFactory;
import com.sitebank.android.ui.analytics.DashboardViewModel;
import com.sitebank.android.ui.analytics.DashboardViewModel_HiltModules;
import com.sitebank.android.ui.auth.AuthViewModel;
import com.sitebank.android.ui.auth.AuthViewModel_HiltModules;
import com.sitebank.android.ui.leads.LeadDetailsViewModel;
import com.sitebank.android.ui.leads.LeadDetailsViewModel_HiltModules;
import com.sitebank.android.ui.leads.LeadsViewModel;
import com.sitebank.android.ui.leads.LeadsViewModel_HiltModules;
import com.sitebank.android.ui.properties.AddPropertyViewModel;
import com.sitebank.android.ui.properties.AddPropertyViewModel_HiltModules;
import com.sitebank.android.ui.properties.PropertyDetailsViewModel;
import com.sitebank.android.ui.properties.PropertyDetailsViewModel_HiltModules;
import com.sitebank.android.ui.properties.PropertyViewModel;
import com.sitebank.android.ui.properties.PropertyViewModel_HiltModules;
import com.sitebank.android.ui.settings.SettingsViewModel;
import com.sitebank.android.ui.settings.SettingsViewModel_HiltModules;
import com.sitebank.android.ui.smartlinks.SmartLinksViewModel;
import com.sitebank.android.ui.smartlinks.SmartLinksViewModel_HiltModules;
import dagger.hilt.android.ActivityRetainedLifecycle;
import dagger.hilt.android.ViewModelLifecycle;
import dagger.hilt.android.internal.builders.ActivityComponentBuilder;
import dagger.hilt.android.internal.builders.ActivityRetainedComponentBuilder;
import dagger.hilt.android.internal.builders.FragmentComponentBuilder;
import dagger.hilt.android.internal.builders.ServiceComponentBuilder;
import dagger.hilt.android.internal.builders.ViewComponentBuilder;
import dagger.hilt.android.internal.builders.ViewModelComponentBuilder;
import dagger.hilt.android.internal.builders.ViewWithFragmentComponentBuilder;
import dagger.hilt.android.internal.lifecycle.DefaultViewModelFactories;
import dagger.hilt.android.internal.lifecycle.DefaultViewModelFactories_InternalFactoryFactory_Factory;
import dagger.hilt.android.internal.managers.ActivityRetainedComponentManager_LifecycleModule_ProvideActivityRetainedLifecycleFactory;
import dagger.hilt.android.internal.managers.SavedStateHandleHolder;
import dagger.hilt.android.internal.modules.ApplicationContextModule;
import dagger.hilt.android.internal.modules.ApplicationContextModule_ProvideContextFactory;
import dagger.internal.DaggerGenerated;
import dagger.internal.DoubleCheck;
import dagger.internal.IdentifierNameString;
import dagger.internal.KeepFieldType;
import dagger.internal.LazyClassKeyMap;
import dagger.internal.MapBuilder;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.Generated;
import kotlinx.serialization.json.Json;
import okhttp3.OkHttpClient;
import retrofit2.Retrofit;

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
public final class DaggerSiteBankApp_HiltComponents_SingletonC {
  private DaggerSiteBankApp_HiltComponents_SingletonC() {
  }

  public static Builder builder() {
    return new Builder();
  }

  public static final class Builder {
    private ApplicationContextModule applicationContextModule;

    private Builder() {
    }

    public Builder applicationContextModule(ApplicationContextModule applicationContextModule) {
      this.applicationContextModule = Preconditions.checkNotNull(applicationContextModule);
      return this;
    }

    public SiteBankApp_HiltComponents.SingletonC build() {
      Preconditions.checkBuilderRequirement(applicationContextModule, ApplicationContextModule.class);
      return new SingletonCImpl(applicationContextModule);
    }
  }

  private static final class ActivityRetainedCBuilder implements SiteBankApp_HiltComponents.ActivityRetainedC.Builder {
    private final SingletonCImpl singletonCImpl;

    private SavedStateHandleHolder savedStateHandleHolder;

    private ActivityRetainedCBuilder(SingletonCImpl singletonCImpl) {
      this.singletonCImpl = singletonCImpl;
    }

    @Override
    public ActivityRetainedCBuilder savedStateHandleHolder(
        SavedStateHandleHolder savedStateHandleHolder) {
      this.savedStateHandleHolder = Preconditions.checkNotNull(savedStateHandleHolder);
      return this;
    }

    @Override
    public SiteBankApp_HiltComponents.ActivityRetainedC build() {
      Preconditions.checkBuilderRequirement(savedStateHandleHolder, SavedStateHandleHolder.class);
      return new ActivityRetainedCImpl(singletonCImpl, savedStateHandleHolder);
    }
  }

  private static final class ActivityCBuilder implements SiteBankApp_HiltComponents.ActivityC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private Activity activity;

    private ActivityCBuilder(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
    }

    @Override
    public ActivityCBuilder activity(Activity activity) {
      this.activity = Preconditions.checkNotNull(activity);
      return this;
    }

    @Override
    public SiteBankApp_HiltComponents.ActivityC build() {
      Preconditions.checkBuilderRequirement(activity, Activity.class);
      return new ActivityCImpl(singletonCImpl, activityRetainedCImpl, activity);
    }
  }

  private static final class FragmentCBuilder implements SiteBankApp_HiltComponents.FragmentC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private Fragment fragment;

    private FragmentCBuilder(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, ActivityCImpl activityCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;
    }

    @Override
    public FragmentCBuilder fragment(Fragment fragment) {
      this.fragment = Preconditions.checkNotNull(fragment);
      return this;
    }

    @Override
    public SiteBankApp_HiltComponents.FragmentC build() {
      Preconditions.checkBuilderRequirement(fragment, Fragment.class);
      return new FragmentCImpl(singletonCImpl, activityRetainedCImpl, activityCImpl, fragment);
    }
  }

  private static final class ViewWithFragmentCBuilder implements SiteBankApp_HiltComponents.ViewWithFragmentC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private final FragmentCImpl fragmentCImpl;

    private View view;

    private ViewWithFragmentCBuilder(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, ActivityCImpl activityCImpl,
        FragmentCImpl fragmentCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;
      this.fragmentCImpl = fragmentCImpl;
    }

    @Override
    public ViewWithFragmentCBuilder view(View view) {
      this.view = Preconditions.checkNotNull(view);
      return this;
    }

    @Override
    public SiteBankApp_HiltComponents.ViewWithFragmentC build() {
      Preconditions.checkBuilderRequirement(view, View.class);
      return new ViewWithFragmentCImpl(singletonCImpl, activityRetainedCImpl, activityCImpl, fragmentCImpl, view);
    }
  }

  private static final class ViewCBuilder implements SiteBankApp_HiltComponents.ViewC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private View view;

    private ViewCBuilder(SingletonCImpl singletonCImpl, ActivityRetainedCImpl activityRetainedCImpl,
        ActivityCImpl activityCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;
    }

    @Override
    public ViewCBuilder view(View view) {
      this.view = Preconditions.checkNotNull(view);
      return this;
    }

    @Override
    public SiteBankApp_HiltComponents.ViewC build() {
      Preconditions.checkBuilderRequirement(view, View.class);
      return new ViewCImpl(singletonCImpl, activityRetainedCImpl, activityCImpl, view);
    }
  }

  private static final class ViewModelCBuilder implements SiteBankApp_HiltComponents.ViewModelC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private SavedStateHandle savedStateHandle;

    private ViewModelLifecycle viewModelLifecycle;

    private ViewModelCBuilder(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
    }

    @Override
    public ViewModelCBuilder savedStateHandle(SavedStateHandle handle) {
      this.savedStateHandle = Preconditions.checkNotNull(handle);
      return this;
    }

    @Override
    public ViewModelCBuilder viewModelLifecycle(ViewModelLifecycle viewModelLifecycle) {
      this.viewModelLifecycle = Preconditions.checkNotNull(viewModelLifecycle);
      return this;
    }

    @Override
    public SiteBankApp_HiltComponents.ViewModelC build() {
      Preconditions.checkBuilderRequirement(savedStateHandle, SavedStateHandle.class);
      Preconditions.checkBuilderRequirement(viewModelLifecycle, ViewModelLifecycle.class);
      return new ViewModelCImpl(singletonCImpl, activityRetainedCImpl, savedStateHandle, viewModelLifecycle);
    }
  }

  private static final class ServiceCBuilder implements SiteBankApp_HiltComponents.ServiceC.Builder {
    private final SingletonCImpl singletonCImpl;

    private Service service;

    private ServiceCBuilder(SingletonCImpl singletonCImpl) {
      this.singletonCImpl = singletonCImpl;
    }

    @Override
    public ServiceCBuilder service(Service service) {
      this.service = Preconditions.checkNotNull(service);
      return this;
    }

    @Override
    public SiteBankApp_HiltComponents.ServiceC build() {
      Preconditions.checkBuilderRequirement(service, Service.class);
      return new ServiceCImpl(singletonCImpl, service);
    }
  }

  private static final class ViewWithFragmentCImpl extends SiteBankApp_HiltComponents.ViewWithFragmentC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private final FragmentCImpl fragmentCImpl;

    private final ViewWithFragmentCImpl viewWithFragmentCImpl = this;

    private ViewWithFragmentCImpl(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, ActivityCImpl activityCImpl,
        FragmentCImpl fragmentCImpl, View viewParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;
      this.fragmentCImpl = fragmentCImpl;


    }
  }

  private static final class FragmentCImpl extends SiteBankApp_HiltComponents.FragmentC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private final FragmentCImpl fragmentCImpl = this;

    private FragmentCImpl(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, ActivityCImpl activityCImpl,
        Fragment fragmentParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;


    }

    @Override
    public DefaultViewModelFactories.InternalFactoryFactory getHiltInternalFactoryFactory() {
      return activityCImpl.getHiltInternalFactoryFactory();
    }

    @Override
    public ViewWithFragmentComponentBuilder viewWithFragmentComponentBuilder() {
      return new ViewWithFragmentCBuilder(singletonCImpl, activityRetainedCImpl, activityCImpl, fragmentCImpl);
    }
  }

  private static final class ViewCImpl extends SiteBankApp_HiltComponents.ViewC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private final ViewCImpl viewCImpl = this;

    private ViewCImpl(SingletonCImpl singletonCImpl, ActivityRetainedCImpl activityRetainedCImpl,
        ActivityCImpl activityCImpl, View viewParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;


    }
  }

  private static final class ActivityCImpl extends SiteBankApp_HiltComponents.ActivityC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl = this;

    private ActivityCImpl(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, Activity activityParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;


    }

    @Override
    public void injectMainActivity(MainActivity arg0) {
    }

    @Override
    public DefaultViewModelFactories.InternalFactoryFactory getHiltInternalFactoryFactory() {
      return DefaultViewModelFactories_InternalFactoryFactory_Factory.newInstance(getViewModelKeys(), new ViewModelCBuilder(singletonCImpl, activityRetainedCImpl));
    }

    @Override
    public Map<Class<?>, Boolean> getViewModelKeys() {
      return LazyClassKeyMap.<Boolean>of(MapBuilder.<String, Boolean>newMapBuilder(9).put(LazyClassKeyProvider.com_sitebank_android_ui_properties_AddPropertyViewModel, AddPropertyViewModel_HiltModules.KeyModule.provide()).put(LazyClassKeyProvider.com_sitebank_android_ui_auth_AuthViewModel, AuthViewModel_HiltModules.KeyModule.provide()).put(LazyClassKeyProvider.com_sitebank_android_ui_analytics_DashboardViewModel, DashboardViewModel_HiltModules.KeyModule.provide()).put(LazyClassKeyProvider.com_sitebank_android_ui_leads_LeadDetailsViewModel, LeadDetailsViewModel_HiltModules.KeyModule.provide()).put(LazyClassKeyProvider.com_sitebank_android_ui_leads_LeadsViewModel, LeadsViewModel_HiltModules.KeyModule.provide()).put(LazyClassKeyProvider.com_sitebank_android_ui_properties_PropertyDetailsViewModel, PropertyDetailsViewModel_HiltModules.KeyModule.provide()).put(LazyClassKeyProvider.com_sitebank_android_ui_properties_PropertyViewModel, PropertyViewModel_HiltModules.KeyModule.provide()).put(LazyClassKeyProvider.com_sitebank_android_ui_settings_SettingsViewModel, SettingsViewModel_HiltModules.KeyModule.provide()).put(LazyClassKeyProvider.com_sitebank_android_ui_smartlinks_SmartLinksViewModel, SmartLinksViewModel_HiltModules.KeyModule.provide()).build());
    }

    @Override
    public ViewModelComponentBuilder getViewModelComponentBuilder() {
      return new ViewModelCBuilder(singletonCImpl, activityRetainedCImpl);
    }

    @Override
    public FragmentComponentBuilder fragmentComponentBuilder() {
      return new FragmentCBuilder(singletonCImpl, activityRetainedCImpl, activityCImpl);
    }

    @Override
    public ViewComponentBuilder viewComponentBuilder() {
      return new ViewCBuilder(singletonCImpl, activityRetainedCImpl, activityCImpl);
    }

    @IdentifierNameString
    private static final class LazyClassKeyProvider {
      static String com_sitebank_android_ui_analytics_DashboardViewModel = "com.sitebank.android.ui.analytics.DashboardViewModel";

      static String com_sitebank_android_ui_properties_AddPropertyViewModel = "com.sitebank.android.ui.properties.AddPropertyViewModel";

      static String com_sitebank_android_ui_properties_PropertyDetailsViewModel = "com.sitebank.android.ui.properties.PropertyDetailsViewModel";

      static String com_sitebank_android_ui_properties_PropertyViewModel = "com.sitebank.android.ui.properties.PropertyViewModel";

      static String com_sitebank_android_ui_leads_LeadsViewModel = "com.sitebank.android.ui.leads.LeadsViewModel";

      static String com_sitebank_android_ui_smartlinks_SmartLinksViewModel = "com.sitebank.android.ui.smartlinks.SmartLinksViewModel";

      static String com_sitebank_android_ui_auth_AuthViewModel = "com.sitebank.android.ui.auth.AuthViewModel";

      static String com_sitebank_android_ui_settings_SettingsViewModel = "com.sitebank.android.ui.settings.SettingsViewModel";

      static String com_sitebank_android_ui_leads_LeadDetailsViewModel = "com.sitebank.android.ui.leads.LeadDetailsViewModel";

      @KeepFieldType
      DashboardViewModel com_sitebank_android_ui_analytics_DashboardViewModel2;

      @KeepFieldType
      AddPropertyViewModel com_sitebank_android_ui_properties_AddPropertyViewModel2;

      @KeepFieldType
      PropertyDetailsViewModel com_sitebank_android_ui_properties_PropertyDetailsViewModel2;

      @KeepFieldType
      PropertyViewModel com_sitebank_android_ui_properties_PropertyViewModel2;

      @KeepFieldType
      LeadsViewModel com_sitebank_android_ui_leads_LeadsViewModel2;

      @KeepFieldType
      SmartLinksViewModel com_sitebank_android_ui_smartlinks_SmartLinksViewModel2;

      @KeepFieldType
      AuthViewModel com_sitebank_android_ui_auth_AuthViewModel2;

      @KeepFieldType
      SettingsViewModel com_sitebank_android_ui_settings_SettingsViewModel2;

      @KeepFieldType
      LeadDetailsViewModel com_sitebank_android_ui_leads_LeadDetailsViewModel2;
    }
  }

  private static final class ViewModelCImpl extends SiteBankApp_HiltComponents.ViewModelC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ViewModelCImpl viewModelCImpl = this;

    private Provider<AddPropertyViewModel> addPropertyViewModelProvider;

    private Provider<AuthViewModel> authViewModelProvider;

    private Provider<DashboardViewModel> dashboardViewModelProvider;

    private Provider<LeadDetailsViewModel> leadDetailsViewModelProvider;

    private Provider<LeadsViewModel> leadsViewModelProvider;

    private Provider<PropertyDetailsViewModel> propertyDetailsViewModelProvider;

    private Provider<PropertyViewModel> propertyViewModelProvider;

    private Provider<SettingsViewModel> settingsViewModelProvider;

    private Provider<SmartLinksViewModel> smartLinksViewModelProvider;

    private ViewModelCImpl(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, SavedStateHandle savedStateHandleParam,
        ViewModelLifecycle viewModelLifecycleParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;

      initialize(savedStateHandleParam, viewModelLifecycleParam);

    }

    @SuppressWarnings("unchecked")
    private void initialize(final SavedStateHandle savedStateHandleParam,
        final ViewModelLifecycle viewModelLifecycleParam) {
      this.addPropertyViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 0);
      this.authViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 1);
      this.dashboardViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 2);
      this.leadDetailsViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 3);
      this.leadsViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 4);
      this.propertyDetailsViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 5);
      this.propertyViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 6);
      this.settingsViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 7);
      this.smartLinksViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 8);
    }

    @Override
    public Map<Class<?>, javax.inject.Provider<ViewModel>> getHiltViewModelMap() {
      return LazyClassKeyMap.<javax.inject.Provider<ViewModel>>of(MapBuilder.<String, javax.inject.Provider<ViewModel>>newMapBuilder(9).put(LazyClassKeyProvider.com_sitebank_android_ui_properties_AddPropertyViewModel, ((Provider) addPropertyViewModelProvider)).put(LazyClassKeyProvider.com_sitebank_android_ui_auth_AuthViewModel, ((Provider) authViewModelProvider)).put(LazyClassKeyProvider.com_sitebank_android_ui_analytics_DashboardViewModel, ((Provider) dashboardViewModelProvider)).put(LazyClassKeyProvider.com_sitebank_android_ui_leads_LeadDetailsViewModel, ((Provider) leadDetailsViewModelProvider)).put(LazyClassKeyProvider.com_sitebank_android_ui_leads_LeadsViewModel, ((Provider) leadsViewModelProvider)).put(LazyClassKeyProvider.com_sitebank_android_ui_properties_PropertyDetailsViewModel, ((Provider) propertyDetailsViewModelProvider)).put(LazyClassKeyProvider.com_sitebank_android_ui_properties_PropertyViewModel, ((Provider) propertyViewModelProvider)).put(LazyClassKeyProvider.com_sitebank_android_ui_settings_SettingsViewModel, ((Provider) settingsViewModelProvider)).put(LazyClassKeyProvider.com_sitebank_android_ui_smartlinks_SmartLinksViewModel, ((Provider) smartLinksViewModelProvider)).build());
    }

    @Override
    public Map<Class<?>, Object> getHiltViewModelAssistedMap() {
      return Collections.<Class<?>, Object>emptyMap();
    }

    @IdentifierNameString
    private static final class LazyClassKeyProvider {
      static String com_sitebank_android_ui_analytics_DashboardViewModel = "com.sitebank.android.ui.analytics.DashboardViewModel";

      static String com_sitebank_android_ui_leads_LeadDetailsViewModel = "com.sitebank.android.ui.leads.LeadDetailsViewModel";

      static String com_sitebank_android_ui_properties_AddPropertyViewModel = "com.sitebank.android.ui.properties.AddPropertyViewModel";

      static String com_sitebank_android_ui_smartlinks_SmartLinksViewModel = "com.sitebank.android.ui.smartlinks.SmartLinksViewModel";

      static String com_sitebank_android_ui_properties_PropertyViewModel = "com.sitebank.android.ui.properties.PropertyViewModel";

      static String com_sitebank_android_ui_auth_AuthViewModel = "com.sitebank.android.ui.auth.AuthViewModel";

      static String com_sitebank_android_ui_leads_LeadsViewModel = "com.sitebank.android.ui.leads.LeadsViewModel";

      static String com_sitebank_android_ui_properties_PropertyDetailsViewModel = "com.sitebank.android.ui.properties.PropertyDetailsViewModel";

      static String com_sitebank_android_ui_settings_SettingsViewModel = "com.sitebank.android.ui.settings.SettingsViewModel";

      @KeepFieldType
      DashboardViewModel com_sitebank_android_ui_analytics_DashboardViewModel2;

      @KeepFieldType
      LeadDetailsViewModel com_sitebank_android_ui_leads_LeadDetailsViewModel2;

      @KeepFieldType
      AddPropertyViewModel com_sitebank_android_ui_properties_AddPropertyViewModel2;

      @KeepFieldType
      SmartLinksViewModel com_sitebank_android_ui_smartlinks_SmartLinksViewModel2;

      @KeepFieldType
      PropertyViewModel com_sitebank_android_ui_properties_PropertyViewModel2;

      @KeepFieldType
      AuthViewModel com_sitebank_android_ui_auth_AuthViewModel2;

      @KeepFieldType
      LeadsViewModel com_sitebank_android_ui_leads_LeadsViewModel2;

      @KeepFieldType
      PropertyDetailsViewModel com_sitebank_android_ui_properties_PropertyDetailsViewModel2;

      @KeepFieldType
      SettingsViewModel com_sitebank_android_ui_settings_SettingsViewModel2;
    }

    private static final class SwitchingProvider<T> implements Provider<T> {
      private final SingletonCImpl singletonCImpl;

      private final ActivityRetainedCImpl activityRetainedCImpl;

      private final ViewModelCImpl viewModelCImpl;

      private final int id;

      SwitchingProvider(SingletonCImpl singletonCImpl, ActivityRetainedCImpl activityRetainedCImpl,
          ViewModelCImpl viewModelCImpl, int id) {
        this.singletonCImpl = singletonCImpl;
        this.activityRetainedCImpl = activityRetainedCImpl;
        this.viewModelCImpl = viewModelCImpl;
        this.id = id;
      }

      @SuppressWarnings("unchecked")
      @Override
      public T get() {
        switch (id) {
          case 0: // com.sitebank.android.ui.properties.AddPropertyViewModel 
          return (T) new AddPropertyViewModel(singletonCImpl.providePropertyApiProvider.get());

          case 1: // com.sitebank.android.ui.auth.AuthViewModel 
          return (T) new AuthViewModel(singletonCImpl.authRepositoryProvider.get());

          case 2: // com.sitebank.android.ui.analytics.DashboardViewModel 
          return (T) new DashboardViewModel(singletonCImpl.provideAdvancedApiProvider.get());

          case 3: // com.sitebank.android.ui.leads.LeadDetailsViewModel 
          return (T) new LeadDetailsViewModel(singletonCImpl.provideLeadsApiProvider.get());

          case 4: // com.sitebank.android.ui.leads.LeadsViewModel 
          return (T) new LeadsViewModel(singletonCImpl.leadsRepositoryProvider.get());

          case 5: // com.sitebank.android.ui.properties.PropertyDetailsViewModel 
          return (T) new PropertyDetailsViewModel(singletonCImpl.providePropertyApiProvider.get());

          case 6: // com.sitebank.android.ui.properties.PropertyViewModel 
          return (T) new PropertyViewModel(singletonCImpl.propertyRepositoryProvider.get());

          case 7: // com.sitebank.android.ui.settings.SettingsViewModel 
          return (T) new SettingsViewModel(singletonCImpl.provideAdvancedApiProvider.get());

          case 8: // com.sitebank.android.ui.smartlinks.SmartLinksViewModel 
          return (T) new SmartLinksViewModel(singletonCImpl.provideAdvancedApiProvider.get());

          default: throw new AssertionError(id);
        }
      }
    }
  }

  private static final class ActivityRetainedCImpl extends SiteBankApp_HiltComponents.ActivityRetainedC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl = this;

    private Provider<ActivityRetainedLifecycle> provideActivityRetainedLifecycleProvider;

    private ActivityRetainedCImpl(SingletonCImpl singletonCImpl,
        SavedStateHandleHolder savedStateHandleHolderParam) {
      this.singletonCImpl = singletonCImpl;

      initialize(savedStateHandleHolderParam);

    }

    @SuppressWarnings("unchecked")
    private void initialize(final SavedStateHandleHolder savedStateHandleHolderParam) {
      this.provideActivityRetainedLifecycleProvider = DoubleCheck.provider(new SwitchingProvider<ActivityRetainedLifecycle>(singletonCImpl, activityRetainedCImpl, 0));
    }

    @Override
    public ActivityComponentBuilder activityComponentBuilder() {
      return new ActivityCBuilder(singletonCImpl, activityRetainedCImpl);
    }

    @Override
    public ActivityRetainedLifecycle getActivityRetainedLifecycle() {
      return provideActivityRetainedLifecycleProvider.get();
    }

    private static final class SwitchingProvider<T> implements Provider<T> {
      private final SingletonCImpl singletonCImpl;

      private final ActivityRetainedCImpl activityRetainedCImpl;

      private final int id;

      SwitchingProvider(SingletonCImpl singletonCImpl, ActivityRetainedCImpl activityRetainedCImpl,
          int id) {
        this.singletonCImpl = singletonCImpl;
        this.activityRetainedCImpl = activityRetainedCImpl;
        this.id = id;
      }

      @SuppressWarnings("unchecked")
      @Override
      public T get() {
        switch (id) {
          case 0: // dagger.hilt.android.ActivityRetainedLifecycle 
          return (T) ActivityRetainedComponentManager_LifecycleModule_ProvideActivityRetainedLifecycleFactory.provideActivityRetainedLifecycle();

          default: throw new AssertionError(id);
        }
      }
    }
  }

  private static final class ServiceCImpl extends SiteBankApp_HiltComponents.ServiceC {
    private final SingletonCImpl singletonCImpl;

    private final ServiceCImpl serviceCImpl = this;

    private ServiceCImpl(SingletonCImpl singletonCImpl, Service serviceParam) {
      this.singletonCImpl = singletonCImpl;


    }
  }

  private static final class SingletonCImpl extends SiteBankApp_HiltComponents.SingletonC {
    private final ApplicationContextModule applicationContextModule;

    private final SingletonCImpl singletonCImpl = this;

    private Provider<TokenManager> tokenManagerProvider;

    private Provider<OkHttpClient> provideOkHttpClientProvider;

    private Provider<Json> provideJsonProvider;

    private Provider<Retrofit> provideRetrofitProvider;

    private Provider<PropertyApi> providePropertyApiProvider;

    private Provider<AuthApi> provideAuthApiProvider;

    private Provider<AuthRepository> authRepositoryProvider;

    private Provider<AdvancedApi> provideAdvancedApiProvider;

    private Provider<LeadsApi> provideLeadsApiProvider;

    private Provider<LeadsRepository> leadsRepositoryProvider;

    private Provider<PropertyRepository> propertyRepositoryProvider;

    private SingletonCImpl(ApplicationContextModule applicationContextModuleParam) {
      this.applicationContextModule = applicationContextModuleParam;
      initialize(applicationContextModuleParam);

    }

    private AuthInterceptor authInterceptor() {
      return new AuthInterceptor(tokenManagerProvider.get());
    }

    @SuppressWarnings("unchecked")
    private void initialize(final ApplicationContextModule applicationContextModuleParam) {
      this.tokenManagerProvider = DoubleCheck.provider(new SwitchingProvider<TokenManager>(singletonCImpl, 3));
      this.provideOkHttpClientProvider = DoubleCheck.provider(new SwitchingProvider<OkHttpClient>(singletonCImpl, 2));
      this.provideJsonProvider = DoubleCheck.provider(new SwitchingProvider<Json>(singletonCImpl, 4));
      this.provideRetrofitProvider = DoubleCheck.provider(new SwitchingProvider<Retrofit>(singletonCImpl, 1));
      this.providePropertyApiProvider = DoubleCheck.provider(new SwitchingProvider<PropertyApi>(singletonCImpl, 0));
      this.provideAuthApiProvider = DoubleCheck.provider(new SwitchingProvider<AuthApi>(singletonCImpl, 6));
      this.authRepositoryProvider = DoubleCheck.provider(new SwitchingProvider<AuthRepository>(singletonCImpl, 5));
      this.provideAdvancedApiProvider = DoubleCheck.provider(new SwitchingProvider<AdvancedApi>(singletonCImpl, 7));
      this.provideLeadsApiProvider = DoubleCheck.provider(new SwitchingProvider<LeadsApi>(singletonCImpl, 8));
      this.leadsRepositoryProvider = DoubleCheck.provider(new SwitchingProvider<LeadsRepository>(singletonCImpl, 9));
      this.propertyRepositoryProvider = DoubleCheck.provider(new SwitchingProvider<PropertyRepository>(singletonCImpl, 10));
    }

    @Override
    public void injectSiteBankApp(SiteBankApp siteBankApp) {
    }

    @Override
    public Set<Boolean> getDisableFragmentGetContextFix() {
      return Collections.<Boolean>emptySet();
    }

    @Override
    public ActivityRetainedComponentBuilder retainedComponentBuilder() {
      return new ActivityRetainedCBuilder(singletonCImpl);
    }

    @Override
    public ServiceComponentBuilder serviceComponentBuilder() {
      return new ServiceCBuilder(singletonCImpl);
    }

    private static final class SwitchingProvider<T> implements Provider<T> {
      private final SingletonCImpl singletonCImpl;

      private final int id;

      SwitchingProvider(SingletonCImpl singletonCImpl, int id) {
        this.singletonCImpl = singletonCImpl;
        this.id = id;
      }

      @SuppressWarnings("unchecked")
      @Override
      public T get() {
        switch (id) {
          case 0: // com.sitebank.android.data.remote.PropertyApi 
          return (T) NetworkModule_ProvidePropertyApiFactory.providePropertyApi(singletonCImpl.provideRetrofitProvider.get());

          case 1: // retrofit2.Retrofit 
          return (T) NetworkModule_ProvideRetrofitFactory.provideRetrofit(singletonCImpl.provideOkHttpClientProvider.get(), singletonCImpl.provideJsonProvider.get());

          case 2: // okhttp3.OkHttpClient 
          return (T) NetworkModule_ProvideOkHttpClientFactory.provideOkHttpClient(singletonCImpl.authInterceptor());

          case 3: // com.sitebank.android.data.local.TokenManager 
          return (T) new TokenManager(ApplicationContextModule_ProvideContextFactory.provideContext(singletonCImpl.applicationContextModule));

          case 4: // kotlinx.serialization.json.Json 
          return (T) NetworkModule_ProvideJsonFactory.provideJson();

          case 5: // com.sitebank.android.data.repository.AuthRepository 
          return (T) new AuthRepository(singletonCImpl.provideAuthApiProvider.get(), singletonCImpl.tokenManagerProvider.get());

          case 6: // com.sitebank.android.data.remote.AuthApi 
          return (T) NetworkModule_ProvideAuthApiFactory.provideAuthApi(singletonCImpl.provideRetrofitProvider.get());

          case 7: // com.sitebank.android.data.remote.AdvancedApi 
          return (T) NetworkModule_ProvideAdvancedApiFactory.provideAdvancedApi(singletonCImpl.provideRetrofitProvider.get());

          case 8: // com.sitebank.android.data.remote.LeadsApi 
          return (T) NetworkModule_ProvideLeadsApiFactory.provideLeadsApi(singletonCImpl.provideRetrofitProvider.get());

          case 9: // com.sitebank.android.data.repository.LeadsRepository 
          return (T) new LeadsRepository(singletonCImpl.provideLeadsApiProvider.get());

          case 10: // com.sitebank.android.data.repository.PropertyRepository 
          return (T) new PropertyRepository(singletonCImpl.providePropertyApiProvider.get());

          default: throw new AssertionError(id);
        }
      }
    }
  }
}
