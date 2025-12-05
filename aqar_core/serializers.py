from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Notification,
    Slider, SiteSetting, 
    Project, ProjectUnit, ProjectGalleryImage, 
    CustomPage, PageFeature, PageGalleryImage
)
# ==========================================
# 1. إعدادات الموقع والسلايدر
# ==========================================

class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = ['key', 'value']

class SliderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slider
        fields = ['id', 'title', 'subtitle', 'image', 'target_link', 'button_text', 'open_in_new_tab', 'display_order']

# ==========================================
# 2. المشاريع والمولات (VIP)
# ==========================================

# مساعد: عشان نعرض الوحدات جوه المشروع
class ProjectUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectUnit
        fields = ['id', 'unit_type', 'area', 'price', 'status', 'floor_plan_image']

# مساعد: عشان نعرض صور المعرض جوه المشروع
class ProjectGallerySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectGalleryImage
        fields = ['id', 'image', 'caption']

# الأساسي: المشروع بكل تفاصيله
class ProjectSerializer(serializers.ModelSerializer):
    units = ProjectUnitSerializer(many=True, read_only=True)          # ربط الوحدات
    gallery_images = ProjectGallerySerializer(many=True, read_only=True) # ربط الصور
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'developer_name', 'location', 'description', 
            'cover_image', 'video_url', 
            'latitude', 'longitude', 'google_map_url',
            'units', 'gallery_images', 'created_at'
        ]

# ==========================================
# 3. الصفحات الخاصة (Custom Pages)
# ==========================================

# مساعد: المزايا
class PageFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageFeature
        fields = ['icon', 'title', 'description']

# مساعد: صور المحتوى
class PageGalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageGalleryImage
        fields = ['id', 'image', 'caption']

# الأساسي: الصفحة الخاصة بكل محتوياتها
class CustomPageSerializer(serializers.ModelSerializer):
    features = PageFeatureSerializer(many=True, read_only=True)         # ربط المزايا
    gallery_images = PageGalleryImageSerializer(many=True, read_only=True) # ربط صور المحتوى

    class Meta:
        model = CustomPage
        fields = [
            'id', 'title', 'slug', 'cover_image', 'video_url', 
            'body_content', 
            'features', 'gallery_images', 'created_at'
        ]
        lookup_field = 'slug' # عشان نقدر نجيب الصفحة بالاسم مش بالـ ID


        
User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        # 👇 التعديل: أضفنا client_type وحذفنا email و username
        fields = ['id', 'phone_number', 'password', 'first_name', 'last_name', 'client_type']

    def create(self, validated_data):
        # نقوم بإنشاء اليوزر نيم تلقائياً ليكون هو نفسه رقم الهاتف
        # هذا يضمن عدم حدوث مشاكل في الدجانجو الذي يتطلب يوزرنيم
        phone = validated_data['phone_number']
        
        user = User.objects.create_user(
            username=phone,  # 👈 اليوزر نيم هو رقم الهاتف
            phone_number=phone,
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            client_type=validated_data.get('client_type', 'Buyer') # القيمة الافتراضية
        )
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 
            'phone_number', 'whatsapp_link', 'interests', 'client_type'
        ]
        read_only_fields = ['username', 'id']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'created_at']