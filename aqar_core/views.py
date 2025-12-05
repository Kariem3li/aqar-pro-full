from rest_framework import generics, status, permissions, viewsets # 👈 تمت إضافة viewsets
from rest_framework.decorators import action # 👈 تمت إضافة action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth import get_user_model, authenticate
from rest_framework.views import APIView # 👈 استيراد جديد

from rest_framework.permissions import AllowAny # عشان أي حد (حتى لو مش مسجل) يقدر يشوف الإعلانات
from .models import Slider, Project, CustomPage, Notification
from .serializers import (
    UserSerializer, UserProfileSerializer, NotificationSerializer,
    SliderSerializer, 
    ProjectSerializer, 
    CustomPageSerializer
)

User = get_user_model()

# 1. تسجيل حساب جديد
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'name': user.first_name,
                'client_type': user.client_type
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 2. تسجيل الدخول
class CustomAuthToken(ObtainAuthToken):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        phone = request.data.get('phone_number') or request.data.get('username')
        password = request.data.get('password')

        if not phone or not password:
            return Response({'non_field_errors': ['يرجى إدخال البيانات']}, status=status.HTTP_400_BAD_REQUEST)

        user_obj = User.objects.filter(phone_number=phone).first()

        if user_obj:
            user = authenticate(username=user_obj.username, password=password)
            if user:
                token, created = Token.objects.get_or_create(user=user)
                return Response({
                    'token': token.key,
                    'user_id': user.pk,
                    'name': user.first_name,
                    'client_type': user.client_type,
                    'is_staff': user.is_staff
                })
        
        return Response({'non_field_errors': ['بيانات الدخول غير صحيحة']}, status=status.HTTP_400_BAD_REQUEST)

# 3. بروفايل المستخدم
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

# 4. إدارة الإشعارات
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        request.user.notifications.filter(is_read=False).update(is_read=True)
        return Response({'status': 'success'})

# 👇👇👇 5. تحديث توكن الفايربيز (جديد) 👇👇👇
class UpdateFCMTokenView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        fcm_token = request.data.get('fcm_token')
        if fcm_token:
            request.user.fcm_token = fcm_token
            request.user.save()
            return Response({'status': 'Token updated successfully'})
        return Response({'error': 'No token provided'}, status=400)


# ==========================================
# 👇👇👇 إضافات العرض (APIs) 👇👇👇
# ==========================================

# 1. API للسلايدر (بيرجع فقط النشط)
class SliderListView(generics.ListAPIView):
    permission_classes = [AllowAny] # مسموح للجميع
    serializer_class = SliderSerializer
    
    def get_queryset(self):
        # يرجع فقط السلايدر النشط، مرتب حسب الأولوية اللي أنت حطيتها
        return Slider.objects.filter(is_active=True).order_by('display_order', '-created_at')

# 2. API للمشاريع والمولات
class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = ProjectSerializer
    
    def get_queryset(self):
        return Project.objects.filter(is_active=True).order_by('-created_at')

# 3. API للصفحات الخاصة (الجوكر)
class CustomPageView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = CustomPageSerializer
    queryset = CustomPage.objects.filter(is_active=True)
    lookup_field = 'slug' # عشان الفرونت يطلب الصفحة بالاسم (/page/summer-offer) مش بالرقم