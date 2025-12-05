from django.contrib import admin
from django.utils.html import format_html
from .models import *
from aqar_core.models import Notification
from aqar_core.fcm_manager import send_push_notification

class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 0
    readonly_fields = ['image_preview']
    def image_preview(self, obj):
        return format_html('<img src="{}" style="width: 100px; height: auto;" />', obj.image.url) if obj.image else ""

class ListingAdmin(admin.ModelAdmin):
    list_display = ('title', 'status_badge', 'price', 'client_type_view', 'owner_whatsapp', 'created_at')
    list_filter = ('status', 'offer_type', 'category', 'governorate')
    search_fields = ('title', 'owner_phone', 'owner_name')
    inlines = [ListingImageInline]
    actions = ['approve_listings', 'reject_listings']

    fieldsets = (
        ('المراجعة', {'fields': ('status', 'is_finance_eligible')}),
        ('المالك', {'fields': ('agent', 'owner_name', 'owner_phone', 'owner_whatsapp_btn')}),
        ('التفاصيل', {'fields': ('title', 'category', 'price', 'area_sqm', 'description')}),
        ('الوثائق', {'fields': ('id_card_preview', 'contract_preview')}),
    )
    readonly_fields = ['owner_whatsapp_btn', 'id_card_preview', 'contract_preview']

    def status_badge(self, obj):
        colors = {'Pending': 'orange', 'Available': 'green', 'Sold': 'red'}
        return format_html(f'<span style="color:white; background:{colors.get(obj.status, "gray")}; padding:3px 8px; border-radius:5px;">{obj.get_status_display()}</span>')

    def client_type_view(self, obj):
        return obj.agent.get_client_type_display() if obj.agent else "-"

    def owner_whatsapp(self, obj):
        if obj.owner_phone:
            phone = obj.owner_phone
            if phone.startswith('01'): phone = '2' + phone
            return format_html(f'<a href="https://wa.me/{phone}" target="_blank" style="color:green; font-weight:bold;">💬 واتساب</a>')
        return "-"

    def owner_whatsapp_btn(self, obj): return self.owner_whatsapp(obj)

    def id_card_preview(self, obj):
        return format_html('<img src="{}" style="max-width: 300px; border: 2px solid red;" />', obj.id_card_image.url) if obj.id_card_image else "لا توجد"

    def contract_preview(self, obj):
        return format_html('<img src="{}" style="max-width: 300px; border: 2px solid blue;" />', obj.contract_image.url) if obj.contract_image else "لا توجد"

    def approve_listings(self, request, queryset):
        queryset.update(status='Available')
        count = 0
        for listing in queryset:
            if listing.agent:
                # 1. إشعار داخلي
                Notification.objects.create(
                    user=listing.agent,
                    title="مبروك! 🥳",
                    message=f"تم نشر إعلانك '{listing.title}' بنجاح.",
                    notification_type='Listing'
                )
                # 2. 🔥 إشعار Push للموبايل
                send_push_notification(
                    listing.agent, 
                    "تم نشر إعلانك! 🏠", 
                    f"وافق الأدمن على عقارك: {listing.title}. اضغط للمعاينة.",
                    link=f"/listings/{listing.id}"
                )
                count += 1
        self.message_user(request, f"تم نشر {count} إعلان وإرسال تنبيهات لأصحابها.")
    approve_listings.short_description = "✅ قبول ونشر (مع إشعار)"

    def reject_listings(self, request, queryset):
        queryset.update(status='Pending')
        self.message_user(request, "تم تعليق الإعلانات.")
    reject_listings.short_description = "⛔ تعليق / رفض"


# تسجيل الموديلات
admin.site.register(Listing, ListingAdmin)
admin.site.register(Governorate)
admin.site.register(City)
admin.site.register(MajorZone)
admin.site.register(Subdivision)
admin.site.register(Category)
admin.site.register(Feature)