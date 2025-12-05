import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'django-insecure-aqar-pro-key-2025'
DEBUG = True
ALLOWED_HOSTS = ['*', 'localhost', '127.0.0.1', '192.168.1.8'] # أضف الـ IP الخاص بك هنا احتياطياً
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # --- مكتبات خارجية ---
    'rest_framework',       # الـ API
    'rest_framework.authtoken',
    'django_filters',       # الفلترة المتقدمة
    'corsheaders',          # للربط مع Next.js
    'smart_selects',        # القوائم المتسلسلة (محافظة->مدينة)
    
    # --- تطبيقاتنا ---
    'aqar_core',
    'aqar',
]

MIDDLEWARE = [
     'corsheaders.middleware.CorsMiddleware', # لازم يكون هنا
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates', BASE_DIR / 'aqar_core' / 'templates'],   
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# قاعدة البيانات (تأكد من إنشاء داتابيز جديدة باسم aqar_db في pgAdmin)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'kariem1',      # نفس داتابيزك القديمة أو اعمل واحدة جديدة
        'USER': 'postgres',
        'PASSWORD': 'kar352001',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# تفعيل موديل المستخدم المخصص
AUTH_USER_MODEL = 'aqar_core.User'

LANGUAGE_CODE = 'ar-eg' # اللغة العربية
TIME_ZONE = 'Africa/Cairo'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- إعدادات الميديا (الصور) ---
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# --- إعدادات Smart Selects ---
USE_DJANGO_JQUERY = True

# --- إعدادات الـ API ---
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12, # كل صفحة 12 عقار
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],


    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',  # <-- السطر ده هو المفتاح
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
}

# السماح للكل (موبايل وكمبيوتر) بدون قيود مؤقتاً
CORS_ALLOW_ALL_ORIGINS = True
FIREBASE_CREDENTIALS_PATH = os.path.join(BASE_DIR, 'serviceAccountKey.json')