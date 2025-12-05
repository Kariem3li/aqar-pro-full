# aqar_core/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification
from .fcm_manager import send_push_notification

@receiver(post_save, sender=Notification)
def notification_created(sender, instance, created, **kwargs):
    """
    هذه الدالة تعمل تلقائياً بمجرد حفظ أي إشعار في قاعدة البيانات
    """
    if created: # فقط عند الإنشاء الجديد (وليس التعديل)
        print(f"🔔 New notification created in DB for: {instance.user.username}")
        
        # استدعاء دالة الإرسال لفايربيز
        send_push_notification(
            user=instance.user,
            title=instance.title,
            body=instance.message,
            # يمكننا إضافة حقل للرابط في الموديل لاحقاً لو أردت
            link='/' 
        )