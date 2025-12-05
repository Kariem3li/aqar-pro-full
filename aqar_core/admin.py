from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.shortcuts import render
from django import forms
from django.http import HttpResponseRedirect
# 👇👇👇 (1) استيراد مهم جداً لحل المشكلة 👇👇👇
from django.contrib.admin import helpers 
from .fcm_manager import send_push_notification 
from .models import User, Notification, Slider, Project, ProjectUnit, CustomPage, PageFeature, SiteSetting, PageGalleryImage, ProjectGalleryImage# 1. فورم كتابة الرسالة الجماعية
class BroadcastForm(forms.Form):
    _selected_action = forms.CharField(widget=forms.MultipleHiddenInput)
    title = forms.CharField(max_length=100, label="عنوان الإشعار", widget=forms.TextInput(attrs={'placeholder': 'مثال: فرصة استثمارية جديدة'}))
    message = forms.CharField(widget=forms.Textarea(attrs={'rows': 4, 'placeholder': 'اكتب تفاصيل الرسالة هنا...'}), label="نص الرسالة")

# 2. تخصيص لوحة المستخدمين
class CustomUserAdmin(UserAdmin):
    # الأعمدة اللي هتظهر في القائمة الخارجية
    list_display = ('username', 'first_name', 'phone_number', 'client_type', 'is_staff', 'date_joined')
    
    # الفلاتر الجانبية (شغالة تمام)
    list_filter = ('client_type', 'is_staff', 'is_active', 'date_joined')
    
    # حقول البحث
    search_fields = ('username', 'phone_number', 'first_name', 'email')
    
    # إظهار الحقول الجديدة داخل صفحة التعديل
    fieldsets = UserAdmin.fieldsets + (
        ('بيانات إضافية', {
            'fields': ('phone_number', 'client_type', 'whatsapp_link', 'is_agent', 'interests')
        }),
        ('تفضيلات العميل', {
            'fields': ('interested_in_rent', 'interested_in_buy')
        }),
        ('بيانات النظام', {
            'fields': ('fcm_token',) # 👈 عرضنا التوكن عشان تتأكد بعينك إنه موجود
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('بيانات إضافية', {
            'classes': ('wide',),
            'fields': ('phone_number', 'client_type', 'email', 'first_name', 'last_name'),
        }),
    )

    actions = ['send_broadcast_notification']

    def send_broadcast_notification(self, request, queryset):
        # لو ضغط على زر الإرسال في الصفحة الثانية
        if 'apply' in request.POST:
            form = BroadcastForm(request.POST)
            if form.is_valid():
                title = form.cleaned_data['title']
                message = form.cleaned_data['message']
                count = 0
                push_count = 0 # 👈 عداد للـ Push الفعلي
                
                for user in queryset:
                    # 1. إشعار داخلي (للموقع)
                    Notification.objects.create(
                        user=user,
                        title=title,
                        message=message,
                        notification_type='System'
                    )
                    
                    # 2. إشعار Push (للموبايل)
                    # نتأكد إن عنده توكن قبل ما نحاول نبعت
                    if user.fcm_token:
                        try:
                            send_push_notification(user, title, message, link='/profile')
                            push_count += 1
                        except Exception as e:
                            print(f"❌ فشل إرسال Push للمستخدم {user.username}: {e}")
                    
                    count += 1
                
                # رسالة توضح لك التفاصيل بدقة
                self.message_user(request, f"✅ تم حفظ الإشعار لـ {count} مستخدم. (تم إرسال تنبيه Push لـ {push_count} مستخدم لديهم توكن نشط).")
                return HttpResponseRedirect(request.get_full_path())
        
        # لو لسه مختار وعايز يشوف الفورم
        else:
            # 👇👇👇 (2) هنا كان الخطأ وتم تصحيحه باستخدام helpers 👇👇👇
            form = BroadcastForm(initial={'_selected_action': request.POST.getlist(helpers.ACTION_CHECKBOX_NAME)})

        return render(request, 'admin/broadcast_message.html', {'items': queryset, 'form': form, 'title': 'إرسال إشعار جماعي'})

    send_broadcast_notification.short_description = "📢 إرسال إشعار للمحددين"

# 3. لوحة الإشعارات
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read')
    search_fields = ('title', 'user__username')

# التسجيل النهائي
admin.site.register(User, CustomUserAdmin)
admin.site.register(Notification, NotificationAdmin)
# ==========================================
# 👇👇👇 إعدادات الجداول الجديدة (VIP & Sliders) 👇👇👇
# ==========================================

# 1. إعدادات الموقع العامة
@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'value')
    search_fields = ('key',)

# 2. إعدادات السلايدر
@admin.register(Slider)
class SliderAdmin(admin.ModelAdmin):
    list_display = ('title', 'target_link', 'is_active', 'display_order', 'created_at')
    list_editable = ('is_active', 'display_order') # عشان تعدل الترتيب والتفعيل بسرعة من بره
    search_fields = ('title',)
    list_filter = ('is_active',)

# 3. إعدادات الصفحات الخاصة (مع المزايا Inline)
class PageFeatureInline(admin.TabularInline):
    model = PageFeature
    extra = 1 # بيظهرلك صف فاضي جاهز للكتابة
    verbose_name = "ميزة"
    verbose_name_plural = "إضافة مزايا للصفحة"

# إعدادات صور المعرض (الجديد)
class PageGalleryImageInline(admin.TabularInline):
    model = PageGalleryImage
    extra = 1
    verbose_name = "صورة إضافية"
    verbose_name_plural = "📸 صور محتوى الإعلان (Gallery)"

@admin.register(CustomPage)
class CustomPageAdmin(admin.ModelAdmin):
    # ضفنا الصور جنب المزايا هنا 👇
    inlines = [PageFeatureInline, PageGalleryImageInline] 
    list_display = ('title', 'slug', 'is_active', 'created_at')
    search_fields = ('title',)
    prepopulated_fields = {'slug': ('title',)}


class ProjectGalleryImageInline(admin.TabularInline):
    model = ProjectGalleryImage
    extra = 1
    verbose_name = "صورة"
    verbose_name_plural = "📸 معرض صور المشروع"

# إعدادات الوحدات (موجودة من قبل)
class ProjectUnitInline(admin.TabularInline):
    model = ProjectUnit
    extra = 1
    verbose_name = "وحدة"
    verbose_name_plural = "وحدات المشروع (Grid)"
    # عرض الحقل الجديد في الجدول
    fields = ('unit_type', 'area', 'price', 'status', 'floor_plan_image')

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    inlines = [ProjectGalleryImageInline, ProjectUnitInline]
    list_display = ('name', 'developer_name', 'location', 'is_active')
    search_fields = ('name', 'developer_name')
    list_filter = ('is_active',)
    # 👇👇👇 ضفنا حقول الخريطة في البحث والتعديل
    fieldsets = (
        ('البيانات الأساسية', {
            'fields': ('name', 'developer_name', 'description', 'cover_image', 'video_url', 'is_active')
        }),
        ('الموقع والخريطة', {
            'fields': ('location', 'google_map_url', 'latitude', 'longitude')
        }),
    )


  


# (اختياري) لو عايز تشوف الوحدات لوحدها
@admin.register(ProjectUnit)
class ProjectUnitAdmin(admin.ModelAdmin):
    list_display = ('unit_type', 'project', 'price', 'status')
    list_filter = ('status', 'project')
    search_fields = ('project__name', 'unit_type')