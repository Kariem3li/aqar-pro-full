from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *
import json

User = get_user_model()

# --- السيريالايزر الفرعية ---
class FeatureSerializer(serializers.ModelSerializer):
    class Meta: model = Feature; fields = ['id', 'name', 'input_type']

class ListingFeatureSerializer(serializers.ModelSerializer):
    feature_name = serializers.CharField(source='feature.name', read_only=True)
    class Meta: 
        model = ListingFeature
        fields = ['id', 'feature', 'feature_name', 'value']

# في ملف aqar/serializers.py (بعد ListingFeatureSerializer مثلاً)

class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = '__all__'

class ListingImageSerializer(serializers.ModelSerializer):
    class Meta: model = ListingImage; fields = ['id', 'image']

class CategorySerializer(serializers.ModelSerializer):
    allowed_features = FeatureSerializer(many=True, read_only=True)
    class Meta: model = Category; fields = ['id', 'name', 'allowed_features']

# --- سيريالايزر الجغرافيا ---
class GovernorateSerializer(serializers.ModelSerializer):
    class Meta: model = Governorate; fields = '__all__'
class CitySerializer(serializers.ModelSerializer):
    class Meta: model = City; fields = '__all__'
class MajorZoneSerializer(serializers.ModelSerializer):
    class Meta: model = MajorZone; fields = '__all__'
class SubdivisionSerializer(serializers.ModelSerializer):
    class Meta: model = Subdivision; fields = '__all__'

# --- Register Serializer ---
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'first_name', 'last_name', 'phone_number', 'interests')

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data) 
        user.set_password(password)
        user.save()
        return user

# --- ListingSerializer الرئيسي ---
class ListingSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)
    dynamic_features = ListingFeatureSerializer(source='features_values', many=True, read_only=True)  
    
    # حقول العرض
    governorate_name = serializers.CharField(source='governorate.name', read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    major_zone_name = serializers.CharField(source='major_zone.name', read_only=True, allow_null=True)
    subdivision_name = serializers.CharField(source='subdivision.name', read_only=True, allow_null=True)
    is_favorite = serializers.SerializerMethodField()

    # حقل الخريطة المخصص
    zone_map_image = serializers.SerializerMethodField()

    
    # حقول الإدخال
    features_data = serializers.CharField(write_only=True, required=False)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True, required=False
    )

    class Meta: 
        model = Listing
        fields = '__all__'

    def get_zone_map_image(self, obj):
        image_obj = None
        if obj.custom_map_image:
            image_obj = obj.custom_map_image
        elif obj.major_zone:
            zone_map = obj.major_zone.maps.first()
            if zone_map:
                image_obj = zone_map.map_file

        if not image_obj: return None

        try:
            request = self.context.get('request')
            if request: return request.build_absolute_uri(image_obj.url)
        except: pass
        
        # ⚠️ تأكد إن الرقم ده هو الـ IP بتاع جهازك الحالي
        return f"http://192.168.1.8:8000{image_obj.url}"

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # البحث عن سجل مفضلة يربط المستخدم الحالي بهذا العقار
            return obj.favorites.filter(user=request.user).exists()
        return False


    # --- دالة الإنشاء (Create) ---
    def create(self, validated_data):
        features_json = validated_data.pop('features_data', None)
        uploaded_images = validated_data.pop('uploaded_images', [])
        
        listing = Listing.objects.create(**validated_data)
        
        # حفظ الصور
        request = self.context.get('request')
        if request and request.FILES:
             images = request.FILES.getlist('uploaded_images')
             for image in images:
                ListingImage.objects.create(listing=listing, image=image)
                if not listing.thumbnail:
                    listing.thumbnail = image
                    listing.save()

        # حفظ المزايا (استخدمنا الدالة المساعدة هنا كمان لتوفير الكود)
        if features_json:
            self._save_features(listing, features_json)

        return listing
    
    # --- دالة التعديل (Update) ---
    def update(self, instance, validated_data):
        features_json = validated_data.pop('features_data', None)
        uploaded_images = validated_data.pop('uploaded_images', [])

        # تحديث البيانات الأساسية
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # حفظ الصور الجديدة
        request = self.context.get('request')
        if request and request.FILES:
             images = request.FILES.getlist('uploaded_images')
             for image in images:
                ListingImage.objects.create(listing=instance, image=image)

        # 🔥 تحديث المزايا
        if features_json:
            self._save_features(instance, features_json)

        return instance

    # --- الدالة المساعدة (الذكية) ---
    def _save_features(self, listing, features_json):
        try:
            features_dict = json.loads(features_json)
            for feature_id, value in features_dict.items():
                if value: 
                    try:
                        feature_obj = Feature.objects.get(id=int(feature_id))
                        # update_or_create: هي دي اللي بتحل المشكلة
                        ListingFeature.objects.update_or_create(
                            listing=listing,
                            feature=feature_obj,
                            defaults={'value': str(value)}
                        )
                    except Feature.DoesNotExist:
                        pass
        except Exception as e:
            print(f"Error saving features: {e}")
    

    # --- User Profile Serializer (تعديل البيانات) ---
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'phone_number', 'whatsapp_link', 'interests']
        read_only_fields = ['username', 'id'] # نمنع تعديل اسم المستخدم