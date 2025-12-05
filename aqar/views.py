# aqar/views.py
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .models import *
from .serializers import *
from .filters import ListingFilter

# --- ViewSets الثوابت (الجغرافيا والتصنيف) ---
class GovernorateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Governorate.objects.all()
    serializer_class = GovernorateSerializer
    pagination_class = None

class CityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['governorate']

class MajorZoneViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MajorZone.objects.all()
    serializer_class = MajorZoneSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['city']

class SubdivisionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subdivision.objects.all()
    serializer_class = SubdivisionSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['major_zone']

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None

    @action(detail=True, methods=['get'])
    def features(self, request, pk=None):
        category = self.get_object()
        features = category.allowed_features.all()
        serializer = FeatureSerializer(features, many=True)
        return Response(serializer.data)

# --- Listing ViewSet (المحرك الرئيسي) ---
class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.all().order_by('-created_at')
    serializer_class = ListingSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ListingFilter
    search_fields = ['title', 'description', 'reference_code']
    ordering_fields = ['price', 'created_at']
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    # 🔥 دالة الفلترة المتقدمة (Handling Dynamic Features)
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # التقاط أي باراميتر يبدأ بـ feat_
        # مثال: feat_5=نعم
        for key, value in self.request.query_params.items():
            if key.startswith('feat_') and value:
                try:
                    feature_id = int(key.split('_')[1])
                    queryset = queryset.filter(
                        features_values__feature_id=feature_id,
                        features_values__value=value
                    )
                except (ValueError, IndexError):
                    pass
        
        return queryset.distinct()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated:
            full_name = f"{user.first_name} {user.last_name}".strip() or user.username
            phone = user.phone_number if user.phone_number else ""
            # لاحظ: المالك هنا هو الـ Agent نفسه
            serializer.save(agent=user, owner_name=full_name, owner_phone=phone, status='Pending')
        else:
            serializer.save(status='Pending')

    def perform_update(self, serializer):
        instance = serializer.instance
        # حذف الصور المحددة
        deleted_image_ids = self.request.data.getlist('deleted_image_ids') 
        if deleted_image_ids:
            for img in ListingImage.objects.filter(id__in=deleted_image_ids, listing=instance):
                img.image.delete()
                img.delete()
        
        # حذف الفيديو
        if self.request.data.get('clear_video') == 'true':
            if instance.video:
                instance.video.delete()
                instance.video = None
        
        serializer.save(status='Pending')

    @action(detail=False, methods=['get'])
    def my_listings(self, request):
        if request.user.is_anonymous:
            return Response({"error": "يجب تسجيل الدخول"}, status=401)
        my_properties = Listing.objects.filter(agent=request.user).order_by('-created_at')
        serializer = self.get_serializer(my_properties, many=True)
        return Response(serializer.data)

# --- Favorite ViewSet ---
class FavoriteViewSet(viewsets.GenericViewSet):
    queryset = Favorite.objects.all()
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        favorites = Favorite.objects.filter(user=request.user).order_by('-created_at')
        listing_ids = favorites.values_list('listing_id', flat=True)
        listings = Listing.objects.filter(id__in=listing_ids)
        serializer = ListingSerializer(listings, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        listing_id = request.data.get('listing_id')
        if not listing_id: return Response({"detail": "Missing ID"}, status=400)
        
        listing = get_object_or_404(Listing, pk=listing_id)
        fav, created = Favorite.objects.get_or_create(user=request.user, listing=listing)
        
        if not created:
            fav.delete()
            return Response({"detail": "Removed", "is_favorite": False})
        return Response({"detail": "Added", "is_favorite": True})