from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils.text import slugify  # <--- ضيف السطر ده مع الـ imports فوق
# 1. BaseModel
class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخر تحديث")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        verbose_name="بواسطة",
        related_name="%(app_label)s_%(class)s_created_by"
    )
    class Meta: abstract = True

# 2. User
class User(AbstractUser):
    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True, verbose_name="رقم الهاتف")
    whatsapp_link = models.CharField(max_length=255, blank=True, verbose_name="رابط الواتساب")
    is_agent = models.BooleanField(default=False, verbose_name="هل هو موظف؟")
    interests = models.TextField(null=True, blank=True, verbose_name="الاهتمامات")

    CLIENT_TYPES = [('Buyer', 'مشترِي'), ('Seller', 'بائع'), ('Investor', 'مستثمر'), ('Marketer', 'مسوق')]
    client_type = models.CharField(max_length=10, choices=CLIENT_TYPES, default='Buyer', verbose_name="نوع العميل")
    
    interested_in_rent = models.BooleanField(default=False, verbose_name="مهتم بالإيجار")
    interested_in_buy = models.BooleanField(default=True, verbose_name="مهتم بالشراء")

    # 👇👇👇 الإضافة الجديدة: توكن فايربيز (عنوان جهاز العميل) 👇👇👇
    fcm_token = models.TextField(null=True, blank=True, verbose_name="FCM Token")

# 3. الإشعارات
class Notification(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', verbose_name="المستخدم")
    title = models.CharField(max_length=255, verbose_name="عنوان الإشعار")
    message = models.TextField(verbose_name="نص الرسالة")
    is_read = models.BooleanField(default=False, verbose_name="تمت القراءة؟")
    
    TYPE_CHOICES = [('System', 'إداري'), ('Listing', 'عقار'), ('Offer', 'عرض')]
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='System')

    class Meta:
        verbose_name = "إشعار"
        verbose_name_plural = "الإشعارات"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.username}"
    

# ==========================================
# 👇👇👇 الإضافات الجديدة (Slider, Projects, Custom Pages) 👇👇👇
# ==========================================

# 4. إعدادات الموقع العامة (Site Settings)
class SiteSetting(models.Model):
    key = models.CharField(max_length=100, unique=True, verbose_name="المفتاح (كود الإعداد)") 
    value = models.CharField(max_length=500, verbose_name="القيمة")            

    class Meta:
        verbose_name = "إعداد عام"
        verbose_name_plural = "إعدادات الموقع"

    def __str__(self):
        return self.key

# 5. السلايدر (Slider) - البوابة المرنة
class Slider(BaseModel):  # ورثنا من BaseModel عشان نعرف مين ضاف السلايدر وأمتى
    title = models.CharField(max_length=200, verbose_name="العنوان الرئيسي")
    subtitle = models.CharField(max_length=300, blank=True, null=True, verbose_name="العنوان الفرعي")
    image = models.ImageField(upload_to='sliders/', verbose_name="صورة السلايدر") 
    
    # المنطقة المرنة للروابط
    target_link = models.CharField(max_length=500, help_text="رابط داخلي أو خارجي يذهب إليه العميل عند الضغط", verbose_name="رابط التوجيه")
    button_text = models.CharField(max_length=50, default="التفاصيل", verbose_name="نص الزر")
    
    is_active = models.BooleanField(default=True, verbose_name="نشط؟")
    display_order = models.IntegerField(default=0, verbose_name="ترتيب الظهور")
    open_in_new_tab = models.BooleanField(default=False, verbose_name="فتح في نافذة جديدة؟")
    class Meta:
        verbose_name = "سلايدر (إعلان)"
        verbose_name_plural = "السلايدر والإعلانات"
        ordering = ['display_order', '-created_at']

    def __str__(self):
        return self.title

# 6. الصفحات الخاصة (Custom Pages) - الجوكر
class CustomPage(BaseModel):
    title = models.CharField(max_length=200, verbose_name="عنوان الصفحة")
    slug = models.SlugField(unique=True, blank=True, verbose_name="رابط الصفحة (Slug)") 
    
    cover_image = models.ImageField(upload_to='pages_covers/', blank=True, null=True, verbose_name="صورة الغلاف (Header)")
    video_url = models.URLField(blank=True, null=True, verbose_name="رابط فيديو (Youtube)") 
    
    body_content = models.TextField(help_text="اكتب هنا التفاصيل الكاملة للصفحة", verbose_name="محتوى الصفحة") 
    
    is_active = models.BooleanField(default=True, verbose_name="نشط؟")

    class Meta:
        verbose_name = "صفحة خاصة"
        verbose_name_plural = "الصفحات الخاصة (الجوكر)"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True) # allow_unicode عشان يقبل عربي في الرابط لو حبيت
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

# 7. مزايا الصفحة (Page Features) - عشان تظهر بشكل بوكسات شيك
class PageFeature(models.Model):
    page = models.ForeignKey(CustomPage, related_name='features', on_delete=models.CASCADE, verbose_name="الصفحة التابعة لها")
    icon = models.CharField(max_length=100, help_text="مثال: fas fa-check", verbose_name="كود الأيقونة (FontAwesome)")
    title = models.CharField(max_length=100, verbose_name="عنوان الميزة")
    description = models.CharField(max_length=255, verbose_name="وصف مختصر")

    class Meta:
        verbose_name = "ميزة"
        verbose_name_plural = "مزايا الصفحة"

    def __str__(self):
        return self.title

# 8. المشاريع والمولات (VIP Projects)
class Project(BaseModel):
    name = models.CharField(max_length=200, verbose_name="اسم المشروع/المول") 
    developer_name = models.CharField(max_length=200, blank=True, null=True, verbose_name="اسم المطور العقاري") 
    location = models.CharField(max_length=255, verbose_name="موقع المشروع")
    description = models.TextField(verbose_name="وصف المشروع التفصيلي")
    
    cover_image = models.ImageField(upload_to='projects/', verbose_name="صورة الغلاف (Parallax)") 
    video_url = models.URLField(blank=True, null=True, verbose_name="رابط فيديو دعائي")
    
    is_active = models.BooleanField(default=True, verbose_name="نشط؟")
    # 👇👇👇 (إضافة) حقول الخريطة 👇👇👇
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, verbose_name="خط العرض (Latitude)")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, verbose_name="خط الطول (Longitude)")
    google_map_url = models.URLField(blank=True, null=True, verbose_name="رابط جوجل مابس (للتسهيل)")
    class Meta:
        verbose_name = "مشروع / مول (VIP)"
        verbose_name_plural = "المشاريع والمولات"

    def __str__(self):
        return self.name

# 9. وحدات المشروع (Project Units) - للـ Grid
class ProjectUnit(models.Model):
    project = models.ForeignKey(Project, related_name='units', on_delete=models.CASCADE, verbose_name="المشروع التابع له")
    unit_type = models.CharField(max_length=100, verbose_name="نوع الوحدة (محل/عيادة/شقة)") 
    area = models.FloatField(verbose_name="المساحة (متر)") 
    price = models.DecimalField(max_digits=14, decimal_places=2, verbose_name="السعر الإجمالي")
    status = models.CharField(max_length=50, choices=[('available', 'متاح'), ('sold', 'مباع'), ('reserved', 'محجوز')], default='available', verbose_name="الحالة")
    floor_plan_image = models.ImageField(upload_to='units_plans/', blank=True, null=True, verbose_name="صورة التقسيمة/الماستر بلان")
    class Meta:
        verbose_name = "وحدة بالمشروع"
        verbose_name_plural = "وحدات المشاريع"

    def __str__(self):
        return f"{self.unit_type} - {self.project.name}"
    
# 10. صور محتوى الصفحة الخاصة (Gallery Images)
class PageGalleryImage(models.Model):
    page = models.ForeignKey(CustomPage, related_name='gallery_images', on_delete=models.CASCADE, verbose_name="الصفحة التابعة لها")
    image = models.ImageField(upload_to='pages_gallery/', verbose_name="صورة إضافية للمحتوى")
    caption = models.CharField(max_length=200, blank=True, null=True, verbose_name="تعليق أسفل الصورة (اختياري)")

    class Meta:
        verbose_name = "صورة محتوى"
        verbose_name_plural = "معرض صور المحتوى"

    def __str__(self):
        return f"صورة لـ {self.page.title}"
    
class ProjectGalleryImage(models.Model):
    project = models.ForeignKey(Project, related_name='gallery_images', on_delete=models.CASCADE, verbose_name="المشروع")
    image = models.ImageField(upload_to='projects_gallery/', verbose_name="صورة للمشروع")
    caption = models.CharField(max_length=200, blank=True, null=True, verbose_name="وصف الصورة (اختياري)")

    class Meta:
        verbose_name = "صورة مشروع"
        verbose_name_plural = "معرض صور المشروع"

    def __str__(self):
        return f"صورة لـ {self.project.name}"