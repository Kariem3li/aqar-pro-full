# aqar/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from aqar_core.views import SliderListView, ProjectViewSet, CustomPageView
router = DefaultRouter()
router.register(r'listings', ListingViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'governorates', GovernorateViewSet)
router.register(r'cities', CityViewSet)
router.register(r'zones', MajorZoneViewSet)
router.register(r'subdivisions', SubdivisionViewSet)
router.register(r'favorites', FavoriteViewSet)
router.register(r'projects', ProjectViewSet, basename='projects')
urlpatterns = [
    path('sliders/', SliderListView.as_view(), name='slider-list'),
    path('pages/<slug:slug>/', CustomPageView.as_view(), name='custom-page-detail'),
    path('', include(router.urls)),
]