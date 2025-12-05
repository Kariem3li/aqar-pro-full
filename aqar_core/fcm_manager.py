import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings
import os

def ensure_firebase_initialized():
    if not firebase_admin._apps:
        try:
            cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', os.path.join(settings.BASE_DIR, 'serviceAccountKey.json'))
            
            if not os.path.exists(cred_path):
                print(f"🔥 مصيبة: ملف المفاتيح غير موجود في المسار: {cred_path}")
                return False

            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("✅ تم الاتصال بـ Firebase بنجاح (Lazy Init)")
            return True
        except Exception as e:
            print(f"❌ فشل الاتصال بـ Firebase: {e}")
            return False
    return True

def send_push_notification(user, title, body, link='/', icon_url=None):
    """
    إرسال إشعار للمستخدم
    """
    if not ensure_firebase_initialized():
        return

    if not user.fcm_token:
        print(f"🔕 المستخدم {user.username} ليس لديه توكن مسجل.")
        return

    try:
        # 👇👇 التعديل هنا: فحص الرابط قبل وضعه في WebpushFCMOptions 👇👇
        # لو الرابط https (إنتاج) نضعه، لو http (تطوير) نتركه فارغاً لتجنب الخطأ
        fcm_options = None
        if link and link.startswith('https'):
            fcm_options = messaging.WebpushFCMOptions(link=link)

        # إعداد الرسالة
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
                image=icon_url 
            ),
            data={
                'url': link, # نرسل الرابط هنا دائماً (مسموح http عادي)
                'click_action': 'FLUTTER_NOTIFICATION_CLICK' 
            },
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    icon='ic_stat_r',
                    color='#0f172a',
                    click_action='FLUTTER_NOTIFICATION_CLICK'
                ),
            ),
            webpush=messaging.WebpushConfig(
                headers={"Urgency": "high"},
                notification=messaging.WebpushNotification(
                    icon='/icons/icon-192x192.png',
                    badge='/icons/badge-72x72.png',
                ),
                fcm_options=fcm_options # 👈 نستخدم المتغير المشروط
            ),
            token=user.fcm_token,
        )

        response = messaging.send(message)
        print(f"🚀 طار الإشعار للمستخدم {user.username}: {response}")
        return response

    except Exception as e:
        print(f"❌ حدث خطأ أثناء الإرسال: {e}")
        return None