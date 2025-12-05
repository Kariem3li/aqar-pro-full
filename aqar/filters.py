import django_filters
from .models import Listing, ListingFeature

class ListingFilter(django_filters.FilterSet):
    # فلاتر السعر والمساحة (من - إلى)
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    min_area = django_filters.NumberFilter(field_name="area_sqm", lookup_expr='gte')
    max_area = django_filters.NumberFilter(field_name="area_sqm", lookup_expr='lte')

    # فلاتر الموقع (Exact Match)
    governorate = django_filters.NumberFilter(field_name="governorate")
    city = django_filters.NumberFilter(field_name="city")
    major_zone = django_filters.NumberFilter(field_name="major_zone")
    subdivision = django_filters.NumberFilter(field_name="subdivision")

    # فلاتر المواصفات الأساسية
    bedrooms = django_filters.NumberFilter(field_name="bedrooms", lookup_expr='exact')
    bathrooms = django_filters.NumberFilter(field_name="bathrooms", lookup_expr='exact')
    floor_number = django_filters.NumberFilter(field_name="floor_number", lookup_expr='exact')

    # فلتر مخصص للمزايا الديناميكية (Dynamic Features)
    # الطريقة دي بتخلينا نبعت ?feature_id=value
    # مثال: ?feat_5=نعم (حيث 5 هو آيدي خاصية "غاز طبيعي")
    
    class Meta:
        model = Listing
        fields = ['offer_type', 'category', 'status', 'is_finance_eligible']