from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, CustomAuthToken, UserProfileView, NotificationViewSet, UpdateFCMTokenView, SliderListView, ProjectViewSet, CustomPageView

# استخدام الراوتر لإنشاء روابط تلقائية للإشعارات
router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'projects', ProjectViewSet, basename='projects')
urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomAuthToken.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('update-fcm/', UpdateFCMTokenView.as_view(), name='update-fcm'),
    path('sliders/', SliderListView.as_view(), name='slider-list'), # رابط السلايدر
    path('pages/<slug:slug>/', CustomPageView.as_view(), name='custom-page-detail'), # رابط الصفحات الخاصة
    # دمج روابط الراوتر
    path('', include(router.urls)),
]

